"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconMap2,
  IconAlertTriangle,
  IconShieldCheck,
  IconBuildingFactory2,
  IconFilter,
  IconLayersLinked,
  IconEye,
} from "@tabler/icons-react";
import { fetchMines, fetchInspections, InspectionRecord } from "@/lib/api";
import Link from "next/link";

// Dynamic import with SSR disabled to prevent Leaflet window errors
const GisMapComponent = dynamic(() => import("@/components/gis-map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] sm:h-[520px] rounded-xl flex items-center justify-center bg-muted/20 border border-border animate-pulse">
      <div className="text-center text-muted-foreground">
        <IconMap2 className="mx-auto mb-2 opacity-50 animate-bounce" size={36} />
        <span>Initializing Indian Mining Spatial GIS Engine...</span>
      </div>
    </div>
  ),
});

const SUBSIDIARIES = ["ALL", "BCCL", "CCL", "SECL", "MCL", "WCL", "NCL", "ECL", "SCCL"];

export default function GisMapPage() {
  const [mines, setMines] = useState<any[]>([]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [showHazards, setShowHazards] = useState(true);
  const [selectedMine, setSelectedMine] = useState<any | null>(null);
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite">("standard");

  useEffect(() => {
    fetchMines().then((r) => setMines(r.mines || [])).catch(console.error);
    fetchInspections().then((r) => setInspections(r.inspections || [])).catch(console.error);
  }, []);

  const highRiskCount = mines.filter((m) => m.overall_risk_score >= 60).length;
  const criticalHazardsCount = inspections.filter((i) => i.hazard_level === "critical").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <IconMap2 className="text-primary" size={28} />
            GIS Spatial Risk & Incident Map
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time geospatial telemetry, hazard zones, and geo-tagged inspection pins across Indian coal basins
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Map Layer Style Switcher */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMapStyle((s) => (s === "standard" ? "satellite" : "standard"))}
            className="text-xs gap-1.5 border-white/15 bg-white/5"
          >
            {mapStyle === "standard" ? "🛰️ Switch to Satellite" : "🗺️ Switch to Standard"}
          </Button>

          <Button
            variant={showHazards ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHazards(!showHazards)}
            className="gap-1.5 text-xs"
          >
            <IconAlertTriangle size={15} />
            {showHazards ? "Hide Hazard Pins" : "Show Hazard Pins"}
          </Button>
          <Link href="/inspector">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <IconLayersLinked size={15} />
              Open Field Inspector
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Stat Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <IconBuildingFactory2 size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">{mines.length}</div>
              <div className="text-xs text-muted-foreground">Monitored Mine Sites</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500">
              <IconAlertTriangle size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">{highRiskCount}</div>
              <div className="text-xs text-muted-foreground">High-Risk Buffer Zones</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
              <IconLayersLinked size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">{criticalHazardsCount}</div>
              <div className="text-xs text-muted-foreground">Active Critical Hazards</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <IconShieldCheck size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">{mines.length - highRiskCount}</div>
              <div className="text-xs text-muted-foreground">Statutorily Safe Sites</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <IconFilter size={14} /> Subsidiary:
          </span>
          {SUBSIDIARIES.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubsidiary(sub)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                selectedSubsidiary === sub
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/80 hover:bg-muted text-muted-foreground border border-border/40"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Risk Filter:</span>
          {["ALL", "COMPLIANT", "HIGH", "CRITICAL"].map((f) => (
            <button
              key={f}
              onClick={() => setRiskFilter(f)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                riskFilter === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/80 hover:bg-muted text-muted-foreground border border-border/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map + Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 h-[580px]">
          <GisMapComponent
            mines={mines}
            inspections={inspections}
            selectedSubsidiary={selectedSubsidiary}
            riskFilter={riskFilter}
            showHazards={showHazards}
            onSelectMine={(mine) => setSelectedMine(mine)}
            mapStyle={mapStyle}
          />
        </div>

        {/* Selected Mine Drill-Down Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="h-full border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Site Telemetry</span>
                {selectedMine && (
                  <Badge variant={selectedMine.overall_risk_score >= 60 ? "destructive" : "secondary"}>
                    {selectedMine.subsidiary}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {selectedMine ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-bold text-base leading-tight">{selectedMine.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedMine.district}, {selectedMine.state}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border border-border/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">Mine Type:</span>
                      <span className="font-semibold capitalize">{selectedMine.mine_type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">Headcount:</span>
                      <span className="font-semibold">{selectedMine.worker_count.toLocaleString()} workers</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">Coordinates:</span>
                      <span className="font-mono text-xs">
                        {selectedMine.latitude.toFixed(2)}°N, {selectedMine.longitude.toFixed(2)}°E
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border/40">
                      <span className="text-xs font-semibold">Overall Risk Score:</span>
                      <span
                        className={`font-bold text-base ${
                          selectedMine.overall_risk_score >= 60 ? "text-destructive" : "text-emerald-500"
                        }`}
                      >
                        {selectedMine.overall_risk_score.toFixed(1)}/100
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Recent Field Inspections
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {inspections
                        .filter((i) => i.mine_name === selectedMine.name)
                        .slice(0, 3)
                        .map((insp) => (
                          <div
                            key={insp.id}
                            className="p-2.5 rounded-lg border border-border/50 bg-background/60 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{insp.area_inspected}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  insp.hazard_level === "critical"
                                    ? "bg-rose-500/10 text-rose-500"
                                    : insp.hazard_level === "high"
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-emerald-500/10 text-emerald-500"
                                }`}
                              >
                                {insp.hazard_level.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2">{insp.observations}</p>
                          </div>
                        ))}
                      {inspections.filter((i) => i.mine_name === selectedMine.name).length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No recent inspections logged.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link href={`/compliance`}>
                      <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                        <IconEye size={14} />
                        View Full Compliance Audit
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground text-xs">
                  <IconMap2 className="mx-auto mb-2 opacity-40" size={32} />
                  Click any mine marker or hazard pin on the map to inspect telemetry details.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
