"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconShieldCheck, IconAlertTriangle, IconFileText, IconTrendingUp, IconTrendingDown, IconMinus } from "@tabler/icons-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchMine, fetchComplianceChecks, fetchFilings, fetchRiskHistory } from "@/lib/api";
import Link from "next/link";

const RISK_COLORS: Record<string, string> = {
  low: "#10B981", medium: "#F59E0B", high: "#F97316", critical: "#EF4444",
};

function getRiskLevel(score: number) {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export default function MineDetailPage() {
  const params = useParams();
  const mineId = params.id as string;

  const [mine, setMine] = useState<any>(null);
  const [checks, setChecks] = useState<any[]>([]);
  const [filings, setFilings] = useState<any[]>([]);
  const [riskHistory, setRiskHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!mineId) return;
    fetchMine(mineId).then(setMine).catch(console.error);
    fetchComplianceChecks(mineId).then(setChecks).catch(console.error);
    fetchFilings({ mine_id: mineId }).then((r) => setFilings(r.filings)).catch(console.error);
    fetchRiskHistory(mineId).then((r) => setRiskHistory(r.history)).catch(console.error);
  }, [mineId]);

  if (!mine) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading mine details...</div>
      </div>
    );
  }

  const level = getRiskLevel(mine.overall_risk_score);
  const passedChecks = checks.filter((c) => c.status === "passed").length;
  const failedChecks = checks.filter((c) => c.status === "failed").length;
  const overdueFilings = filings.filter((f) => f.status === "overdue").length;

  const chartData = riskHistory.map((r: any) => ({
    date: new Date(r.computed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    score: r.score,
  }));

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div className="flex items-center gap-3">
        <Link href="/mines">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <IconArrowLeft size={16} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{mine.name}</h1>
          <p className="text-sm text-muted-foreground">
            {mine.district}, {mine.state} · {mine.subsidiary} · {mine.mine_type}
          </p>
        </div>
        <Badge
          className="text-sm px-3 py-1"
          style={{
            backgroundColor: RISK_COLORS[level] + "15",
            color: RISK_COLORS[level],
            border: `1px solid ${RISK_COLORS[level]}40`,
          }}
        >
          Risk: {mine.overall_risk_score.toFixed(1)}
        </Badge>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Workers", value: mine.worker_count.toLocaleString(), icon: "👷" },
          { label: "Total Filings", value: filings.length, icon: "📄" },
          { label: "Checks Passed", value: passedChecks, icon: "✅" },
          { label: "Overdue", value: overdueFilings, icon: "⚠️" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-0.5">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk trend chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Risk Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={RISK_COLORS[level]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={RISK_COLORS[level]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke={RISK_COLORS[level]} fillOpacity={1} fill="url(#riskGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No historical data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance checks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Compliance Checks ({checks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {checks.slice(0, 20).map((check: any) => (
              <div
                key={check.id}
                className="p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {check.status === "passed" ? (
                      <IconShieldCheck size={16} className="text-emerald-500" />
                    ) : check.status === "failed" ? (
                      <IconAlertTriangle size={16} className="text-red-500" />
                    ) : (
                      <IconFileText size={16} className="text-amber-500" />
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                      style={{
                        color: check.status === "passed" ? "#10B981" : check.status === "failed" ? "#EF4444" : "#F59E0B",
                      }}
                    >
                      {check.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Score: {(check.score * 100).toFixed(0)}%
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {check.verified_by}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{check.explanation}</p>
                {/* Findings */}
                {check.findings && check.findings.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {check.findings.slice(0, 5).map((f: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: f.status === "passed" ? "#10B98115" : "#EF444415",
                          color: f.status === "passed" ? "#10B981" : "#EF4444",
                        }}
                      >
                        {f.field}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
