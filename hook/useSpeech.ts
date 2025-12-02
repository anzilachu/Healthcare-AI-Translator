import { useState, useEffect, useRef } from "react";

export function useSpeechRecognition(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Keep a stable, growing final transcript and a lighter-weight interim layer
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = true;
    recog.continuous = true;
    // Prefer a single best guess to reduce noisy alternates
    (recog as any).maxAlternatives = 1;

    recog.onresult = (event: any) => {
      let stable = finalTranscriptRef.current;
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = String(res[0]?.transcript ?? "");
        if (res.isFinal) {
          // Commit final segment once, to stabilize mid‑sentence behavior
          stable += (stable ? " " : "") + text.trim();
        } else {
          interim += " " + text.trim();
        }
      }

      finalTranscriptRef.current = stable.trim();
      const combined = (stable + interim).trim();

      // Lightweight guard: only push meaningful updates to avoid jitter
      if (combined && combined !== stable) {
        onResult(combined);
      } else if (stable && !combined) {
        onResult(stable);
      }
    };

    recog.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };

    setRecognition(recog);

    return () => {
      recog.onresult = null;
      recog.onerror = null;
      recog.abort?.();
    };
  }, [onResult]);

  const start = () => {
    if (!recognition) return;
    finalTranscriptRef.current = "";
    setIsListening(true);
    recognition.start();
  };

  const stop = () => {
    if (!recognition) return;
    setIsListening(false);
    recognition.stop();
  };

  return { isListening, start, stop };
}

