import { app, Menu, session } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import log from "./logger.js";
import {
  analyzeImage,
  analyzeText,
  configureAi,
  toAiError,
} from "./aiProvider.js";
import { createClipboardWatcher } from "./clipboardWatcher.js";
import { registerIpcHandlers } from "./ipc.js";
import { createMediaWatcher } from "./mediaWatcher.js";
import { createPlacement } from "./placement.js";
import { getApiKey, getSetting, setSetting } from "./settings.js";
import { buildAppMenu, createTray } from "./tray.js";
import {
  createWindow,
  hardenWebContents,
  isTrustedRendererUrl,
} from "./window.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// PowerShell can't read files inside app.asar, so the script ships unpacked.
const MEDIA_SCRIPT = path
  .join(__dirname, "mediaWatcher.ps1")
  .replace(/app\.asar([\\/])/, "app.asar.unpacked$1");

if (!app.isPackaged) {
  // Keep development data out of the real user profile.
  const devDataPath = path.join(__dirname, "../.electron-data");
  app.setPath("userData", devDataPath);
  app.setPath("cache", path.join(devDataPath, "Cache"));
  app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
}

app.setAppUserModelId("com.notch.app");

let mainWindow = null;
let placement = null;
let tray = null;
let clipboardRequest = null;

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

async function analyzeClipboard(snapshot) {
  // A newer copy supersedes any analysis still in flight.
  clipboardRequest?.abort();
  const controller = new AbortController();
  clipboardRequest = controller;
  const options = { signal: controller.signal };

  try {
    const result =
      snapshot.kind === "text"
        ? await analyzeText(snapshot.text, options)
        : await analyzeImage(snapshot.imageData, "image/png", options);
    if (!controller.signal.aborted) {
      send("notch:ai-result", { kind: snapshot.kind, ...result });
    }
  } catch (err) {
    if (controller.signal.aborted) return;
    const aiError = toAiError(err);
    if (aiError.code !== "not-configured") {
      log.warn(`Clipboard analysis failed (${aiError.code}):`, err.message);
    }
    send("notch:ai-result", {
      kind: snapshot.kind,
      error: aiError.message,
      code: aiError.code,
    });
  } finally {
    if (clipboardRequest === controller) clipboardRequest = null;
  }
}

const clipboardWatcher = createClipboardWatcher({
  onCopy(snapshot) {
    send("notch:clipboard-copy", {
      kind: snapshot.kind,
      ...(snapshot.kind === "text" ? { text: snapshot.text } : {}),
    });
    analyzeClipboard(snapshot);
  },
});

const mediaWatcher = createMediaWatcher({
  scriptPath: MEDIA_SCRIPT,
  onUpdate: (media) => send("notch:media-update", media),
});

function setClipboardAiEnabled(enabled) {
  setSetting("clipboardAi", enabled);
  if (enabled) {
    clipboardWatcher.start();
  } else {
    clipboardWatcher.stop();
    clipboardRequest?.abort();
  }
}

function openSettings() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.show();
  mainWindow.focus();
  send("notch:open-settings");
}

const buildMenu = () =>
  buildAppMenu({
    openSettings,
    isClipboardAiEnabled: () => getSetting("clipboardAi"),
    setClipboardAiEnabled,
    resetPosition: () => placement?.reset(),
  });

function configurePermissions() {
  const ses = session.defaultSession;
  // The renderer may only ever ask for the microphone.
  ses.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      const audioOnly =
        permission === "media" &&
        (details.mediaTypes ?? []).every((type) => type === "audio");
      callback(audioOnly && isTrustedRendererUrl(webContents.getURL()));
    },
  );
  ses.setPermissionCheckHandler(
    (webContents, permission) =>
      permission === "media" && isTrustedRendererUrl(webContents?.getURL()),
  );
}

function createMainWindow() {
  mainWindow = createWindow();
  placement = createPlacement(mainWindow);
  placement.restore();
  mainWindow.on("closed", () => {
    mainWindow = null;
    placement = null;
  });
}

async function start() {
  if (!app.isPackaged) {
    const { config } = await import("dotenv");
    config({ quiet: true });
  }

  configureAi({ apiKey: getApiKey(), model: process.env.GEMINI_MODEL });
  configurePermissions();
  if (app.isPackaged) Menu.setApplicationMenu(null);

  registerIpcHandlers({
    getPlacement: () => placement,
    mediaWatcher,
    buildMenu,
  });

  createMainWindow();
  tray = createTray(buildMenu);

  if (getSetting("clipboardAi")) clipboardWatcher.start();
  mediaWatcher.start();

  log.info(`Notch ${app.getVersion()} started`);
}

app.on("web-contents-created", (_event, contents) =>
  hardenWebContents(contents),
);

if (app.requestSingleInstanceLock()) {
  app.on("second-instance", () => mainWindow?.showInactive());

  app
    .whenReady()
    .then(start)
    .catch((err) => {
      log.error("Startup failed:", err);
      app.exit(1);
    });

  app.on("before-quit", () => {
    clipboardWatcher.stop();
    mediaWatcher.stop();
    clipboardRequest?.abort();
    tray?.destroy();
  });

  app.on("window-all-closed", () => app.quit());
} else {
  app.quit();
}
