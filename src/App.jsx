import { useCallback, useEffect, useRef, useState } from "react";
import AIOrb from "./components/AIOrb";
import AIResult from "./components/AIResult";
import MediaIsland from "./components/MediaIsland";
import VoiceResult from "./components/VoiceResult";
import useVoiceCommand from "./hooks/useVoiceCommand";

const COPY_DISCOVERY_MS = 5000;
const RESULT_RETIRE_MS = 1500;
const VOICE_DISMISS_MS = 3000;

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
  const [voiceActive, setVoiceActive] = useState(false);

  const hoverTimeoutRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const voiceTimeoutRef = useRef(null);

  const expireCopiedContent = () => {
    setCopiedQuery(null);
    setClipboardKind(null);
    setAiResult(null);
    setAiLoading(false);
    setIsSearchOpen(false);
    setState("idle");
  };

  const scheduleCopyExpiry = () => {
    clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(expireCopiedContent, COPY_DISCOVERY_MS);
  };

  const scheduleResultExpiry = () => {
    clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(expireCopiedContent, RESULT_RETIRE_MS);
  };

  // ── Dismiss voice panel ──────────────────────────────────────
  const dismissVoice = useCallback(() => {
    clearTimeout(voiceTimeoutRef.current);
    setVoiceActive(false);
    setState("idle");
  }, []);

  // ── Execute recognized commands ──────────────────────────────
  const executeCommand = useCallback(
    (cmd) => {
      if (!cmd) return;

      switch (cmd.action) {
        case "play":
        case "pause":
        case "toggle":
          window.notchAPI?.mediaControl("toggle");
          break;
        case "next":
          window.notchAPI?.mediaControl("next");
          break;
        case "prev":
          window.notchAPI?.mediaControl("prev");
          break;
        case "search":
          if (cmd.query) window.notchAPI?.searchWeb(cmd.query);
          break;
        default:
          break;
      }

      // Keep feedback visible for 3 seconds, then dismiss
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = setTimeout(dismissVoice, VOICE_DISMISS_MS);
    },
    [dismissVoice],
  );

  // ── Voice command hook with Gemini ───────────────────────────
  const {
    isListening,
    isAnalyzing,
    transcript,
    command: voiceCommand,
    error: voiceError,
    startListening,
    stopListening,
    resetVoiceState,
  } = useVoiceCommand({ onCommandRecognized: executeCommand });

  // ── Sync orb state with voice activity ───────────────────────
  useEffect(() => {
    if (isListening) {
      setState("listening");
    } else if (isAnalyzing) {
      setState("thinking");
    } else if (voiceActive && voiceCommand) {
      setState("speaking");
    } else if (voiceActive && voiceError) {
      setState("error");
    }
  }, [isListening, isAnalyzing, voiceActive, voiceCommand, voiceError]);

  // ── Orb click → start/stop voice recording ───────────────────
  const handleOrbClick = () => {
    if (voiceActive) {
      if (isListening) {
        stopListening();
        return;
      }
      resetVoiceState();
      dismissVoice();
      return;
    }

    // Clear any previous clipboard state
    expireCopiedContent();

    setVoiceActive(true);
    startListening();
  };

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

    const cleanup = window.notchAPI.onClipboardCopy(
      ({ kind = "text", text }) => {
        const isValidText = kind === "text" && text && text.trim();
        const isImage = kind === "image";

        if (isValidText || isImage) {
          if (voiceActive) {
            resetVoiceState();
            dismissVoice();
          }

          setCopiedQuery(isValidText ? text.trim() : null);
          setClipboardKind(kind);
          setAiResult(null);
          setAiLoading(true);
          setIsSearchOpen(false);
          setState("copied");
          scheduleCopyExpiry();
        }
      },
    );

    return () => {
      cleanup?.();
      clearTimeout(copyTimeoutRef.current);
    };
  }, [voiceActive, dismissVoice, resetVoiceState]);

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
      clearTimeout(copyTimeoutRef.current);
      setIsSearchOpen(true);
      setState("thinking");
    }
  };

  const handlePointerLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 450);
    if (
      !copiedQuery &&
      clipboardKind !== "image" &&
      !isSearchOpen &&
      !voiceActive
    ) {
      window.notchAPI?.setInteractive(false);
    }
  };

  const handleResultPointerEnter = () => {
    clearTimeout(copyTimeoutRef.current);
    window.notchAPI?.setInteractive(true);
  };

  const handleResultInteraction = () => {
    clearTimeout(copyTimeoutRef.current);
  };

  const handleResultPointerLeave = () => {
    if (copiedQuery || clipboardKind === "image") {
      scheduleResultExpiry();
    }
    window.notchAPI?.setInteractive(false);
  };

  const handleVoicePointerEnter = () => {
    clearTimeout(voiceTimeoutRef.current);
    window.notchAPI?.setInteractive(true);
  };

  const handleVoicePointerLeave = () => {
    if (!isListening && !isAnalyzing && (voiceCommand || voiceError)) {
      voiceTimeoutRef.current = setTimeout(dismissVoice, VOICE_DISMISS_MS);
    }
    window.notchAPI?.setInteractive(false);
  };

  // Reveal the search prompt from a recent copy only after the orb is hovered.
  const hasPendingClipboard = Boolean(copiedQuery || clipboardKind === "image");
  const showMedia = Boolean(
    !hasPendingClipboard && !voiceActive && media && media.active && isHovered,
  );
  const isExpanded = Boolean(isSearchOpen || showMedia || voiceActive);

  // Dynamically manage window dimensions based on expansion state
  useEffect(() => {
    if (isExpanded) {
      window.notchAPI?.setWindowSize({ width: 620, height: 220 });
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

  useEffect(() => {
    return () => clearTimeout(voiceTimeoutRef.current);
  }, []);

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
          onClick={handleOrbClick}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        />
      </div>

      {voiceActive ? (
        <VoiceResult
          isListening={isListening}
          isAnalyzing={isAnalyzing}
          transcript={transcript}
          command={voiceCommand}
          error={voiceError}
          onStopListening={stopListening}
          onDismiss={() => {
            resetVoiceState();
            dismissVoice();
          }}
          onPointerEnter={handleVoicePointerEnter}
          onPointerLeave={handleVoicePointerLeave}
        />
      ) : isSearchOpen && (clipboardKind === "image" || copiedQuery) ? (
        <AIResult
          loading={aiLoading}
          kind={clipboardKind}
          micro={aiResult?.micro}
          short={aiResult?.short}
          full={aiResult?.full}
          description={aiResult?.description}
          detectedText={aiResult?.detectedText}
          query={aiResult?.query}
          error={aiResult?.error}
          fallbackText={copiedQuery}
          onSearch={() => handleSearch(aiResult?.query || copiedQuery)}
          onDismiss={dismissPrompt}
          onPointerEnter={handleResultPointerEnter}
          onPointerLeave={handleResultPointerLeave}
          onPointerMove={handleResultInteraction}
          onWheel={handleResultInteraction}
        />
      ) : media && media.active ? (
        <MediaIsland
          media={media}
          visible={showMedia}
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
