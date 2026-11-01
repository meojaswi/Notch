import { describe, expect, it } from "vitest";
import {
  clampToArea,
  clampWindowByOrb,
  computeResize,
  defaultOrbPosition,
} from "./geometry.js";

const workArea = { x: 0, y: 0, width: 1920, height: 1040 };

describe("defaultOrbPosition", () => {
  it("centres the orb at the bottom of the work area", () => {
    expect(defaultOrbPosition(workArea)).toEqual({ x: 910, y: 940 });
  });

  it("respects work areas that do not start at the origin", () => {
    const secondary = { x: 1920, y: 40, width: 1280, height: 1000 };
    expect(defaultOrbPosition(secondary)).toEqual({ x: 2510, y: 940 });
  });
});

describe("clampToArea", () => {
  it("leaves rectangles inside the area untouched", () => {
    const rect = { x: 100, y: 100, width: 100, height: 100 };
    expect(clampToArea(rect, workArea)).toEqual({ x: 100, y: 100 });
  });

  it("pulls rectangles back from every edge", () => {
    const size = { width: 100, height: 100 };
    expect(clampToArea({ x: -50, y: -50, ...size }, workArea)).toEqual({
      x: 0,
      y: 0,
    });
    expect(clampToArea({ x: 5000, y: 5000, ...size }, workArea)).toEqual({
      x: 1820,
      y: 940,
    });
  });
});

describe("clampWindowByOrb", () => {
  it("keeps a left-docked orb on screen while the panel may overflow", () => {
    const expanded = { x: 1800, y: 500, width: 620, height: 220 };
    expect(clampWindowByOrb(expanded, "left", workArea)).toEqual({
      x: 1800,
      y: 500,
    });
  });

  it("clamps using the orb's slot when docked right", () => {
    const expanded = { x: 1500, y: 500, width: 620, height: 220 };
    // The orb sits at x + 520, which would be 2020 — past the right edge.
    expect(clampWindowByOrb(expanded, "right", workArea)).toEqual({
      x: 1300,
      y: 500,
    });
  });
});

describe("computeResize", () => {
  const base = { workArea, currentWidth: 100, targetWidth: 620, shiftX: 0 };

  it("expands to the right when there is room", () => {
    expect(computeResize({ ...base, x: 200 })).toEqual({
      x: 200,
      dock: "left",
      shiftX: 0,
    });
  });

  it("shifts left and docks right near the right edge", () => {
    expect(computeResize({ ...base, x: 1800 })).toEqual({
      x: 1280,
      dock: "right",
      shiftX: 520,
    });
  });

  it("restores the original position when shrinking", () => {
    const expanded = computeResize({ ...base, x: 1800 });
    const shrunk = computeResize({
      workArea,
      x: expanded.x,
      currentWidth: 620,
      targetWidth: 100,
      shiftX: expanded.shiftX,
    });
    expect(shrunk).toEqual({ x: 1800, dock: "left", shiftX: 0 });
  });

  it("keeps the current dock when only the height changes", () => {
    expect(
      computeResize({
        workArea,
        x: 1280,
        currentWidth: 620,
        targetWidth: 620,
        shiftX: 520,
      }),
    ).toEqual({ x: 1280, dock: "right", shiftX: 520 });
  });
});
