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
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      onResult(finalTranscript + interimTranscript);
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

