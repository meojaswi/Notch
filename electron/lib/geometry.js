// Pure window-geometry helpers. Kept free of Electron imports so they can be
// unit tested.

// Size of the collapsed window, and of the orb's slot inside the expanded one.
export const COMPACT_SIZE = 100;

export function defaultOrbPosition(workArea) {
  return {
    x: workArea.x + Math.round((workArea.width - COMPACT_SIZE) / 2),
    y: workArea.y + workArea.height - COMPACT_SIZE,
  };
}

export function clampToArea({ x, y, width, height }, area) {
  const maxX = Math.max(area.x, area.x + area.width - width);
  const maxY = Math.max(area.y, area.y + area.height - height);
  return {
    x: Math.round(Math.min(Math.max(x, area.x), maxX)),
    y: Math.round(Math.min(Math.max(y, area.y), maxY)),
  };
}

// Where the orb sits inside the window: a COMPACT_SIZE square against the
// left edge (or the right edge when docked right), vertically centred.
export function orbOffset({ width, height }, dock) {
  return {
    x: dock === "right" ? width - COMPACT_SIZE : 0,
    y: Math.round((height - COMPACT_SIZE) / 2),
  };
}

// Window position that keeps the orb inside `area`, given a desired window
// position.
export function clampWindowByOrb({ x, y, width, height }, dock, area) {
  const offset = orbOffset({ width, height }, dock);
  const orb = clampToArea(
    {
      x: x + offset.x,
      y: y + offset.y,
      width: COMPACT_SIZE,
      height: COMPACT_SIZE,
    },
    area,
  );
  return { x: orb.x - offset.x, y: orb.y - offset.y };
}

/**
 * Works out where the window goes when its width changes. Expanding grows
 * rightwards unless that would run off the screen, in which case the window
 * shifts left and docks the orb on the right. Shrinking undoes the shift so
 * the orb returns to exactly where it was.
 */
export function computeResize({
  x,
  currentWidth,
  targetWidth,
  workArea,
  shiftX,
}) {
  if (targetWidth === currentWidth) {
    return { x, dock: shiftX > 0 ? "right" : "left", shiftX };
  }

  if (targetWidth > currentWidth) {
    const maxRight = workArea.x + workArea.width;
    if (x + targetWidth > maxRight) {
      const nextShift = Math.min(x - workArea.x, targetWidth - currentWidth);
      return { x: x - nextShift, dock: "right", shiftX: nextShift };
    }
    return { x, dock: "left", shiftX: 0 };
  }

  return { x: x + shiftX, dock: "left", shiftX: 0 };
}
