import React, { useEffect, useState } from 'react';
import './ClockPanel.css';

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatMeridiem(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[1];
}

function formatDate(date) {
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function ClockPanel({ onEdit }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 10);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="clock-panel">
      <div className="clock-panel-time">
        <span className="clock-panel-time-value">{formatTime(now).replace(/\s?[AP]M$/, '')}</span>
        <span className="clock-panel-time-meridiem">{formatMeridiem(now)}</span>
      </div>

      <div className="clock-panel-footer">
        <span className="clock-panel-date">{formatDate(now)}</span>
        <button className="ghost-button" onClick={onEdit}>
          Edit
        </button>
      </div>
    </div>
  );
}
