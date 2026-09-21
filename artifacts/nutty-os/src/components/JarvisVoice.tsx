import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Mic, MicOff, Volume2 } from "lucide-react";
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

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
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

    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [data]);

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSpokenCommand = (command: string) => {
    if (!command.trim()) return;

    const result = respondToIntent(command, data);
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
      prompt: command,
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

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      window.speechSynthesis.cancel();
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
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
          <span className="font-bold text-xs uppercase tracking-wider">Nutty Assistant</span>
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
          !transcript && <p className="text-muted-foreground italic">Tap mic and speak...</p>
        )}
      </div>

      <button
        onClick={toggleListening}
        className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
          isListening
            ? "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20 shadow-md"
            : "bg-primary hover:opacity-90 text-primary-foreground shadow-md"
        }`}
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4" /> Listening...
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" /> Start Voice Interaction
          </>
        )}
      </button>
    </div>
  );
}