# Notch

A floating AI orb for Windows, built with Electron, React and Vite. It sits on
top of your desktop and:

- **Explains what you copy.** Copy text or an image and the orb pulses; hover it
  for a Gemini summary and a one-click web search.
- **Takes voice commands.** Click the orb and say "next track", "pause" or
  "search for …".
- **Controls media.** Hover while something is playing (Spotify, a browser,
  etc.) for track info and playback controls.

Right-click the orb, or click the tray icon, for Settings, the clipboard toggle,
Start with Windows, and Quit.

## Getting started

Requires Windows 10/11 and Node.js 22.12+.

```bash
npm install
npm run dev        # Vite dev server + Electron with hot reload
```

Add a Gemini API key (free from
[Google AI Studio](https://aistudio.google.com/app/apikey)) via **Settings** in
the orb's right-click menu. For development you can instead copy `.env.example`
to `.env` and set `GEMINI_API_KEY`; `GEMINI_MODEL` overrides the default model
(`gemini-2.5-flash`).

## Scripts

| Command                | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Run with hot reload                              |
| `npm start`            | Build and run the production renderer locally    |
| `npm run check`        | Lint, format check, tests and build (same as CI) |
| `npm test`             | Unit tests (Vitest)                              |
| `npm run pack`         | Unpacked build in `release/win-unpacked/`        |
| `npm run dist`         | NSIS installer in `release/`                     |
| `npm run lint`/`format` | ESLint / Prettier                               |

## Releasing

Bump `version` in `package.json`, commit, then push a matching tag
(`git tag v0.2.0 && git push --tags`). The release workflow builds the
installer and attaches it to a draft GitHub release. To sign it, add
`WINDOWS_CERT_BASE64` (a base64 `.pfx`) and `WINDOWS_CERT_PASSWORD` repository
secrets; unsigned builds trigger a SmartScreen warning.

## Privacy

- Copied text and images are sent to Gemini only while **Analyze clipboard with
  AI** is on (tray menu), and only with your API key.
- Content that password managers mark as private, and text that looks like a
  secret (API keys, tokens, private keys, card numbers, generated passwords), is
  never sent.
- The API key is encrypted with Windows DPAPI (`safeStorage`) and stored in
  `%APPDATA%\Notch\settings.json`. Logs live in `%APPDATA%\Notch\logs`.

## Architecture

```
electron/
  main.js              App lifecycle and wiring
  window.js            Orb window, sandboxing, navigation lock, crash reload
  placement.js         Position: drag, expand/collapse, multi-monitor, persistence
  ipc.js               IPC handlers; checks every sender and payload
  preload.cjs          The window.notchAPI bridge exposed to the renderer
  aiProvider.js        Gemini calls (structured output, timeouts, error mapping)
  clipboardWatcher.js  Clipboard polling with privacy filtering
  mediaWatcher.js/.ps1 Media session (GSMTC) bridge via a supervised PowerShell
  settings.js          settings.json store + encrypted API key
  tray.js              Tray icon and the shared app menu
  logger.js            electron-log file logging
  lib/                 Pure, unit-tested helpers (geometry, validation, secrets)
src/                   React renderer (orb, panels, voice hook)
```

Security: `contextIsolation`, `sandbox`, no `nodeIntegration`, a strict CSP,
navigation and window-open blocked, microphone-only permissions, IPC accepted
only from the app's own page, and DevTools disabled in packaged builds.
