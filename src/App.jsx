import { useEffect, useRef, useState } from "react";
import AIOrb from "./components/AIOrb";
import AIResult from "./components/AIResult";
import SearchPrompt from "./components/SearchPrompt";
import MediaIsland from "./components/MediaIsland";

export default function App() {
  const [state, setState] = useState("idle");
  const [copiedQuery, setCopiedQuery] = useState(null);
  const [clipboardKind, setClipboardKind] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [media, setMedia] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [dockDirection, setDockDirection] = useState("left");
  const hoverTimeoutRef = useRef(null);
  const copyTimeoutRef = useRef(null);

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

    const cleanup = window.notchAPI.onClipboardCopy(({ kind = "text", text }) => {
      const isValidText = kind === "text" && text && text.trim();
      const isImage = kind === "image";

      if (isValidText || isImage) {
        clearTimeout(copyTimeoutRef.current);
        setCopiedQuery(isValidText ? text.trim() : null);
        setClipboardKind(kind);
        setAiResult(null);
        setAiLoading(true);
        setIsSearchOpen(false);
        setState("copied");
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedQuery(null);
          setClipboardKind(null);
          setAiResult(null);
          setAiLoading(false);
          setIsSearchOpen(false);
          setState("idle");
        }, 9000);
      }
    });

    return () => {
      cleanup?.();
      clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!window.notchAPI?.onAiResult) return;

    const cleanup = window.notchAPI.onAiResult((result) => {
      setAiResult(result);
      setAiLoading(false);
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
    if (copiedQuery || clipboardKind === "image") {
      setIsSearchOpen(true);
      setState("thinking");
    }
  };

  const handlePointerLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 450);
  };

  // Reveal the search prompt from a recent copy only after the orb is hovered.
  const hasPendingClipboard = Boolean(copiedQuery || clipboardKind === "image");
  const showMedia = Boolean(
    !hasPendingClipboard && media && media.active && isHovered
  );
  const isExpanded = Boolean(isSearchOpen || showMedia);

  // Dynamically manage window dimensions based on expansion state
  useEffect(() => {
    if (isExpanded) {
      window.notchAPI?.setWindowSize({ width: 450, height: 100 });
    } else {
      window.notchAPI?.setWindowSize({ width: 100, height: 100 });
    }
  }, [isExpanded]);

  const handleSearch = (query) => {
    window.notchAPI?.searchWeb(query || copiedQuery);
    dismissPrompt();
  };

  const dismissPrompt = () => {
    clearTimeout(copyTimeoutRef.current);
    setCopiedQuery(null);
    setClipboardKind(null);
    setAiResult(null);
    setAiLoading(false);
    setIsSearchOpen(false);
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

      {isSearchOpen && clipboardKind === "image" ? (
        <AIResult
          loading={aiLoading}
          description={aiResult?.description}
          detectedText={aiResult?.detectedText}
          query={aiResult?.query}
          error={aiResult?.error}
          onSearch={() => handleSearch(aiResult?.query)}
          onDismiss={dismissPrompt}
        />
      ) : isSearchOpen && copiedQuery ? (
        <SearchPrompt
          text={aiResult?.query || copiedQuery}
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
