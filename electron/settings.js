import { app, safeStorage } from "electron";
import fs from "node:fs";
import path from "node:path";
import log from "./logger.js";

const DEFAULTS = Object.freeze({
  clipboardAi: true,
  position: null,
  // Encrypted with the OS keychain (DPAPI on Windows), stored as base64.
  apiKey: null,
});

let cache = null;

function settingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function load() {
  if (cache) return cache;
  try {
    cache = {
      ...DEFAULTS,
      ...JSON.parse(fs.readFileSync(settingsPath(), "utf8")),
    };
  } catch (err) {
    if (err.code !== "ENOENT") {
      log.warn("Settings file unreadable, falling back to defaults:", err);
    }
    cache = { ...DEFAULTS };
  }
  return cache;
}

function persist() {
  const target = settingsPath();
  const temp = `${target}.tmp`;
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    // Write then rename, so a crash mid-write can't leave a corrupt file.
    fs.writeFileSync(temp, JSON.stringify(cache, null, 2));
    fs.renameSync(temp, target);
  } catch (err) {
    log.error("Failed to save settings:", err);
  }
}

export function getSetting(key) {
  return load()[key];
}

export function setSetting(key, value) {
  load()[key] = value;
  persist();
}

export function getApiKey() {
  const stored = load().apiKey;
  if (stored) {
    try {
      return safeStorage.decryptString(Buffer.from(stored, "base64"));
    } catch (err) {
      log.error("Stored API key could not be decrypted:", err);
    }
  }
  return process.env.GEMINI_API_KEY?.trim() || "";
}

export function setApiKey(key) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure storage is unavailable on this system");
  }
  setSetting("apiKey", safeStorage.encryptString(key).toString("base64"));
}

export function clearApiKey() {
  setSetting("apiKey", null);
}

export function getApiKeyStatus() {
  const key = getApiKey();
  if (!key) return { configured: false, masked: "", source: null };
  return {
    configured: true,
    masked: `${key.slice(0, 4)}…${key.slice(-4)}`,
    source: load().apiKey ? "settings" : "environment",
  };
}
