import { useEffect, useRef, useState } from "react";
import AIOrb from "./components/AIOrb";
import SearchPrompt from "./components/SearchPrompt";
import MediaIsland from "./components/MediaIsland";

export default function App() {
  const [state, setState] = useState("idle");
  const [copiedQuery, setCopiedQuery] = useState(null);
  const [media, setMedia] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [dockDirection, setDockDirection] = useState("left");
  const hoverTimeoutRef = useRef(null);

  // Listen for dock direction (expands right or left depending on screen edge)
  useEffect(() => {
    if (!window.notchAPI?.onDockDirection) return;
    const cleanup = window.notchAPI.onDockDirection(({ dock }) => {
      setDockDirection(dock || "left");
    });
    return cleanup;
  }, []);

  // Listen for Windows clipboard events
  useEffect(() => {
    if (!window.notchAPI?.onClipboardCopy) return;

    const cleanup = window.notchAPI.onClipboardCopy(({ text }) => {
      if (text && text.trim()) {
        setCopiedQuery(text.trim());
        setState("thinking");
      }
    });

    return cleanup;
  }, []);

  // Listen for Windows GSMTC media events (Spotify, YouTube, Chrome, Apple Music, etc.)
  useEffect(() => {
    if (!window.notchAPI?.onMediaUpdate) return;

    const cleanup = window.notchAPI.onMediaUpdate((data) => {
      if (data && data.active && data.title) {
        setMedia(data);
      } else {
        setMedia(null);
      }
    });

    return cleanup;
  }, []);

  const handlePointerEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 450);
  };

  // Reveal media only when hovered; clipboard prompt reveals immediately
  const showMedia = Boolean(!copiedQuery && media && media.active && isHovered);
  const isExpanded = Boolean(copiedQuery || showMedia);

  // Dynamically manage window dimensions based on expansion state
  useEffect(() => {
    if (isExpanded) {
      window.notchAPI?.setWindowSize({ width: 400, height: 100 });
    } else {
      window.notchAPI?.setWindowSize({ width: 100, height: 100 });
    }
  }, [isExpanded]);

  const handleSearch = (query) => {
    window.notchAPI?.searchWeb(query || copiedQuery);
    dismissPrompt();
  };

  const dismissPrompt = () => {
    setCopiedQuery(null);
    setState("idle");
  };

  return (
    <main
      className={`${isExpanded ? "expanded" : "compact"} ${
        dockDirection === "right" ? "dock-right" : ""
      }`}
    >
      <div className="orb-slot">
        <AIOrb
          state={state}
          size={50}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        />
      </div>

      {copiedQuery ? (
        <SearchPrompt
          text={copiedQuery}
          onSearch={() => handleSearch(copiedQuery)}
          onDismiss={dismissPrompt}
        />
      ) : showMedia ? (
        <MediaIsland
          media={media}
          onPlayPause={() => window.notchAPI?.mediaControl("toggle")}
          onNext={() => window.notchAPI?.mediaControl("next")}
          onPrev={() => window.notchAPI?.mediaControl("prev")}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        />
      ) : null}
    </main>
  );
}
