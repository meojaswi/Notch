import { useMemo } from "react";
import { DEFAULT_PRESET, getPosition } from "../config/positions.browser";

export function useOrbPosition(presetName = DEFAULT_PRESET) {
  return useMemo(
    () => ({
      preset: presetName,
      coordinates: getPosition(presetName, { width: window.innerWidth }),
    }),
    [presetName],
  );
}
