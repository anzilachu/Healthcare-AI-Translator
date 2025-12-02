import { useState, useEffect } from "react";

export function useSpeechRecognition(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Keep a stable, growing final transcript and a lighter-weight interim layer

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
      let final = "";
      let interim = "";

      // Rebuild the transcript from scratch based on the current event's result list
      // This avoids duplication issues if the browser resends previous segments
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const text = String(res[0]?.transcript ?? "");
        if (res.isFinal) {
          final += (final ? " " : "") + text.trim();
        } else {
          interim += " " + text.trim();
        }
      }

      // Android Chrome fix: Check if interim text includes the final text
      // Often on mobile, the interim result contains the entire phrase including what was just finalized
      let combined = final;
      const cleanFinal = final.trim().toLowerCase();
      const cleanInterim = interim.trim().toLowerCase();

      if (cleanInterim && cleanFinal && cleanInterim.startsWith(cleanFinal)) {
        // If interim starts with final, it's likely a full transcript, so use interim only (but keep original case from interim)
        // We use the length of the final string to find where the "new" part starts in the original interim string, 
        // but simpler is to just use the interim string if it looks like a superset.
        // However, we must be careful about case. Let's trust the interim's content.
        combined = interim.trim();
      } else {
        combined = (final + " " + interim).trim();
      }

      onResult(combined);
    };

    recog.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recog.onend = () => {
      setIsListening(false);
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

