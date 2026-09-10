import { BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const window = new BrowserWindow({
    width: 100,
    height: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: "#00000000",
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === "production") {
    window.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    window.loadURL("http://127.0.0.1:5173");
  }

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

export { createWindow };
