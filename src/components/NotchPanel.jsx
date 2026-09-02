import React, { useState } from 'react';
import TopBar from './TopBar';
import Dashboard from './Dashboard';
import './NotchPanel.css';

export default function NotchPanel({ systemStats, mediaInfo, scheduled, notifications = [], onMediaControl }) {
  const [view, setView] = useState('today');

  return (
    <div className="notch-panel">
      <TopBar
        view={view}
        onViewChange={setView}
        hasNotifications={notifications.length > 0}
        onOpenStats={() => setView('stats')}
        onOpenSettings={() => setView('settings')}
      />

      {view === 'today' && (
        <Dashboard
          systemStats={systemStats}
          mediaInfo={mediaInfo}
          scheduled={scheduled}
          onMediaPrev={() => onMediaControl?.('prev')}
          onMediaPlayPause={() => onMediaControl?.('play-pause')}
          onMediaNext={() => onMediaControl?.('next')}
        />
      )}

      {/* 'stats', 'notifications', 'settings' views can slot in here later
          without touching TopBar or Dashboard */}
    </div>
  );
}
