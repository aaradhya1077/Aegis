"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconSearch, IconFilter, IconArrowRight } from "@tabler/icons-react";
import { fetchMines } from "@/lib/api";
import Link from "next/link";

const RISK_COLORS: Record<string, string> = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#F97316",
  critical: "#EF4444",
};

function getRiskLevel(score: number) {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

type Mine = {
  id: string;
  name: string;
  state: string;
  subsidiary: string;
  mine_type: string;
  overall_risk_score: number;
  status: string;
};

export default function MinesPage() {
  const [mines, setMines] = useState<Mine[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchMines().then((r) => setMines(r.mines)).catch(console.error);
  }, []);

  const filtered = mines
    .filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.state.toLowerCase().includes(search.toLowerCase()) ||
      m.subsidiary.toLowerCase().includes(search.toLowerCase())
    )
    .filter((m) => !filter || getRiskLevel(m.overall_risk_score) === filter)
    .sort((a, b) => b.overall_risk_score - a.overall_risk_score);

  const states = [...new Set(mines.map((m) => m.state))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          Mine Registry & Risk Radar
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {mines.length} collieries indexed across {states.length} coal-producing states
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 p-3.5 rounded-xl border border-white/10 bg-[#0e141d] shadow-sm">
        <div className="relative flex-1">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search mines, states, subsidiaries..."
            className="pl-9 h-9 text-xs border-white/10 bg-white/5 text-white placeholder:text-muted-foreground focus:border-emerald-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">Risk:</span>
          {["critical", "high", "medium", "low"].map((level) => (
            <Button
              key={level}
              variant={filter === level ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filter === level ? null : level)}
              className={`text-xs h-8 px-3 font-semibold transition-all duration-150 ${
                filter === level
                  ? "text-white shadow-xs"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
              }`}
              style={
                filter === level
                  ? { backgroundColor: RISK_COLORS[level], borderColor: RISK_COLORS[level] }
                  : {}
              }
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Mine grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((mine) => {
          const level = getRiskLevel(mine.overall_risk_score);
          const color = RISK_COLORS[level];
          return (
            <Link key={mine.id} href={`/mines/${mine.id}`}>
              <Card
                className="border-white/10 bg-[#0e141d] hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer h-full shadow-sm"
                style={{ borderLeftWidth: "3px", borderLeftColor: color }}
              >
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate text-white">{mine.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mine.state} · {mine.subsidiary}
                      </p>
                    </div>
                    <Badge
                      className="text-[10px] px-2 py-0.5 shrink-0 ml-2 font-mono font-bold uppercase"
                      style={{
                        backgroundColor: color + "15",
                        color: color,
                        border: `1px solid ${color}35`,
                      }}
                    >
                      {level}
                    </Badge>
                  </div>

                  {/* Risk bar */}
                  <div className="mb-3.5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground font-medium">Risk Score</span>
                      <span className="font-mono font-extrabold" style={{ color: color }}>
                        {mine.overall_risk_score.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${mine.overall_risk_score}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-white/5">
                    <span className="capitalize font-medium">{mine.mine_type}</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold group-hover:underline">
                      Details <IconArrowRight size={12} />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground bg-[#0e141d] rounded-xl border border-white/10">
          No mines match your search criteria
        </div>
      )}
    </div>
  );
}
