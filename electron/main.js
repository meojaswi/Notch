import { app, BrowserWindow, clipboard, ipcMain, screen, shell } from "electron";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createWindow } from "./window.js";
import { applyPosition } from "./position.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const electronDataPath = path.join(__dirname, "../.electron-data");
app.setPath("userData", electronDataPath);
app.setPath("cache", path.join(electronDataPath, "Cache"));
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");

let mainWindow;
let lastClipboardText = "";
let clipboardInterval = null;
let mediaProcess = null;

function startClipboardWatcher(win) {
  if (clipboardInterval) {
    clearInterval(clipboardInterval);
  }

  try {
    lastClipboardText = clipboard.readText() || "";
  } catch {
    lastClipboardText = "";
  }

  clipboardInterval = setInterval(() => {
    if (!win || win.isDestroyed()) return;

    try {
      const currentText = clipboard.readText() || "";
      const trimmed = currentText.trim();

      if (trimmed && trimmed !== lastClipboardText) {
        lastClipboardText = trimmed;

        if (trimmed.length >= 2 && trimmed.length <= 1200) {
          win.webContents.send("notch:clipboard-copy", { text: trimmed });
        }
      }
    } catch (err) {
      console.error("Clipboard watch error:", err);
    }
  }, 500);
}

function startMediaWatcher(win) {
  if (mediaProcess) {
    try {
      mediaProcess.kill();
    } catch {}
  }

  const scriptPath = path.join(__dirname, "mediaWatcher.ps1");
  mediaProcess = spawn("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    scriptPath,
  ]);

  let buffer = "";
  mediaProcess.stdout.on("data", (data) => {
    buffer += data.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (win && !win.isDestroyed()) {
            win.webContents.send("notch:media-update", parsed);
          }
        } catch {}
      }
    }
  });

  mediaProcess.stderr.on("data", (data) => {
    console.error(`Media watcher: ${data.toString().trim()}`);
  });

  mediaProcess.on("error", (err) => {
    console.error("Media watcher error:", err);
  });
}

function sendMediaKey(action) {
  const code = action === "next" ? "0xB0" : action === "prev" ? "0xB1" : "0xB3";
  spawn("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    `Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, uint dwExtraInfo);' -Name K -Namespace Win32; [Win32.K]::keybd_event(${code}, 0, 0, 0); [Win32.K]::keybd_event(${code}, 0, 2, 0);`,
  ]);
}

function createMainWindow() {
  mainWindow = createWindow();
  applyPosition(mainWindow, "desktop-orb");
  startClipboardWatcher(mainWindow);
  startMediaWatcher(mainWindow);
  return mainWindow;
}

ipcMain.on("notch:set-interactive", (event, interactive) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window && !window.isDestroyed()) {
    window.setIgnoreMouseEvents(!interactive, { forward: true });
  }
});

ipcMain.on("notch:move-window", (event, { deltaX, deltaY }) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window && !window.isDestroyed()) {
    const [x, y] = window.getPosition();
    window.setPosition(Math.round(x + deltaX), Math.round(y + deltaY));
    window.setAlwaysOnTop(true, "screen-saver");
  }
});

let expandedShiftX = 0;

function resizeWindow(event, { width, height }) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window || window.isDestroyed()) return;

  const [x, y] = window.getPosition();
  const [curW] = window.getSize();
  const targetW = Math.round(width);
  const targetH = Math.round(height);

  const [, curH] = window.getSize();
  if (targetW === curW && targetH === curH) return;

  const currentDisplay = screen.getDisplayNearestPoint({ x, y });
  const maxRight = currentDisplay.workArea.x + currentDisplay.workArea.width;

  let newX = x;
  let dock = "left";

  if (targetW > curW) {
    // Expanding: check if expanding right exceeds monitor boundary
    if (x + targetW > maxRight) {
      expandedShiftX = Math.min(x - currentDisplay.workArea.x, targetW - curW);
      newX = x - expandedShiftX;
      dock = "right";
    } else {
      expandedShiftX = 0;
      dock = "left";
    }
  } else {
    // Shrinking: restore original position exactly
    if (expandedShiftX > 0) {
      newX = x + expandedShiftX;
      expandedShiftX = 0;
    }
    dock = "left";
  }

  if (Math.round(newX) !== x) {
    window.setPosition(Math.round(newX), y);
  }
  window.setSize(targetW, targetH);
  window.webContents.send("notch:dock-direction", { dock });
}

ipcMain.on("notch:resize", resizeWindow);
ipcMain.on("notch:set-window-size", resizeWindow);

ipcMain.on("notch:search-web", (_event, query) => {
  if (typeof query === "string" && query.trim()) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
    shell.openExternal(url);
  }
});

ipcMain.on("notch:media-control", (_event, action) => {
  sendMediaKey(action);
});

ipcMain.handle("notch:ping", () => "pong");

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (clipboardInterval) {
    clearInterval(clipboardInterval);
  }
  if (mediaProcess) {
    try {
      mediaProcess.kill();
    } catch {}
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

export { createMainWindow };
