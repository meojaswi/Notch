import { describe, expect, it } from "vitest";
import {
  AiError,
  analyzeText,
  configureAi,
  normalizeAnalysis,
  normalizeVoice,
  parseJsonResponse,
  toAiError,
} from "./aiProvider.js";

describe("parseJsonResponse", () => {
  it("parses plain and fenced JSON", () => {
    expect(parseJsonResponse('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonResponse('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
});

describe("normalizeAnalysis", () => {
  it("trims strings and drops non-string fields", () => {
    expect(normalizeAnalysis({ micro: " hi ", short: 3 })).toEqual({
      micro: "hi",
      short: "",
      full: "",
      query: "",
      detectedText: "",
    });
  });
});

describe("normalizeVoice", () => {
  it("falls back to unknown for unexpected actions", () => {
    expect(normalizeVoice({ action: "format-disk" }).action).toBe("unknown");
    expect(normalizeVoice({ action: "next" }).action).toBe("next");
  });
});

describe("toAiError", () => {
  it.each([
    [{ status: 400, message: "API key not valid" }, "invalid-key"],
    [{ status: 403, message: "Forbidden" }, "invalid-key"],
    [{ status: 404, message: "Not found" }, "model-unavailable"],
    [{ status: 429, message: "Too many requests" }, "rate-limited"],
    [{ status: 503, message: "Overloaded" }, "unavailable"],
    [new TypeError("fetch failed"), "network"],
    [new Error("something odd"), "unknown"],
  ])("maps %o to %s", (err, code) => {
    expect(toAiError(err).code).toBe(code);
  });
});

describe("analyzeText", () => {
  it("fails fast with a clear error when no key is configured", async () => {
    configureAi({ apiKey: "" });
    await expect(analyzeText("hello")).rejects.toEqual(
      expect.objectContaining({ code: "not-configured" }),
    );
    await expect(analyzeText("hello")).rejects.toBeInstanceOf(AiError);
  });
});
