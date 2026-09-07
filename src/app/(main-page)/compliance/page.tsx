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
} from "@tabler/icons-react";
import { fetchMines, fetchComplianceChecks, submitHumanReview } from "@/lib/api";
import { toast } from "sonner";

export default function CompliancePage() {
  const [mines, setMines] = useState<any[]>([]);
  const [selectedMine, setSelectedMine] = useState<string | null>(null);
  const [checks, setChecks] = useState<any[]>([]);
  const [search, setSearch] = useState("");

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
  }, []);

  useEffect(() => {
    if (selectedMine) {
      loadChecks(selectedMine);
    }
  }, [selectedMine]);

  const loadChecks = (mineId: string) => {
    fetchComplianceChecks(mineId).then(setChecks).catch(console.error);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <IconShieldCheck className="text-primary" size={28} />
          Compliance Checks & Statutory Audits
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Clause-level verification results with explainable findings and Human-in-the-Loop review
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mine selector */}
        <Card className="lg:col-span-1 border-white/10 bg-card/60 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white">Select Colliery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-3">
              <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search mines..."
                className="pl-8 h-8 text-xs border-white/10 bg-white/5"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
              {filteredMines.map((mine) => (
                <button
                  key={mine.id}
                  onClick={() => setSelectedMine(mine.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    selectedMine === mine.id
                      ? "bg-primary/20 text-white border border-primary/30 font-medium"
                      : "hover:bg-white/5 text-neutral-300"
                  }`}
                >
                  <div className="font-semibold truncate">{mine.name}</div>
                  <div className="text-[11px] text-muted-foreground flex justify-between mt-0.5">
                    <span>{mine.state} · {mine.subsidiary}</span>
                    <span className="font-mono">Risk: {mine.overall_risk_score.toFixed(0)}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance results */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedMine ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <IconShieldCheck size={48} className="mx-auto mb-4 opacity-30" />
                <p>Select a mine to view compliance checks</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1 text-xs text-emerald-400 border-emerald-500/30">
                  <IconShieldCheck size={13} />
                  {checks.filter((c) => c.status === "passed" || c.status === "human_verified").length} Passed / Verified
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs text-red-400 border-red-500/30">
                  <IconAlertTriangle size={13} />
                  {checks.filter((c) => c.status === "failed").length} Failed
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs text-amber-400 border-amber-500/30">
                  <IconEye size={13} />
                  {checks.filter((c) => c.status === "needs_review").length} Needs Review
                </Badge>
              </div>

              <div className="space-y-3">
                {checks.slice(0, 30).map((check) => (
                  <Card key={check.id} className="border-white/10 bg-card/50 hover:border-white/20 transition-all">
                    <CardContent className="py-4 px-4 sm:px-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {check.status === "passed" || check.status === "human_verified" ? (
                            <IconShieldCheck size={18} className="text-emerald-400 shrink-0" />
                          ) : check.status === "failed" ? (
                            <IconAlertTriangle size={18} className="text-red-400 shrink-0" />
                          ) : (
                            <IconEye size={18} className="text-amber-400 shrink-0" />
                          )}
                          <span className="text-sm font-semibold capitalize text-white">
                            {check.status.replace("_", " ")}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono text-neutral-400">
                            {(check.score * 100).toFixed(0)}% Match
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            {check.verified_by} · {new Date(check.checked_at).toLocaleDateString("en-IN")}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReview(check)}
                            className="h-7 text-[11px] gap-1 border-white/15 bg-white/5 hover:bg-primary/20 hover:text-white"
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
                              backgroundColor: f.status === "passed" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                              color: f.status === "passed" ? "#34D399" : "#F87171",
                              border: `1px solid ${f.status === "passed" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                            }}
                          >
                            {f.status === "passed" ? "✓" : "✗"} {f.field}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

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
