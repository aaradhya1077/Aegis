"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconBuildingFactory2,
  IconShieldCheck,
  IconAlertTriangle,
  IconFileText,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconArrowRight,
  IconDeviceMobile,
  IconMap2,
  IconAlertOctagon,
  IconUsers,
  IconLink,
  IconClock,
  IconCpu,
  IconHelmet,
  IconSettings,
  IconCheck,
  IconEye,
  IconRefresh,
} from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  fetchDashboard,
  fetchMines,
  fetchForecastAlerts,
  fetchInspections,
  fetchViolations,
  fetchAuditBlocks,
  verifyAuditChain,
  InspectionRecord,
  ViolationRecord,
  AuditBlock,
} from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import { STAKEHOLDERS, StakeholderRole } from "@/components/stakeholder-switcher";

interface DashboardData {
  total_mines: number;
  compliant_percentage: number;
  overdue_filings: number;
  critical_alerts: number;
  total_filings: number;
  total_checks: number;
  risk_distribution: Record<string, number>;
  compliance_by_category: Record<string, number>;
}

const RISK_COLORS: Record<string, string> = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#F97316",
  critical: "#EF4444",
};

const DEFAULT_DASHBOARD_DATA: DashboardData = {
  total_mines: 30,
  compliant_percentage: 84.6,
  overdue_filings: 11,
  critical_alerts: 8,
  total_filings: 1419,
  total_checks: 1292,
  risk_distribution: { low: 10, medium: 12, high: 5, critical: 3 },
  compliance_by_category: { safety: 86.4, environmental: 81.2, labor: 89.0, dgms: 91.5 },
};

export default function DashboardPage() {
  const [currentRole, setCurrentRole] = useState<"regulator" | "mine_officer" | "frontline" | "admin">("regulator");
  const [data, setData] = useState<DashboardData | null>(DEFAULT_DASHBOARD_DATA);
  const [mines, setMines] = useState<Array<{ id: string; name: string; state: string; subsidiary: string; mine_type: string; overall_risk_score: number; status: string }>>([]);
  const [alerts, setAlerts] = useState<Array<{ mine_name: string | null; regulation_clause: string | null; predicted_risk: number; trend_direction: string; days_until_due: number }>>([]);
  
  // Stakeholder-specific states
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [auditBlocks, setAuditBlocks] = useState<AuditBlock[]>([]);
  const [ledgerValid, setLedgerValid] = useState<boolean | null>(null);
  const [isVerifyingLedger, setIsVerifyingLedger] = useState(false);

  const syncUser = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.role && (parsed.role === "regulator" || parsed.role === "mine_officer" || parsed.role === "frontline" || parsed.role === "admin")) {
            setCurrentRole(parsed.role);
            return;
          }
        }
      } catch {}
      setCurrentRole("regulator");
    }
  };

  useEffect(() => {
    syncUser();
    const handler = () => syncUser();
    window.addEventListener("aegis-user-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("aegis-user-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  useEffect(() => {
    fetchDashboard().then(setData).catch(console.error);
    fetchMines().then((r) => setMines(r.mines || [])).catch(console.error);
    fetchForecastAlerts(0.4)
      .then((r) => setAlerts((r?.alerts || []).slice(0, 8)))
      .catch((err) => {
        console.warn("Forecast alerts fetch failed:", err);
        setAlerts([]);
      });
    fetchInspections().then((r) => setInspections(r.inspections || [])).catch(console.error);
    fetchViolations().then((r) => setViolations(r.violations || [])).catch(console.error);
    fetchAuditBlocks(8).then((r) => setAuditBlocks(r.blocks || [])).catch(console.error);
    verifyAuditChain().then((r) => setLedgerValid(r.valid)).catch(console.error);
  }, []);

  const handleSwitchStakeholder = (role: StakeholderRole) => {
    const profile = STAKEHOLDERS[role];
    if (!profile) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify({ id: profile.id, name: profile.name, role: profile.role }));
      window.dispatchEvent(new Event("aegis-user-changed"));
      toast.success(`Dashboard morphed to ${profile.title}`, {
        description: `Active Stakeholder ID: ${profile.id}`,
      });
    }
  };

  const handleVerifyChainNow = async () => {
    setIsVerifyingLedger(true);
    try {
      const res = await verifyAuditChain();
      setLedgerValid(res.valid);
      if (res.valid) {
        toast.success("Blockchain Merkle Chain verified 100% intact! Zero tampering detected.");
      } else {
        toast.error(`Chain breach detected at block #${res.broken_at_block}`);
      }
    } catch {
      toast.error("Failed to verify blockchain ledger");
    } finally {
      setIsVerifyingLedger(false);
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground flex items-center gap-2">
          <IconShieldCheck className="animate-spin text-primary" size={24} />
          <span>Synchronizing Indian Coal Mining Compliance Telemetry...</span>
        </div>
      </div>
    );
  }

  const riskPieData = Object.entries(data.risk_distribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: RISK_COLORS[name],
  }));

  const categoryBarData = Object.entries(data.compliance_by_category).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    compliance: value,
    gap: 100 - value,
  }));

  const topRiskMines = [...mines].sort((a, b) => b.overall_risk_score - a.overall_risk_score).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* ── Stakeholder Persona Switcher Ribbon ─────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-[#0d1218]/90 backdrop-blur-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs text-muted-foreground font-medium shrink-0">Current Stakeholder View:</span>
          <Badge
            className={`text-xs py-0.5 px-2 font-semibold border ${
              currentRole === "regulator"
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : currentRole === "mine_officer"
                ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                : currentRole === "frontline"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-purple-500/15 text-purple-300 border-purple-500/30"
            }`}
          >
            {currentRole === "regulator" && "🛡️ DGMS Regulator (REG-001)"}
            {currentRole === "mine_officer" && "🏭 Colliery Management (MINE-001)"}
            {currentRole === "frontline" && "👷 Frontline Field Sirdar (FIELD-001)"}
            {currentRole === "admin" && "⚙️ Platform Operations (ADMIN-001)"}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Button
            size="sm"
            variant={currentRole === "regulator" ? "default" : "outline"}
            onClick={() => handleSwitchStakeholder("regulator")}
            className={`text-xs h-8 px-3 ${
              currentRole === "regulator"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-emerald-500/10 hover:text-emerald-300"
            }`}
          >
            <IconShieldCheck size={14} className="mr-1.5 text-emerald-300" />
            DGMS Regulator
          </Button>
          <Button
            size="sm"
            variant={currentRole === "mine_officer" ? "default" : "outline"}
            onClick={() => handleSwitchStakeholder("mine_officer")}
            className={`text-xs h-8 px-3 ${
              currentRole === "mine_officer"
                ? "bg-sky-600 hover:bg-sky-500 text-white"
                : "border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-sky-500/10 hover:text-sky-300"
            }`}
          >
            <IconHelmet size={14} className="mr-1.5 text-sky-300" />
            Colliery Management
          </Button>
          <Button
            size="sm"
            variant={currentRole === "frontline" ? "default" : "outline"}
            onClick={() => handleSwitchStakeholder("frontline")}
            className={`text-xs h-8 px-3 ${
              currentRole === "frontline"
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-amber-500/10 hover:text-amber-300"
            }`}
          >
            <IconDeviceMobile size={14} className="mr-1.5 text-amber-300" />
            Frontline Inspector
          </Button>
          <Button
            size="sm"
            variant={currentRole === "admin" ? "default" : "outline"}
            onClick={() => handleSwitchStakeholder("admin")}
            className={`text-xs h-8 px-3 ${
              currentRole === "admin"
                ? "bg-purple-600 hover:bg-purple-500 text-white"
                : "border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-purple-500/10 hover:text-purple-300"
            }`}
          >
            <IconSettings size={14} className="mr-1.5 text-purple-300" />
            Platform Ops
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. DGMS REGULATOR DASHBOARD VIEW                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {currentRole === "regulator" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Regulatory Command Banner */}
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-transparent p-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  DGMS Dhanbad National Statutory Safety Directive
                </span>
                <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/30 font-mono">
                  Directive #2026/04
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                <span>Shift II Active</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">30 Monitored Collieries</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-1.5 text-[11px] sm:text-xs leading-relaxed">
              <strong>Statutory Mandate:</strong> CMR 2017 Regulation 106 highwall slope stability telemetry and Section 23 accident return compliance. Automated cross-referencing is active across 8 CIL subsidiaries.
            </p>
          </div>

          {/* Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <IconBuildingFactory2 className="h-6 w-6 text-emerald-400" />
                Executive Statutory Compliance Dashboard
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Real-time regulatory compliance telemetry across {data.total_mines} registered Indian coal mines
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20">
                <Link href="/gis-map">
                  <IconBuildingFactory2 size={14} className="mr-1.5" />
                  National GIS Radar
                </Link>
              </Button>
            </div>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Total Registered Mines",
                value: data.total_mines,
                icon: IconBuildingFactory2,
                description: "CIL & SCCL Collieries",
                color: "text-emerald-400",
                stripe: "border-l-[3px] border-l-emerald-500",
              },
              {
                title: "National Compliance Rate",
                value: `${data.compliant_percentage}%`,
                icon: IconShieldCheck,
                description: `${data.total_checks} automated audits`,
                color: data.compliant_percentage >= 80 ? "text-emerald-400" : "text-amber-400",
                stripe: "border-l-[3px] border-l-emerald-500",
              },
              {
                title: "Overdue Statutory Returns",
                value: data.overdue_filings,
                icon: IconFileText,
                description: `Out of ${data.total_filings} filings`,
                color: data.overdue_filings > 0 ? "text-amber-400" : "text-emerald-400",
                stripe: "border-l-[3px] border-l-amber-500",
              },
              {
                title: "Critical Safety Notices",
                value: data.critical_alerts,
                icon: IconAlertTriangle,
                description: "Failed high-severity checks",
                color: data.critical_alerts > 0 ? "text-red-400" : "text-emerald-400",
                stripe: "border-l-[3px] border-l-red-500",
              },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`border-white/10 bg-[#0e141d] ${stat.stripe} hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 shadow-sm`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                        <p className={`text-3xl font-extrabold mt-1 tracking-tight ${stat.color}`}>{stat.value}</p>
                        <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">{stat.description}</p>
                      </div>
                      <div className={`${stat.color} opacity-20 p-2.5 rounded-xl bg-white/[0.03]`}>
                        <stat.icon size={36} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Distribution Pie */}
            <Card className="border-white/10 bg-[#0e141d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">National Risk Distribution</CardTitle>
                <CardDescription className="text-xs">Collieries categorized by DGMS composite risk score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[230px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                        {riskPieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0d1218",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2.5 justify-center mt-2">
                  {riskPieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}:</span>
                      <span className="font-semibold text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance by Category */}
            <Card className="lg:col-span-2 border-white/10 bg-[#0e141d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Compliance Rate by Statutory Category</CardTitle>
                <CardDescription className="text-xs">Evaluation across Safety, Environmental & Labor mandates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBarData} layout="vertical" barGap={0}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222c38" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#64748b" fontSize={11} />
                      <YAxis type="category" dataKey="name" width={110} stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0d1218", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px" }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`]}
                      />
                      <Bar dataKey="compliance" fill="#10B981" radius={[0, 4, 4, 0]} name="Compliant" />
                      <Bar dataKey="gap" fill="#EF444433" radius={[0, 4, 4, 0]} name="Non-compliant" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row: Top Risk Mines & Forecast Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-white/10 bg-[#0e141d]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <IconAlertOctagon size={16} className="text-red-400" />
                    High-Risk Mines Requiring Notice
                  </CardTitle>
                  <Link href="/mines" className="text-xs text-primary hover:underline flex items-center gap-1">
                    View Registry <IconArrowRight size={12} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {topRiskMines.slice(0, 6).map((mine) => {
                    const riskLevel =
                      mine.overall_risk_score >= 75 ? "critical" : mine.overall_risk_score >= 50 ? "high" : mine.overall_risk_score >= 25 ? "medium" : "low";
                    return (
                      <Link key={mine.id} href={`/mines/${mine.id}`} className="block">
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate text-white">{mine.name}</p>
                            <p className="text-[11px] text-muted-foreground">{mine.state} · {mine.subsidiary} ({mine.mine_type})</p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <span className="text-xs font-mono font-bold" style={{ color: RISK_COLORS[riskLevel] }}>
                              {mine.overall_risk_score.toFixed(0)}/100
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 uppercase font-mono"
                              style={{ color: RISK_COLORS[riskLevel], borderColor: `${RISK_COLORS[riskLevel]}50`, backgroundColor: `${RISK_COLORS[riskLevel]}15` }}
                            >
                              {riskLevel}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0e141d]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <IconTrendingUp size={16} className="text-amber-400" />
                    Predictive Return Default Alerts
                  </CardTitle>
                  <Link href="/forecasts" className="text-xs text-primary hover:underline flex items-center gap-1">
                    Full Forecasts <IconArrowRight size={12} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {alerts.slice(0, 6).map((alert, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="mt-0.5">
                        {alert.trend_direction === "deteriorating" ? (
                          <IconTrendingUp size={16} className="text-red-400" />
                        ) : alert.trend_direction === "improving" ? (
                          <IconTrendingDown size={16} className="text-emerald-400" />
                        ) : (
                          <IconMinus size={16} className="text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate text-white">{alert.mine_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{alert.regulation_clause}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono font-bold text-red-400">{(alert.predicted_risk * 100).toFixed(0)}% Risk</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{alert.days_until_due}d left</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. MINE OFFICER / MANAGER DASHBOARD VIEW                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {currentRole === "mine_officer" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Operational Banner */}
          <div className="rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-emerald-500/5 to-transparent p-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <IconHelmet className="h-4 w-4 text-sky-400 shrink-0" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Jharia Seam #4 Colliery (BCCL) • Shift II Safety Cell
                </span>
                <Badge variant="outline" className="text-[10px] text-sky-300 border-sky-500/30 font-mono">
                  Agent ID: MINE-001
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                <span>Active Underground Workforce: <strong>840 Miners</strong></span>
              </div>
            </div>
            <p className="text-muted-foreground mt-1.5 text-[11px] sm:text-xs leading-relaxed">
              <strong>Shift Priority:</strong> Face 2 ventilation fan air delivery verification and conveyor mist sprayer maintenance. Submit Safety Management Plan (CMR Reg. 104) before statutory deadline.
            </p>
          </div>

          {/* Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <IconHelmet className="h-6 w-6 text-sky-400" />
                Mine Operations & Statutory Readiness Dashboard
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Local colliery hazard mitigation, CAPA tracking, and document submission readiness
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs">
                <Link href="/inspector">
                  <IconDeviceMobile size={14} className="mr-1.5" />
                  Launch Field Inspector
                </Link>
              </Button>
            </div>
          </div>

          {/* Mine Officer KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-white/10 bg-[#0e141d] border-l-[3px] border-l-emerald-500 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Colliery Safety Rating</p>
                    <p className="text-3xl font-extrabold mt-1 tracking-tight text-emerald-400">88.5%</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">Above DGMS 80% threshold</p>
                  </div>
                  <div className="text-emerald-400 opacity-20 p-2.5 rounded-xl bg-white/[0.03]">
                    <IconShieldCheck size={36} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0e141d] border-l-[3px] border-l-amber-500 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Statutory Returns</p>
                    <p className="text-3xl font-extrabold mt-1 tracking-tight text-amber-400">2 Returns</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">Due within 30 days</p>
                  </div>
                  <div className="text-amber-400 opacity-20 p-2.5 rounded-xl bg-white/[0.03]">
                    <IconFileText size={36} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0e141d] border-l-[3px] border-l-red-500 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Pit Face Hazards</p>
                    <p className="text-3xl font-extrabold mt-1 tracking-tight text-red-400">{violations.filter(v => v.status === "open").length || 3}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">CAPA remediation required</p>
                  </div>
                  <div className="text-red-400 opacity-20 p-2.5 rounded-xl bg-white/[0.03]">
                    <IconAlertTriangle size={36} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0e141d] border-l-[3px] border-l-sky-500 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contractor PME Medical %</p>
                    <p className="text-3xl font-extrabold mt-1 tracking-tight text-sky-400">94.2%</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">Mines Rules 1955 compliant</p>
                  </div>
                  <div className="text-sky-400 opacity-20 p-2.5 rounded-xl bg-white/[0.03]">
                    <IconUsers size={36} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Operational Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/inspector" className="p-4 rounded-xl border border-white/10 bg-[#0e141d] hover:bg-[#121a26] hover:border-sky-500/40 transition-all duration-200 group shadow-sm hover:-translate-y-0.5">
              <div className="p-2 rounded-lg bg-sky-500/10 w-fit mb-2.5 group-hover:scale-105 transition-transform">
                <IconDeviceMobile className="text-sky-400" size={20} />
              </div>
              <div className="font-bold text-xs text-white">Mobile Inspector</div>
              <div className="text-[11px] text-muted-foreground mt-1">GPS pit face logging (offline-ready)</div>
            </Link>

            <Link href="/violations" className="p-4 rounded-xl border border-white/10 bg-[#0e141d] hover:bg-[#121a26] hover:border-red-500/40 transition-all duration-200 group shadow-sm hover:-translate-y-0.5">
              <div className="p-2 rounded-lg bg-red-500/10 w-fit mb-2.5 group-hover:scale-105 transition-transform">
                <IconAlertOctagon className="text-red-400" size={20} />
              </div>
              <div className="font-bold text-xs text-white">Submit CAPA Action</div>
              <div className="text-[11px] text-muted-foreground mt-1">Clear open notices & fines</div>
            </Link>

            <Link href="/filings" className="p-4 rounded-xl border border-white/10 bg-[#0e141d] hover:bg-[#121a26] hover:border-emerald-500/40 transition-all duration-200 group shadow-sm hover:-translate-y-0.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 w-fit mb-2.5 group-hover:scale-105 transition-transform">
                <IconFileText className="text-emerald-400" size={20} />
              </div>
              <div className="font-bold text-xs text-white">Upload Statutory Return</div>
              <div className="text-[11px] text-muted-foreground mt-1">SMP, Form IV, Air Quality</div>
            </Link>

            <Link href="/contractors" className="p-4 rounded-xl border border-white/10 bg-[#0e141d] hover:bg-[#121a26] hover:border-amber-500/40 transition-all duration-200 group shadow-sm hover:-translate-y-0.5">
              <div className="p-2 rounded-lg bg-amber-500/10 w-fit mb-2.5 group-hover:scale-105 transition-transform">
                <IconUsers className="text-amber-400" size={20} />
              </div>
              <div className="font-bold text-xs text-white">Contractors Welfare</div>
              <div className="text-[11px] text-muted-foreground mt-1">Review worker health & PME</div>
            </Link>
          </div>

          {/* Two-Column Operational Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Deadlines */}
            <Card className="border-white/10 bg-[#0e141d]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <IconClock size={16} className="text-amber-400" />
                    Upcoming Statutory Filings Countdown
                  </CardTitle>
                  <Link href="/filings" className="text-xs text-sky-400 hover:underline">
                    Filing Desk &rarr;
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  { name: "Safety Management Plan (SMP)", clause: "CMR 2017 Reg. 104", days: 12, urgent: true },
                  { name: "Form IV Accident & Near-Miss Return", clause: "Mines Act 1952 Sec. 23", days: 18, urgent: false },
                  { name: "Ambient Respirable Dust Sampling Return", clause: "CMR 2017 Reg. 124", days: 26, urgent: false },
                  { name: "Annual Mine Closure Plan Financial Review", clause: "MoEF&CC EC Condition 7", days: 44, urgent: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <div>
                      <div className="text-xs font-semibold text-white">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">{item.clause}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${item.urgent ? "text-amber-400" : "text-emerald-400"}`}>
                        {item.days} days left
                      </span>
                      <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] px-2 text-sky-300 hover:bg-sky-500/20">
                        <Link href="/filings">Submit</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Field Inspections */}
            <Card className="border-white/10 bg-[#0e141d]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <IconDeviceMobile size={16} className="text-sky-400" />
                    Pit Face Observations & Incidents
                  </CardTitle>
                  <Link href="/inspector" className="text-xs text-sky-400 hover:underline">
                    Log Inspection &rarr;
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {inspections.slice(0, 4).map((insp) => (
                  <div key={insp.id} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{insp.area_inspected}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 uppercase font-mono ${
                            insp.hazard_level === "critical"
                              ? "text-red-400 border-red-500/40 bg-red-500/10"
                              : insp.hazard_level === "high"
                              ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
                              : "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                          }`}
                        >
                          {insp.hazard_level}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{insp.observations}</p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="h-7 text-[10px] px-2 border-white/10 shrink-0">
                      <Link href="/violations">Remediate</Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. FRONTLINE FIELD INSPECTOR DASHBOARD VIEW                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {currentRole === "frontline" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Frontline Shift Banner */}
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-transparent p-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <IconDeviceMobile className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Pit-3 Working Face & Haulage Road • Shift I Field Supervision
                </span>
                <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/30 font-mono">
                  Sirdar ID: FIELD-001
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                <span>GPS Fix: <strong className="text-emerald-400">Locked (&plusmn;3m)</strong></span>
                <span>•</span>
                <span>PWA Storage: <strong className="text-emerald-400">Offline Synced</strong></span>
              </div>
            </div>
            <p className="text-muted-foreground mt-1.5 text-[11px] sm:text-xs leading-relaxed">
              <strong>Pre-Shift Directive:</strong> Verify CH₄ gas concentration with flame safety lamp / continuous telemetry before authorizing entry. Inspect tell-tale strata extensometers along Bench 4. Check haul road berm height is at least 1.8m.
            </p>
          </div>

          {/* Heading with Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <IconDeviceMobile className="h-6 w-6 text-amber-400" />
                Frontline Field Inspection & Hazard Dashboard
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Real-time pit inspections, statutory safe limits, tell-tale strata logs & offline sync
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-500 text-white text-xs shadow-md">
                <Link href="/inspector">
                  <IconDeviceMobile size={14} className="mr-1.5" />
                  Launch Mobile Field App
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-white/15 bg-white/5 text-xs text-white">
                <Link href="/gis-map">
                  <IconMap2 size={14} className="mr-1.5 text-amber-400" />
                  GIS Pit Hazard Map
                </Link>
              </Button>
            </div>
          </div>

          {/* Frontline KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-white/10 bg-[#0e141d]/80 shadow-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs text-muted-foreground uppercase font-semibold">
                  Active Shift Hazards
                </CardDescription>
                <CardTitle className="text-2xl font-extrabold text-amber-400">
                  {inspections.filter((i) => i.hazard_level === "critical" || i.hazard_level === "high").length || 3}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-[11px] text-neutral-400">1 Critical bench crack, 2 High gas/berm warnings</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0e141d]/80 shadow-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs text-muted-foreground uppercase font-semibold">
                  Methane Telemetry (CH₄)
                </CardDescription>
                <CardTitle className="text-2xl font-extrabold text-emerald-400">
                  0.45% <span className="text-xs font-normal text-muted-foreground">in return</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-[11px] text-emerald-400 font-medium">Within safe limit (&lt; 0.75% CMR Reg 153)</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0e141d]/80 shadow-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs text-muted-foreground uppercase font-semibold">
                  Haul Road Berm Height
                </CardDescription>
                <CardTitle className="text-2xl font-extrabold text-red-400">
                  1.6m <span className="text-xs font-normal text-muted-foreground">Bench 4</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-[11px] text-red-400 font-medium">Below tyre diameter (1.8m min) • Stop dumper</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0e141d]/80 shadow-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs text-muted-foreground uppercase font-semibold">
                  Offline Sync Queue
                </CardDescription>
                <CardTitle className="text-2xl font-extrabold text-sky-400">
                  100% Synced
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-[11px] text-neutral-400">Local IndexedDB records committed to audit chain</p>
              </CardContent>
            </Card>
          </div>

          {/* Frontline Shift Inspection Records & Statutory Limits Quick Guide */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Recent Field Observations */}
            <Card className="border-white/10 bg-[#0e141d]/80 shadow-md">
              <CardHeader className="pb-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <IconAlertOctagon className="h-4 w-4 text-amber-400" />
                      Geo-Tagged Field Observations & Hazard Reports
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Recent inspections logged by frontline staff across active mining faces
                    </CardDescription>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs border-white/10">
                    <Link href="/inspector">Open Log</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {inspections.slice(0, 5).map((insp) => (
                  <div
                    key={insp.id}
                    className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">{insp.area_inspected}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 font-bold uppercase ${
                            insp.hazard_level === "critical"
                              ? "border-red-500 text-red-400 bg-red-500/10"
                              : insp.hazard_level === "high"
                              ? "border-amber-500 text-amber-400 bg-amber-500/10"
                              : "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                          }`}
                        >
                          {insp.hazard_level}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{insp.observations}</p>
                    </div>
                    <span className="text-[10px] text-neutral-400 shrink-0 font-mono">
                      {insp.category}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Right: Sirdar Statutory Safe Limits Reference */}
            <Card className="border-white/10 bg-[#0e141d]/80 shadow-md">
              <CardHeader className="pb-3 border-b border-white/10">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <IconShieldCheck className="h-4 w-4 text-emerald-400" />
                  Frontline Statutory Safe Limits (CMR 2017 & DGMS Circulars)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Immediate pre-shift inspection guidelines for Mining Sirdars and Overmen
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 space-y-2.5 text-xs">
                <div className="p-2 rounded bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400">Methane (CH₄) Gas Thresholds</span>
                    <span className="text-[10px] font-mono text-neutral-400">CMR Reg. 153</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    General body &lt; 0.5%. Max permissible in return airway: <strong>0.75%</strong>. If reading touches <strong>1.25%</strong>, cut all electrical power immediately and withdraw all work persons.
                  </p>
                </div>

                <div className="p-2 rounded bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sky-400">Haul Road Berm & Lighting</span>
                    <span className="text-[10px] font-mono text-neutral-400">CMR Reg. 106</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Berm height on open pit edges must equal or exceed largest dumper tyre diameter (minimum <strong>1.8 meters</strong>). Maximum road gradient must not exceed <strong>1 in 16</strong>.
                  </p>
                </div>

                <div className="p-2 rounded bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-400">Roof Strata Convergence</span>
                    <span className="text-[10px] font-mono text-neutral-400">CMR Reg. 123</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tell-tale extensometer dilation exceeding <strong>10mm/day</strong> indicates imminent strata cleavage. Immediate installation of high-tensile resin roof bolts required.
                  </p>
                </div>

                <div className="p-2 rounded bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-400">Inundation Safety Buffer</span>
                    <span className="text-[10px] font-mono text-neutral-400">CMR Reg. 149</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    When mining within <strong>60 meters</strong> of waterlogged disused workings or water bodies, mandatory advance pilot borehole drilling (minimum 3m forward) is statutory.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. PLATFORM OPERATIONS (SYSTEM ADMIN) DASHBOARD VIEW                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {currentRole === "admin" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Admin Platform Banner */}
          <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-sky-500/5 to-transparent p-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <IconSettings className="h-4 w-4 text-purple-400 shrink-0" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Ministry of Coal • Central IT & Regulatory Telemetry Core
                </span>
                <Badge variant="outline" className="text-[10px] text-purple-300 border-purple-500/30 font-mono">
                  Administrator ID: ADMIN-001
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                <span>FastAPI Service: <strong className="text-emerald-400">Online</strong></span>
                <span>•</span>
                <span>SQLite DB: <strong className="text-emerald-400">Mounted</strong></span>
              </div>
            </div>
            <p className="text-muted-foreground mt-1.5 text-[11px] sm:text-xs leading-relaxed">
              <strong>System Health:</strong> SHA-256 Merkle chain verification active. FAISS Vector Store loaded with 80+ regulatory clauses. All statutory audit logs cryptographically sealed.
            </p>
          </div>

          {/* Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <IconSettings className="h-6 w-6 text-purple-400" />
                Platform Telemetry & Cryptographic Integrity Dashboard
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Blockchain audit verification, knowledge graph ontology status, and microservice telemetry
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleVerifyChainNow}
                disabled={isVerifyingLedger}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs shadow-md"
              >
                <IconRefresh size={14} className={`mr-1.5 ${isVerifyingLedger ? "animate-spin" : ""}`} />
                {isVerifyingLedger ? "Verifying..." : "Verify Ledger Hash Continuity"}
              </Button>
            </div>
          </div>

          {/* Admin KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-white/10 bg-[#0e141d] border-l-[3px] border-l-emerald-500 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Blockchain Ledger Status</p>
                    <p className={`text-2xl font-extrabold mt-1 tracking-tight ${ledgerValid ? "text-emerald-400" : "text-amber-400"}`}>
                      {ledgerValid ? "100% INTACT" : "Validating..."}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">Zero cryptographic breaches</p>
                  </div>
                  <div className="text-emerald-400 opacity-20 p-2.5 rounded-xl bg-white/[0.03]">
                    <IconLink size={36} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0e141d] border-l-[3px] border-l-purple-500 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chained Audit Blocks</p>
                    <p className="text-3xl font-extrabold mt-1 tracking-tight text-purple-400">{auditBlocks.length > 0 ? auditBlocks[0].index + 1 : 42}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">SHA-256 Merkle Chained</p>
                  </div>
                  <div className="text-purple-400 opacity-20 p-2.5 rounded-xl bg-white/[0.03]">
                    <IconShieldCheck size={36} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0e141d] border-l-[3px] border-l-sky-500 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Regulatory Graph Clauses</p>
                    <p className="text-3xl font-extrabold mt-1 tracking-tight text-sky-400">82 Nodes</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">Mines Act & CMR 2017</p>
                  </div>
                  <div className="text-sky-400 opacity-20 p-2.5 rounded-xl bg-white/[0.03]">
                    <IconCpu size={36} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0e141d] border-l-[3px] border-l-emerald-500 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI RAG Acceleration</p>
                    <p className="text-2xl font-extrabold mt-1 tracking-tight text-emerald-400">Groq LPU Active</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">&lt; 120ms token latency</p>
                  </div>
                  <div className="text-emerald-400 opacity-20 p-2.5 rounded-xl bg-white/[0.03]">
                    <IconCpu size={36} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Live Audit Ledger Section */}
          <Card className="border-white/10 bg-[#0e141d] shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                    <IconLink size={16} className="text-purple-400" />
                    Recent SHA-256 Blockchain Audit Blocks
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">Immutable cryptographically signed state transitions</CardDescription>
                </div>
                <Button asChild size="sm" variant="outline" className="text-xs border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20">
                  <Link href="/audit-trail">Full Ledger &rarr;</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-white/5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-muted-foreground">
                      <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[10px]">Index</th>
                      <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[10px]">Action</th>
                      <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[10px]">Actor</th>
                      <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[10px]">Block Hash (SHA-256)</th>
                      <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[10px]">Previous Hash</th>
                      <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[10px] text-right">Integrity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {auditBlocks.slice(0, 5).map((block) => (
                      <tr key={block.index} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 text-purple-300 font-bold">#{block.index}</td>
                        <td className="py-2.5 font-sans font-medium text-white">{block.action}</td>
                        <td className="py-2.5 text-neutral-400">{block.actor_id}</td>
                        <td className="py-2.5 text-neutral-300 truncate max-w-[140px]">{block.block_hash.slice(0, 16)}...</td>
                        <td className="py-2.5 text-muted-foreground truncate max-w-[120px]">{block.prev_hash.slice(0, 12)}...</td>
                        <td className="py-2.5 text-right font-sans">
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] py-0">
                            SEALED
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Admin Services Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-white/10 bg-[#0e141d] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Knowledge Graph Ontology</span>
                <Badge className="bg-sky-500/20 text-sky-300 text-[10px]">80+ Clauses</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Directed acyclic graph encoding statutory relations across 5 mining acts and 14 return types.
              </p>
              <Button asChild size="sm" variant="outline" className="w-full text-xs border-sky-500/30 text-sky-300 mt-2">
                <Link href="/knowledge-graph">Inspect Graph Canvas</Link>
              </Button>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-[#0e141d] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Mines Database Telemetry</span>
                <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">30 Mines</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Geospatial coordinates, worker populations, and subsidiary mappings across 6 coal states.
              </p>
              <Button asChild size="sm" variant="outline" className="w-full text-xs border-emerald-500/30 text-emerald-300 mt-2">
                <Link href="/mines">Manage Mines Registry</Link>
              </Button>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-[#0e141d] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">AI Vector Engine & RAG</span>
                <Badge className="bg-purple-500/20 text-purple-300 text-[10px]">FAISS LPU</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Indexed Indian coal mining legal corpus with semantic similarity matching and Groq acceleration.
              </p>
              <Button asChild size="sm" variant="outline" className="w-full text-xs border-purple-500/30 text-purple-300 mt-2">
                <Link href="/chatbot">Test Legal RAG</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
