"use client";

import { useCallback, useEffect, useState } from "react";
import { useSpeechRecognition } from "../hook/useSpeech";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "zh", label: "Chinese" },
];

export function Translator() {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFreshTranslation, setHasFreshTranslation] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [canListen, setCanListen] = useState(false);

  const handleSpeechResult = useCallback((text: string) => {
    setInputText(text);
    // New dictated text means any existing translation is no longer fresh
    setHasFreshTranslation(false);
  }, []);

  const { isListening, start, stop } = useSpeechRecognition(handleSpeechResult);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("speechSynthesis" in window) {
        setCanSpeak(true);
      }
      // Check for speech recognition support
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setCanListen(true);
      }
    }

    // Clear all patient data on page unload for privacy
    const handleBeforeUnload = () => {
      setInputText("");
      setTranslatedText("");
      stop();
      window.speechSynthesis.cancel();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also clear on component unmount
      handleBeforeUnload();
    };
  }, [stop]);

  // Auto-translate debounce
  useEffect(() => {
    if (!inputText.trim()) return;

    // Don't auto-translate if we just got a fresh translation
    // Also don't auto-translate while listening - wait for user to stop
    if (hasFreshTranslation || isListening) return;

    const timer = setTimeout(() => {
      handleTranslate(false); // Don't auto-speak on typing, only on explicit stop or button
    }, 1000);

    return () => clearTimeout(timer);
  }, [inputText, hasFreshTranslation, isListening]);

  const handleTranslate = async (autoPlay = false) => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    setError(null);
    setHasFreshTranslation(false);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          source: sourceLang,
          target: targetLang,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to translate");
      }

      const data = await res.json();
      const translated = data.translated ?? "";
      setTranslatedText(translated);
      setHasFreshTranslation(true);

      if (autoPlay && translated) {
        // Small delay to ensure state is settled/user is ready
        setTimeout(() => {
          speakText(translated, targetLang);
        }, 100);
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText || inputText);
    setTranslatedText("");
    setHasFreshTranslation(false);
  };

  const handleStopListening = () => {
    stop();
    if (inputText.trim()) {
      handleTranslate(true); // Auto-speak when stopping dictation
    }
  };

  const getSpeechLang = (code: string) => {
    switch (code) {
      case "en":
        return "en-US";
      case "es":
        return "es-ES";
      case "fr":
        return "fr-FR";
      case "de":
        return "de-DE";
      case "ar":
        return "ar-SA";
      case "hi":
        return "hi-IN";
      case "zh":
        return "zh-CN";
      default:
        return "en-US";
    }
  };

  const speakText = (text: string, langCode: string) => {
    if (!text.trim() || !canSpeak) return;
    if (typeof window === "undefined") return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getSpeechLang(langCode);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.cancel();
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const handleSpeakTranslated = () => {
    speakText(translatedText, targetLang);
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Floating Speak Button - Globally accessible, especially for mobile */}
      <button
        type="button"
        onClick={isListening ? handleStopListening : start}
        disabled={!canListen}
        className={`fixed bottom-6 left-1/2 z-50 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full shadow-lg transition-all duration-200 ${isListening
          ? "bg-red-500 text-white hover:bg-red-600 active:scale-95"
          : "bg-green-500 text-white hover:bg-green-600 active:scale-95"
          } disabled:bg-zinc-400 disabled:cursor-not-allowed sm:h-14 sm:w-14`}
        aria-label={isListening ? "Stop speaking" : "Start speaking"}
      >
        {isListening ? (
          <svg
            className="h-6 w-6 sm:h-5 sm:w-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 9a1 1 0 10-2 0v2a1 1 0 102 0V9z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className="h-6 w-6 sm:h-5 sm:w-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {isListening && (
          <span className="absolute h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        )}
      </button>

      <div className="mt-[15px] w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 sm:mt-0 sm:p-6">
        {/* Medical Safety Notice */}
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-50/50 p-2.5 dark:border-amber-600/30 dark:bg-amber-950/20 sm:mb-6 sm:p-3">
          <svg className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs leading-snug text-amber-900 dark:text-amber-100">
            <strong>Medical Notice:</strong> AI translations may not be 100% accurate. For critical medical decisions, always use a professional medical interpreter. Medical abbreviations are automatically expanded for better accuracy.
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              Healthcare Translator
            </h1>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
              Speak or type medical information and get a clear, accurate translation.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              From
            </label>
            <select
              value={sourceLang}
              onChange={(e) => {
                setSourceLang(e.target.value);
                setHasFreshTranslation(false);
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>

            <div className="relative mt-1 flex-1">
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setHasFreshTranslation(false);
                }}
                placeholder="Describe symptoms, medications, or instructions to translate..."
                className="min-h-[140px] w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100 dark:focus:bg-zinc-900 dark:focus:ring-zinc-100"
              />

              {/* Mobile-friendly inline controls */}
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                  type="button"
                  onClick={start}
                  disabled={isListening || !canListen}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition enabled:hover:border-zinc-300 enabled:hover:bg-zinc-50 enabled:active:scale-95 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:enabled:hover:border-zinc-600 dark:enabled:hover:bg-zinc-800"
                >
                  <span className={`h-2 w-2 rounded-full ${isListening ? "bg-zinc-400" : "bg-green-500"}`} />
                  Speak
                </button>
                <button
                  type="button"
                  onClick={handleStopListening}
                  disabled={!isListening}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition enabled:hover:border-zinc-300 enabled:hover:bg-zinc-50 enabled:active:scale-95 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:enabled:hover:border-zinc-600 dark:enabled:hover:bg-zinc-800"
                >
                  <span className={`h-2 w-2 rounded-full ${isListening ? "bg-red-500 animate-pulse" : "bg-zinc-400"}`} />
                  Stop
                </button>
              </div>
            </div>
          </div>

          <div className="my-4 flex items-center justify-center md:my-0">
            <button
              type="button"
              onClick={swapLanguages}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
              aria-label="Swap languages"
            >
              ⇄
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              To
            </label>
            <select
              value={targetLang}
              onChange={(e) => {
                setTargetLang(e.target.value);
                setHasFreshTranslation(false);
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>

            <div className="relative mt-1 min-h-[140px] rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-50">
              {translatedText ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {translatedText}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  Translation will appear here.
                </p>
              )}

              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-transparent transition" />

              <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!translatedText}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition enabled:hover:border-zinc-300 enabled:hover:bg-zinc-50 enabled:active:scale-95 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:enabled:hover:border-zinc-600 dark:enabled:hover:bg-zinc-800"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={handleSpeakTranslated}
                  disabled={!translatedText || !canSpeak || isSpeaking}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition enabled:hover:border-zinc-300 enabled:hover:bg-zinc-50 enabled:active:scale-95 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:enabled:hover:border-zinc-600 dark:enabled:hover:bg-zinc-800"
                >
                  {isSpeaking ? "Playing…" : "Play"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 mb-2 flex flex-col gap-2 sm:mb-0 sm:flex-row sm:items-center sm:justify-between">
          {!hasFreshTranslation && (
            <button
              type="button"
              onClick={() => handleTranslate(false)}
              disabled={isTranslating || !inputText.trim()}
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-600"
            >
              {isTranslating ? "Translating..." : "Translate"}
            </button>
          )}

          <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
            <p className="font-medium text-zinc-600 dark:text-zinc-400">
              🔒 Privacy: No patient data is stored. All information is processed
              in-memory and automatically cleared when you leave the page.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    </>
  );
}


