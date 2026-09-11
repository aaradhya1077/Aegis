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


type RoleType = "regulator" | "mine_officer" | "frontline" | "admin";

const ROLE_META: Record<RoleType, { title: string; subtitle: string; badge: string; badgeColor: string }> = {
  regulator: {
    title: "DGMS Statutory & Enforcement Intelligence",
    subtitle: "Directorate General of Mines Safety • Statutory Audit, Violation Show-Cause & Section 22(1A) Actions",
    badge: "DGMS Regulator Oversight",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  mine_officer: {
    title: "Colliery Safety & Remediation Intelligence",
    subtitle: "Mine Safety Division • Corrective Action Plans (CAPA), Overdue Filings & Penalty Mitigation",
    badge: "Colliery Management & Safety",
    badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  frontline: {
    title: "Frontline Shift Safety Advisory",
    subtitle: "Mining Sirdar & Overman Lens • Pre-Shift Gas Thresholds, Berm Standards & Emergency Stop Rules",
    badge: "Frontline Field Sirdar",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  admin: {
    title: "Platform Operations & Telemetry",
    subtitle: "Ministry of Coal IT Cell • Knowledge Graph Topology, Merkle Ledger & Model Telemetry",
    badge: "Platform Operations",
    badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
};

const ROLE_GREETINGS: Record<RoleType, string> = {
  regulator:
    "Welcome Inspector. **Aegis Regulatory Enforcement Assistant** is online.\n\n" +
    "⚡ **Configured for DGMS Statutory Oversight & Enforcement:**\n" +
    "- **Mines Act 1952 Sec 22(1A)**: Powers to issue prohibition orders for imminent safety hazards.\n" +
    "- **High-Risk Collieries**: Rajmahal Opencast (CRITICAL 88.5) and Jharia Colliery (84.5) flagged for urgent inspection.\n" +
    "- **Monetary Penalties**: Track non-compliance under Sections 72B & 73 with escalation audit chains.\n\n" +
    "How may I support your statutory enforcement audit today? You can type or tap the microphone to dictate.",
  mine_officer:
    "Welcome Safety Manager. **Aegis Colliery Remediation Assistant** is online.\n\n" +
    "⚡ **Configured for Internal Compliance, Remediation & Risk Mitigation:**\n" +
    "- **Overdue Filings**: 3 quarterly returns overdue at Rajmahal — remediate before Section 72C penalty accruals.\n" +
    "- **CAPA Evidence**: Prepare photographic & geotechnical proof to resolve open DGMS violation notices.\n" +
    "- **Predictive Trajectories**: Review 134 deadline forecasts to prioritize upcoming safety audits.\n\n" +
    "Which colliery compliance task would you like to review?",
  frontline:
    "Welcome Sirdar Ramesh. **Aegis Frontline Shift Safety Advisory** is active.\n\n" +
    "⚡ **Configured for Pre-Shift Inspections & Real-Time Hazard Thresholds:**\n" +
    "- **Methane (CH₄) Limit (CMR Reg 153)**: Permissible max 0.75% in return airway; electric isolation at 1.25%.\n" +
    "- **Haul Road Safety (CMR Reg 106)**: Berm height must be at least tyre diameter (1.8m min).\n" +
    "- **Strata Dilation**: Report crack widening on Pit-3 Bench 4 directly to the shift log.\n\n" +
    "Stay alert underground! What statutory safe limit or inspection rule do you need to check?",
  admin:
    "Welcome Administrator. **Aegis Platform Operations Intelligence** is active.\n\n" +
    "⚡ **Configured for Platform Architecture & Telemetry Monitoring:**\n" +
    "- **Regulatory Graph**: 25 Regulation nodes, 30 Mine nodes, 1,419 Filings, 1,292 Checks.\n" +
    "- **Blockchain Merkle Ledger**: Cryptographically verifiable tamper-proof audit chain.\n" +
    "- **Inference Telemetry**: Groq hardware-accelerated LLaMA-3.3 inference (<200ms latency).\n\n" +
    "What platform telemetry would you like to inspect?",
};

const ROLE_PROMPTS: Record<RoleType, Array<{ label: string; query: string }>> = {
  regulator: [
    { label: "Rajmahal Sec 22 Risk", query: "Why is Rajmahal Opencast Project flagged as Critical risk and what Section 22 actions are warranted?" },
    { label: "DGMS Open Violations", query: "What are the active DGMS violations and penalties due for show-cause notice?" },
    { label: "Overdue Filings Escalation", query: "Which mines in Jharkhand have overdue statutory filings requiring penalty escalation?" },
    { label: "CMR 2017 Reg 104 (SMP)", query: "What are the mandatory requirements for Safety Management Plans under CMR 2017 Reg 104?" },
    { label: "Sec 72B/73 Penalties", query: "What are the legal penalties under Mines Act 1952 Section 72B and 73 for non-compliance?" },
  ],
  mine_officer: [
    { label: "Rajmahal Overdue Filings", query: "What statutory filings are overdue for Rajmahal Opencast Project and how do we remediate them?" },
    { label: "Actions Due This Week", query: "What compliance actions and filings are due this week across our colliery?" },
    { label: "CAPA Evidence Checklist", query: "What evidence is required to close the open DGMS violation on Pit-3 working face?" },
    { label: "Berm Height Remediation", query: "How do we rectify the haul road berm height violation under CMR 2017 Reg 106?" },
    { label: "Penalty Mitigation Plan", query: "What steps are required to prevent Section 72C monetary penalties for delayed returns?" },
  ],
  frontline: [
    { label: "CH₄ Statutory Limits", query: "What is the permissible methane gas limit in return airway and what is the emergency withdrawal limit?" },
    { label: "Haul Road Berm Rule", query: "What are the statutory height requirements for haul road berms under CMR 2017 Reg 106?" },
    { label: "Report Bench Crack", query: "How should I record a strata crack observed on Bench 4 during morning shift inspection?" },
    { label: "Water Inundation Buffer", query: "What is the mandatory barrier distance when approaching waterlogged old workings?" },
    { label: "खदान सुरक्षा नियम (Hindi)", query: "अंडरग्राउंड खदान में मीथेन गैस और छत सपोर्ट के जरूरी नियम क्या हैं?" },
  ],
  admin: [
    { label: "Vector Store Status", query: "What is the current status of the FAISS vector index and embedding models?" },
    { label: "Merkle Ledger Health", query: "Verify the cryptographic integrity of the SHA-256 tamper-proof audit trail." },
    { label: "134 Trajectories Split", query: "What is the distribution of the 134 deadline forecast trajectories across risk tiers?" },
    { label: "Groq Inference Latency", query: "What is the current Groq hardware-accelerated LLaMA-3.3 inference latency?" },
  ],
};

export function ChatArea() {
  const [currentRole, setCurrentRole] = React.useState<RoleType>("regulator");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Groq API Key state
  const [groqKey, setGroqKey] = React.useState(DEFAULT_GROQ_KEY);
  const [showKeyModal, setShowKeyModal] = React.useState(false);
  const [isKeySaved, setIsKeySaved] = React.useState(true);

  // Speech to Text state
  const [isListening, setIsListening] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const syncRole = React.useCallback(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role && parsed.role in ROLE_META) {
          return parsed.role as RoleType;
        }
      }
    } catch {}
    return "regulator" as RoleType;
  }, []);

  React.useEffect(() => {
    const initialRole = syncRole();
    setCurrentRole(initialRole);
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: ROLE_GREETINGS[initialRole],
        timestamp: new Date(),
        engine: "Groq Hardware-Accelerated + FAISS Vector Store",
      },
    ]);

    const handler = () => {
      const newRole = syncRole();
      setCurrentRole(newRole);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `🔄 **Switched to ${ROLE_META[newRole].badge}**\n\n${ROLE_GREETINGS[newRole]}`,
          timestamp: new Date(),
          engine: "Aegis Context Engine",
        },
      ]);
    };

    window.addEventListener("aegis-user-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("aegis-user-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, [syncRole]);

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
      const res = await chatQuery(textToSend, groqKey || undefined, currentRole);
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

  const activeMeta = ROLE_META[currentRole] || ROLE_META.regulator;
  const activePrompts = ROLE_PROMPTS[currentRole] || ROLE_PROMPTS.regulator;

  return (
    <Card className="flex flex-col h-[calc(100vh-14rem)] min-h-[540px] max-h-[760px] border-white/10 bg-[#0e141d]/95 backdrop-blur shadow-xl overflow-hidden">
      {/* Header */}
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 p-3 sm:p-4 bg-white/[0.02]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Bot className="h-4 w-4" />
              </span>
              <span>{activeMeta.title}</span>
            </CardTitle>
            <Badge className={`${activeMeta.badgeColor} text-[10px] font-mono flex items-center gap-1`}>
              <Zap className="h-3 w-3 text-emerald-400 fill-emerald-400" />
              {activeMeta.badge}
            </Badge>
          </div>
          <CardDescription className="text-muted-foreground text-xs mt-1">
            {activeMeta.subtitle}
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
        {activePrompts.map((p, idx) => (
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
            placeholder={
              currentRole === "regulator"
                ? "Ask enforcement query (e.g. 'Rajmahal Section 22 actions', 'Active DGMS violations')..."
                : currentRole === "mine_officer"
                ? "Ask remediation query (e.g. 'Overdue filings for Rajmahal', 'Actions due this week')..."
                : currentRole === "frontline"
                ? "Ask shift safety query (e.g. 'Permissible methane limit', 'Haul road berm rule')..."
                : "Ask platform telemetry query (e.g. 'Vector store status', 'Merkle ledger health')..."
            }
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
