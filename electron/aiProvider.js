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

export async function createSearchQuery(text) {
  const result = await generate(`
Create one concise web search query from the copied text below.
Preserve important names, technologies, error messages, and intent.
Return JSON only in this exact shape: {"query":"..."}

Copied text:
${text}
`);

  return typeof result?.query === "string" && result.query.trim()
    ? result.query.trim()
    : null;
}

export async function describeImage(imageData, mimeType = "image/png") {
  const result = await generate([
    {
      text: 'Describe this image and suggest one useful web search query. Return JSON only in this exact shape: {"description":"...","query":"...","detectedText":"..."}. Use an empty string when no text is visible.',
    },
    {
      inlineData: {
        mimeType,
        data: imageData,
      },
    },
  ]);

  return {
    description:
      typeof result?.description === "string" ? result.description.trim() : "",
    query: typeof result?.query === "string" ? result.query.trim() : "",
    detectedText:
      typeof result?.detectedText === "string"
        ? result.detectedText.trim()
        : "",
  };
}
