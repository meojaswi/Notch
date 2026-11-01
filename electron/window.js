import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import log from "./logger.js";
import { COMPACT_SIZE } from "./lib/geometry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RENDERER_INDEX = path.join(__dirname, "../dist/index.html");
const RENDERER_DIR_URL = pathToFileURL(path.dirname(RENDERER_INDEX)).href;

// Only unpackaged builds may load the Vite dev server.
const DEV_SERVER_URL = app.isPackaged ? null : process.env.VITE_DEV_SERVER_URL;

const MAX_CRASH_RELOADS = 3;
const CRASH_WINDOW_MS = 60_000;

export function isTrustedRendererUrl(url) {
  if (typeof url !== "string" || !url) return false;
  try {
    if (DEV_SERVER_URL) {
      return new URL(url).origin === new URL(DEV_SERVER_URL).origin;
    }
    return url.toLowerCase().startsWith(`${RENDERER_DIR_URL.toLowerCase()}/`);
  } catch {
    return false;
  }
}

function reloadAfterCrashes(window) {
  const crashes = [];
  window.webContents.on("render-process-gone", (_event, details) => {
    log.error("Renderer process gone:", details);
    if (details.reason === "clean-exit" || window.isDestroyed()) return;

    const now = Date.now();
    crashes.push(now);
    while (crashes.length && now - crashes[0] > CRASH_WINDOW_MS)
      crashes.shift();
    if (crashes.length > MAX_CRASH_RELOADS) {
      log.error("Renderer keeps crashing; not reloading again");
      return;
    }
    window.reload();
  });

  window.webContents.on("unresponsive", () =>
    log.warn("Renderer unresponsive"),
  );
  window.webContents.on("responsive", () => log.info("Renderer responsive"));
}

export function createWindow() {
  const window = new BrowserWindow({
    width: COMPACT_SIZE,
    height: COMPACT_SIZE,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: "#00000000",
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: !app.isPackaged,
    },
  });

  reloadAfterCrashes(window);

  const load = DEV_SERVER_URL
    ? window.loadURL(DEV_SERVER_URL)
    : window.loadFile(RENDERER_INDEX);
  load.catch((err) => log.error("Failed to load renderer:", err));
  window.webContents.on("did-finish-load", () => log.info("Renderer loaded"));
  window.webContents.on("did-fail-load", (_event, code, description, url) =>
    log.error(`Renderer failed to load ${url}: ${description} (${code})`),
  );

  window.once("ready-to-show", () => {
    window.showInactive();
    window.setAlwaysOnTop(true, "screen-saver");
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  });

  window.on("blur", () => {
    window.setAlwaysOnTop(true, "screen-saver");
  });

  return window;
}

// Applied to every webContents: the renderer may never navigate away from the
// app, open new windows, or embed webviews.
export function hardenWebContents(contents) {
  contents.on("will-navigate", (event, url) => {
    if (!isTrustedRendererUrl(url)) {
      log.warn(`Blocked navigation to ${url}`);
      event.preventDefault();
    }
  });
  contents.on("will-attach-webview", (event) => event.preventDefault());
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
}
