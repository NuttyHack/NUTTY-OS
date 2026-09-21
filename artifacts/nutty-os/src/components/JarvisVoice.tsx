import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Volume2, Sparkles, Mic } from "lucide-react";
import { NuttyData, respondToIntent, VoiceTurn, makeId } from "../lib/nutty-data";

interface JarvisVoiceProps {
  data: NuttyData;
  onUpdateData: (updater: (prev: NuttyData) => NuttyData) => void;
}

const INTENT_ROUTES: Record<string, string> = {
  CHECK_SOCIALS: "/social",
  CHECK_BILLS: "/money",
  CHECK_CALENDAR: "/calendar",
  CHECK_EMAIL: "/email",
  CHECK_TASKS: "/tasks",
  CHECK_SCHOOL_WORK: "/work",
  CHECK_GOALS: "/goals",
  CHECK_MEMORY: "/memory",
  PLAN_DAY: "/today",
  DAILY_BRIEFING: "/today",
};

// Wake words regex catching variations (Nutty, Nati, Nazi)
const WAKE_WORD_REGEX = /^(hey\s+)?(nutty|nati|nazi|jarvis)[,\s]*/i;

export function JarvisVoice({ data, onUpdateData }: JarvisVoiceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastReply, setLastReply] = useState("Nutty Voice Daemon active. Listening for 'Hey Nutty'...");
  const [isInitialized, setIsInitialized] = useState(false);
  const [, setLocation] = useLocation();

  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // --- Voice Daemon Core Loop ---
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setIsInitialized(true);
    };

    recognition.onresult = (event: any) => {
      // Ignore recognized speech while Nutty is currently talking out loud
      if (isSpeakingRef.current) return;

      const current = event.resultIndex;
      const rawText = event.results[current][0].transcript.trim();
      setTranscript(rawText);

      if (event.results[current].isFinal) {
        processVoiceInput(rawText);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // INFINITE LOOP: Immediately restart recognition unless Nutty is actively speaking
      if (!isSpeakingRef.current) {
        restartListeningSilently();
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.debug("Voice recognition notice:", event.error);
      }
      setIsListening(false);
      if (!isSpeakingRef.current) {
        setTimeout(restartListeningSilently, 300);
      }
    };

    recognitionRef.current = recognition;

    // Auto-start listening on mount
    try {
      recognition.start();
    } catch (e) {
      // If browser blocks auto-mic on cold load, register one-time document click handler
      const unlockMic = () => {
        try {
          recognition.start();
        } catch {}
        document.removeEventListener("click", unlockMic);
      };
      document.addEventListener("click", unlockMic);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const restartListeningSilently = () => {
    if (!recognitionRef.current || isSpeakingRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already running or initializing
    }
  };

  // --- JARVIS Voice Engine ---
  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      // Pause mic while speaking to avoid hearing itself
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };

    const handleSpeechComplete = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setTranscript("");
      // RE-OPEN MIC IMMEDIATELY AFTER SPEAKING
      setTimeout(restartListeningSilently, 200);
    };

    utterance.onend = handleSpeechComplete;
    utterance.onerror = handleSpeechComplete;

    window.speechSynthesis.speak(utterance);
  };

  const processVoiceInput = (rawText: string) => {
    if (!rawText) return;

    const hasWakeWord = WAKE_WORD_REGEX.test(rawText);
    const cleanCommand = rawText.replace(WAKE_WORD_REGEX, "").trim();

    // If user said "Hey Nutty" with no extra command
    if (hasWakeWord && !cleanCommand) {
      const jarvisGreeting = "At your service, sir. How can I help you today?";
      setLastReply(jarvisGreeting);
      speakText(jarvisGreeting);
      return;
    }

    // Process command if wake-word was present OR if Nutty was already in conversation
    if (hasWakeWord || cleanCommand.length > 3) {
      const query = cleanCommand || rawText;
      const result = respondToIntent(query, dataRef.current);
      const responseText = typeof result === "string" ? result : result.text;
      const intent = typeof result === "object" ? result.intent : null;

      if (intent && INTENT_ROUTES[intent]) {
        setLocation(INTENT_ROUTES[intent]);
      }

      setLastReply(responseText);
      speakText(responseText);

      const turn: VoiceTurn = {
        id: makeId("voice"),
        timestamp: new Date().toISOString(),
        prompt: rawText,
        response: responseText,
      };

      onUpdateData((prev) => ({
        ...prev,
        voiceTurns: [turn, ...((prev as any).voiceTurns || [])],
      }));
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-4 shadow-sm w-full max-w-sm transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              isSpeaking
                ? "bg-emerald-500 animate-pulse"
                : isListening
                ? "bg-blue-500 animate-pulse"
                : "bg-amber-500"
            }`}
          />
          <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Nutty Background Engine
          </span>
        </div>
        {isSpeaking && (
          <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
            <Volume2 className="h-3.5 w-3.5 animate-bounce" /> Speaking
          </span>
        )}
      </div>

      <div className="min-h-[54px] rounded-lg bg-muted/30 p-3 text-xs font-mono flex flex-col justify-center border border-border/50">
        {transcript ? (
          <p className="text-foreground font-semibold">"{transcript}"</p>
        ) : (
          <p className="text-muted-foreground italic">{lastReply}</p>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span className="flex items-center gap-1">
          <Mic className={`h-3 w-3 ${isListening ? "text-blue-500" : "text-muted-foreground"}`} />
          {isListening ? "Always-On Listening..." : "Click anywhere on screen to wake mic"}
        </span>
        <span className="font-semibold text-primary/80">"Hey Nutty"</span>
      </div>
    </div>
  );
}