import "./VoiceResult.css";

const COMMAND_MAP = {
  play: { icon: "▶", label: "Play" },
  pause: { icon: "⏸", label: "Pause" },
  toggle: { icon: "⏯", label: "Play / Pause" },
  next: { icon: "⏭", label: "Next Track" },
  prev: { icon: "⏮", label: "Previous Track" },
  search: { icon: "🔍", label: "Search" },
};

export default function VoiceResult({
  isListening,
  isAnalyzing,
  transcript,
  command,
  error,
  onStopListening,
  onDismiss,
  onPointerEnter,
  onPointerLeave,
}) {
  const micState = isListening
    ? "listening"
    : isAnalyzing
      ? "analyzing"
      : command
        ? "done"
        : "";

  const cmd = command ? COMMAND_MAP[command.action] : null;

  return (
    <div
      className="voice-result-wrap"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Mic icon — clicking while listening stops recording immediately */}
      <button
        type="button"
        className={`voice-mic-icon ${micState}`}
        onClick={isListening ? onStopListening : undefined}
        title={isListening ? "Click when done speaking" : undefined}
        style={{ border: 0, cursor: isListening ? "pointer" : "default" }}
      >
        <svg viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </button>

      {/* Content */}
      <div className="voice-content">
        <span className="voice-status">
          {error
            ? "Error"
            : isListening
              ? "Listening... (3s)"
              : isAnalyzing
                ? "Processing with Gemini..."
                : command
                  ? "Command recognized"
                  : "Ready"}
        </span>

        {/* Transcript or placeholder */}
        {error ? (
          <span className="voice-transcript" style={{ color: "#ff7b7b" }}>
            {error}
          </span>
        ) : transcript ? (
          <span className="voice-transcript">
            "{transcript}"
          </span>
        ) : isListening ? (
          <>
            <span className="voice-transcript interim">
              Speak now...
              <span className="voice-cursor" />
            </span>
            <div className="voice-hints">
              <span className="voice-hint">play</span>
              <span className="voice-hint">pause</span>
              <span className="voice-hint">next track</span>
              <span className="voice-hint">search for...</span>
            </div>
          </>
        ) : isAnalyzing ? (
          <span className="voice-transcript interim">
            Understanding voice command...
          </span>
        ) : null}

        {/* Command feedback pill */}
        {cmd && (
          <div className="voice-command-feedback">
            <span className="command-icon">{cmd.icon}</span>
            <span className="command-text">
              {cmd.label}
              {command.action === "search" && command.query
                ? `: ${command.query}`
                : ""}
            </span>
          </div>
        )}

        {/* Waveform animation while listening */}
        {isListening && (
          <div className="voice-waveform">
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </div>
        )}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        className="voice-dismiss-btn"
        aria-label="Dismiss"
        onClick={onDismiss}
      >
        &times;
      </button>
    </div>
  );
}
