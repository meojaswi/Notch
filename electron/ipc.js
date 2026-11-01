import { BrowserWindow, ipcMain, shell } from "electron";
import log from "./logger.js";
import { isTrustedRendererUrl } from "./window.js";
import {
  analyzeAudio,
  configureAi,
  toAiError,
  validateApiKey,
} from "./aiProvider.js";
import {
  clearApiKey,
  getApiKey,
  getApiKeyStatus,
  setApiKey,
} from "./settings.js";
import {
  isAllowedExternalUrl,
  parseApiKey,
  parseMediaAction,
  parseMoveDelta,
  parseRendererError,
  parseSearchQuery,
  parseVoicePayload,
  parseWindowSize,
} from "./lib/validate.js";

function isTrustedSender(event) {
  return isTrustedRendererUrl(event.senderFrame?.url);
}

function on(channel, listener) {
  ipcMain.on(channel, (event, ...args) => {
    if (!isTrustedSender(event)) {
      log.warn(`Blocked IPC "${channel}" from ${event.senderFrame?.url}`);
      return;
    }
    listener(event, ...args);
  });
}

function handle(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!isTrustedSender(event)) {
      log.warn(`Blocked IPC "${channel}" from ${event.senderFrame?.url}`);
      throw new Error("Untrusted sender");
    }
    return handler(event, ...args);
  });
}

function windowFor(event) {
  const window = BrowserWindow.fromWebContents(event.sender);
  return window && !window.isDestroyed() ? window : null;
}

export function registerIpcHandlers({ getPlacement, mediaWatcher, buildMenu }) {
  on("notch:set-interactive", (event, interactive) => {
    windowFor(event)?.setIgnoreMouseEvents(interactive !== true, {
      forward: true,
    });
  });

  on("notch:move-window", (_event, payload) => {
    const delta = parseMoveDelta(payload);
    if (delta) getPlacement()?.moveBy(delta.deltaX, delta.deltaY);
  });

  on("notch:set-window-size", (event, payload) => {
    const size = parseWindowSize(payload);
    const placement = getPlacement();
    if (!size || !placement) return;
    const dock = placement.resize(size.width, size.height);
    event.sender.send("notch:dock-direction", { dock });
  });

  on("notch:search-web", (_event, query) => {
    const cleaned = parseSearchQuery(query);
    if (!cleaned) return;
    shell.openExternal(
      `https://www.google.com/search?q=${encodeURIComponent(cleaned)}`,
    );
  });

  on("notch:open-external", (_event, url) => {
    if (isAllowedExternalUrl(url)) {
      shell.openExternal(url);
    } else {
      log.warn(`Blocked openExternal for ${url}`);
    }
  });

  on("notch:media-control", (_event, action) => {
    const command = parseMediaAction(action);
    if (command) mediaWatcher.sendCommand(command);
  });

  on("notch:show-context-menu", (event) => {
    const window = windowFor(event);
    if (window) buildMenu().popup({ window });
  });

  on("notch:renderer-error", (_event, payload) => {
    const error = parseRendererError(payload);
    if (error) {
      log.error(
        `Renderer error (${error.source}): ${error.message}`,
        error.stack,
      );
    }
  });

  handle("notch:voice-command", async (_event, payload) => {
    const voice = parseVoicePayload(payload);
    if (!voice) return { error: "Invalid audio recording", code: "invalid" };
    try {
      return await analyzeAudio(voice.audioData, voice.mimeType);
    } catch (err) {
      const aiError = toAiError(err);
      log.warn(`Voice command failed (${aiError.code}):`, err.message);
      return { error: aiError.message, code: aiError.code };
    }
  });

  handle("notch:get-api-key-status", () => getApiKeyStatus());

  handle("notch:save-api-key", async (_event, key) => {
    const apiKey = parseApiKey(key);
    if (!apiKey) {
      return { ok: false, error: "That doesn't look like an API key" };
    }

    try {
      await validateApiKey(apiKey);
    } catch (err) {
      // Only a definite rejection blocks saving; a flaky network shouldn't.
      if (err.code === "invalid-key") return { ok: false, error: err.message };
      log.warn(`Could not verify API key (${err.code}); saving anyway`);
    }

    try {
      setApiKey(apiKey);
    } catch (err) {
      log.error("Failed to store API key:", err);
      return { ok: false, error: err.message };
    }
    configureAi({ apiKey, model: process.env.GEMINI_MODEL });
    return { ok: true, status: getApiKeyStatus() };
  });

  handle("notch:clear-api-key", () => {
    clearApiKey();
    configureAi({ apiKey: getApiKey(), model: process.env.GEMINI_MODEL });
    return { ok: true, status: getApiKeyStatus() };
  });
}
