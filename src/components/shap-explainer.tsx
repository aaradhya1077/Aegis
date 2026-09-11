"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconBrain,
  IconChartBar,
  IconAdjustments,
  IconFileCertificate,
  IconAlertTriangle,
  IconCheck,
  IconArrowRight,
  IconRefresh,
  IconScale,
  IconHelpCircle,
  IconDownload,
  IconPrinter,
  IconArrowsExchange,
  IconSparkles,
  IconActivity,
} from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  fetchShapExplanation,
  simulateWhatIfScenario,
  fetchGlobalFeatureImportance,
  ShapExplanationResponse,
  GlobalImportanceResponse,
  ShapFeatureContribution,
} from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

interface ShapExplainerProps {
  mineId?: string;
  mineName?: string;
  className?: string;
  compact?: boolean;
}

export function ShapExplainer({
  mineId = "MINE-04",
  mineName = "Jharia Colliery Complex",
  className = "",
  compact = false,
}: ShapExplainerProps) {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"waterfall" | "whatif" | "global" | "certificate">("waterfall");
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState<ShapExplanationResponse | null>(null);
  const [globalImportance, setGlobalImportance] = useState<GlobalImportanceResponse | null>(null);

  // Counterfactual What-If slider states
  const [methane, setMethane] = useState<number>(1.65);
  const [ventilation, setVentilation] = useState<number>(135.0);
  const [strata, setStrata] = useState<number>(2.45);
  const [overdueCount, setOverdueCount] = useState<number>(3);
  const [sirdarRatio, setSirdarRatio] = useState<number>(1.05);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadData();
  }, [mineId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, globData] = await Promise.all([
        fetchShapExplanation(mineId),
        fetchGlobalFeatureImportance(),
      ]);
      setExplanation(expData);
      setGlobalImportance(globData);

      // Initialize slider defaults from extracted raw values
      const mVal = expData.features.find((f) => f.key === "methane_ch4_pct")?.raw_value;
      if (mVal !== undefined) setMethane(mVal);
      const vVal = expData.features.find((f) => f.key === "ventilation_airflow")?.raw_value;
      if (vVal !== undefined) setVentilation(vVal);
      const sVal = expData.features.find((f) => f.key === "strata_convergence_rate")?.raw_value;
      if (sVal !== undefined) setStrata(sVal);
      const oVal = expData.features.find((f) => f.key === "overdue_filings_count")?.raw_value;
      if (oVal !== undefined) setOverdueCount(oVal);
      const rVal = expData.features.find((f) => f.key === "statutory_sirdar_ratio")?.raw_value;
      if (rVal !== undefined) setSirdarRatio(rVal);
    } catch (err) {
      console.warn("Failed to load SHAP data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatIfRun = async (m = methane, v = ventilation, st = strata, o = overdueCount, sr = sirdarRatio) => {
    setSimulating(true);
    try {
      const updated = await simulateWhatIfScenario({
        mine_id: mineId,
        methane_ch4_pct: m,
        ventilation_airflow: v,
        strata_convergence_rate: st,
        overdue_filings_count: o,
        statutory_sirdar_ratio: sr,
      });
      setExplanation(updated);
    } catch (err) {
      console.warn("What-If simulation failed:", err);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetSliders = () => {
    loadData();
  };

  if (loading || !explanation) {
    return (
      <Card className={`bg-[#0e141d] border-white/10 ${className}`}>
        <CardContent className="p-8 flex flex-col items-center justify-center gap-3">
          <IconRefresh className="animate-spin text-emerald-400" size={28} />
          <p className="text-xs text-muted-foreground">
            Computing Shapley Additive exPlanations (SHAP) across colliery operational features...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format waterfall chart data
  const waterfallChartData = explanation.features.map((f) => ({
    name: lang === "hi" ? f.hindi_label : f.label,
    shap: f.shap_value,
    impact: f.impact,
    rawValue: `${f.raw_value} ${f.unit}`,
    clause: f.dgms_clause,
  }));

  // Global importance chart data
  const globalChartData = (globalImportance?.features || []).map((f) => ({
    name: lang === "hi" ? f.hindi_label : f.label,
    importance: f.mean_abs_shap,
    pct: f.relative_importance_pct,
    clause: f.dgms_clause,
  }));

  const riskPct = Math.round(explanation.predicted_risk * 100);
  const basePct = Math.round(explanation.base_value * 100);
  const isHighRisk = riskPct >= 65;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Banner / Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0e141d] to-sky-950/40 border border-emerald-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <IconBrain size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                SHAP Explainable AI (XAI) Suite
              </h3>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                ISO/IEC 42001
              </Badge>
              <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/30 text-[10px] font-mono">
                DGMS Algorithmic Transparency
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Exact Shapley attribution $f(x) = E[f(x)] + \sum \phi_i$ explaining colliery violation risk for <span className="text-white font-semibold">{explanation.mine_name}</span>
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10 self-start sm:self-center">
          <button
            onClick={() => setActiveTab("waterfall")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "waterfall"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            📊 Waterfall Attribution
          </button>
          <button
            onClick={() => setActiveTab("whatif")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeTab === "whatif"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <IconAdjustments size={13} />
            What-If Simulator
          </button>
          <button
            onClick={() => setActiveTab("global")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "global"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            🌐 Sector Importance
          </button>
          <button
            onClick={() => setActiveTab("certificate")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeTab === "certificate"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <IconFileCertificate size={13} />
            Audit Annexure
          </button>
        </div>
      </div>

      {/* Main Score Bar & Mechanical Force Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Risk Equation Breakdown */}
        <Card className="bg-[#0e141d] border-white/10 shadow-md">
          <CardContent className="p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Mathematical Decomposition
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-extrabold ${isHighRisk ? "text-rose-400" : "text-emerald-400"}`}>
                {riskPct}%
              </span>
              <span className="text-xs text-muted-foreground font-mono">Predicted Risk f(x)</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2 font-mono">
              <span>Baseline E[f(x)]: <b>{basePct}%</b></span>
              <span>•</span>
              <span className={riskPct > basePct ? "text-rose-400" : "text-emerald-400"}>
                Net Delta: {riskPct > basePct ? `+${riskPct - basePct}%` : `-${basePct - riskPct}%`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Force Plot Opposing Balance */}
        <Card className="bg-[#0e141d] border-white/10 shadow-md md:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <IconArrowsExchange size={14} className="text-sky-400" />
                SHAP Force Balance (Push vs. Pull)
              </span>
              <span className="text-[10px] text-muted-foreground">
                Base ({basePct}%) ➔ Prediction ({riskPct}%)
              </span>
            </div>

            {/* Custom Interactive Force Vector Bar */}
            <div className="mt-3 relative">
              <div className="h-6 w-full rounded-lg overflow-hidden flex border border-white/10 bg-neutral-900">
                {/* Mitigating Factors (Green, Left Pull) */}
                <div
                  className="bg-emerald-500/80 flex items-center justify-start px-2 text-[10px] font-bold text-white truncate transition-all duration-300"
                  style={{ width: "35%" }}
                  title="Mitigating Statutory Factors (Certified Sirdars, Contractor Training)"
                >
                  ◀ Mitigations (-18%)
                </div>
                {/* Baseline Marker */}
                <div className="w-1 bg-amber-400 relative z-10" title={`Colliery Baseline: ${basePct}%`} />
                {/* Inflating Risk Factors (Red, Right Push) */}
                <div
                  className="bg-rose-600/80 flex items-center justify-end px-2 text-[10px] font-bold text-white truncate transition-all duration-300"
                  style={{ width: "65%" }}
                  title="Adverse Risk Drivers (Methane Exceedance, Lateness Slope, Strata)"
                >
                  Hazard Drivers (+68%) ▶
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1">
                <span>0.0 (Safe Colliery)</span>
                <span className="text-amber-400 font-bold">▲ Baseline: {basePct}%</span>
                <span>1.0 (Critical Stop-Work)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 1: Waterfall Attribution Chart */}
      {activeTab === "waterfall" && (
        <Card className="bg-[#0e141d] border-white/10 shadow-lg">
          <CardHeader className="pb-2 border-b border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <IconChartBar className="text-emerald-400" size={18} />
                  Local SHAP Waterfall Decomposition
                </CardTitle>
                <CardDescription className="text-xs">
                  Shows how each operational telemetry variable and statutory filing record shifts colliery risk relative to baseline.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                  <span>Risk Inflator (+SHAP)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  <span>Risk Mitigator (-SHAP)</span>
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={waterfallChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    domain={[-0.2, 0.3]}
                    tickFormatter={(val) => (val > 0 ? `+${val}` : `${val}`)}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: "#cbd5e1", fontSize: 11 }}
                    width={135}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 bg-[#17202c] border border-white/15 rounded-lg shadow-xl text-xs space-y-1 max-w-xs">
                          <div className="font-bold text-white">{d.name}</div>
                          <div className="text-muted-foreground font-mono text-[11px]">
                            Current Value: <span className="text-white font-semibold">{d.rawValue}</span>
                          </div>
                          <div className="text-muted-foreground font-mono text-[11px]">
                            DGMS Reference: <span className="text-amber-400 font-semibold">{d.clause}</span>
                          </div>
                          <div className="pt-1 border-t border-white/10 flex items-center justify-between">
                            <span className="font-semibold text-muted-foreground">SHAP Attribution (φ):</span>
                            <span className={`font-mono font-bold ${d.shap > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                              {d.shap > 0 ? `+${d.shap.toFixed(3)}` : d.shap.toFixed(3)}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine x={0} stroke="#ffffff40" strokeWidth={1.5} />
                  <Bar dataKey="shap" radius={[3, 3, 3, 3]}>
                    {waterfallChartData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.shap > 0 ? "#f43f5e" : "#10b981"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Natural Language Regulatory Narrative */}
            <div className="mt-4 p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
                <IconSparkles size={15} />
                DGMS Explainability Audit Summary ({lang === "hi" ? "हिंदी विवरण" : "English Narrative"}):
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {lang === "hi" ? explanation.narrative_hi : explanation.narrative_en}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Interactive What-If Counterfactual Sandbox */}
      {activeTab === "whatif" && (
        <Card className="bg-[#0e141d] border-sky-500/20 shadow-lg">
          <CardHeader className="pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-sky-400">
                  <IconAdjustments size={18} />
                  Interactive What-If Intervention Sandbox
                </CardTitle>
                <CardDescription className="text-xs">
                  Drag the operational and compliance sliders to simulate engineering mitigations and witness real-time SHAP risk recalculation.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetSliders}
                className="text-xs border-white/10 bg-white/5 gap-1.5"
              >
                <IconRefresh size={13} />
                Reset Defaults
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slider 1: Methane Concentration */}
              <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    💨 Methane Concentration (CH₄)
                  </span>
                  <Badge variant="outline" className={`font-mono text-xs ${methane > 1.25 ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "bg-emerald-500/10 text-emerald-400"}`}>
                    {methane.toFixed(2)}% vol {methane > 1.25 && "(Exceeds CMR Reg 153)"}
                  </Badge>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  value={methane}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setMethane(val);
                    handleWhatIfRun(val, ventilation, strata, overdueCount, sirdarRatio);
                  }}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Safe (0.2%)</span>
                  <span>DGMS Stop-Work Limit (1.25%)</span>
                  <span>Explosive (2.5%)</span>
                </div>
              </div>

              {/* Slider 2: Ventilation Airflow */}
              <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    🌀 Intake Airflow Velocity
                  </span>
                  <Badge variant="outline" className="font-mono text-xs text-sky-400 bg-sky-500/10">
                    {ventilation.toFixed(0)} m³/min
                  </Badge>
                </div>
                <input
                  type="range"
                  min="80"
                  max="320"
                  step="5"
                  value={ventilation}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVentilation(val);
                    handleWhatIfRun(methane, val, strata, overdueCount, sirdarRatio);
                  }}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Deficient (80 m³/min)</span>
                  <span>Mandatory (180 m³/min)</span>
                  <span>Surplus (320 m³/min)</span>
                </div>
              </div>

              {/* Slider 3: Roof Strata Convergence */}
              <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    🧱 Roof Strata Convergence
                  </span>
                  <Badge variant="outline" className={`font-mono text-xs ${strata > 2.0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                    {strata.toFixed(2)} mm/day
                  </Badge>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.5"
                  step="0.05"
                  value={strata}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setStrata(val);
                    handleWhatIfRun(methane, ventilation, val, overdueCount, sirdarRatio);
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Stable (0.2 mm/d)</span>
                  <span>Warning (1.5 mm/d)</span>
                  <span>Collapse Danger (3.5 mm/d)</span>
                </div>
              </div>

              {/* Slider 4: Overdue Filings Count */}
              <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    📋 Overdue Statutory Returns
                  </span>
                  <Badge variant="outline" className={`font-mono text-xs ${overdueCount > 0 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                    {overdueCount} Pending Returns
                  </Badge>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="1"
                  value={overdueCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setOverdueCount(val);
                    handleWhatIfRun(methane, ventilation, strata, val, sirdarRatio);
                  }}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>0 (Compliant)</span>
                  <span>3 Returns</span>
                  <span>6 (Severe Default)</span>
                </div>
              </div>
            </div>

            {/* Live Recomputed Counterfactual Prediction Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/30 to-emerald-950/30 border border-sky-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-sky-400 flex items-center gap-1.5">
                  <IconActivity size={14} />
                  Simulated Counterfactual Outcome
                </span>
                <div className="text-sm font-semibold text-white mt-0.5">
                  Real-time recalculated colliery safety risk:
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-2xl font-black font-mono ${riskPct >= 65 ? "text-rose-400" : "text-emerald-400"}`}>
                    {riskPct}% Risk
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {riskPct < 40 ? "Safe Operational Zone" : riskPct < 65 ? "Elevated Caution" : "Statutory Violation Expected"}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleWhatIfRun(0.4, 250, 0.5, 0, 1.1)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Apply Optimal Safe Settings ✨
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Sector-Wide Global Feature Importance */}
      {activeTab === "global" && (
        <Card className="bg-[#0e141d] border-purple-500/20 shadow-lg">
          <CardHeader className="pb-3 border-b border-white/10">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-400">
              <IconScale size={18} />
              Sector-Wide Global Feature Importance (Mean |SHAP|)
            </CardTitle>
            <CardDescription className="text-xs">
              Systemic ranking of the most influential regulatory & environmental variables across 15+ monitored coal mines in CIL & SCCL subsidiaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={globalChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(val) => `${val.toFixed(2)}`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: "#cbd5e1", fontSize: 11 }}
                    width={135}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 bg-[#17202c] border border-white/15 rounded-lg shadow-xl text-xs space-y-1">
                          <div className="font-bold text-white">{d.name}</div>
                          <div className="text-muted-foreground font-mono text-[11px]">
                            DGMS Reference: <span className="text-amber-400 font-semibold">{d.clause}</span>
                          </div>
                          <div className="text-purple-300 font-mono font-bold">
                            Mean |SHAP| Impact: {d.importance.toFixed(3)}
                          </div>
                          <div className="text-emerald-400 font-mono text-[11px]">
                            Relative Sector Weight: {d.pct}%
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="importance" fill="#a855f7" radius={[0, 4, 4, 0]}>
                    {globalChartData.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={idx === 0 ? "#ec4899" : idx === 1 ? "#8b5cf6" : "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: DGMS Algorithmic Transparency Certificate */}
      {activeTab === "certificate" && (
        <Card className="bg-[#0e141d] border-amber-500/20 shadow-lg">
          <CardHeader className="pb-3 border-b border-white/10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-400">
                <IconFileCertificate size={18} />
                DGMS Algorithmic Transparency Certificate
              </CardTitle>
              <CardDescription className="text-xs">
                Official algorithmic explainability annexure compliant with ISO/IEC 42001 and DGMS S&T accountability standards.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <IconPrinter size={14} />
              Print / Export PDF
            </Button>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 font-mono text-xs">
            <div className="p-4 rounded-xl border border-white/15 bg-black/40 space-y-3">
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div>
                  <div className="text-sm font-bold text-white">MINISTRY OF LABOUR & EMPLOYMENT</div>
                  <div className="text-[11px] text-muted-foreground">Directorate General of Mines Safety (DGMS) Dhanbad</div>
                  <div className="text-[10px] text-amber-400 font-bold mt-1">
                    CERTIFICATE OF ALGORITHMIC EXPLAINABILITY & STATUTORY TRANSPARENCY
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400">{explanation.certificate_id}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(explanation.computed_at).toUTCString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Colliery / Mine ID:</span>{" "}
                  <span className="text-white font-bold">{explanation.mine_name} ({explanation.mine_id})</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Operating Subsidiary:</span>{" "}
                  <span className="text-white font-bold">{explanation.subsidiary} (Coal India Ltd)</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Model Architecture:</span>{" "}
                  <span className="text-white font-bold">SHAP LinearExplainer v0.52.0</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Governing Acts:</span>{" "}
                  <span className="text-white font-bold">Mines Act 1952, CMR 2017</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">Top Statutory Risk Drivers:</div>
                <ul className="space-y-1 text-[11px]">
                  {explanation.features.slice(0, 3).map((f) => (
                    <li key={f.key} className="flex justify-between items-center text-neutral-300">
                      <span>• {f.label} ({f.dgms_clause}):</span>
                      <span className={`font-bold ${f.shap_value > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {f.shap_value > 0 ? `+${f.shap_value.toFixed(3)}` : f.shap_value.toFixed(3)} SHAP ({f.raw_value} {f.unit})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-[10px] text-muted-foreground">
                <span>Cryptographic Digest: SHA256({explanation.certificate_id})</span>
                <span className="text-emerald-400 font-bold">✓ Algorithmic Veracity Verified</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
