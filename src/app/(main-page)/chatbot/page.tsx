"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconBook,
  IconBuildingFactory2,
  IconAlertTriangle,
  IconShieldCheck,
  IconCpu,
  IconFlame,
} from "@tabler/icons-react";
import { ChatArea } from "@/components/chat-area";

export default function ChatbotPage() {
  return (
    <div className="space-y-4">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <IconCpu className="h-5 w-5" />
              </span>
              Regulatory Intelligence AI
            </h1>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs font-mono">
              DGMS Dhanbad • CMR 2017 Grounded
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Hardware-accelerated Groq RAG over The Mines Act 1952, Coal Mines Regulations 2017 & MoEF&CC Clearance Conditions.
          </p>
        </div>
      </div>

      {/* Main Grid: Responsive 1 col on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Side Info Panel (Collapsible or below on mobile) */}
        <div className="lg:col-span-1 space-y-3 order-2 lg:order-1">
          <Card className="bg-[#0e141d]/90 border-white/10 shadow-md backdrop-blur">
            <CardHeader className="pb-2.5 pt-3.5 px-4 border-b border-white/5">
              <CardTitle className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <IconShieldCheck className="h-4 w-4" />
                Statutory Corpus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs px-4 py-3.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <span className="flex items-center gap-2 text-neutral-300">
                  <IconBook className="h-4 w-4 text-emerald-400" />
                  Mines Act 1952 / CMR 2017
                </span>
                <span className="font-mono font-bold text-emerald-400">25+ Clauses</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <span className="flex items-center gap-2 text-neutral-300">
                  <IconBuildingFactory2 className="h-4 w-4 text-sky-400" />
                  Registered Coal Mines
                </span>
                <span className="font-mono font-bold text-sky-400">30 Mines</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <span className="flex items-center gap-2 text-neutral-300">
                  <IconFlame className="h-4 w-4 text-amber-400" />
                  DGMS Tech Circulars
                </span>
                <span className="font-mono font-bold text-amber-400">Indexed</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <span className="flex items-center gap-2 text-neutral-300">
                  <IconAlertTriangle className="h-4 w-4 text-rose-400" />
                  Live Audits & CAPA
                </span>
                <span className="font-mono font-bold text-rose-400">Real-time</span>
              </div>
            </CardContent>
          </Card>

          <div className="hidden lg:block rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-[11px] text-amber-200/90 leading-relaxed shadow-sm">
            💡 <strong>SIH 2026 Evaluation Tip:</strong> You can click the microphone icon in the chat input to speak in English or Hindi (e.g. <em>&quot;खदान में वेंटिलेशन और सुरक्षा नियम क्या हैं?&quot;</em>).
          </div>
        </div>

        {/* Right Main Chat Area */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <ChatArea />
        </div>
      </div>
    </div>
  );
}
