import { useEffect } from "react";

export function useOrbHover(ref) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !window.notchAPI?.setInteractive) {
      return undefined;
    }

    const setInteractive = (interactive) =>
      window.notchAPI.setInteractive(interactive);
    const handleMouseEnter = () => setInteractive(true);
    const handlePointerDown = () => setInteractive(true);
    const handleMouseLeave = (event) => {
      // If user is holding mouse button down (dragging), do not disable interactivity
      if (event.buttons !== 0) {
        return;
      }
      setInteractive(false);
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("pointerdown", handlePointerDown);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("mouseleave", handleMouseLeave);
      setInteractive(false);
    };
  }, [ref]);
}
