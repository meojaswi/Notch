const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("notchAPI", {
  setInteractive: (interactive) =>
    ipcRenderer.send("notch:set-interactive", Boolean(interactive)),
  moveWindow: (delta) => ipcRenderer.send("notch:move-window", delta),
  setWindowSize: (size) => ipcRenderer.send("notch:set-window-size", size),
  searchWeb: (query) => ipcRenderer.send("notch:search-web", query),
  onClipboardCopy: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("notch:clipboard-copy", handler);
    return () => ipcRenderer.removeListener("notch:clipboard-copy", handler);
  },
  onMediaUpdate: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("notch:media-update", handler);
    return () => ipcRenderer.removeListener("notch:media-update", handler);
  },
  onDockDirection: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("notch:dock-direction", handler);
    return () => ipcRenderer.removeListener("notch:dock-direction", handler);
  },
  mediaControl: (action) => ipcRenderer.send("notch:media-control", action),
  ping: () => ipcRenderer.invoke("notch:ping"),
});
