import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Converts a Blob to a base64 string without data-url prefix.
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result || "").split(",")[1];
      resolve(base64 || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * useVoiceCommand hook using MediaRecorder and Google Gemini for recognition.
 */
export default function useVoiceCommand({ onCommandRecognized } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [command, setCommand] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const autoStopTimerRef = useRef(null);
  const onCommandCallbackRef = useRef(onCommandRecognized);

  useEffect(() => {
    onCommandCallbackRef.current = onCommandRecognized;
  }, [onCommandRecognized]);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    clearTimeout(autoStopTimerRef.current);
  }, []);

  const stopListening = useCallback(() => {
    clearTimeout(autoStopTimerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  }, []);

  const processAudioBlob = useCallback(async (blob, mimeType) => {
    setIsListening(false);
    setIsAnalyzing(true);
    setError(null);

    try {
      const base64 = await blobToBase64(blob);
      if (!base64) {
        throw new Error("Recorded audio was empty");
      }

      const response = await window.notchAPI?.sendVoiceAudio(
        base64,
        mimeType || "audio/webm",
      );

      if (response?.error) {
        throw new Error(response.error);
      }

      const spoken = response?.transcript || "";
      const action = response?.action || "unknown";
      const query = response?.query || "";

      setTranscript(spoken);

      const parsedCmd = action !== "unknown" ? { action, query } : null;
      setCommand(parsedCmd);

      if (parsedCmd) {
        onCommandCallbackRef.current?.(parsedCmd);
      }
    } catch (err) {
      console.error("Voice recognition failed:", err);
      setError(err.message || "Failed to recognize speech");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");
    setCommand(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      let mimeType = "audio/webm";
      if (
        typeof MediaRecorder.isTypeSupported === "function" &&
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ) {
        mimeType = "audio/webm;codecs=opus";
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });
        cleanupStream();
        processAudioBlob(audioBlob, mimeType);
      };

      mediaRecorder.start(250);
      setIsListening(true);

      // Automatically stop listening after 3.5 seconds
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = setTimeout(() => {
        stopListening();
      }, 3500);
    } catch (err) {
      console.error("Microphone access error:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Microphone access was denied"
          : "Microphone unavailable",
      );
      setIsListening(false);
      cleanupStream();
    }
  }, [cleanupStream, processAudioBlob, stopListening]);

  const resetVoiceState = useCallback(() => {
    stopListening();
    cleanupStream();
    setIsListening(false);
    setIsAnalyzing(false);
    setTranscript("");
    setCommand(null);
    setError(null);
  }, [cleanupStream, stopListening]);

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  return {
    isListening,
    isAnalyzing,
    transcript,
    command,
    error,
    startListening,
    stopListening,
    resetVoiceState,
  };
}
