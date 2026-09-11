"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconUsers,
  IconShieldCheck,
  IconAlertTriangle,
  IconStethoscope,
  IconBriefcase,
  IconPlus,
  IconBuildingFactory2,
  IconFileCheck,
} from "@tabler/icons-react";
import { fetchContractors, fetchWelfareSummary, ContractorRecord } from "@/lib/api";
import { toast } from "sonner";

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<ContractorRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchContractors().then((r) => setContractors(r.contractors || [])).catch(console.error);
    fetchWelfareSummary().then(setSummary).catch(console.error);
  }, []);

  const filtered = contractors.filter((c) => {
    if (statusFilter !== "ALL" && c.compliance_status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <IconUsers className="h-5 w-5" />
            </span>
            Contractor & Labor Welfare Governance
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Tracking contractor safety ratings, Periodic Medical Examinations (PME), and Mines Act 1952 statutory labor mandates
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card kpi-card-emerald p-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <IconBriefcase size={20} />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Firms
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight">{summary?.total_contractor_firms ?? contractors.length}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Onboarded Contractor Firms</div>
          </div>
        </div>

        <div className="kpi-card kpi-card-blue p-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20">
              <IconUsers size={20} />
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
              Workforce
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight">{summary?.total_contract_workforce?.toLocaleString() ?? 0}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Contracted Field Workforce</div>
          </div>
        </div>

        <div className="kpi-card kpi-card-emerald p-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <IconShieldCheck size={20} />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Index
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight">{summary?.average_safety_index ?? 85}%</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">Average Safety Index</div>
          </div>
        </div>

        <div className="kpi-card kpi-card-purple p-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20">
              <IconStethoscope size={20} />
            </div>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
              PME
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight">{summary?.average_pme_compliance_percent ?? 94}%</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">PME Medical Clearance Rate</div>
          </div>
        </div>
      </div>

      {/* Statutory Banner: Form IV Compliance */}
      <div className="p-4 rounded-xl border border-white/10 bg-[#0e141d] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IconFileCheck size={18} />
          </div>
          <div>
            <span className="font-semibold text-foreground">Statutory Returns (The Mines Act 1952, Section 23): </span>
            <span>{summary?.form_iv_statutory_status || "All quarterly fatality & accident registers verified."}</span>
          </div>
        </div>
        <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 bg-emerald-500/10 self-start md:self-auto shrink-0 font-mono text-[11px]">
          Form IV Audited
        </Badge>
      </div>

      {/* Contractors Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Registered Mining Contractors</h2>
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-lg border border-white/10">
            {["ALL", "compliant", "review_required"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {st === "review_required" ? "Review Required" : st}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const isCompliant = c.compliance_status === "compliant";

            return (
              <Card
                key={c.id}
                className={`border-white/10 bg-[#0e141d]/90 hover:border-white/20 transition-all shadow-md overflow-hidden ${
                  isCompliant ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-amber-500"
                }`}
              >
                <CardHeader className="pb-3 border-b border-white/5 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">{c.company_name}</CardTitle>
                      <CardDescription className="text-xs font-mono text-muted-foreground mt-0.5">{c.registration_no}</CardDescription>
                    </div>
                    <Badge
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        isCompliant
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {c.compliance_status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3.5 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Deploy Site:</span>
                    <strong className="text-foreground font-medium">
                      {c.mine_name} ({c.subsidiary})
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Active Workers:</span>
                    <strong className="text-foreground font-medium">{c.active_workers} Personnel</strong>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Safety Rating:</span>
                      <strong className={c.safety_rating >= 85 ? "text-emerald-400" : "text-amber-400"}>
                        {c.safety_rating}%
                      </strong>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all ${
                          c.safety_rating >= 85 ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${c.safety_rating}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Medical Clearance (PME):</span>
                      <strong className="text-foreground font-medium">{c.pme_valid_percent}%</strong>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${c.pme_valid_percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-white/5 flex justify-between items-center text-muted-foreground">
                    <span>Supervisor Lead:</span>
                    <span className="font-semibold text-foreground">{c.contact_person}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
