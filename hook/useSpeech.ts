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
      // Collect all transcripts
      const transcripts: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        transcripts.push(event.results[i][0].transcript);
      }

      // Deduplicate: If transcript[i] is a prefix of transcript[i+1], ignore transcript[i]
      // This fixes the Android Chrome bug where it sends cumulative segments as separate results
      // e.g. ["my", "my name", "my name is"] -> "my name is"
      let combined = "";
      for (let i = 0; i < transcripts.length; i++) {
        const current = transcripts[i].trim();
        const next = transcripts[i + 1]?.trim();

        if (next && next.toLowerCase().startsWith(current.toLowerCase())) {
          continue; // Skip this segment as it's included in the next one
        }

        combined += (combined ? " " : "") + current;
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

