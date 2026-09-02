# Notch

Notch is a Windows desktop utility built with Electron, React, JavaScript, and Vite. It is structured as a modular foundation for a floating Dynamic Island-like notch and companion desktop buddy.

## Getting started

```bash
npm install
npm run dev
npm run build
npm run dist
```

## Architecture

- Electron main process creates and manages windows.
- Preload scripts expose a minimal bridge for each renderer.
- React renderers are isolated into notch and buddy views.
- TriggerBus centralizes hotkey and clipboard-like event signals.
- Plugin and AI layers are isolated behind interfaces for future expansion.

## Security

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true` where supported

## Notes

This is the initial scaffold and does not implement real Windows native integrations yet.
