"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconAlertOctagon,
  IconShieldExclamation,
  IconCheck,
  IconClock,
  IconSearch,
  IconArrowUpRight,
  IconCurrencyRupee,
  IconFileCheck,
  IconSend,
} from "@tabler/icons-react";
import {
  fetchViolations,
  fetchInspectionStats,
  submitCapa,
  resolveViolation,
  ViolationRecord,
} from "@/lib/api";
import { toast } from "sonner";

export default function ViolationsPage() {
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedViolation, setSelectedViolation] = useState<ViolationRecord | null>(null);

  // CAPA modal form state
  const [capaAction, setCapaAction] = useState("");
  const [capaEngineer, setCapaEngineer] = useState("Chief Safety Engineer");
  const [isSubmittingCapa, setIsSubmittingCapa] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    fetchViolations().then((r) => setViolations(r.violations || [])).catch(console.error);
    fetchInspectionStats().then(setStats).catch(console.error);
  };

  const handleCapaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedViolation || !capaAction) return;

    setIsSubmittingCapa(true);
    try {
      await submitCapa(selectedViolation.id, {
        proposed_action: capaAction,
        action_taken_by: capaEngineer,
      });
      toast.success("Corrective Action Plan (CAPA) logged and submitted for review!");
      setCapaAction("");
      setSelectedViolation(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit CAPA");
    } finally {
      setIsSubmittingCapa(false);
    }
  };

  const handleResolve = async (violId: string) => {
    try {
      await resolveViolation(violId, {
        verified_by: "REG-001 (DGMS Inspector)",
        notes: "On-site physical inspection verified remediation action. Compliance restored.",
      });
      toast.success("Violation marked resolved and recorded to blockchain audit ledger!");
      setSelectedViolation(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve violation");
    }
  };

  const filteredViolations = violations.filter((v) => {
    if (statusFilter !== "ALL" && v.status !== statusFilter) return false;
    if (severityFilter !== "ALL" && v.severity !== severityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        v.mine_name.toLowerCase().includes(q) ||
        v.subsidiary.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <IconAlertOctagon className="text-rose-500" size={28} />
            Violations & Corrective Action (CAPA) Tracker
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            End-to-end statutory breach resolution, automated escalation tiers, and verifiable engineering remediation
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500">
              <IconShieldExclamation size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.open_violations ?? 0}</div>
              <div className="text-xs text-muted-foreground">Active Open Violations</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
              <IconClock size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.capa_pending_review ?? 0}</div>
              <div className="text-xs text-muted-foreground">CAPA Pending Verification</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <IconCheck size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.resolved_violations ?? 0}</div>
              <div className="text-xs text-muted-foreground">Remediated & Closed</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <IconCurrencyRupee size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold">
                ₹{((stats?.total_penalty_exposure_inr || 0) / 100000).toFixed(1)}L
              </div>
              <div className="text-xs text-muted-foreground">Statutory Penalty Exposure</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-sm">
          <IconSearch size={15} className="text-muted-foreground" />
          <Input
            placeholder="Search breach by mine, division or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs bg-background/80"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Status:</span>
          {["ALL", "open", "capa_submitted", "resolved"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-all ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/80 hover:bg-muted text-muted-foreground border border-border/40"
              }`}
            >
              {s === "capa_submitted" ? "CAPA Submitted" : s}
            </button>
          ))}

          <span className="text-xs font-semibold text-muted-foreground ml-2">Severity:</span>
          {["ALL", "critical", "high", "medium"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-all ${
                severityFilter === sev
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/80 hover:bg-muted text-muted-foreground border border-border/40"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Violations List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredViolations.map((viol) => {
          const isCrit = viol.severity === "critical";
          const isHigh = viol.severity === "high";
          const isResolved = viol.status === "resolved";

          return (
            <Card
              key={viol.id}
              className={`border transition-all ${
                isResolved
                  ? "border-border/40 opacity-75 bg-card/40"
                  : isCrit
                  ? "border-rose-500/30 bg-rose-500/5 shadow-sm"
                  : "border-border/70 bg-card hover:border-primary/40"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">{viol.id}</span>
                      <Badge
                        variant={isCrit ? "destructive" : isHigh ? "default" : "secondary"}
                        className="text-[10px] uppercase font-bold"
                      >
                        {viol.severity}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        Tier {viol.escalation_tier}: {viol.escalation_tier === 2 ? "Subsidiary GM" : "Mine Safety Officer"}
                      </Badge>
                      <span className="text-xs font-bold text-foreground">
                        {viol.mine_name} ({viol.subsidiary} - {viol.state})
                      </span>
                    </div>

                    <h3 className="font-semibold text-base">{viol.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{viol.description}</p>

                    {viol.capa && (
                      <div className="mt-2 p-2.5 rounded-md bg-muted/50 border border-border/40 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary flex items-center gap-1">
                            <IconFileCheck size={14} /> CAPA Proposal ({viol.capa.action_taken_by})
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Status: {viol.capa.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-foreground">{viol.capa.proposed_action}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Actions & Deadlines */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 min-w-[200px] border-t lg:border-t-0 pt-3 lg:pt-0 border-border/40">
                    <div className="text-left lg:text-right">
                      <div className="text-xs text-muted-foreground">Statutory Penalty</div>
                      <div className="text-base font-bold text-foreground">
                        ₹{viol.penalty_inr.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-rose-500 font-medium">
                        Due by {new Date(viol.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isResolved && !viol.capa && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedViolation(viol)}
                          className="gap-1 text-xs"
                        >
                          <IconSend size={13} />
                          Submit CAPA
                        </Button>
                      )}

                      {!isResolved && viol.capa && (
                        <Button
                          size="sm"
                          onClick={() => handleResolve(viol.id)}
                          className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <IconCheck size={13} />
                          Approve & Close
                        </Button>
                      )}

                      {isResolved && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 gap-1">
                          <IconCheck size={12} /> Resolved in Ledger
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CAPA Submission Drawer / Modal */}
      {selectedViolation && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border shadow-2xl animate-in fade-in zoom-in duration-150">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Submit Corrective & Preventive Action (CAPA)</span>
                <span className="font-mono text-xs text-muted-foreground">{selectedViolation.id}</span>
              </CardTitle>
              <CardDescription>
                Statutory engineering remediation plan for {selectedViolation.mine_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-xs">
                <div className="font-semibold text-foreground mb-1">{selectedViolation.title}</div>
                <p className="text-muted-foreground">{selectedViolation.description}</p>
              </div>

              <form onSubmit={handleCapaSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Action Lead / Division</label>
                  <Input
                    value={capaEngineer}
                    onChange={(e) => setCapaEngineer(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Proposed Engineering Remediation & Evidence Plan
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Detail specific geotechnical support, ventilation adjustments, dust water bowser dispatch, or electrical replacement measures..."
                    value={capaAction}
                    onChange={(e) => setCapaAction(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedViolation(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSubmittingCapa}>
                    {isSubmittingCapa ? "Logging..." : "Submit Plan for Verification"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
