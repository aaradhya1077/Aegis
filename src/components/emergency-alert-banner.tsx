"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  IconAlertTriangle,
  IconFlame,
  IconVolume,
  IconVolumeOff,
  IconShieldCheck,
  IconX,
  IconChecklist,
  IconPhoneCall,
  IconSend,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n";

export interface EmergencyEventDetail {
  mine_name: string;
  mine_id: string;
  hazard_level: string;
  title: string;
  statute?: string;
  block_hash?: string;
  timestamp?: string;
}

export function EmergencyAlertBanner() {
  const { t, lang } = useLanguage();
  const [activeAlert, setActiveAlert] = useState<EmergencyEventDetail | null>(null);
  const [muted, setMuted] = useState(false);
  const [protocolOpen, setProtocolOpen] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    step1: true,
    step2: false,
    step3: false,
    step4: false,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenIntervalRef = useRef<any>(null);

  // Web Audio API synthesized emergency chime
  const playChime = () => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === "suspended") {
        ctx?.resume();
      }
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(820, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Ignore audio autoplay policy errors
    }
  };

  useEffect(() => {
    const handleEmergency = (e: Event) => {
      const customEvent = e as CustomEvent<EmergencyEventDetail>;
      if (customEvent.detail) {
        setActiveAlert(customEvent.detail);
        setSmsSent(false);
        setChecklist({ step1: true, step2: false, step3: false, step4: false });
        playChime();
      }
    };

    const handleClear = () => {
      setActiveAlert(null);
    };

    window.addEventListener("aegis-emergency-alert", handleEmergency);
    window.addEventListener("aegis-emergency-clear", handleClear);

    return () => {
      window.removeEventListener("aegis-emergency-alert", handleEmergency);
      window.removeEventListener("aegis-emergency-clear", handleClear);
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
    };
  }, [muted]);

  const handleDismiss = () => {
    setActiveAlert(null);
    window.dispatchEvent(new CustomEvent("aegis-emergency-clear"));
  };

  const handleDispatchSms = () => {
    setSmsSent(true);
  };

  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!activeAlert) return null;

  return (
    <>
      <div className="w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-y border-red-500/60 shadow-lg shadow-red-950/40 text-white px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-300">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-white animate-pulse">
            <IconFlame className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-red-600 text-white font-extrabold uppercase tracking-wider text-[10px] px-2 py-0 border-none">
                {t("emergency.alert")}
              </Badge>
              <span className="font-bold text-xs sm:text-sm text-red-100 truncate">
                {activeAlert.mine_name}
              </span>
              {activeAlert.statute && (
                <span className="hidden md:inline text-[11px] font-mono text-red-300/80">
                  [{activeAlert.statute}]
                </span>
              )}
            </div>
            <p className="text-xs text-red-200/90 truncate mt-0.5">
              {activeAlert.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMuted(!muted)}
            className="h-7 text-xs border-red-400/40 bg-red-950/40 text-red-200 hover:bg-red-900/60"
            title={muted ? "Unmute Alarm" : "Mute Alarm"}
          >
            {muted ? <IconVolumeOff className="h-3.5 w-3.5" /> : <IconVolume className="h-3.5 w-3.5 text-red-300 animate-bounce" />}
          </Button>

          <Button
            size="sm"
            onClick={() => setProtocolOpen(true)}
            className="h-7 text-xs bg-red-600 hover:bg-red-500 text-white font-semibold gap-1.5 shadow"
          >
            <IconChecklist className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">DGMS</span> Protocol
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-7 w-7 p-0 text-red-300 hover:bg-red-800/60 hover:text-white"
            title="Acknowledge Alert"
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Evacuation Protocol & Rescue Dispatch Modal */}
      <Dialog open={protocolOpen} onOpenChange={setProtocolOpen}>
        <DialogContent className="max-w-2xl bg-[#0e141c] border-red-500/40 text-foreground p-5 sm:p-6">
          <DialogHeader className="border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                <IconFlame className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  {t("emergency.stop_work")}
                  <Badge className="bg-red-600 text-white text-[10px]">SECTION 22</Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Colliery: {activeAlert.mine_name} • DGMS Safety Notification Directive
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-red-200">
              <div className="font-semibold text-sm mb-1 text-red-100 flex items-center gap-1.5">
                <IconAlertTriangle className="h-4 w-4 text-red-400" />
                Trigger: {activeAlert.title}
              </div>
              <p className="text-red-300/90 leading-relaxed">
                Mandatory electrical cutoff to inbye face and suspension of all winding/extraction operations ordered under CMR 2017 Regulation 153/106.
              </p>
              {activeAlert.block_hash && (
                <div className="mt-2 font-mono text-[10px] text-red-300/70 truncate">
                  Audit Block Hash: {activeAlert.block_hash}
                </div>
              )}
            </div>

            {/* Statutory Checklist */}
            <div className="space-y-2">
              <div className="font-semibold text-white uppercase tracking-wider text-[11px] text-muted-foreground">
                {t("emergency.checklist")}
              </div>
              <div className="space-y-2">
                {[
                  { id: "step1", text: "Isolate high-tension power feeders to affected pit face (CMR Reg. 153)" },
                  { id: "step2", text: "Sound surface audible siren (3 long blasts) & direct workers to intake escape gallery" },
                  { id: "step3", text: "Alert DGMS Dhanbad Zonal Inspectorate & CIL Central Control Room" },
                  { id: "step4", text: "Deploy Mine Rescue Station team with BG-4 closed-circuit breathing apparatus" },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
                      checklist[item.id]
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded flex items-center justify-center border ${
                        checklist[item.id]
                          ? "bg-emerald-500 border-emerald-400 text-black font-bold"
                          : "border-white/30"
                      }`}
                    >
                      {checklist[item.id] && "✓"}
                    </div>
                    <span className="flex-1 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Broadcast SMS & Stand Down Row */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleDispatchSms}
                  disabled={smsSent}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs gap-1.5 h-8"
                >
                  <IconSend className="h-3.5 w-3.5" />
                  {smsSent ? "✓ SMS Broadcast Dispatched (1,240 Miners)" : "Broadcast Emergency SMS to Shift II"}
                </Button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setProtocolOpen(false);
                  handleDismiss();
                }}
                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs h-8 gap-1.5"
              >
                <IconShieldCheck className="h-3.5 w-3.5" />
                {t("emergency.acknowledge")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function triggerEmergencyAlert(detail: EmergencyEventDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aegis-emergency-alert", { detail }));
  }
}

export function clearEmergencyAlert() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aegis-emergency-clear"));
  }
}
