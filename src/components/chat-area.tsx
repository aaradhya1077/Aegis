"use client";

import * as React from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Key,
  Check,
  ShieldCheck,
  Mic,
  MicOff,
  Zap,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { chatQuery } from "@/lib/api";

type Source = {
  act?: string;
  clause?: string;
  filing_type?: string;
  score?: number;
  severity?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  engine?: string;
  confidence?: number;
  timestamp: Date;
  latencyMs?: number;
};

const DEFAULT_GROQ_KEY =
  process.env.NEXT_PUBLIC_GROQ_API_KEY || "";


const SAMPLE_PROMPTS = [
  { label: "CMR 2017 Reg 104 (SMP)", query: "What are the mandatory requirements for Safety Management Plans under CMR 2017 Reg 104?" },
  { label: "DGMS Form IV Protocol", query: "What is the statutory filing protocol for Form IV Dangerous Occurrence under The Mines Act 1952?" },
  { label: "Sec 72B/73 Penalties", query: "What are the legal penalties under Mines Act 1952 Section 72B and 73 for non-compliance?" },
  { label: "खदान वेंटिलेशन नियम (Hindi)", query: "भारतीय कोयला खदानों में वेंटिलेशन और मीथेन गैस जांच के लिए DGMS के नियम क्या हैं?" },
  { label: "Overdue Mines Check", query: "Which mines in Jharkhand or BCCL have overdue statutory filings?" },
];

export function ChatArea() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Welcome to the **Aegis Autonomous Statutory Regulatory Intelligence Assistant** (Ministry of Coal & DGMS Dhanbad • SIH 2026).\n\n" +
        "⚡ **Hardware Acceleration:** Powered by **Groq Ultra-Low Latency Inference** (<200ms) with a grounded **FAISS Vector Store** over the Indian Mining Statutory Corpus:\n" +
        "- **The Mines Act, 1952** (Sections 22, 22A, 23, 72B, 73)\n" +
        "- **Coal Mines Regulations, 2017 (CMR 2017)**\n" +
        "- **DGMS Safety Circulars & Standard Operating Procedures**\n" +
        "- **MoEF&CC Environmental Clearances & SPCB Standards**\n\n" +
        "How may I assist your statutory audit today? You can type or tap the microphone to dictate in English or Hindi.",
      timestamp: new Date(),
      engine: "Groq Hardware-Accelerated + FAISS Vector Store",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Groq API Key state
  const [groqKey, setGroqKey] = React.useState(DEFAULT_GROQ_KEY);
  const [showKeyModal, setShowKeyModal] = React.useState(false);
  const [isKeySaved, setIsKeySaved] = React.useState(true);

  // Speech to Text state
  const [isListening, setIsListening] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem("aegis_groq_key");
    if (saved) {
      setGroqKey(saved);
      setIsKeySaved(true);
    } else {
      setGroqKey(DEFAULT_GROQ_KEY);
      localStorage.setItem("aegis_groq_key", DEFAULT_GROQ_KEY);
      setIsKeySaved(true);
    }
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const saveGroqKey = (key: string) => {
    localStorage.setItem("aegis_groq_key", key);
    setGroqKey(key);
    setIsKeySaved(!!key);
    setShowKeyModal(false);
  };

  // Voice speech-to-text recognition
  const toggleSpeechRecognition = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRec =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or mobile Safari/Chrome.");
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN"; // English (India), also handles Hindi terms

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSend = async (customQuery?: string) => {
    const textToSend = customQuery || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customQuery) setInput("");
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const res = await chatQuery(textToSend, groqKey || undefined);
      const latency = Date.now() - startTime;
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.answer || "No statutory response details available.",
        sources: (res.sources as Source[]) || [],
        engine: res.engine || "Groq Accelerated + FAISS",
        confidence: res.confidence,
        timestamp: new Date(),
        latencyMs: latency,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to fetch statutory response";
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Statutory query note: ${errMsg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-14rem)] min-h-[540px] max-h-[760px] border-white/10 bg-[#0d1218]/90 backdrop-blur shadow-2xl overflow-hidden">
      {/* Header */}
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 p-3 sm:p-4 bg-white/[0.02]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
              <Bot className="h-5 w-5 text-emerald-400" />
              <span>Aegis Statutory Intelligence</span>
            </CardTitle>
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
              <Zap className="h-3 w-3 text-emerald-400 fill-emerald-400" />
              Groq Hardware Engine Active
            </Badge>
          </div>
          <CardDescription className="text-muted-foreground text-xs mt-0.5">
            Ministry of Coal & DGMS Dhanbad • Grounded Statutory RAG over CMR 2017 & The Mines Act 1952
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowKeyModal(true)}
            className="h-7 text-xs border-white/15 bg-white/5 text-muted-foreground hover:text-foreground gap-1.5"
          >
            <Key className="h-3 w-3 text-amber-400" />
            <span className="hidden sm:inline">Groq Key:</span>
            <span className="font-mono text-[10px] text-amber-300">Active</span>
            <Check className="h-3 w-3 text-emerald-400" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages area */}
      <CardContent className="flex-1 overflow-y-auto space-y-3 p-3 sm:p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2.5 sm:gap-3 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 mt-1">
              <AvatarFallback
                className={
                  message.role === "user"
                    ? "bg-blue-600 text-white font-bold text-xs"
                    : "bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs"
                }
              >
                {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-emerald-400" />}
              </AvatarFallback>
            </Avatar>

            <div
              className={`rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm max-w-[92%] sm:max-w-[85%] space-y-2 leading-relaxed ${
                message.role === "user"
                  ? "bg-emerald-600 text-white shadow-md font-medium"
                  : "bg-white/[0.04] border border-white/10 text-neutral-200"
              }`}
            >
              <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                {message.content}
              </div>

              {/* Latency and Engine Info */}
              {message.role === "assistant" && (message.engine || message.latencyMs) && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-neutral-400">
                  {message.engine && (
                    <span className="flex items-center gap-1 font-mono text-emerald-400">
                      <Zap className="h-2.5 w-2.5" />
                      {message.engine}
                    </span>
                  )}
                  {message.latencyMs && (
                    <span className="rounded bg-black/40 px-1 py-0.2 border border-white/5 font-mono text-amber-300">
                      ⏱️ {message.latencyMs}ms
                    </span>
                  )}
                </div>
              )}

              {/* Cited Statutory Clauses */}
              {message.sources && message.sources.length > 0 && (
                <div className="pt-2 border-t border-white/10 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-400 font-semibold text-[10px]">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Verified Statutory Citations (FAISS Index):
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {message.sources.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded bg-black/40 border border-white/10 flex items-center justify-between gap-1 text-[10px]"
                      >
                        <span className="font-semibold text-emerald-300 truncate">
                          {s.act} • {s.clause}
                        </span>
                        {s.severity && (
                          <Badge
                            variant="outline"
                            className="text-[8px] uppercase px-1 py-0 font-bold border-white/20 text-neutral-300"
                          >
                            {s.severity}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 sm:gap-3">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
              <AvatarFallback className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
                <Bot className="h-4 w-4 text-emerald-400" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin text-emerald-400" />
              <span>Querying Groq hardware acceleration & synthesizing statutory citations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Preset Prompt Chips */}
      <div className="border-t border-white/10 bg-white/[0.01] px-3 py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase font-mono shrink-0 flex items-center gap-1 mr-1">
          <BookOpen className="h-3 w-3 text-amber-400" /> Quick:
        </span>
        {SAMPLE_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.query)}
            disabled={isLoading}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/40 px-2.5 py-1 text-[11px] text-neutral-300 transition-all font-medium whitespace-nowrap"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <CardFooter className="p-2 sm:p-3 border-t border-white/10 bg-[#0a0d12]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex w-full items-center gap-1.5 sm:gap-2"
        >
          <Input
            placeholder="Ask statutory query (e.g. 'CMR 2017 Reg 104 requirements', 'खदान में सुरक्षा नियम')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 text-xs sm:text-sm bg-white/[0.03] border-white/15 h-9 sm:h-10 text-white placeholder:text-neutral-500"
          />

          {/* Voice Input Button */}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={toggleSpeechRecognition}
            className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 border-white/15 ${
              isListening
                ? "bg-red-500/20 text-red-400 border-red-500/50 animate-pulse"
                : "bg-white/5 text-muted-foreground hover:text-white"
            }`}
            title={isListening ? "Listening... click to stop" : "Voice input (English / Hindi)"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          {/* Send Button */}
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>

      {/* Groq Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-white/20 bg-[#0d1218] text-foreground shadow-2xl">
            <CardHeader className="pb-3 border-b border-white/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <Key className="h-4 w-4 text-amber-400" />
                Groq Hardware API Configuration
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Groq hardware-accelerated LLaMA/Qwen model inference active (&lt;200ms latency)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Groq API Key</label>
                <Input
                  type="password"
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="font-mono text-xs bg-white/5 border-white/15"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Active key is automatically pre-configured for your SIH 2026 session.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowKeyModal(false)} className="text-xs">
                  Close
                </Button>
                <Button size="sm" onClick={() => saveGroqKey(groqKey)} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}
