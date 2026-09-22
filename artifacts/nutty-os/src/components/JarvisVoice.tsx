import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Volume2, Sparkles, Mic, Radio } from "lucide-react";
import { NuttyData, VoiceTurn, makeId } from "../lib/nutty-data";

interface JarvisVoiceProps {
  data: NuttyData;
  onUpdateData: (updater: (prev: NuttyData) => NuttyData) => void;
}

const WAKE_WORD_REGEX = /^(hey\s+)?(nutty|nati|nazi|jarvis)[,\s]*/i;

export function JarvisVoice({ data, onUpdateData }: JarvisVoiceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastReply, setLastReply] = useState("Nutty Proactive Engine Active.");
  const [, setLocation] = useLocation();

  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const dataRef = useRef(data);
  const lastProactiveCheckRef = useRef<number>(Date.now());

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // --- Voice Engine ---
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      if (isSpeakingRef.current) return;

      const current = event.resultIndex;
      const rawText = event.results[current][0].transcript.trim();
      setTranscript(rawText);

      if (event.results[current].isFinal) {
        processInputWithAI(rawText);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!isSpeakingRef.current) restartListeningSilently();
    };

    recognition.onerror = () => {
      setIsListening(false);
      if (!isSpeakingRef.current) setTimeout(restartListeningSilently, 300);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      const unlockMic = () => {
        try { recognition.start(); } catch {}
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
    try { recognitionRef.current.start(); } catch {}
  };

  // --- Proactive Background Monitor (Nutty speaks first) ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Check every 60 seconds for ambient events
      if (now - lastProactiveCheckRef.current > 60000 && !isSpeakingRef.current) {
        lastProactiveCheckRef.current = now;
        checkProactiveTriggers();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const checkProactiveTriggers = async () => {
    const currentData = dataRef.current as any;

    // Trigger 1: Detect background audio playback
    const isAudioPlaying = document.querySelector("audio, video") !== null;

    // Trigger 2: Check for unread social updates or emails
    const unreadEmails = currentData?.emails?.filter((e: any) => !e.read)?.length || 0;

    let triggerMessage = "";
    if (isAudioPlaying) {
      triggerMessage = "[SYSTEM NOTICE: User is currently playing music or audio media. Acknowledge this casually.]";
    } else if (unreadEmails > 0) {
      triggerMessage = `[SYSTEM NOTICE: User has ${unreadEmails} unread emails. Briefly inform them.]`;
    }

    if (triggerMessage) {
      processInputWithAI("", triggerMessage);
    }
  };

  // --- Dynamic Generative AI Request ---
  const processInputWithAI = async (userInput: string, ambientTrigger?: string) => {
    if (!userInput && !ambientTrigger) return;

    const hasWakeWord = WAKE_WORD_REGEX.test(userInput);
    const cleanCommand = userInput.replace(WAKE_WORD_REGEX, "").trim();

    if (!hasWakeWord && !ambientTrigger && cleanCommand.length < 3) return;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanCommand || userInput,
          ambientTrigger,
          osContext: dataRef.current,
        }),
      });

      const resData = await response.json();
      const aiReply = resData.text || "I'm connected, sir.";

      setLastReply(aiReply);
      speakText(aiReply);

      if (userInput) {
        const turn: VoiceTurn = {
          id: makeId("voice"),
          timestamp: new Date().toISOString(),
          prompt: userInput,
          response: aiReply,
        };

        onUpdateData((prev) => ({
          ...prev,
          voiceTurns: [turn, ...((prev as any).voiceTurns || [])],
        }));
      }
    } catch (e) {
      console.error("Failed to fetch AI voice response:", e);
    }
  };

  // --- TTS Engine ---
  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };

    const handleSpeechComplete = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setTranscript("");
      setTimeout(restartListeningSilently, 200);
    };

    utterance.onend = handleSpeechComplete;
    utterance.onerror = handleSpeechComplete;

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-4 shadow-sm w-full max-w-sm">
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
            <Radio className="h-3.5 w-3.5 text-primary animate-pulse" /> Nutty OS Brain
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
          {isListening ? "Listening & Observing..." : "Click anywhere to wake"}
        </span>
        <span className="font-semibold text-primary/80">"Hey Nutty"</span>
      </div>
    </div>
  );
}