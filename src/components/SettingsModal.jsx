import { useEffect, useRef, useState } from "react";
import "./SettingsModal.css";

const API_KEY_URL = "https://aistudio.google.com/app/apikey";
const EMPTY_STATUS = { configured: false, masked: "", source: null };

export default function SettingsModal({
  onClose,
  onPointerEnter,
  onPointerLeave,
}) {
  const [apiKey, setApiKeyInput] = useState("");
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const savedTimerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    window.notchAPI
      ?.getApiKeyStatus?.()
      .then((res) => res && setStatus(res))
      .catch(() => setError("Couldn't load the current key status"));
    return () => clearTimeout(savedTimerRef.current);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const applyResult = (res) => {
    if (!res?.ok) {
      setError(res?.error || "Something went wrong");
      return false;
    }
    setError("");
    setStatus(res.status ?? EMPTY_STATUS);
    return true;
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!apiKey.trim() || loading) return;

    setLoading(true);
    setError("");
    try {
      const res = await window.notchAPI?.saveApiKey?.(apiKey.trim());
      if (applyResult(res)) {
        setApiKeyInput("");
        setSaved(true);
        clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Couldn't save the key");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      applyResult(await window.notchAPI?.clearApiKey?.());
    } catch {
      setError("Couldn't remove the key");
    }
  };

  return (
    <div
      className="settings-card"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className="settings-header">
        <div className="settings-title-row">
          <svg
            className="settings-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z" />
          </svg>
          <span className="settings-title">Notch AI Settings</span>
        </div>
        <button
          type="button"
          className="settings-close-btn"
          aria-label="Close"
          onClick={onClose}
        >
          &times;
        </button>
      </div>

      <div className="settings-body">
        <p className="settings-desc">
          Enter your free Google Gemini API Key to enable voice commands,
          clipboard analysis, and image detection. It is encrypted and stored
          only on this computer.
        </p>

        <form className="settings-input-group" onSubmit={handleSave}>
          <input
            ref={inputRef}
            type="password"
            className="settings-input"
            aria-label="Gemini API key"
            autoComplete="off"
            spellCheck={false}
            placeholder={
              status.configured
                ? `Active key: ${status.masked}`
                : "Paste Gemini API Key (e.g. AIzaSy...)"
            }
            value={apiKey}
            onChange={(e) => {
              setApiKeyInput(e.target.value);
              setError("");
            }}
          />
          <button
            type="submit"
            className="settings-save-btn"
            disabled={loading || !apiKey.trim()}
          >
            {saved ? "Saved ✓" : loading ? "Checking..." : "Save Key"}
          </button>
        </form>

        {error ? (
          <p className="settings-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="settings-footer">
        <button
          type="button"
          className="settings-link"
          onClick={() => window.notchAPI?.openExternal?.(API_KEY_URL)}
        >
          Get a free Gemini API key from Google AI Studio &rarr;
        </button>

        <div className="settings-status">
          {status.source === "settings" ? (
            <button
              type="button"
              className="settings-link settings-remove"
              onClick={handleRemove}
            >
              Remove
            </button>
          ) : null}
          <span
            className={`settings-status-badge ${
              status.configured ? "active" : "empty"
            }`}
            title={
              status.source === "environment"
                ? "Using GEMINI_API_KEY from the environment"
                : undefined
            }
          >
            {status.configured ? "Key Configured" : "No Key Set"}
          </span>
        </div>
      </div>
    </div>
  );
}
