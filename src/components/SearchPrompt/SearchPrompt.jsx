import { useEffect, useRef } from "react";
import "./SearchPrompt.css";

export default function SearchPrompt({ text, onSearch, onDismiss }) {
  const timerRef = useRef(null);

  useEffect(() => {
    // Auto-dismiss after 4  seconds if not clicked
    timerRef.current = setTimeout(() => {
      onDismiss?.();
    }, 4000);

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        onSearch?.();
      } else if (e.key === "Escape") {
        onDismiss?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDismiss, onSearch]);

  const handlePointerEnter = () => {
    window.notchAPI?.setInteractive(true);
    // Pause dismiss timer on hover
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handlePointerLeave = () => {
    timerRef.current = setTimeout(() => {
      onDismiss?.();
    }, 4000);
  };

  return (
    <div
      className="search-prompt-wrap"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div className="search-prompt-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <div className="search-prompt-content">
        <span className="search-prompt-label">Search Google</span>
        <span className="search-prompt-query" title={text}>
          &ldquo;{text}&rdquo;
        </span>
      </div>

      <div className="search-prompt-actions">
        <button
          type="button"
          className="search-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSearch?.();
          }}
        >
          Search
        </button>
        <button
          type="button"
          className="dismiss-btn"
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
        >
          &times;
        </button>
      </div>
    </div>
  );
}
