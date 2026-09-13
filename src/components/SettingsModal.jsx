import { useEffect, useState } from "react";
import "./SettingsModal.css";

export default function SettingsModal({
  onClose,
  onPointerEnter,
  onPointerLeave,
}) {
  const [apiKey, setApiKeyInput] = useState("");
  const [status, setStatus] = useState({ configured: false, masked: "" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.notchAPI?.getApiKeyStatus?.().then((res) => {
      if (res) setStatus(res);
    });
  }, []);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    const success = await window.notchAPI?.saveApiKey?.(apiKey.trim());
    setLoading(false);

    if (success) {
      setSaved(true);
      setStatus({
        configured: true,
        masked: `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`,
      });
      setApiKeyInput("");
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const openAiStudio = () => {
    window.notchAPI?.openExternal?.("https://aistudio.google.com/app/apikey");
  };

  return (
    <div
      className="settings-card"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className="settings-header">
        <div className="settings-title-row">
          <svg className="settings-icon" viewBox="0 0 24 24" fill="currentColor">
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
          clipboard analysis, and image detection.
        </p>

        <form className="settings-input-group" onSubmit={handleSave}>
          <input
            type="password"
            className="settings-input"
            placeholder={
              status.configured
                ? `Active key: ${status.masked}`
                : "Paste Gemini API Key (e.g. AIzaSy...)"
            }
            value={apiKey}
            onChange={(e) => setApiKeyInput(e.target.value)}
          />
          <button
            type="submit"
            className="settings-save-btn"
            disabled={loading || !apiKey.trim()}
          >
            {saved ? "Saved ✓" : loading ? "Saving..." : "Save Key"}
          </button>
        </form>
      </div>

      <div className="settings-footer">
        <button
          type="button"
          className="settings-link"
          onClick={openAiStudio}
        >
          Get a free Gemini API key from Google AI Studio &rarr;
        </button>

        <span
          className={`settings-status-badge ${
            status.configured ? "active" : "empty"
          }`}
        >
          {status.configured ? "Key Configured" : "No Key Set"}
        </span>
      </div>
    </div>
  );
}
