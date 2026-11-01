// Decides whether copied text looks like a secret, so it is never sent to the
// AI provider. False positives only mean a copy goes unanalysed, so the rules
// lean towards caution.

// Clipboard formats that password managers set to ask clipboard monitors to
// leave the content alone.
export const EXCLUSION_FORMATS = Object.freeze([
  "ExcludeClipboardContentFromMonitorProcessing",
  "Clipboard Viewer Ignore",
]);

const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\beyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/, // JWT
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/, // AWS access key
  /\bgh[pousr]_[A-Za-z0-9]{36}\b/, // GitHub token
  /\bgithub_pat_\w{22,}/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/, // Slack token
  /\bAIza[\w-]{35}/, // Google API key
  /\b[rs]k_(?:live|test)_[0-9A-Za-z]{16,}/, // Stripe key
  /\bsk-[\w-]{20,}/, // OpenAI / Anthropic style key
  /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:[^\s@/]+@/i, // URL with inline password
];

function shannonEntropy(text) {
  const counts = new Map();
  for (const char of text) counts.set(char, (counts.get(char) ?? 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / text.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function passesLuhn(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

function containsCardNumber(text) {
  const candidates = text.match(/\b(?:\d[ -]?){12,18}\d\b/g) ?? [];
  return candidates.some((candidate) =>
    passesLuhn(candidate.replace(/[ -]/g, "")),
  );
}

function looksLikePassword(text) {
  if (/\s/.test(text) || /^[a-z][a-z0-9+.-]*:\/\//i.test(text)) return false;
  if (/^[^@]+@[^@]+\.[a-z]{2,}$/i.test(text) || /[\\/]/.test(text)) {
    return false; // emails and paths
  }

  const hasLower = /[a-z]/.test(text);
  const hasUpper = /[A-Z]/.test(text);
  const hasDigit = /\d/.test(text);
  const hasSymbol = /[^A-Za-z0-9]/.test(text);

  // Generated passwords mix every character class and, unlike code, rarely
  // contain runs of letters long enough to be words.
  if (text.length >= 10 && text.length <= 64) {
    const longestLetterRun = Math.max(
      0,
      ...(text.match(/[A-Za-z]+/g) ?? []).map((run) => run.length),
    );
    if (hasLower && hasUpper && hasDigit && hasSymbol && longestLetterRun < 5) {
      return true;
    }
  }

  // Long random tokens (API keys, session ids) score high on entropy.
  return (
    text.length >= 24 &&
    /^[\w+/=.-]+$/.test(text) &&
    hasLower &&
    hasUpper &&
    hasDigit &&
    shannonEntropy(text) >= 4.2
  );
}

export function looksSensitive(text) {
  if (typeof text !== "string" || !text.trim()) return false;
  const trimmed = text.trim();
  return (
    SECRET_PATTERNS.some((pattern) => pattern.test(trimmed)) ||
    containsCardNumber(trimmed) ||
    looksLikePassword(trimmed)
  );
}
