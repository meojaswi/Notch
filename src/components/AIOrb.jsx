import { useEffect, useRef, useState } from "react";
import "./AIOrb.css";

export default function AIOrb({
  state = "idle",
  amplitude = 0,
  size = 80,
  onClick,
  onPointerEnter,
  onPointerLeave,
}) {
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const lastScreenPosition = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const onPointerMove = (event) => {
      if (!dragging.current) return;

      const deltaX = event.screenX - lastScreenPosition.current.x;
      const deltaY = event.screenY - lastScreenPosition.current.y;

      if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
        didDrag.current = true;
        lastScreenPosition.current = { x: event.screenX, y: event.screenY };
        window.notchAPI?.moveWindow({ deltaX, deltaY });
      }
    };

    const onPointerUp = () => {
      if (dragging.current) {
        dragging.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    dragging.current = true;
    didDrag.current = false;
    lastScreenPosition.current = { x: event.screenX, y: event.screenY };
    setIsDragging(true);
    window.notchAPI?.setInteractive(true);
  };

  const handleClick = (event) => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    onClick?.(event);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`orb-wrap ${isDragging ? "dragging" : ""}`}
      style={{
        "--size": typeof size === "number" ? `${size}px` : size,
        "--amp": amplitude,
      }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.(e);
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerEnter={(e) => {
        window.notchAPI?.setInteractive(true);
        onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        if (dragging.current) return;
        onPointerLeave?.(e);
      }}
    >
      <div className={`orb-core ${state}`} />
    </div>
  );
}
