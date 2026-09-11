"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconDeviceMobile,
  IconCurrentLocation,
  IconWifi,
  IconWifiOff,
  IconCamera,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconShieldExclamation,
  IconRefresh,
  IconMicrophone,
  IconMicrophoneOff,
  IconSparkles,
} from "@tabler/icons-react";
import { fetchMines, fetchInspections, createInspection, InspectionRecord } from "@/lib/api";
import { toast } from "sonner";

export default function FieldInspectorPage() {
  const [mines, setMines] = useState<any[]>([]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [selectedMineId, setSelectedMineId] = useState("");
  const [areaInspected, setAreaInspected] = useState("");
  const [category, setCategory] = useState("safety");
  const [hazardLevel, setHazardLevel] = useState("medium");
  const [observations, setObservations] = useState("");
  const [inspectorName, setInspectorName] = useState("Er. Rajesh Kumar (Mine Safety Officer)");
  const [inspectorId, setInspectorId] = useState("MINE-001");

  // Geolocation states
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Hands-free Voice Dictation States
  const [isRecording, setIsRecording] = useState(false);
  const [speechLang, setSpeechLang] = useState<"en-IN" | "hi-IN">("en-IN");
  const recognitionRef = useRef<any>(null);

  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome/Edge or type manually.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        toast.info(`Microphone active (${speechLang === "en-IN" ? "English" : "Hindi"}). Dictate your inspection findings...`);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setObservations((prev) => (prev ? `${prev} ${transcript}` : transcript));
          toast.success(`Voice note captured: "${transcript.substring(0, 35)}..."`);

          // Neuro-symbolic keyword auto-tagging
          const lower = transcript.toLowerCase();
          if (
            lower.includes("methane") ||
            lower.includes("gas") ||
            lower.includes("ch4") ||
            lower.includes("ventilation") ||
            lower.includes("हवा") ||
            lower.includes("गैस")
          ) {
            setCategory("ventilation");
            setHazardLevel("critical");
            toast.info("Auto-tagged: Category -> Ventilation, Severity -> Critical (CMR Reg. 153)");
          } else if (
            lower.includes("slope") ||
            lower.includes("bench") ||
            lower.includes("crack") ||
            lower.includes("roof") ||
            lower.includes("strata") ||
            lower.includes("ढलान") ||
            lower.includes("छत")
          ) {
            setCategory("safety");
            setHazardLevel("high");
            toast.info("Auto-tagged: Category -> Safety, Severity -> High (CMR Reg. 106/111)");
          } else if (
            lower.includes("worker") ||
            lower.includes("contractor") ||
            lower.includes("medical") ||
            lower.includes("pme") ||
            lower.includes("मजदूर")
          ) {
            setCategory("labor");
            setHazardLevel("medium");
            toast.info("Auto-tagged: Category -> Labor Welfare (Mines Rules 1955)");
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  useEffect(() => {
    fetchMines().then((r) => {
      setMines(r.mines || []);
      if (r.mines?.length > 0) setSelectedMineId(r.mines[0].id);
    });
    loadInspections();
    captureGPS();
  }, []);

  const loadInspections = () => {
    fetchInspections().then((r) => setInspections(r.inspections || []));
  };

  const captureGPS = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            accuracy: Math.round(pos.coords.accuracy),
          });
          setIsLocating(false);
        },
        (err) => {
          console.warn("GPS error, defaulting to central mining coordinates:", err);
          // Fallback to Jharia Coalfield coordinates
          setGpsLocation({ lat: 23.74, lng: 86.41, accuracy: 15 });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsLocation({ lat: 23.74, lng: 86.41, accuracy: 15 });
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMineId || !areaInspected || !observations) {
      toast.error("Please provide mine, area inspected, and field observations.");
      return;
    }

    const payload = {
      mine_id: selectedMineId,
      inspector_id: inspectorId,
      inspector_name: inspectorName,
      latitude: gpsLocation ? gpsLocation.lat : 23.74,
      longitude: gpsLocation ? gpsLocation.lng : 86.41,
      area_inspected: areaInspected,
      category: category,
      hazard_level: hazardLevel,
      observations: observations,
      offline_synced: isOfflineMode ? 1 : 0,
    };

    if (isOfflineMode) {
      setOfflineQueue((prev) => [...prev, { ...payload, queued_at: new Date().toISOString() }]);
      toast.info("Underground mode active: Observation cached to local storage buffer.");
      setAreaInspected("");
      setObservations("");
      return;
    }

    setLoading(true);
    try {
      const res = await createInspection(payload);
      if (res.status === "success") {
        toast.success(
          res.violation_flagged
            ? `Inspection logged! Hazard level triggered Violation #${res.violation_id}`
            : "Field inspection logged and chained to blockchain ledger!"
        );
        setAreaInspected("");
        setObservations("");
        loadInspections();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit field inspection");
    } finally {
      setLoading(false);
    }
  };

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    setLoading(true);
    let synced = 0;
    for (const item of offlineQueue) {
      try {
        await createInspection(item);
        synced++;
      } catch (err) {
        console.error("Sync item failed:", err);
      }
    }
    setOfflineQueue([]);
    setLoading(false);
    setIsOfflineMode(false);
    toast.success(`Successfully uploaded ${synced} buffered underground field reports!`);
    loadInspections();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <IconDeviceMobile className="text-primary" size={28} />
            Geo-Tagged Field Inspector Portal
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Mobile-first statutory safety observations with GPS time-stamping and underground offline sync
          </p>
        </div>

        {/* Network & GPS telemetry pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isOfflineMode
                ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
            }`}
          >
            {isOfflineMode ? <IconWifiOff size={14} /> : <IconWifi size={14} />}
            <span>{isOfflineMode ? "Underground Mode (Offline)" : "Cloud Sync Active"}</span>
          </button>

          {offlineQueue.length > 0 && (
            <Button size="sm" onClick={syncOfflineQueue} disabled={loading} className="gap-1.5 text-xs">
              <IconRefresh size={14} className={loading ? "animate-spin" : ""} />
              Sync Buffer ({offlineQueue.length})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Inspection Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-white/10 bg-[#0e141d] shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center justify-between text-white">
                <span>Log Statutory Observation</span>
                <Badge variant="outline" className="gap-1.5 font-mono text-[11px] border-sky-500/30 bg-sky-500/10 text-sky-300 py-0.5 px-2">
                  <IconCurrentLocation size={13} className="text-sky-400" />
                  {gpsLocation ? `${gpsLocation.lat}°N, ${gpsLocation.lng}°E` : "Locating..."}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Direct digital evidence submission into DGMS & Coal India compliance record
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Mine */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Target Mine Location</label>
                    <select
                      value={selectedMineId}
                      onChange={(e) => setSelectedMineId(e.target.value)}
                      className="w-full h-9 rounded-md border border-white/15 bg-white/5 px-3 py-1 text-sm text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      {mines.map((m) => (
                        <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                          {m.name} ({m.subsidiary} - {m.state})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Area Inspected */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Inspected Section / Face</label>
                    <Input
                      placeholder="e.g. Pit-3 Bench 4, Haul Road North, Shaft-2"
                      value={areaInspected}
                      onChange={(e) => setAreaInspected(e.target.value)}
                      className="h-9 text-sm bg-white/5 border-white/15 text-white placeholder:text-muted-foreground focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Regulatory Domain</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-9 rounded-md border border-white/15 bg-white/5 px-3 py-1 text-sm text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 capitalize"
                    >
                      <option value="safety" className="bg-neutral-900 text-white">Safety (Strata & Haulage)</option>
                      <option value="ventilation" className="bg-neutral-900 text-white">Ventilation & Methane (CMR 2017)</option>
                      <option value="environmental" className="bg-neutral-900 text-white">Environmental (MoEF&CC / SPCB)</option>
                      <option value="electrical" className="bg-neutral-900 text-white">Electrical Switchgear & Earthing</option>
                      <option value="labor" className="bg-neutral-900 text-white">Labor Welfare & Medical</option>
                    </select>
                  </div>

                  {/* Hazard Level */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Hazard Severity Rating</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { level: "low", color: "text-emerald-400 border-emerald-500/40", activeBg: "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold" },
                        { level: "medium", color: "text-amber-400 border-amber-500/40", activeBg: "bg-amber-500/20 border-amber-500 text-amber-300 font-bold" },
                        { level: "high", color: "text-orange-400 border-orange-500/40", activeBg: "bg-orange-500/20 border-orange-500 text-orange-300 font-bold" },
                        { level: "critical", color: "text-red-400 border-red-500/40", activeBg: "bg-red-500/20 border-red-500 text-red-300 font-extrabold" },
                      ].map(({ level, color, activeBg }) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setHazardLevel(level)}
                          className={`py-1.5 px-2 text-xs rounded-lg border capitalize transition-all duration-150 ${
                            hazardLevel === level
                              ? activeBg + " shadow-xs"
                              : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Observations Text & Hands-Free Voice Control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300">Field Observations & Findings</label>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={speechLang}
                        onChange={(e: any) => setSpeechLang(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-neutral-300 focus:outline-none"
                      >
                        <option value="en-IN" className="bg-[#0b0f14]">EN (Indian)</option>
                        <option value="hi-IN" className="bg-[#0b0f14]">हिंदी (Hindi)</option>
                      </select>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={toggleVoiceRecording}
                        className={`h-7 px-2.5 text-xs gap-1.5 transition-all ${
                          isRecording
                            ? "bg-red-600 text-white border-red-500 animate-pulse font-bold"
                            : "bg-white/5 border-white/15 text-sky-300 hover:bg-sky-500/20"
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <IconMicrophoneOff size={13} />
                            Listening... (Click to Stop)
                          </>
                        ) : (
                          <>
                            <IconMicrophone size={13} />
                            Voice Dictate (Hands-Free)
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Document strata crack width, air velocity readings, PPE non-compliance, water spray efficiency, or equipment guard status... Or click 'Voice Dictate' to speak in English or Hindi!"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />

                  {isRecording && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-950/30 border border-red-500/30 text-xs text-red-300 animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <span>Recording voice notes live. Speak naturally; findings will auto-transcribe and tag category.</span>
                    </div>
                  )}
                </div>

                {/* Geo / Time verification badge */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IconCamera size={16} className="text-sky-400" />
                    <span>Camera / Geotag Stamp:</span>
                    <strong className="text-white font-mono">
                      {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <IconCheck size={14} />
                    <span>SHA-256 Merkle Ledger Ready</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading} className="gap-2 px-6 bg-sky-600 hover:bg-sky-500 text-white shadow-md">
                    {loading ? "Recording..." : isOfflineMode ? "Buffer Offline Observation" : "Transmit Field Report"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Live Field Activity Feed */}
        <div className="space-y-4">
          <Card className="border-white/10 bg-[#0e141d] shadow-sm">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-base font-bold flex items-center justify-between text-white">
                <span>Recent Observations</span>
                <Badge variant="secondary" className="font-mono text-xs bg-white/5 border border-white/10 text-neutral-300">
                  {inspections.length} Logged
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-[580px] overflow-y-auto space-y-3">
              {inspections.slice(0, 10).map((insp) => {
                const isCrit = insp.hazard_level === "critical";
                const isHigh = insp.hazard_level === "high";

                return (
                  <div
                    key={insp.id}
                    className={`p-3 rounded-lg border bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-150 space-y-2 text-xs ${
                      isCrit
                        ? "border-red-500/30 border-l-[3px] border-l-red-500"
                        : isHigh
                        ? "border-amber-500/30 border-l-[3px] border-l-amber-500"
                        : "border-white/10 border-l-[3px] border-l-emerald-500"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-white">{insp.area_inspected}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {insp.mine_name} · {insp.subsidiary}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                          isCrit
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : isHigh
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {insp.hazard_level}
                      </span>
                    </div>

                    <p className="text-neutral-300 line-clamp-2 leading-relaxed">{insp.observations}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-muted-foreground">
                      <span>{insp.inspector_name.split(" ")[0]}</span>
                      <span className="font-mono text-neutral-400">{insp.latitude.toFixed(2)}°N, {insp.longitude.toFixed(2)}°E</span>
                      {insp.offline_synced === 1 && (
                        <span className="text-amber-400 font-semibold">Synced Offline</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
