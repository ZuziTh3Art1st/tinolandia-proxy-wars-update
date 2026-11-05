"use client";

import { useEffect, useState } from "react";

export function CommentaryAudio({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setSpeaking(false);
    setError("");
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text]);

  const togglePlayback = () => {
    if (!("speechSynthesis" in window)) {
      setError("Voice playback is not available in this browser.");
      return;
    }

    const synthesis = window.speechSynthesis;
    if (speaking) {
      synthesis.cancel();
      setSpeaking(false);
      return;
    }

    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-ZA";
    utterance.rate = 0.96;
    const voices = synthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === "en-za")
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en-"))
      ?? null;
    utterance.onstart = () => { setSpeaking(true); setError(""); };
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setError("Voice playback failed. Check that your device has speech audio enabled.");
    };
    synthesis.speak(utterance);
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button type="button" onClick={togglePlayback} className="rounded-full border border-[#bfd2c8] bg-white px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-dark)] transition hover:border-[var(--accent)]" aria-pressed={speaking}>
        {speaking ? "Stop voice" : "Listen"}
      </button>
      {error && <span role="status" className="max-w-44 text-[10px] text-rose-700">{error}</span>}
    </div>
  );
}
