import { describe, expect, it } from "vitest";
import {
  isAllowedExternalUrl,
  parseApiKey,
  parseMediaAction,
  parseMoveDelta,
  parseRendererError,
  parseSearchQuery,
  parseVoicePayload,
  parseWindowSize,
} from "./validate.js";

describe("parseMoveDelta", () => {
  it("accepts finite numbers and rounds them", () => {
    expect(parseMoveDelta({ deltaX: 1.6, deltaY: -2.2 })).toEqual({
      deltaX: 2,
      deltaY: -2,
    });
  });

  it.each([undefined, null, {}, { deltaX: NaN, deltaY: 0 }, { deltaX: "1" }])(
    "rejects %o",
    (payload) => {
      expect(parseMoveDelta(payload)).toBeNull();
    },
  );

  it("clamps absurd deltas", () => {
    expect(parseMoveDelta({ deltaX: 1e9, deltaY: -1e9 })).toEqual({
      deltaX: 10_000,
      deltaY: -10_000,
    });
  });
});

describe("parseWindowSize", () => {
  it("clamps sizes into a sane range", () => {
    expect(parseWindowSize({ width: 5, height: 99999 })).toEqual({
      width: 50,
      height: 1200,
    });
  });

  it("rejects non-numeric sizes", () => {
    expect(parseWindowSize({ width: "620", height: 220 })).toBeNull();
  });
});

describe("parseMediaAction", () => {
  it("allows only known actions", () => {
    expect(parseMediaAction("next")).toBe("next");
    expect(parseMediaAction("rm -rf")).toBeNull();
    expect(parseMediaAction(undefined)).toBeNull();
  });
});

describe("parseSearchQuery", () => {
  it("trims and caps the query", () => {
    expect(parseSearchQuery("  cats  ")).toBe("cats");
    expect(parseSearchQuery("x".repeat(600))).toHaveLength(500);
  });

  it("rejects empty or non-string queries", () => {
    expect(parseSearchQuery("   ")).toBeNull();
    expect(parseSearchQuery(42)).toBeNull();
  });
});

describe("parseVoicePayload", () => {
  it("accepts base64 audio with an audio mime type", () => {
    const payload = { audioData: "AAEC", mimeType: "audio/webm;codecs=opus" };
    expect(parseVoicePayload(payload)).toEqual(payload);
  });

  it("rejects non-audio mime types and non-base64 data", () => {
    expect(
      parseVoicePayload({ audioData: "AAEC", mimeType: "text/html" }),
    ).toBeNull();
    expect(
      parseVoicePayload({ audioData: "<script>", mimeType: "audio/webm" }),
    ).toBeNull();
  });
});

describe("parseApiKey", () => {
  it("trims a plausible key", () => {
    const key = `AIza${"a".repeat(35)}`;
    expect(parseApiKey(`  ${key}\n`)).toBe(key);
  });

  it("rejects short keys and keys with spaces", () => {
    expect(parseApiKey("short")).toBeNull();
    expect(parseApiKey("has a space in the middle of it")).toBeNull();
  });
});

describe("isAllowedExternalUrl", () => {
  it("allows only https links to known hosts", () => {
    expect(isAllowedExternalUrl("https://aistudio.google.com/app/apikey")).toBe(
      true,
    );
    expect(isAllowedExternalUrl("http://aistudio.google.com/")).toBe(false);
    expect(isAllowedExternalUrl("https://evil.example/")).toBe(false);
    expect(isAllowedExternalUrl("file:///C:/Windows/System32/calc.exe")).toBe(
      false,
    );
    expect(isAllowedExternalUrl("not a url")).toBe(false);
  });
});

describe("parseRendererError", () => {
  it("requires a message and truncates long fields", () => {
    expect(parseRendererError({})).toBeNull();
    const parsed = parseRendererError({ message: "x".repeat(5000) });
    expect(parsed.message).toHaveLength(4000);
    expect(parsed.stack).toBe("");
  });
});
