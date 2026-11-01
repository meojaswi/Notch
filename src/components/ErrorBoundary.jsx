import { Component } from "react";

export function reportError(error, source) {
  window.notchAPI?.reportError({
    message: String(error?.message ?? error ?? "Unknown error"),
    stack: String(error?.stack ?? ""),
    source,
  });
}

// The window is transparent, so an unhandled render error would make the orb
// silently vanish. Show a small reload button instead.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    reportError(
      {
        message: error?.message,
        stack: `${error?.stack}\n${info?.componentStack}`,
      },
      "react",
    );
    window.notchAPI?.setWindowSize({ width: 100, height: 100 });
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="compact">
        <div className="orb-slot">
          <button
            type="button"
            className="crash-orb"
            title="Notch hit a problem. Click to reload."
            aria-label="Reload Notch"
            onPointerEnter={() => window.notchAPI?.setInteractive(true)}
            onPointerLeave={() => window.notchAPI?.setInteractive(false)}
            onClick={() => window.location.reload()}
          >
            ↻
          </button>
        </div>
      </main>
    );
  }
}
