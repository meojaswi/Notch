# Notch

Notch is a Windows desktop utility built with Electron, React, JavaScript, and Vite. It is structured as a modular foundation for a floating Dynamic Island-like notch and companion desktop buddy.

## Getting started

```bash
npm install
npm run dev
npm run build
npm run dist
```

## Gemini setup

Notch uses the official `@google/genai` SDK from the Electron main process. Set
the API key before starting the app:

```powershell
$env:GEMINI_API_KEY="your-api-key"
npm run start
```

`GEMINI_MODEL` optionally selects the Gemini model and defaults to
`gemini-2.5-flash`. Copied text is converted into a search query, while copied
images are described and can produce a search query. Clipboard content is sent
to Gemini only when `GEMINI_API_KEY` is configured.

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
