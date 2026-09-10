import "./AIResult.css";

export default function AIResult({
  loading,
  description,
  detectedText,
  query,
  error,
  onSearch,
  onDismiss,
}) {
  return (
    <div
      className="ai-result-wrap"
      onPointerEnter={() => window.notchAPI?.setInteractive(true)}
    >
      <div className="ai-result-icon" aria-hidden="true">
        {loading ? "..." : "AI"}
      </div>

      <div className="ai-result-content">
        <span className="ai-result-label">
          {loading
            ? "Analyzing image"
            : error
              ? "Image analysis"
              : "Image description"}
        </span>
        <span className="ai-result-description">
          {loading
            ? "Gemini is describing the copied image..."
            : description || error || "Image description unavailable"}
        </span>
        {!loading && detectedText ? (
          <span className="ai-result-text" title={detectedText}>
            Text: {detectedText}
          </span>
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
