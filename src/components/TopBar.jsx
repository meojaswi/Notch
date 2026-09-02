import React from 'react';
import { Sparkles, BarChart2, Bell, Settings } from 'lucide-react';
import './TopBar.css';

export default function TopBar({ view, onViewChange, hasNotifications, onOpenStats, onOpenSettings }) {
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button
          className={`pill-button ${view === 'today' ? 'pill-button--active' : ''}`}
          onClick={() => onViewChange?.('today')}
        >
          Today
        </button>
        <button className="icon-button" aria-label="Quick actions">
          <Sparkles size={16} />
        </button>
      </div>

      <div className="top-bar-right">
        <button className="pill-button" onClick={onOpenStats}>
          Stats
        </button>
        <button className="icon-button" aria-label="Notifications" onClick={() => onViewChange?.('notifications')}>
          <Bell size={16} />
          {hasNotifications && <span className="icon-button-badge" />}
        </button>
        <button className="icon-button" aria-label="Settings" onClick={onOpenSettings}>
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
