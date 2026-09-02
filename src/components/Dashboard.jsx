import React from 'react';
import ClockPanel from './ClockPanel';
import CalendarWidget from './CalendarWidget';
import MediaWidget from './MediaWidget';
import StatCard from './StatCard';
import './Dashboard.css';

export default function Dashboard({ systemStats, mediaInfo, scheduled, onMediaPrev, onMediaPlayPause, onMediaNext }) {
  const ramFraction = systemStats?.ram?.usedFraction ?? 0;
  const netUp = systemStats?.net?.up ?? '--';
  const netDown = systemStats?.net?.down ?? '--';

  return (
    <div className="dashboard">
      <ClockPanel />

      <div className="dashboard-row dashboard-row--two">
        <CalendarWidget />
        <MediaWidget media={mediaInfo} onPrev={onMediaPrev} onPlayPause={onMediaPlayPause} onNext={onMediaNext} />
      </div>

      <div className="dashboard-row dashboard-row--three">
        <StatCard variant="ram" label="RAM" value={ramFraction} />
        <StatCard variant="net" label="NET" value={{ up: netUp, down: netDown }} />
        <StatCard
          variant="scheduled"
          label="SCHEDULED"
          value={{ count: scheduled?.length ?? 0, next: scheduled?.[0]?.time }}
        />
      </div>
    </div>
  );
}
