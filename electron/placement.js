import { screen } from "electron";
import { getSetting, setSetting } from "./settings.js";
import {
  clampWindowByOrb,
  computeResize,
  defaultOrbPosition,
} from "./lib/geometry.js";

const SAVE_DELAY_MS = 500;

/**
 * Owns the orb window's position: initial placement, dragging, expanding and
 * collapsing, keeping it on screen when displays change, and remembering
 * where the user left it.
 */
export function createPlacement(window) {
  let shiftX = 0;
  let dock = "left";
  let saveTimer = null;

  function workAreaAround(x, y) {
    const [width, height] = window.getSize();
    return screen.getDisplayNearestPoint({
      x: Math.round(x + width / 2),
      y: Math.round(y + height / 2),
    }).workArea;
  }

  function moveTo(x, y) {
    const [width, height] = window.getSize();
    const next = clampWindowByOrb(
      { x, y, width, height },
      dock,
      workAreaAround(x, y),
    );
    window.setPosition(next.x, next.y);
  }

  function savePosition() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (window.isDestroyed()) return;
      const [x, y] = window.getPosition();
      // Store the collapsed position, undoing any expansion shift.
      setSetting("position", { x: x + shiftX, y });
    }, SAVE_DELAY_MS);
  }

  function ensureOnScreen() {
    if (window.isDestroyed()) return;
    const [x, y] = window.getPosition();
    moveTo(x, y);
  }

  return {
    restore() {
      const saved = getSetting("position");
      if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) {
        moveTo(saved.x, saved.y);
      } else {
        this.reset();
      }
      screen.on("display-removed", ensureOnScreen);
      screen.on("display-metrics-changed", ensureOnScreen);
      window.on("closed", () => {
        screen.off("display-removed", ensureOnScreen);
        screen.off("display-metrics-changed", ensureOnScreen);
      });
    },

    reset() {
      const { x, y } = defaultOrbPosition(screen.getPrimaryDisplay().workArea);
      shiftX = 0;
      dock = "left";
      window.setPosition(x, y);
      setSetting("position", null);
    },

    moveBy(deltaX, deltaY) {
      const [x, y] = window.getPosition();
      moveTo(x + deltaX, y + deltaY);
      window.setAlwaysOnTop(true, "screen-saver");
      savePosition();
    },

    resize(width, height) {
      const [x, y] = window.getPosition();
      const [currentWidth, currentHeight] = window.getSize();
      if (width === currentWidth && height === currentHeight) return dock;

      const next = computeResize({
        x,
        currentWidth,
        targetWidth: width,
        workArea: screen.getDisplayNearestPoint({ x, y }).workArea,
        shiftX,
      });
      shiftX = next.shiftX;
      dock = next.dock;
      window.setBounds({ x: next.x, y, width, height });
      return dock;
    },
  };
}
