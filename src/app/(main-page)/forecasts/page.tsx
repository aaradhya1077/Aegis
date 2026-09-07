"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconAlertTriangle,
  IconSearch,
  IconBuildingFactory2,
  IconArrowRight,
  IconRefresh,
  IconCalendarTime,
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
} from "recharts";
import { fetchForecastAlerts } from "@/lib/api";
import Link from "next/link";

interface ForecastAlert {
  id: string;
  mine_id: string;
  mine_name: string | null;
  regulation_id: string;
  regulation_clause: string | null;
  predicted_risk: number;
  trend_direction: string;
  days_until_due: number;
  confidence: number;
}

const TREND_CONFIG: Record<
  string,
  { icon: typeof IconTrendingUp; color: string; bg: string; border: string; label: string }
> = {
  deteriorating: {
    icon: IconTrendingUp,
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.25)",
    label: "Deteriorating",
  },
  stable: {
    icon: IconMinus,
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.25)",
    label: "Stable",
  },
  improving: {
    icon: IconTrendingDown,
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.25)",
    label: "Improving",
  },
};

export default function ForecastsPage() {
  const [alerts, setAlerts] = useState<ForecastAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [trendFilter, setTrendFilter] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchForecastAlerts(0.0)
      .then((r) => {
        setAlerts(r.alerts || []);
        setTotal(r.total || 0);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load forecast alerts";
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAlerts = alerts
    .filter((a) => !trendFilter || a.trend_direction === trendFilter)
    .filter(
      (a) =>
        !search ||
        (a.mine_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.regulation_clause || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.mine_id || "").toLowerCase().includes(search.toLowerCase())
    );

  const deterioratingCount = alerts.filter((a) => a.trend_direction === "deteriorating").length;
  const stableCount = alerts.filter((a) => a.trend_direction === "stable").length;
  const improvingCount = alerts.filter((a) => a.trend_direction === "improving").length;

  const chartData = [
    { range: "0-20% Risk", count: alerts.filter((a) => a.predicted_risk < 0.2).length, color: "#10B981" },
    { range: "20-40% Risk", count: alerts.filter((a) => a.predicted_risk >= 0.2 && a.predicted_risk < 0.4).length, color: "#34D399" },
    { range: "40-60% Risk", count: alerts.filter((a) => a.predicted_risk >= 0.4 && a.predicted_risk < 0.6).length, color: "#F59E0B" },
    { range: "60-80% Risk", count: alerts.filter((a) => a.predicted_risk >= 0.6 && a.predicted_risk < 0.8).length, color: "#F97316" },
    { range: "80-100% Risk", count: alerts.filter((a) => a.predicted_risk >= 0.8).length, color: "#EF4444" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <IconTrendingUp className="h-6 w-6 text-emerald-500" />
            Deadline & Violation Forecaster
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Predictive compliance analytics calculated via submission lateness slope and historical violation patterns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-white/10 hover:bg-white/5 text-xs"
          >
            <IconRefresh className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Trajectories
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={loadData} className="text-xs text-red-400 hover:text-red-300">
            Try Again
          </Button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            ...TREND_CONFIG.deteriorating,
            title: "Deteriorating Trajectory",
            count: deterioratingCount,
            key: "deteriorating",
            sub: "High risk of missed deadline or penalty escalation",
          },
          {
            ...TREND_CONFIG.stable,
            title: "Stable Trajectory",
            count: stableCount,
            key: "stable",
            sub: "Predictable submission cadences within safe margins",
          },
          {
            ...TREND_CONFIG.improving,
            title: "Improving Trajectory",
            count: improvingCount,
            key: "improving",
            sub: "Demonstrating shortening lag times and prompt filings",
          },
        ].map((s) => {
          const isSelected = trendFilter === s.key;
          return (
            <Card
              key={s.title}
              onClick={() => setTrendFilter(isSelected ? null : s.key)}
              className={`cursor-pointer transition-all duration-200 bg-[#121820]/80 border shadow-lg backdrop-blur ${
                isSelected
                  ? "ring-2 ring-emerald-500 border-emerald-500/50"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {s.label}
                    </span>
                    <p className="text-3xl font-bold mt-1.5" style={{ color: s.color }}>
                      {loading ? "..." : s.count}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">{s.sub}</p>
                  </div>
                  <div
                    className="p-3 rounded-xl shrink-0"
                    style={{ backgroundColor: s.bg, border: `1px solid ${s.border}` }}
                  >
                    <s.icon size={28} style={{ color: s.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart: Risk Distribution */}
      <Card className="bg-[#121820]/90 border-white/10 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Predicted Risk Distribution</span>
            <span className="text-xs font-normal text-muted-foreground">
              Total {alerts.length} monitored statutory clauses
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Frequency distribution of calculated non-compliance probabilities across all registered mines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="range" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#182230",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#f3f4f6",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by mine name, clause or ID..."
            className="pl-9 bg-[#121820] border-white/10 text-sm focus-visible:ring-emerald-500 h-9"
          />
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={trendFilter === null ? "default" : "outline"}
            onClick={() => setTrendFilter(null)}
            className={`text-xs h-8 ${
              trendFilter === null
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "border-white/10 hover:bg-white/5"
            }`}
          >
            All Trajectories ({alerts.length})
          </Button>
          {["deteriorating", "stable", "improving"].map((t) => {
            const cfg = TREND_CONFIG[t];
            const isSel = trendFilter === t;
            return (
              <Button
                key={t}
                size="sm"
                variant="outline"
                onClick={() => setTrendFilter(isSel ? null : t)}
                className="text-xs h-8 gap-1.5 border-white/10 hover:bg-white/5"
                style={
                  isSel
                    ? { backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }
                    : {}
                }
              >
                <cfg.icon size={14} style={{ color: cfg.color }} />
                <span className="capitalize">{t}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Alerts List */}
      <Card className="bg-[#121820]/90 border-white/10 shadow-lg">
        <CardHeader className="pb-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <IconAlertTriangle size={18} className="text-amber-400" />
              Statutory Deadline Forecasts ({filteredAlerts.length})
            </CardTitle>
            {trendFilter && (
              <Badge variant="outline" className="text-xs border-white/10">
                Filtered: <span className="capitalize ml-1 text-emerald-400">{trendFilter}</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <IconRefresh className="h-6 w-6 animate-spin text-emerald-500" />
              <span className="text-sm">Evaluating compliance trajectories from historical filings...</span>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No forecasts found matching your search criteria.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredAlerts.map((alert) => {
                const trend =
                  TREND_CONFIG[alert.trend_direction as keyof typeof TREND_CONFIG] ||
                  TREND_CONFIG.stable;
                return (
                  <div
                    key={alert.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="p-2 rounded-lg shrink-0 mt-0.5"
                        style={{ backgroundColor: trend.bg, border: `1px solid ${trend.border}` }}
                      >
                        <trend.icon size={18} style={{ color: trend.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/mines/${alert.mine_id}`}
                            className="text-sm font-semibold text-foreground hover:text-emerald-400 transition-colors flex items-center gap-1 group-hover:underline"
                          >
                            <IconBuildingFactory2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {alert.mine_name || alert.mine_id}
                          </Link>
                          <span className="text-xs text-muted-foreground font-mono">
                            ({alert.mine_id})
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xl">
                          {alert.regulation_clause || alert.regulation_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 sm:self-center self-end">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <IconCalendarTime className="h-4 w-4 text-muted-foreground/80" />
                        <span>{alert.days_until_due}d until due</span>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-mono font-bold" style={{ color: trend.color }}>
                          {(alert.predicted_risk * 100).toFixed(0)}% Risk
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round(alert.confidence * 100)}% conf
                        </span>
                      </div>

                      <Badge
                        className="text-xs px-2.5 py-1 shrink-0 font-medium"
                        style={{
                          backgroundColor: trend.bg,
                          color: trend.color,
                          border: `1px solid ${trend.border}`,
                        }}
                      >
                        {trend.label}
                      </Badge>

                      <Link
                        href={`/mines/${alert.mine_id}`}
                        className="p-1.5 rounded-lg border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors hidden md:inline-flex"
                      >
                        <IconArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
