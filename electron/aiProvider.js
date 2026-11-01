import { GoogleGenAI, Type } from "@google/genai";

const DEFAULT_MODEL = "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 15_000;
const VALIDATE_TIMEOUT_MS = 10_000;

let apiKey = "";
let model = DEFAULT_MODEL;
let client = null;

export class AiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AiError";
    this.code = code;
  }
}

export function configureAi(options) {
  apiKey = options.apiKey?.trim() || "";
  model = options.model?.trim() || DEFAULT_MODEL;
  client = null;
}

function getClient() {
  if (!apiKey) return null;
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

// Maps SDK and network failures onto messages a user can act on.
export function toAiError(err) {
  if (err instanceof AiError) return err;

  const status = typeof err?.status === "number" ? err.status : 0;
  const message = String(err?.message ?? "");

  if (status === 400 && /api.?key/i.test(message)) {
    return new AiError("invalid-key", "Your Gemini API key is not valid");
  }
  if (status === 401 || status === 403) {
    return new AiError("invalid-key", "Gemini rejected the API key");
  }
  if (status === 404) {
    return new AiError(
      "model-unavailable",
      `Gemini model "${model}" is not available`,
    );
  }
  if (status === 429) {
    return new AiError("rate-limited", "Gemini rate limit hit, try again soon");
  }
  if (status >= 500) {
    return new AiError("unavailable", "Gemini is temporarily unavailable");
  }
  if (/fetch failed|ENOTFOUND|ECONNRESET|ECONNREFUSED|network/i.test(message)) {
    return new AiError("network", "Couldn't reach Gemini, check your network");
  }
  return new AiError("unknown", "AI processing failed");
}

function withTimeout(signal, ms) {
  const timeout = AbortSignal.timeout(ms);
  return {
    timeout,
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  };
}

export function parseJsonResponse(text) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

async function generate(contents, responseSchema, { signal } = {}) {
  const ai = getClient();
  if (!ai) {
    throw new AiError("not-configured", "Add a Gemini API key in Settings");
  }

  const { timeout, signal: abortSignal } = withTimeout(
    signal,
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        abortSignal,
      },
    });
    return parseJsonResponse(response.text || "{}");
  } catch (err) {
    if (timeout.aborted && !signal?.aborted) {
      throw new AiError("timeout", "Gemini took too long to respond");
    }
    throw signal?.aborted ? err : toAiError(err);
  }
}

// Confirms a key works before it is saved. Throws an AiError if it doesn't.
export async function validateApiKey(key) {
  const ai = new GoogleGenAI({ apiKey: key });
  const { timeout, signal } = withTimeout(null, VALIDATE_TIMEOUT_MS);
  try {
    await ai.models.get({ model, config: { abortSignal: signal } });
  } catch (err) {
    if (timeout.aborted) {
      throw new AiError("timeout", "Gemini took too long to respond");
    }
    throw toAiError(err);
  }
}

const stringField = (description) => ({ type: Type.STRING, description });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    micro: stringField("max 6 words, glanceable label"),
    short: stringField("max 15 words, one-line summary for the island"),
    full: stringField("2-4 sentences, detailed description"),
    query: stringField("one concise, useful web search query"),
    detectedText: stringField("visible text in an image, or empty string"),
  },
  required: ["micro", "short", "full", "query"],
};

const VOICE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    transcript: stringField("exact transcription of the spoken words"),
    action: {
      type: Type.STRING,
      enum: ["play", "pause", "toggle", "next", "prev", "search", "unknown"],
    },
    query: stringField("search query if action is search, otherwise empty"),
  },
  required: ["transcript", "action", "query"],
};

const asTrimmedString = (value) =>
  typeof value === "string" ? value.trim() : "";

export function normalizeAnalysis(result) {
  return {
    micro: asTrimmedString(result?.micro),
    short: asTrimmedString(result?.short),
    full: asTrimmedString(result?.full),
    query: asTrimmedString(result?.query),
    detectedText: asTrimmedString(result?.detectedText),
  };
}

export function normalizeVoice(result) {
  const action = asTrimmedString(result?.action);
  return {
    transcript: asTrimmedString(result?.transcript),
    action: VOICE_SCHEMA.properties.action.enum.includes(action)
      ? action
      : "unknown",
    query: asTrimmedString(result?.query),
  };
}

export async function analyzeText(text, options) {
  const result = await generate(
    `Analyze this copied text. Preserve important names, technologies, error messages, and intent. Leave detectedText empty.

Copied text:
${text}`,
    ANALYSIS_SCHEMA,
    options,
  );
  return normalizeAnalysis(result);
}

export async function analyzeImage(imageData, mimeType, options) {
  const result = await generate(
    [
      { text: "Analyze this image." },
      { inlineData: { mimeType, data: imageData } },
    ],
    ANALYSIS_SCHEMA,
    options,
  );
  return normalizeAnalysis(result);
}

export async function analyzeAudio(audioData, mimeType, options) {
  const result = await generate(
    [
      {
        text: `You are a voice assistant for a Windows desktop utility widget.
Listen carefully to the spoken voice in this audio clip.
Transcribe what the user said and detect the command.

Command recognition rules:
- "play", "resume", "start music", "unpause" -> "play"
- "pause", "stop", "stop music" -> "pause"
- "toggle", "play pause" -> "toggle"
- "next", "skip", "next song", "next track" -> "next"
- "previous", "prev", "go back", "last track" -> "prev"
- "search for [x]", "google [x]", "find [x]", "look up [x]" -> "search", query: "[x]"
- If the user asks a question or names a topic without media keywords (e.g. "what is quantum computing", "cats"), set action "search", query to that text.
- If completely unintelligible or silent, set action "unknown" and transcript ""`,
      },
      { inlineData: { mimeType, data: audioData } },
    ],
    VOICE_SCHEMA,
    options,
  );
  return normalizeVoice(result);
}
