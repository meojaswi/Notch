import { describe, expect, it } from "vitest";
import { looksSensitive } from "./sensitive.js";

describe("looksSensitive", () => {
  it.each([
    ["a private key", "-----BEGIN RSA PRIVATE KEY-----\nMIIE..."],
    [
      "a JWT",
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
    ],
    ["an AWS key", "AKIAIOSFODNN7EXAMPLE"],
    ["a GitHub token", `ghp_${"a1B2".repeat(9)}`],
    ["a Google API key", `AIza${"Sy0-_aB1c".repeat(3)}1234567-`],
    ["a Stripe key", "sk_live_4eC39HqLyjWDarjtT1zdp7dc"],
    ["an OpenAI-style key", "sk-proj-abcdefghijklmnopqrstuvwx"],
    ["a database URL with password", "postgres://admin:hunter2@db.local/app"],
    ["a card number", "4111 1111 1111 1111"],
    ["a generated password", "xK9#mP2$vL5@qR"],
    ["a long random token", "q8ZtR3vN1xLw7KpB4mYc9HdJ2sFgA6eU"],
  ])("flags %s", (_label, text) => {
    expect(looksSensitive(text)).toBe(true);
  });

  it.each([
    ["prose", "The quick brown fox jumps over the lazy dog"],
    ["an error message", "TypeError: Cannot read properties of undefined"],
    ["a code snippet", "React.useState(0)"],
    ["an identifier with digits", "Base64Encoder"],
    ["a URL", "https://example.com/path?query=1"],
    ["an email", "someone@example.com"],
    ["a Windows path", "C:\\Users\\me\\Documents\\notes.txt"],
    ["a phone number", "+1 555 010 9999"],
    ["a number that fails Luhn", "4111 1111 1111 1112"],
    ["empty text", "   "],
  ])("does not flag %s", (_label, text) => {
    expect(looksSensitive(text)).toBe(false);
  });
});
