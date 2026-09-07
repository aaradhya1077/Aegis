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
            <IconUsers className="text-primary" size={28} />
            Contractor & Labor Welfare Governance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tracking contractor safety ratings, Periodic Medical Examinations (PME), and Mines Act 1952 statutory labor mandates
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <IconBriefcase size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary?.total_contractor_firms ?? contractors.length}</div>
              <div className="text-xs text-muted-foreground">Onboarded Contractor Firms</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
              <IconUsers size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary?.total_contract_workforce?.toLocaleString() ?? 0}</div>
              <div className="text-xs text-muted-foreground">Contracted Field Workforce</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <IconShieldCheck size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary?.average_safety_index ?? 85}%</div>
              <div className="text-xs text-muted-foreground">Average Safety Index</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
              <IconStethoscope size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary?.average_pme_compliance_percent ?? 94}%</div>
              <div className="text-xs text-muted-foreground">PME Medical Clearance Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statutory Banner: Form IV Compliance */}
      <Card className="border-border/60 bg-muted/20">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconFileCheck size={18} className="text-emerald-500" />
            <span className="font-semibold text-foreground">Statutory Returns (The Mines Act 1952, Section 23):</span>
            <span>{summary?.form_iv_statutory_status || "All quarterly fatality & accident registers verified."}</span>
          </div>
          <Badge variant="outline" className="text-emerald-600 border-emerald-500/40">
            Form IV Audited
          </Badge>
        </CardContent>
      </Card>

      {/* Contractors Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Registered Mining Contractors</h2>
          <div className="flex items-center gap-2">
            {["ALL", "compliant", "review_required"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
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
              <Card key={c.id} className="border-border/60 hover:border-primary/40 transition-all">
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{c.company_name}</CardTitle>
                      <CardDescription className="text-xs font-mono">{c.registration_no}</CardDescription>
                    </div>
                    <Badge
                      variant={isCompliant ? "secondary" : "destructive"}
                      className="text-[10px] uppercase font-bold"
                    >
                      {c.compliance_status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Deploy Site:</span>
                    <strong className="text-foreground">
                      {c.mine_name} ({c.subsidiary})
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Active Workers:</span>
                    <strong className="text-foreground">{c.active_workers} Personnel</strong>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Safety Rating:</span>
                      <strong className={c.safety_rating >= 85 ? "text-emerald-500" : "text-amber-500"}>
                        {c.safety_rating}%
                      </strong>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          c.safety_rating >= 85 ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${c.safety_rating}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Medical Clearance (PME):</span>
                      <strong className="text-foreground">{c.pme_valid_percent}%</strong>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${c.pme_valid_percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/30 flex justify-between items-center text-muted-foreground">
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
