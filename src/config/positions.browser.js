const DEFAULT_PRESET = "desktop-orb";

const presets = {
  "desktop-orb": ({ width, height }) => ({ x: width - 184, y: height - 184 }),
  "top-left": () => ({ x: 24, y: 24 }),
  "top-right": ({ width }) => ({ x: width - 384, y: 24 }),
};

export function getPosition(presetName, workArea) {
  return (presets[presetName] || presets[DEFAULT_PRESET])(workArea);
}

export { DEFAULT_PRESET };
