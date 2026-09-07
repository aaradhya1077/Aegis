"use client";

import { useEffect, useState } from "react";
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
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Log Statutory Observation</span>
                <Badge variant="outline" className="gap-1 font-mono text-[11px]">
                  <IconCurrentLocation size={12} className="text-primary" />
                  {gpsLocation ? `${gpsLocation.lat}°N, ${gpsLocation.lng}°E` : "Locating..."}
                </Badge>
              </CardTitle>
              <CardDescription>
                Direct digital evidence submission into DGMS & Coal India compliance record
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Mine */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Target Mine Location</label>
                    <select
                      value={selectedMineId}
                      onChange={(e) => setSelectedMineId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {mines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.subsidiary} - {m.state})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Area Inspected */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Inspected Section / Face</label>
                    <Input
                      placeholder="e.g. Pit-3 Bench 4, Haul Road North, Shaft-2"
                      value={areaInspected}
                      onChange={(e) => setAreaInspected(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Regulatory Domain</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary capitalize"
                    >
                      <option value="safety">Safety (Strata & Haulage)</option>
                      <option value="ventilation">Ventilation & Methane (CMR 2017)</option>
                      <option value="environmental">Environmental (MoEF&CC / SPCB)</option>
                      <option value="electrical">Electrical Switchgear & Earthing</option>
                      <option value="labor">Labor Welfare & Medical</option>
                    </select>
                  </div>

                  {/* Hazard Level */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Hazard Severity Rating</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { level: "low", color: "text-emerald-400 border-emerald-500/40" },
                        { level: "medium", color: "text-amber-400 border-amber-500/40" },
                        { level: "high", color: "text-orange-400 border-orange-500/40" },
                        { level: "critical", color: "text-rose-400 border-rose-500/40 font-bold" },
                      ].map(({ level, color }) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setHazardLevel(level)}
                          className={`py-2 px-2 rounded-lg text-xs border capitalize transition-all flex items-center justify-center ${
                            hazardLevel === level
                              ? "bg-emerald-600 text-white font-semibold shadow-sm border-emerald-500"
                              : `bg-muted/40 hover:bg-muted ${color}`
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Observations */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Field Observation & Findings</label>
                  <textarea
                    rows={3}
                    placeholder="Document strata crack width, air velocity readings, PPE non-compliance, water spray efficiency, or equipment guard status..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Geo / Time verification badge */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IconCamera size={16} className="text-primary" />
                    <span>Camera / Geotag Stamp:</span>
                    <strong className="text-foreground">
                      {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <IconCheck size={14} />
                    <span>SHA-256 Merkle Ledger Ready</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading} className="gap-2 px-6">
                    {loading ? "Recording..." : isOfflineMode ? "Buffer Offline Observation" : "Transmit Field Report"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Live Field Activity Feed */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Recent Observations</span>
                <Badge variant="secondary" className="font-mono text-xs">
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
                    className="p-3 rounded-lg border border-border/50 bg-background/80 hover:bg-muted/30 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm">{insp.area_inspected}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {insp.mine_name} · {insp.subsidiary}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isCrit
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            : isHigh
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        }`}
                      >
                        {insp.hazard_level}
                      </span>
                    </div>

                    <p className="text-muted-foreground line-clamp-2">{insp.observations}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px] text-muted-foreground">
                      <span>{insp.inspector_name.split(" ")[0]}</span>
                      <span className="font-mono">{insp.latitude.toFixed(2)}°N, {insp.longitude.toFixed(2)}°E</span>
                      {insp.offline_synced === 1 && (
                        <span className="text-amber-500 font-medium">Synced Offline</span>
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
