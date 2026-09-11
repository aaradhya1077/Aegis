"use client";

import React, { useState, useEffect } from "react";
import {
  IconActivity,
  IconGauge,
  IconFlame,
  IconWind,
  IconDroplet,
  IconLayersSubtract,
  IconAlertTriangle,
  IconCheck,
  IconRefresh,
  IconEye,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SensorTelemetry {
  id: string;
  name: string;
  type: "ch4" | "co" | "air_velocity" | "strata_sag" | "water_level";
  value: number;
  unit: string;
  threshold: number;
  statute: string;
  status: "normal" | "warning" | "critical";
  location: string;
  x: number; // SVG percentage
  y: number; // SVG percentage
}

interface MineDigitalTwinProps {
  mineId: string;
  mineName: string;
  mineType?: string;
  subsidiary?: string;
  riskScore?: number;
}

export function MineDigitalTwin({
  mineId,
  mineName,
  mineType = "underground",
  subsidiary = "BCCL",
  riskScore = 45,
}: MineDigitalTwinProps) {
  const [viewMode, setViewMode] = useState<"underground" | "opencast">(
    mineType.toLowerCase().includes("opencast") ? "opencast" : "underground"
  );
  const [selectedSensor, setSelectedSensor] = useState<SensorTelemetry | null>(null);
  const [simulatedAlertActive, setSimulatedAlertActive] = useState(false);

  // Live sensor readings state
  const [sensors, setSensors] = useState<SensorTelemetry[]>([
    {
      id: "SENS-CH4-01",
      name: "Return Airway Optical CH4 Telemetry",
      type: "ch4",
      value: 0.45,
      unit: "%",
      threshold: 0.75,
      statute: "CMR 2017 Reg. 153(2)",
      status: "normal",
      location: "Seam IV • Return Airway 4B",
      x: 68,
      y: 62,
    },
    {
      id: "SENS-VEL-02",
      name: "Main Incline Air Velocity Monitor",
      type: "air_velocity",
      value: 2.3,
      unit: "m/s",
      threshold: 1.5,
      statute: "CMR 2017 Reg. 154 (Min 1.5 m/s)",
      status: "normal",
      location: "Shaft Collar Incline Entry",
      x: 35,
      y: 42,
    },
    {
      id: "SENS-SAG-03",
      name: "Dual-Height Strata Extensometer",
      type: "strata_sag",
      value: 4.2,
      unit: "mm",
      threshold: 10.0,
      statute: "DGMS Tech Circular 09/2023",
      status: "normal",
      location: "Depillaring District 2 Junction",
      x: 48,
      y: 78,
    },
    {
      id: "SENS-CO-04",
      name: "Carbon Monoxide Spontaneous Fire Sensor",
      type: "co",
      value: 4.8,
      unit: "ppm",
      threshold: 25.0,
      statute: "CMR 2017 Reg. 138 (Spontaneous Combustion)",
      status: "normal",
      location: "Goaf Seal #12 Monitoring Pipe",
      x: 82,
      y: 80,
    },
    {
      id: "SENS-SUMP-05",
      name: "Underground Sump Dewatering Level",
      type: "water_level",
      value: 1.8,
      unit: "m",
      threshold: 4.0,
      statute: "CMR 2017 Reg. 152 (Inundation Danger)",
      status: "normal",
      location: "Central Dip Sump #1",
      x: 20,
      y: 86,
    },
  ]);

  // Listen for simulated hazards to trigger live sensor alarm
  useEffect(() => {
    const handleEmergency = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        setSimulatedAlertActive(true);
        // Spike CH4 and strata sag
        setSensors((prev) =>
          prev.map((s) => {
            if (s.type === "ch4") return { ...s, value: 0.88, status: "critical" };
            if (s.type === "strata_sag") return { ...s, value: 14.5, status: "critical" };
            return s;
          })
        );
      }
    };

    const handleClear = () => {
      setSimulatedAlertActive(false);
      setSensors((prev) =>
        prev.map((s) => {
          if (s.type === "ch4") return { ...s, value: 0.42, status: "normal" };
          if (s.type === "strata_sag") return { ...s, value: 3.8, status: "normal" };
          return s;
        })
      );
    };

    window.addEventListener("aegis-emergency-alert", handleEmergency);
    window.addEventListener("aegis-emergency-clear", handleClear);
    return () => {
      window.removeEventListener("aegis-emergency-alert", handleEmergency);
      window.removeEventListener("aegis-emergency-clear", handleClear);
    };
  }, []);

  // Subtle real-time telemetry jitter
  useEffect(() => {
    const interval = setInterval(() => {
      if (!simulatedAlertActive) {
        setSensors((prev) =>
          prev.map((s) => {
            if (s.type === "ch4") {
              const delta = (Math.random() - 0.5) * 0.04;
              return { ...s, value: Math.max(0.1, Number((s.value + delta).toFixed(2))) };
            }
            if (s.type === "air_velocity") {
              const delta = (Math.random() - 0.5) * 0.1;
              return { ...s, value: Math.max(1.0, Number((s.value + delta).toFixed(1))) };
            }
            return s;
          })
        );
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [simulatedAlertActive]);

  const ch4Sensor = sensors.find((s) => s.type === "ch4");
  const isCh4Breached = (ch4Sensor?.value || 0) >= (ch4Sensor?.threshold || 0.75);

  return (
    <Card className="border-white/10 bg-[#0c1017] shadow-xl overflow-hidden">
      <CardHeader className="p-4 border-b border-white/10 bg-white/[0.02] flex flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <IconLayersSubtract size={18} />
            </span>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              2.5D Mine Strata & Telemetry Digital Twin
              <Badge variant="outline" className="text-[10px] text-sky-400 border-sky-500/30">
                Live IoT Telemetry
              </Badge>
              {isCh4Breached && (
                <Badge className="bg-red-600 text-white text-[10px] animate-pulse">
                  ALARM: REG. 153 BREACH
                </Badge>
              )}
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time subsurface strata monitoring, ventilation circuits, and DGMS statutory threshold watchdog
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setViewMode("underground")}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                viewMode === "underground"
                  ? "bg-sky-500/20 text-sky-300 font-semibold"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Underground Cutaway
            </button>
            <button
              onClick={() => setViewMode("opencast")}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                viewMode === "opencast"
                  ? "bg-amber-500/20 text-amber-300 font-semibold"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Opencast Bench (Reg. 106)
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* SVG 2.5D Cutaway Graphic */}
        <div className="relative w-full h-[320px] sm:h-[380px] bg-gradient-to-b from-[#0f172a] via-[#090d14] to-[#04070b] rounded-xl border border-white/10 overflow-hidden select-none">
          <svg className="w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="strata1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="coalSeam" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#020617" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Background Grid */}
            <rect width="800" height="450" fill="url(#grid)" />

            {viewMode === "underground" ? (
              <>
                {/* Surface Ground Line */}
                <rect x="0" y="0" width="800" height="90" fill="url(#skyGrad)" opacity="0.6" />
                <line x1="0" y1="90" x2="800" y2="90" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" />
                <text x="20" y="80" fill="#94a3b8" fontSize="11" fontWeight="bold">
                  SURFACE LEVEL (RL +210m)
                </text>

                {/* Surface Structures: Winding Tower & Substation */}
                <path d="M 120 90 L 140 25 L 160 25 L 180 90 Z" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="150" cy="25" r="10" fill="#0284c7" />
                <text x="125" y="20" fill="#7dd3fc" fontSize="10">
                  Headgear
                </text>
                <rect x="220" y="65" width="45" height="25" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                <text x="225" y="80" fill="#cbd5e1" fontSize="9">
                  Sub-station
                </text>

                {/* Vertical Shaft 1 */}
                <rect x="140" y="90" width="20" height="300" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                <line x1="150" y1="90" x2="150" y2="390" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" />
                <rect x="142" y="180" width="16" height="22" fill="#0284c7" rx="2" />

                {/* Incline Portal & Haulage Tunnel */}
                <path
                  d="M 280 90 L 390 190 L 440 220"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <text x="290" y="110" fill="#38bdf8" fontSize="9">
                  Incline No. 1
                </text>

                {/* Strata Overburden Layers */}
                <rect x="0" y="90" width="800" height="80" fill="#1e293b" opacity="0.35" />
                <text x="700" y="130" fill="#64748b" fontSize="10">
                  Sandstone (80m)
                </text>

                {/* Coal Seam IV (Middle Level) */}
                <rect x="0" y="190" width="800" height="50" fill="url(#coalSeam)" stroke="#334155" strokeWidth="1" />
                <text x="20" y="220" fill="#38bdf8" fontSize="11" fontWeight="bold">
                  COAL SEAM IV (Thickness: 4.8m)
                </text>

                {/* Bord & Pillar Galleries in Seam IV */}
                <g stroke="#0f172a" strokeWidth="3" fill="#020617">
                  <rect x="250" y="195" width="45" height="40" rx="3" />
                  <rect x="330" y="195" width="45" height="40" rx="3" />
                  <rect x="410" y="195" width="45" height="40" rx="3" />
                  <rect x="490" y="195" width="55" height="40" rx="3" />
                  <rect x="580" y="195" width="50" height="40" rx="3" />
                </g>

                {/* Ventilation Intake Air (Cyan Flow Arrows) */}
                <path
                  d="M 150 90 L 150 215 L 480 215"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
                <polygon points="480,212 490,215 480,218" fill="#06b6d4" />
                <text x="280" y="210" fill="#22d3ee" fontSize="10">
                  Intake Air (Fresh Airflow)
                </text>

                {/* Intermediate Shale Layer */}
                <rect x="0" y="240" width="800" height="70" fill="#0f172a" opacity="0.4" />
                <text x="700" y="280" fill="#64748b" fontSize="10">
                  Carbonaceous Shale
                </text>

                {/* Deep Coal Seam V & Longwall Face */}
                <rect x="0" y="320" width="800" height="60" fill="url(#coalSeam)" stroke="#334155" strokeWidth="1" />
                <text x="20" y="355" fill="#f59e0b" fontSize="11" fontWeight="bold">
                  DEEP SEAM V (Longwall District • Depth 290m)
                </text>

                {/* Longwall Galleries */}
                <rect x="200" y="325" width="180" height="50" fill="#020617" rx="3" />
                <rect x="440" y="325" width="220" height="50" fill="#020617" rx="3" />

                {/* Return Airflow & Gas Telemetry Circuit (Orange Flow) */}
                <path
                  d="M 640 335 L 640 215 L 530 215 L 530 190 L 530 90"
                  fill="none"
                  stroke={isCh4Breached ? "#ef4444" : "#f97316"}
                  strokeWidth="2.5"
                  strokeDasharray="6 3"
                />
                <text x="540" y="150" fill={isCh4Breached ? "#f87171" : "#fb923c"} fontSize="10" fontWeight="bold">
                  Return Airway (CH4: {ch4Sensor?.value}%)
                </text>

                {/* Underground Sump Basin */}
                <rect x="130" y="375" width="90" height="25" fill="#0369a1" opacity="0.6" rx="2" />
                <text x="145" y="392" fill="#bae6fd" fontSize="9">
                  Central Sump
                </text>
              </>
            ) : (
              <>
                {/* Opencast Bench Slope Geometry View (CMR Reg 106) */}
                <rect x="0" y="0" width="800" height="70" fill="url(#skyGrad)" opacity="0.5" />
                <text x="20" y="50" fill="#94a3b8" fontSize="11" fontWeight="bold">
                  OPENCAST HIGHWALL & DUMP STABILITY GEOMETRY (CMR 2017 REG. 106)
                </text>

                {/* Benches */}
                <path
                  d="M 30 70 L 120 70 L 160 140 L 260 140 L 300 210 L 400 210 L 450 290 L 580 290 L 630 380 L 780 380"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                />
                <path
                  d="M 30 70 L 120 70 L 160 140 L 260 140 L 300 210 L 400 210 L 450 290 L 580 290 L 630 380 L 780 380 L 780 450 L 30 450 Z"
                  fill="#1c1917"
                  opacity="0.75"
                />

                {/* Berm & Slope Annotations */}
                <text x="175" y="130" fill="#fcd34d" fontSize="10">
                  Bench 1 (Height: 8m, Berm: 12m)
                </text>
                <text x="315" y="200" fill="#fcd34d" fontSize="10">
                  Bench 2 (Height: 8m, Berm: 12m)
                </text>
                <text x="465" y="280" fill="#fcd34d" fontSize="10">
                  Bench 3 • Active Shovel Face
                </text>

                {/* Slope Angle Indicator */}
                <path d="M 120 70 L 160 140" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
                <text x="145" y="95" fill="#f87171" fontSize="11" fontWeight="bold">
                  Slope: 44.2° (Limit &le; 45°)
                </text>

                {/* Haul Road Gradient */}
                <path d="M 100 400 L 750 120" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 4" opacity="0.8" />
                <text x="380" y="250" fill="#7dd3fc" fontSize="10" fontWeight="bold">
                  Haul Road Ramp (1 in 16 Gradient • Reg 106 Compliant)
                </text>
              </>
            )}

            {/* Interactive Sensor Nodes */}
            {sensors.map((sensor) => {
              const isCrit = sensor.status === "critical";
              const isSelected = selectedSensor?.id === sensor.id;
              const color = isCrit ? "#ef4444" : sensor.status === "warning" ? "#f59e0b" : "#10b981";

              return (
                <g
                  key={sensor.id}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => setSelectedSensor(sensor)}
                >
                  {/* Pulsing ring for critical/selected */}
                  {(isCrit || isSelected) && (
                    <circle
                      cx={`${sensor.x}%`}
                      cy={`${sensor.y}%`}
                      r="16"
                      fill={color}
                      opacity="0.25"
                      className="animate-ping"
                    />
                  )}

                  {/* Sensor Pin Base */}
                  <circle
                    cx={`${sensor.x}%`}
                    cy={`${sensor.y}%`}
                    r="9"
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* Label */}
                  <rect
                    x={`calc(${sensor.x}% - 40px)`}
                    y={`calc(${sensor.y}% - 26px)`}
                    width="80"
                    height="18"
                    rx="3"
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth="1"
                    opacity="0.9"
                  />
                  <text
                    x={`${sensor.x}%`}
                    y={`calc(${sensor.y}% - 14px)`}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {sensor.value} {sensor.unit}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Quick HUD Overlay */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/10 text-[11px] font-mono text-neutral-300 space-y-1">
            <div className="text-white font-bold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Mine Telemetry Bus Active
            </div>
            <div>Subsurface Seams: IV, V (Coking)</div>
            <div>Ventilation Fan: 18,500 m³/min</div>
          </div>
        </div>

        {/* Selected Sensor Telemetry Card */}
        {selectedSensor ? (
          <div className="p-3.5 rounded-xl border border-white/15 bg-white/[0.03] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    selectedSensor.status === "critical"
                      ? "bg-red-600 text-white"
                      : selectedSensor.status === "warning"
                      ? "bg-amber-500 text-black"
                      : "bg-emerald-600 text-white"
                  }
                >
                  {selectedSensor.status.toUpperCase()}
                </Badge>
                <span className="font-semibold text-white text-sm">{selectedSensor.name}</span>
                <span className="text-xs text-muted-foreground font-mono">({selectedSensor.id})</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Location: <strong>{selectedSensor.location}</strong> • Mandate:{" "}
                <span className="text-sky-400">{selectedSensor.statute}</span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-white">
                  {selectedSensor.value} {selectedSensor.unit}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Statutory Ceiling: &le; {selectedSensor.threshold} {selectedSensor.unit}
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedSensor(null)}
                className="text-xs h-7"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-1">
            💡 Click on any blinking sensor pin on the cutaway to inspect real-time statutory telemetry & DGMS thresholds.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
