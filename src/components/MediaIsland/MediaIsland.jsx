import { useRef } from "react";
import "./MediaIsland.css";

function formatTime(ms) {
  if (!ms || ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function MediaIsland({
  media,
  onPlayPause,
  onNext,
  onPrev,
  onPointerEnter,
  onPointerLeave,
}) {
  const islandRef = useRef(null);

  if (!media || !media.title) return null;

  const isPlaying = media.status === "Playing";
  const progress =
    media.duration > 0
      ? Math.min(100, Math.max(0, (media.position / media.duration) * 100))
      : 0;

  return (
    <div
      ref={islandRef}
      className="media-island-wrap"
      onPointerEnter={(e) => {
        window.notchAPI?.setInteractive(true);
        onPointerEnter?.(e);
      }}
      onPointerLeave={onPointerLeave}
    >
      <div className="media-top-row">
        <div
          className={`media-app-icon ${isPlaying ? "playing" : ""}`}
          aria-hidden="true"
        >
          {media.thumbnail ? (
            <img src={media.thumbnail} alt="" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 3v11.2a3.5 3.5 0 1 0 2 3.15V8.4l7-1.75v6.55a3.5 3.5 0 1 0 2 3.15V3.5L9 6.25V3z" />
            </svg>
          )}
        </div>

        <div className="media-info">
          <span className="media-title" title={media.title}>
            {media.title}
          </span>
          {media.artist && (
            <span className="media-artist" title={media.artist}>
              {media.artist}
            </span>
          )}
        </div>

        <div className="media-controls">
          <button
            type="button"
            className="media-btn"
            aria-label="Previous track"
            onClick={(e) => {
              e.stopPropagation();
              onPrev?.();
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            type="button"
            className="media-btn play-pause"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause?.();
            }}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="media-btn"
            aria-label="Next track"
            onClick={(e) => {
              e.stopPropagation();
              onNext?.();
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="media-progress-row">
        <span className="media-time">{formatTime(media.position)}</span>
        <div className="media-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <span className="media-time">{formatTime(media.duration)}</span>
      </div>
    </div>
  );
}
