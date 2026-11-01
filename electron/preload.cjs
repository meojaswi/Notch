const { contextBridge, ipcRenderer } = require("electron");

function subscribe(channel) {
  return (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  };
}

contextBridge.exposeInMainWorld("notchAPI", {
  setInteractive: (interactive) =>
    ipcRenderer.send("notch:set-interactive", Boolean(interactive)),
  moveWindow: (delta) => ipcRenderer.send("notch:move-window", delta),
  setWindowSize: (size) => ipcRenderer.send("notch:set-window-size", size),
  searchWeb: (query) => ipcRenderer.send("notch:search-web", query),
  mediaControl: (action) => ipcRenderer.send("notch:media-control", action),
  showContextMenu: () => ipcRenderer.send("notch:show-context-menu"),
  openExternal: (url) => ipcRenderer.send("notch:open-external", url),
  reportError: (error) => ipcRenderer.send("notch:renderer-error", error),
  sendVoiceAudio: (audioData, mimeType) =>
    ipcRenderer.invoke("notch:voice-command", { audioData, mimeType }),
  getApiKeyStatus: () => ipcRenderer.invoke("notch:get-api-key-status"),
  saveApiKey: (key) => ipcRenderer.invoke("notch:save-api-key", key),
  clearApiKey: () => ipcRenderer.invoke("notch:clear-api-key"),
  onClipboardCopy: subscribe("notch:clipboard-copy"),
  onAiResult: subscribe("notch:ai-result"),
  onMediaUpdate: subscribe("notch:media-update"),
  onDockDirection: subscribe("notch:dock-direction"),
  onOpenSettings: subscribe("notch:open-settings"),
});
