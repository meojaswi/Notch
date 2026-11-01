import { app, Menu, nativeImage, shell, Tray } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLogsDir } from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRAY_ICON = path.join(__dirname, "assets/tray.png");

// The same menu backs the tray icon and right-clicking the orb.
export function buildAppMenu({
  openSettings,
  isClipboardAiEnabled,
  setClipboardAiEnabled,
  resetPosition,
}) {
  return Menu.buildFromTemplate([
    { label: "Settings…", click: openSettings },
    { type: "separator" },
    {
      label: "Analyze clipboard with AI",
      type: "checkbox",
      checked: isClipboardAiEnabled(),
      click: (item) => setClipboardAiEnabled(item.checked),
    },
    {
      label: "Start with Windows",
      type: "checkbox",
      checked: app.getLoginItemSettings().openAtLogin,
      // Registering a dev build would launch a bare Electron at login.
      enabled: app.isPackaged,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
    },
    { type: "separator" },
    { label: "Reset orb position", click: resetPosition },
    { label: "Open logs folder", click: () => shell.openPath(getLogsDir()) },
    { type: "separator" },
    { label: "Quit Notch", role: "quit" },
  ]);
}

export function createTray(buildMenu) {
  const tray = new Tray(nativeImage.createFromPath(TRAY_ICON));
  tray.setToolTip("Notch");
  // Rebuilt on every open so checkbox states are always current.
  const showMenu = () => tray.popUpContextMenu(buildMenu());
  tray.on("click", showMenu);
  tray.on("right-click", showMenu);
  return tray;
}
