export const DEFAULT_PRESET = "desktop-orb";

export const positionPresets = Object.freeze({
  "desktop-orb": ({ width, height }) => ({
    x: Math.round((width - 100) / 2),
    y: height - 100,
  }),
  "top-left": () => ({ x: 24, y: 24 }),
  "top-right": ({ width }) => ({
    x: width - 140,
    y: 24,
  }),
});

export function getPosition(presetName, workArea) {
  const preset = positionPresets[presetName] || positionPresets[DEFAULT_PRESET];
  return preset(workArea);
}
