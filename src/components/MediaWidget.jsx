import React from 'react';
import { SkipBack, Play, Pause, SkipForward } from 'lucide-react';
import './MediaWidget.css';

function formatSeconds(s) {
  if (s == null || Number.isNaN(s)) return '--:--';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${sec}`;
}

export default function MediaWidget({ media, onPrev, onPlayPause, onNext }) {
  if (!media) {
    return (
      <div className="media-widget media-widget--empty">
        <span>Nothing playing</span>
      </div>
    );
  }

  const { title, artist, artworkUrl, isPlaying, positionSeconds, durationSeconds } = media;
  const progress = durationSeconds ? Math.min(1, positionSeconds / durationSeconds) : 0;

  return (
    <div className="media-widget">
      <div className="media-widget-top">
        <div className="media-widget-art" style={artworkUrl ? { backgroundImage: `url(${artworkUrl})` } : undefined} />

        <div className="media-widget-info">
          <span className="media-widget-title">{title}</span>
          <span className="media-widget-artist">{artist}</span>
        </div>

        <div className="media-widget-controls">
          <button className="media-widget-btn" onClick={onPrev} aria-label="Previous track">
            <SkipBack size={14} />
          </button>
          <button className="media-widget-btn" onClick={onPlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button className="media-widget-btn" onClick={onNext} aria-label="Next track">
            <SkipForward size={14} />
          </button>
        </div>
      </div>

      <div className="media-widget-progress-track">
        <div className="media-widget-progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="media-widget-times">
        <span>{formatSeconds(positionSeconds)}</span>
        <span>{formatSeconds(durationSeconds)}</span>
      </div>
    </div>
  );
}
