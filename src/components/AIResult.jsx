import "./AIResult.css";

export default function AIResult({
  loading,
  kind,
  micro,
  short,
  full,
  detectedText,
  query,
  error,
  fallbackText,
  onSearch,
  onDismiss,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  onWheel,
}) {
  return (
    <div
      className="ai-result-wrap"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      onWheel={onWheel}
    >
      <div className="ai-result-icon" aria-hidden="true">
        {loading ? "..." : kind === "image" ? "IMG" : "TXT"}
      </div>

      <div className="ai-result-content">
        <span className="ai-result-label">
          {loading
            ? "Analyzing"
            : micro || (kind === "image" ? "Image" : "Copied text")}
        </span>
        <span className="ai-result-summary">
          {loading
            ? "Gemini is preparing a brief description..."
            : short || error || fallbackText}
        </span>
        {!loading ? (
          <div className="ai-result-details">
            <p>{full || error || "Description unavailable"}</p>
            {detectedText ? (
              <p className="ai-result-text">Text: {detectedText}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="ai-result-actions">
        {!loading && query ? (
          <button type="button" className="ai-search-btn" onClick={onSearch}>
            Search
          </button>
        ) : null}
        <button
          type="button"
          className="ai-dismiss-btn"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          &times;
        </button>
      </div>
    </div>
  );
}
