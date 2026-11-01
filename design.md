# Notch - AI-Powered Desktop Assistant

## Project Vision
Notch is an AI-ready Dynamic Island style utility for Windows that provides contextual assistance through a non-intrusive orb interface. It leverages system-level monitoring (clipboard, media, active applications) combined with AI capabilities to offer proactive, context-aware help without interrupting workflow.

## Core Principles
1. **Non-intrusive Presence** - The orb sits discreetly on screen, accessible via hover or hotkey
2. **Context Awareness** - Understands what you're working on to provide relevant assistance
3. **Privacy First** - All processing happens locally; only AI calls go externally (with user-configured API keys)
4. **Windows Native Integration** - Leverages Windows APIs for deep system integration
5. **Modular & Extensible** - Easy to add new features and capabilities
6. **Performance Conscious** - Optimized for minimal resource usage

## System Architecture

### Main Components
1. **Orb Interface (`src/components/AIOrb.jsx`)** - WebGL-based visual indicator showing state
2. **Renderer Process** - React/Vite UI that displays information and handles user interaction
3. **Main Process (`electron/main.js`)** - System-level monitoring, IPC handling, window management
4. **Preload Script (`electron/preload.js`)** - Secure bridge between renderer and main processes
5. **AI Provider (`electron/aiProvider.js`)** - Handles communication with Google GenAI API
6. **Config Store (`electron/configStore.js`)** - Persistent settings storage
7. **Media Watcher (`electron/mediaWatcher.ps1`)** - PowerShell script for media metadata detection
8. **Settings Modal (`src/components/SettingsModal.jsx`)** - User configuration interface

### Communication Flow
```
Renderer Process ← IPC → Main Process
       ↑                   ↑
       ↓                   ↓
UI Components   ←→   System Watchers & API Clients
                    (Clipboard, Media, Active Window, etc.)
                    ↓
                AI Provider (External API)
```

### Key Technologies
- **Electron v31+** - Desktop application framework
- **React 18 + Vite** - Modern UI framework with fast HMR
- **OGL** - WebGL library for the orb visualization
- **SystemInformation** - Cross-platform system metrics
- **Google GenAI API** - AI capabilities (text/image/audio analysis)
- **RobotJS** - Global keyboard/mouse control (for aliases)
- **PowerShell** - Windows-specific system integration

## Current Features

### 1. Orb Interface States
- **Idle** - Default state, subtle pulsing
- **Listening** - Active voice input (blue/purple hues)
- **Thinking** - Processing AI requests (morphing blob)
- **Speaking** - Responding to user (expanding/contracting)
- **Error** - API or processing failure (red hues)
- **Copied** - Recent clipboard activity (green hues)

### 2. Monitoring Capabilities
- **Clipboard Watcher** - Detects text/image copies, triggers AI analysis
- **Media Watcher** - Uses Windows Media Control API to detect:
  * Currently playing song/video
  * Artist, album, title
  * Playback state (playing/paused)
  * Position/duration
  * Thumbnail extraction
- **Active Window Tracking** - (Planned) Detects foreground application
- **Global Hotkey** - Alt+Shift+Space for instant voice activation

### 3. AI Capabilities
- **Text Analysis** - Summarization, explanation, sentiment
- **Image Analysis** - Object detection, scene description, OCR
- **Audio Analysis** - Speech-to-text, audio content understanding
- **Web Search** - Initiates searches based on context/query
- **Voice Commands** - Hands-free activation and control

### 4. User Interactions
- **Hover over Orb** - Shows details of last copied item
- **Click/Drag Orb** - Move orb to preferred screen location
- **Right-click Orb** - Access context menu (settings, etc.)
- **Global Hotkey** - Alt+Shift+Space: Activate voice listening from anywhere
- **Keyboard Typing** - (Planned) Alias expansion with backtick trigger

## Data Flow Examples

### Clipboard → AI Analysis → Display
1. User copies text/image
2. Clipboard watcher detects change
3. Main process sends `notch:clipboard-copy` event to renderer
4. Renderer shows preview in orb UI
5. Main process sends content to AI provider
6. AI provider returns analysis
7. Main process sends `notch:ai-result` to renderer
8. Renderer displays result in tooltip/panel near orb

### Media Detection → Contextual Assistance
1. Media watcher detects song/video change
2. Main process sends `notch:media-update` with metadata
3. Renderer updates orb/tooltip with now-playing info
4. When user copies related text, AI analysis includes media context
5. Example: Copying text while listening to a podcast → AI can relate content to podcast topic

### Voice Command Flow
1. User presses Alt+Shift+Space
2. Main process activates listening state in orb
3. System audio captured and sent to AI provider
4. AI provider returns transcribed command
5. Main process executes command (app control, web search, etc.)
6. Result sent back to user via orb/UI

## Design Guidelines

### UI/UX Principles
1. **Progressive Disclosure** - Show simple state by default, reveal details on interaction
2. **Consistent Feedback** - All actions provide clear visual/auditory feedback
3. **Accessibility First** - Respect system settings (contrast, motion reduction, etc.)
4. **Visual Hierarchy** - Orb is noticeable but not distracting
5. **Windows Native Feel** - Follows Windows design patterns where appropriate

### Performance Guidelines
1. **GPU Acceleration** - Offload visual effects to GPU (WebGL/shaders)
2. **Efficient Polling** - Use event-based systems where possible (media watcher)
3. **Throttling & Debouncing** - Limit frequency of expensive operations
4. **Memory Management** - Prevent leaks in long-running processes
5. **Startup Optimization** - Lazy load heavy modules

### Privacy & Security
1. **Local-First** - Minimize external data transmission
2. **User Consent** - Explicit opt-in for AI features requiring API keys
3. **Secure Storage** - Encrypt sensitive data (API keys) if stored
4. **Context Isolation** - Don't share monitoring data with AI unless explicitly triggered
5. **Audit Transparency** - Clear indicators when monitoring/processing is active

### Extensibility Patterns
1. **Plugin Architecture** - Features should be addable/removable without core changes
2. **Event-Driven** - Communicate via well-defined IPC events
3. **Configuration Driven** - Features togglable via settings
4. **Fallback Gracefully** - Degrade nicely when APIs/features unavailable
5. **Clear Extension Points** - Well-documented hooks for new capabilities

## Planned Features & Roadmap

### Near Term (0.2.x)
- [ ] **Email Alias System** - Backtick-triggered text expansion
- [ ] **Orb Customization Settings** - Adjust colors, size, effects via SettingsModal
- [ ] **Enhanced Media Integration** - Display now-playing in orb UI, media controls
- [ ] **Improved AI Context** - Pass media/app state to AI for better analysis
- [ ] **Notification Center** - History of AI results, media changes, alerts

### Mid Term (0.3.x)
- [ ] **Active Window Tracking** - Detect foreground application for context
- [ ] **Application-Specific Assistants** - Tailored help for IDE, browser, office apps
- [ ] **Workflow Automation** - Simple "if this, then that" style automations
- [ ] **Enhanced Voice Commands** - Natural language control of system/apps
- [ ] **Clipboard History** - Searchable clipboard with AI summarization

### Long Term (0.4.x+)
- [ ] **Proactive Assistance** - Anticipate needs based on patterns/time/location
- [ ] **Cross-Device Sync** - Securely sync preferences/settings across devices
- [ ] **Marketplace/Extensions** - Community-created features and themes
- [ ] **Advanced AI Features** - Custom model fine-tuning, local processing options
- [ ] **Enterprise Features** - Deployment management, policy controls

## Technical Decisions & Rationale

### Why Electron?
- **Pros**: Mature ecosystem, easy web tech transition, good Windows integration
- **Cons**: Higher memory usage than native
- **Verdict**: Best balance of development speed and feature completeness for MVP

### Why React/Vite over Alternatives?
- **React**: Mature, great ecosystem, familiar to developers
- **Vite**: Extremely fast HMR, excellent build performance
- **Alternatives Considered**: Svelte (smaller bundle but less ecosystem), SolidJS (performance but newer)

### Why OGL for the Orb?
- **Pros**: GPU-accelerated, smooth animations, unique visual identity
- **Cons**: More complex than CSS/SVG alternatives
- **Verdict**: The orb is a signature feature worth the complexity for its visual appeal

### Why SystemInformation over Native Modules?
- **Pros**: Cross-platform, well-maintained, good coverage
- **Cons**: Slightly less detailed than native WMI calls
- **Verdict**: Good enough for current needs; can add native modules later if needed

### Why Google GenAI API?
- **Pros**: Strong multimodal capabilities, good documentation, generous free tier
- **Cons**: Requires API key, external dependency
- **Verdict**: Best available option for text/image/audio analysis in one API

## Security Considerations

### API Key Management
- Keys stored encrypted in user's local storage (when implemented)
- Never transmitted except to Google GenAI endpoint
- Option to clear keys from settings
- Clear indication when AI features are active/inactive

### System Monitoring Permissions
- Transparent about what is being monitored
- Easy disable/enable toggles for each monitoring type
- Visual indicators when monitoring is active (orb state changes)
- Respects application-specific exclusions (password managers, etc.)

### Update Security
- Code-signed releases for Windows SmartScreen compliance
- SHA-256 verification of downloads
- Optional automatic updates with user consent
- Clear changelog for each release

## Contributing Guidelines

### Code Style
- **JavaScript/JSX**: StandardJS with Prettier
- **CSS**: BEM-like naming, modular components
- **Commits**: Conventional commits (feat:, fix:, docs:, etc.)
- **Files**: PascalCase for components, camelCase for utilities

### Pull Request Process
1. Fork repository
2. Create feature branch (`feature/amazing-feature`)
3. Make changes with corresponding tests
4. Ensure linting passes
5. Submit PR with clear description
6. Address review feedback
7. Squash and merge upon approval

### Issue Reporting
- Use GitHub Issues template
- Include: Version, OS, reproduction steps, expected vs actual behavior
- Label appropriately (bug, enhancement, question, etc.)

## Build & Deployment

### Development
```bash
# Install dependencies
npm install

# Start dev mode (hot reload)
npm run dev
```

### Production Build
```bash
# Create production build
npm run build

# Create distributable installer
npm run dist
```

### Release Process
1. Update version in package.json
2. Create GitHub release with tag
3. Upload generated installer from `dist/` folder
4. Announce to users via in-app notification/email

## Appendix

### Glossary
- **Notch**: The orb UI component (inspired by Apple's Dynamic Island but for Windows)
- **IPC**: Inter-Process Communication (between Electron main and renderer processes)
- **AI Provider**: Module handling communication with GenAI API
- **State**: Visual/current mode of the orb (idle, listening, thinking, etc.)

### Environment Variables
- `GOOGLE_AI_API_KEY` - Optional: Set globally instead of storing in app
- `NOTCH_DEV_MODE` - Enable additional logging/debug features
- `NOTCH_DISABLE_UPDATES` - Turn off automatic update checking

### Troubleshooting
- **Orb not responding**: Check if another app is capturing global hotkeys
- **AI not working**: Verify API key is set in Settings → AI Configuration
- **Media detection not working**: Ensure Windows Media Control API is accessible
- **High CPU usage**: Try reducing orb quality in Settings → Appearance → Performance

---

*This design document evolves with the project. Last updated: 2026-09-20*