// Validation for everything that crosses the IPC boundary from the renderer.
// Each parser returns a clean value, or null when the payload is unusable.

const MAX_MOVE_DELTA = 10_000;
const MIN_WINDOW_SIZE = 50;
const MAX_WINDOW_SIZE = 1200;
const MAX_QUERY_LENGTH = 500;
// ~4 MB of base64 is minutes of Opus audio; voice clips are capped at seconds.
const MAX_AUDIO_BASE64_LENGTH = 4 * 1024 * 1024;
const MAX_ERROR_FIELD_LENGTH = 4000;

export const MEDIA_ACTIONS = Object.freeze([
  "toggle",
  "play",
  "pause",
  "next",
  "prev",
]);

const EXTERNAL_URL_HOSTS = new Set(["aistudio.google.com"]);

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function parseMoveDelta(payload) {
  const { deltaX, deltaY } = payload ?? {};
  if (!isFiniteNumber(deltaX) || !isFiniteNumber(deltaY)) return null;
  return {
    deltaX: clamp(Math.round(deltaX), -MAX_MOVE_DELTA, MAX_MOVE_DELTA),
    deltaY: clamp(Math.round(deltaY), -MAX_MOVE_DELTA, MAX_MOVE_DELTA),
  };
}

export function parseWindowSize(payload) {
  const { width, height } = payload ?? {};
  if (!isFiniteNumber(width) || !isFiniteNumber(height)) return null;
  return {
    width: clamp(Math.round(width), MIN_WINDOW_SIZE, MAX_WINDOW_SIZE),
    height: clamp(Math.round(height), MIN_WINDOW_SIZE, MAX_WINDOW_SIZE),
  };
}

export function parseMediaAction(action) {
  return MEDIA_ACTIONS.includes(action) ? action : null;
}

export function parseSearchQuery(query) {
  if (typeof query !== "string") return null;
  const trimmed = query.trim().slice(0, MAX_QUERY_LENGTH);
  return trimmed || null;
}

export function parseVoicePayload(payload) {
  const { audioData, mimeType } = payload ?? {};
  if (
    typeof audioData !== "string" ||
    audioData.length === 0 ||
    audioData.length > MAX_AUDIO_BASE64_LENGTH ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(audioData)
  ) {
    return null;
  }
  if (
    typeof mimeType !== "string" ||
    !/^audio\/[\w.+-]+(;\s*codecs=[\w.]+)?$/.test(mimeType)
  ) {
    return null;
  }
  return { audioData, mimeType };
}

export function parseApiKey(key) {
  if (typeof key !== "string") return null;
  const trimmed = key.trim();
  // Printable ASCII with no spaces; generous bounds around real key lengths.
  return /^[\x21-\x7e]{20,200}$/.test(trimmed) ? trimmed : null;
}

export function isAllowedExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" && EXTERNAL_URL_HOSTS.has(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export function parseRendererError(payload) {
  const field = (value) =>
    typeof value === "string" ? value.slice(0, MAX_ERROR_FIELD_LENGTH) : "";
  const message = field(payload?.message);
  if (!message) return null;
  return {
    message,
    stack: field(payload?.stack),
    source: field(payload?.source),
  };
}
