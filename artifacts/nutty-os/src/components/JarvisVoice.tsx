import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Mic, MicOff, Volume2, Sparkles } from "lucide-react";
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

export function JarvisVoice({ data, onUpdateData }: JarvisVoiceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [, setLocation] = useLocation();

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const isSpeakingRef = useRef(false);

  // Synchronize state with refs for async event callbacks
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // We manage turn-taking explicitly
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);

      if (event.results[current].isFinal) {
        handleSpokenCommand(text);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart recognition if continuous mode is active and Nati is NOT currently speaking
      if (shouldListenRef.current && !isSpeakingRef.current) {
        try {
          recognition.start();
          setIsListening(true);
        } catch (e) {
          console.debug("Recognition start retry deferred:", e);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        console.error("Speech recognition error:", event.error);
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [data]);

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      // Stop mic while Nati speaks so she doesn't hear herself
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;

      // CONTINUOUS CONVERSATION HANDOFF:
      // Auto-resume listening immediately when Nati finishes talking
      if (shouldListenRef.current && recognitionRef.current) {
        setTranscript("");
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.debug("Failed to restart recognition after speech:", e);
        }
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSpokenCommand = (rawCommand: string) => {
    if (!rawCommand.trim()) return;

    // Wake-word cleanup ("Hey Nati", "Nati")
    const cleanCommand = rawCommand
      .replace(/^(hey nati|nati|hey nutty|nutty)[,\s]*/i, "")
      .trim();

    const queryToProcess = cleanCommand.length > 0 ? cleanCommand : rawCommand;

    const result = respondToIntent(queryToProcess, data);
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
      prompt: rawCommand,
      response: responseText,
    };

    onUpdateData((prev) => ({
      ...prev,
      voiceTurns: [turn, ...((prev as any).voiceTurns || [])],
    }));
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (shouldListenRef.current) {
      // Stop hands-free session
      shouldListenRef.current = false;
      window.speechSynthesis.cancel();
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Start hands-free continuous session
      shouldListenRef.current = true;
      window.speechSynthesis.cancel();
      setTranscript("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
      }
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm w-full max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              isListening
                ? "bg-red-500 animate-ping"
                : isSpeaking
                ? "bg-emerald-500 animate-pulse"
                : "bg-muted-foreground"
            }`}
          />
          <span className="font-bold text-xs uppercase tracking-wider">
            Nati Assistant {shouldListenRef.current && "(Hands-Free Active)"}
          </span>
        </div>
        {isSpeaking && (
          <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
            <Volume2 className="h-3.5 w-3.5 animate-bounce" /> Speaking
          </span>
        )}
      </div>

      <div className="min-h-[50px] rounded-lg bg-muted/40 p-2.5 mb-3 text-xs font-mono flex flex-col justify-center">
        {transcript && <p className="text-foreground font-semibold mb-1">"{transcript}"</p>}
        {lastReply ? (
          <p className="text-muted-foreground">{lastReply}</p>
        ) : (
          !transcript && (
            <p className="text-muted-foreground italic">
              {shouldListenRef.current
                ? "Say 'Hey Nati' or ask a question..."
                : "Click below to start hands-free conversation..."}
            </p>
          )
        )}
      </div>

      <button
        onClick={toggleListening}
        className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
          shouldListenRef.current
            ? "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20 shadow-md"
            : "bg-primary hover:opacity-90 text-primary-foreground shadow-md"
        }`}
      >
        {shouldListenRef.current ? (
          <>
            <MicOff className="h-4 w-4" /> End Conversation
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Start Nati Voice Mode
          </>
        )}
      </button>
    </div>
  );
}