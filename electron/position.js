import { screen } from "electron";
import { DEFAULT_PRESET, getPosition } from "../src/config/positions.js";

export function applyPosition(window, presetName = DEFAULT_PRESET) {
  if (!window || window.isDestroyed()) {
    return;
  }

  const display = screen.getPrimaryDisplay();
  const bounds = display.workAreaSize;
  const preset = getPosition(presetName, bounds);
  window.setPosition(preset.x, preset.y, false);
}
