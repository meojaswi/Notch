import React, { useState, useEffect } from 'react';
import NotchPanel from './components/NotchPanel';

export default function App() {
  const [systemStats, setSystemStats] = useState({ ram: null, net: null });
  const [mediaInfo, setMediaInfo] = useState(null);
  const [scheduled, setScheduled] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // main process pushes data over IPC (contextBridge-exposed API, see preload.js)
    window.notchAPI?.onSystemStats(setSystemStats);
    window.notchAPI?.onMediaUpdate(setMediaInfo);
    window.notchAPI?.onScheduleUpdate(setScheduled);
    window.notchAPI?.onNotificationsUpdate(setNotifications);
  }, []);

  const handleMediaControl = (action) => {
    window.notchAPI?.sendMediaControl(action);
  };

  return (
    <NotchPanel
      systemStats={systemStats}
      mediaInfo={mediaInfo}
      scheduled={scheduled}
      notifications={notifications}
      onMediaControl={handleMediaControl}
    />
  );
}
