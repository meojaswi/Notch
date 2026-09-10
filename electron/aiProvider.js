import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const requestTimeoutMs = 15000;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function parseJsonResponse(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  return JSON.parse(cleaned);
}

async function generate(contents) {
  const client = getClient();
  if (!client) return null;

  const request = client.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: "application/json",
    },
  });

  const timeout = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error("Gemini request timed out")),
      requestTimeoutMs,
    );
  });

  const response = await Promise.race([request, timeout]);
  return parseJsonResponse(response.text || "{}");
}

function normalizeAnalysis(result) {
  return {
    micro: typeof result?.micro === "string" ? result.micro.trim() : "",
    short: typeof result?.short === "string" ? result.short.trim() : "",
    full: typeof result?.full === "string" ? result.full.trim() : "",
    query: typeof result?.query === "string" ? result.query.trim() : "",
    detectedText:
      typeof result?.detectedText === "string"
        ? result.detectedText.trim()
        : "",
  };
}

export async function analyzeText(text) {
  const result = await generate(`
Analyze this copied text and respond ONLY in this JSON shape, with no markdown:
{
  "micro": "max 6 words, glanceable label",
  "short": "max 15 words, one-line summary for the island",
  "full": "2-4 sentences, detailed description",
  "query": "one concise web search query"
}

Preserve important names, technologies, error messages, and intent.

Copied text:
${text}
`);

  return normalizeAnalysis(result);
}

export async function analyzeImage(imageData, mimeType = "image/png") {
  const result = await generate([
    {
      text: 'Analyze this image and respond ONLY in this JSON shape, with no markdown: {"micro":"max 6 words, glanceable label","short":"max 15 words, one-line summary for the island","full":"2-4 sentences, detailed description","query":"one useful web search query","detectedText":"visible text, or empty string"}.',
    },
    {
      inlineData: {
        mimeType,
        data: imageData,
      },
    },
  ]);

  return normalizeAnalysis(result);
}
