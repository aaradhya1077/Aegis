"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  IconSearch,
  IconShieldCheck,
  IconAlertTriangle,
  IconEye,
  IconUserCheck,
  IconCheck,
  IconX,
  IconFileAlert,
  IconRadar2,
  IconSend,
  IconRefresh,
} from "@tabler/icons-react";
import {
  fetchMines,
  fetchComplianceChecks,
  submitHumanReview,
  fetchCirculars,
  scanCircularCompliance,
  DgmsCircular,
} from "@/lib/api";
import { toast } from "sonner";

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<"checks" | "circulars">("checks");
  const [mines, setMines] = useState<any[]>([]);
  const [selectedMine, setSelectedMine] = useState<string | null>(null);
  const [checks, setChecks] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // Circulars state
  const [circulars, setCirculars] = useState<DgmsCircular[]>([]);
  const [selectedCircular, setSelectedCircular] = useState<DgmsCircular | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Human review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeCheck, setActiveCheck] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"passed" | "failed">("passed");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    fetchMines()
      .then((r) => {
        setMines(r.mines || []);
        if (r.mines?.length > 0 && !selectedMine) {
          setSelectedMine(r.mines[0].id);
        }
      })
      .catch(console.error);

    fetchCirculars()
      .then((r) => {
        setCirculars(r.circulars || []);
        if (r.circulars?.length > 0) setSelectedCircular(r.circulars[0]);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedMine) {
      loadChecks(selectedMine);
    }
  }, [selectedMine]);

  const loadChecks = (mineId: string) => {
    fetchComplianceChecks(mineId).then(setChecks).catch(console.error);
  };

  const handleScanCircular = async (cirId: string) => {
    setIsScanning(true);
    try {
      const res = await scanCircularCompliance(cirId);
      setScanResult(res);
      toast.success(`Autonomous scan completed across ${res.total_scanned} mines! Found ${res.vulnerable_count} vulnerable collieries.`);
    } catch {
      toast.error("Circular compliance scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenReview = (check: any) => {
    setActiveCheck(check);
    setReviewStatus(check.status === "passed" ? "passed" : "passed");
    setReviewNotes("");
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheck) return;

    setIsSubmittingReview(true);
    try {
      await submitHumanReview(activeCheck.id, {
        status: reviewStatus,
        notes: reviewNotes || "Physical inspection confirmation by DGMS Officer.",
      });
      toast.success(`Check successfully updated to ${reviewStatus === "passed" ? "Human Verified" : "Failed"}`);
      setReviewModalOpen(false);
      if (selectedMine) loadChecks(selectedMine);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit human review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredMines = mines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header + Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IconShieldCheck className="text-primary" size={28} />
            Compliance Checks & Statutory Audits
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Clause-level verification results with explainable findings and Human-in-the-Loop review
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab("checks")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === "checks"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            Colliery Check Records
          </button>
          <button
            onClick={() => setActiveTab("circulars")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "circulars"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <IconFileAlert size={14} />
            DGMS Safety Circulars
            <Badge className="ml-1 bg-sky-500/20 text-sky-300 text-[10px] px-1 py-0">NEW</Badge>
          </button>
        </div>
      </div>

      {activeTab === "circulars" ? (
        /* DGMS Safety Circulars Section */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {circulars.map((cir) => (
              <Card
                key={cir.id}
                className={`border transition-all duration-200 cursor-pointer ${
                  selectedCircular?.id === cir.id
                    ? "border-sky-500/50 bg-sky-950/20 shadow-md"
                    : "border-white/10 bg-[#0e141d] hover:border-white/20"
                }`}
                onClick={() => setSelectedCircular(cir)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] text-sky-400 border-sky-500/30">
                      {cir.circular_no}
                    </Badge>
                    <Badge
                      className={
                        cir.severity === "critical"
                          ? "bg-red-500/20 text-red-300 text-[10px]"
                          : "bg-amber-500/20 text-amber-300 text-[10px]"
                      }
                    >
                      {cir.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-white mt-2 leading-snug">
                    {cir.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">{cir.summary}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-neutral-400">
                    <span>Mandate: <strong className="text-neutral-200">{cir.statutory_ref}</strong></span>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCircular(cir);
                        handleScanCircular(cir.id);
                      }}
                      disabled={isScanning}
                      className="h-7 text-xs bg-sky-600 hover:bg-sky-500 text-white gap-1"
                    >
                      <IconRadar2 size={13} />
                      {isScanning && selectedCircular?.id === cir.id ? "Scanning..." : "Scan 30 Mines"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Scan Results for Selected Circular */}
          {scanResult && (
            <Card className="border-sky-500/30 bg-[#0e141d] shadow-lg animate-in fade-in">
              <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <IconRadar2 className="text-sky-400" size={20} />
                    <CardTitle className="text-base font-bold text-white">
                      Autonomous Scan Findings: {scanResult.circular_title}
                    </CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Evaluated against {scanResult.total_scanned} coal mines across India • Mandate: {scanResult.statutory_ref}
                  </p>
                </div>
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs px-2.5 py-1">
                  {scanResult.vulnerable_count} Vulnerable Collieries Flagged
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {scanResult.vulnerable_mines.map((vm: any) => (
                    <div
                      key={vm.mine_id}
                      className="p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-2 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{vm.mine_name}</span>
                        <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/30">
                          Risk: {vm.risk_score.toFixed(0)}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {vm.state} · {vm.subsidiary} ({vm.mine_type})
                      </div>
                      <div className="text-xs text-red-300/90 font-medium">
                        ⚠️ {vm.risk_factors.join(" • ")}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => toast.success(`Statutory Advisory Notice dispatched to ${vm.mine_name} management.`)}
                        className="w-full text-xs h-7 bg-white/5 hover:bg-white/10 text-sky-300 border border-sky-500/20 gap-1 mt-1"
                      >
                        <IconSend size={12} />
                        Dispatch Notice
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Standard Mine Checks Grid */

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mine selector */}
        <Card className="lg:col-span-1 border-white/10 bg-[#0e141d] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-white">Select Colliery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-3">
              <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search mines..."
                className="pl-8 h-8 text-xs border-white/10 bg-white/5 text-white placeholder:text-muted-foreground focus:border-emerald-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredMines.map((mine) => (
                <button
                  key={mine.id}
                  onClick={() => setSelectedMine(mine.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${
                    selectedMine === mine.id
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold shadow-xs"
                      : "hover:bg-white/5 text-neutral-300 border border-transparent"
                  }`}
                >
                  <div className="font-semibold truncate text-white">{mine.name}</div>
                  <div className="text-[11px] text-muted-foreground flex justify-between mt-0.5">
                    <span>{mine.state} · {mine.subsidiary}</span>
                    <span className="font-mono text-xs font-semibold">Risk: {mine.overall_risk_score.toFixed(0)}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance results */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedMine ? (
            <Card className="border-white/10 bg-[#0e141d]">
              <CardContent className="py-16 text-center text-muted-foreground">
                <IconShieldCheck size={48} className="mx-auto mb-4 opacity-30 text-emerald-400" />
                <p className="text-sm font-medium">Select a mine to view compliance checks</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1.5 text-xs text-emerald-400 border-emerald-500/30 bg-emerald-500/10 py-1 px-2.5">
                  <IconShieldCheck size={14} />
                  {checks.filter((c) => c.status === "passed" || c.status === "human_verified").length} Passed / Verified
                </Badge>
                <Badge variant="outline" className="gap-1.5 text-xs text-red-400 border-red-500/30 bg-red-500/10 py-1 px-2.5">
                  <IconAlertTriangle size={14} />
                  {checks.filter((c) => c.status === "failed").length} Failed
                </Badge>
                <Badge variant="outline" className="gap-1.5 text-xs text-amber-400 border-amber-500/30 bg-amber-500/10 py-1 px-2.5">
                  <IconEye size={14} />
                  {checks.filter((c) => c.status === "needs_review").length} Needs Review
                </Badge>
              </div>

              <div className="space-y-3">
                {checks.slice(0, 30).map((check) => {
                  const isPassed = check.status === "passed" || check.status === "human_verified";
                  const isFailed = check.status === "failed";
                  return (
                    <Card
                      key={check.id}
                      className={`border-white/10 bg-[#0e141d] hover:border-white/20 transition-all duration-200 shadow-sm ${
                        isPassed
                          ? "border-l-[3px] border-l-emerald-500"
                          : isFailed
                          ? "border-l-[3px] border-l-red-500"
                          : "border-l-[3px] border-l-amber-500"
                      }`}
                    >
                      <CardContent className="py-4 px-4 sm:px-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {isPassed ? (
                              <IconShieldCheck size={18} className="text-emerald-400 shrink-0" />
                            ) : isFailed ? (
                              <IconAlertTriangle size={18} className="text-red-400 shrink-0" />
                            ) : (
                              <IconEye size={18} className="text-amber-400 shrink-0" />
                            )}
                            <span className="text-sm font-bold capitalize text-white">
                              {check.status.replace("_", " ")}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono text-neutral-300 border-white/10 bg-white/5">
                              {(check.score * 100).toFixed(0)}% Match
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {check.verified_by} · {new Date(check.checked_at).toLocaleDateString("en-IN")}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReview(check)}
                              className="h-7 text-[11px] gap-1 border-white/15 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30"
                            >
                              <IconUserCheck size={13} />
                              Review / Override
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                          {check.explanation}
                        </p>

                        {/* Findings pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {(check.findings || []).map((f: any, i: number) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                              style={{
                                backgroundColor: f.status === "passed" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                color: f.status === "passed" ? "#34D399" : "#F87171",
                                border: `1px solid ${f.status === "passed" ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                              }}
                            >
                              {f.status === "passed" ? "✓" : "✗"} {f.field}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Human Review Modal Dialog */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-md border-white/15 bg-[#0e1319] text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <IconUserCheck className="h-4 w-4 text-primary" />
              Inspector Verification & Compliance Override
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              DGMS Regulatory Oversight: Provide human confirmation to pass or confirm statutory failure.
            </DialogDescription>
          </DialogHeader>

          {activeCheck && (
            <form onSubmit={handleSubmitReview} className="space-y-4 mt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1">
                <div className="font-semibold text-white">Clause Explanation:</div>
                <div className="text-muted-foreground leading-relaxed">{activeCheck.explanation}</div>
              </div>

              <div>
                <Label className="text-xs text-neutral-300">Statutory Determination</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <Button
                    type="button"
                    variant={reviewStatus === "passed" ? "default" : "outline"}
                    onClick={() => setReviewStatus("passed")}
                    className={`h-9 text-xs gap-1.5 ${
                      reviewStatus === "passed" ? "bg-emerald-600 text-white" : "border-white/15 bg-white/5"
                    }`}
                  >
                    <IconCheck size={14} />
                    Pass (Human Verified)
                  </Button>

                  <Button
                    type="button"
                    variant={reviewStatus === "failed" ? "default" : "outline"}
                    onClick={() => setReviewStatus("failed")}
                    className={`h-9 text-xs gap-1.5 ${
                      reviewStatus === "failed" ? "bg-rose-600 text-white" : "border-white/15 bg-white/5"
                    }`}
                  >
                    <IconX size={14} />
                    Fail (Confirm Violation)
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-neutral-300">Inspector Observations & Notes</Label>
                <textarea
                  className="w-full mt-1.5 h-20 rounded-md border border-white/15 bg-white/5 p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. On-site physical measurement confirmed bench slope stabilization and air velocity compliance."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReviewModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingReview}
                  className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSubmittingReview ? "Saving..." : "Save Determination"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
