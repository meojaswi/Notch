import { spawn } from "node:child_process";
import log from "./logger.js";

const INITIAL_RESTART_DELAY_MS = 1000;
const MAX_RESTART_DELAY_MS = 60_000;
// A watcher that ran this long was healthy, so its restart backoff resets.
const HEALTHY_RUN_MS = 30_000;

/**
 * Runs mediaWatcher.ps1 as a long-lived child process, parses its JSON lines,
 * forwards playback commands to it, and restarts it with backoff if it dies.
 */
export function createMediaWatcher({ scriptPath, onUpdate }) {
  let child = null;
  let stopped = true;
  let restartTimer = null;
  let restartDelay = INITIAL_RESTART_DELAY_MS;

  function handleOutput(stream) {
    let buffer = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("{")) continue;
        try {
          onUpdate(JSON.parse(trimmed));
        } catch (err) {
          log.warn("Media watcher sent malformed JSON:", err.message);
        }
      }
    });
  }

  function launch() {
    const startedAt = Date.now();
    const proc = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
      ],
      { windowsHide: true },
    );
    child = proc;

    handleOutput(proc.stdout);
    proc.stderr.setEncoding("utf8");
    proc.stderr.on("data", (data) => log.warn(`Media watcher: ${data.trim()}`));
    proc.stdin.on("error", () => {}); // EPIPE if it dies mid-write
    proc.on("error", (err) => log.error("Media watcher failed to start:", err));

    proc.on("exit", (code, signal) => {
      if (child === proc) child = null;
      if (stopped) return;

      if (Date.now() - startedAt > HEALTHY_RUN_MS) {
        restartDelay = INITIAL_RESTART_DELAY_MS;
      }
      log.warn(
        `Media watcher exited (code ${code}, signal ${signal}); restarting in ${restartDelay}ms`,
      );
      onUpdate({ active: false });
      restartTimer = setTimeout(launch, restartDelay);
      restartDelay = Math.min(restartDelay * 2, MAX_RESTART_DELAY_MS);
    });
  }

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      launch();
    },
    stop() {
      stopped = true;
      clearTimeout(restartTimer);
      if (child) {
        child.stdin.end();
        child.kill();
        child = null;
      }
    },
    sendCommand(action) {
      if (child?.stdin.writable) child.stdin.write(`${action}\n`);
    },
  };
}
