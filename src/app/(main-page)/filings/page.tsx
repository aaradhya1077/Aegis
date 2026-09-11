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
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  IconSearch,
  IconFileText,
  IconUpload,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconPlus,
  IconDownload,
  IconFileCertificate,
  IconSparkles,
} from "@tabler/icons-react";
import {
  fetchFilings,
  fetchMines,
  fetchRegulations,
  uploadFiling,
  getReportsCsvUrl,
} from "@/lib/api";
import { toast } from "sonner";
import { DocumentAuditDiff } from "@/components/document-audit-diff";

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  compliant: { color: "#10B981", icon: IconCheck, label: "Compliant" },
  overdue: { color: "#EF4444", icon: IconAlertTriangle, label: "Overdue" },
  missing: { color: "#6B7280", icon: IconClock, label: "Missing" },
  flagged: { color: "#F59E0B", icon: IconAlertTriangle, label: "Flagged" },
  pending: { color: "#8B5CF6", icon: IconClock, label: "Pending" },
};

const FILING_TYPES = [
  "Safety Management Plan",
  "Environmental Clearance Compliance Report",
  "Annual Safety Report",
  "Medical Examination Report",
  "Mine Closure Plan",
  "Ventilation Plan",
  "Strata Control Plan",
  "Dust Suppression Report",
  "Worker Welfare Report",
  "Production & Development Report",
];

export default function FilingsPage() {
  const [filings, setFilings] = useState<any[]>([]);
  const [mines, setMines] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedMineId, setSelectedMineId] = useState("");
  const [selectedRegId, setSelectedRegId] = useState("");
  const [selectedType, setSelectedType] = useState(FILING_TYPES[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [diffModalOpen, setDiffModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    fetchFilings().then((r) => setFilings(r.filings || [])).catch(console.error);
    fetchMines().then((r) => {
      setMines(r.mines || []);
      if (r.mines?.length > 0) setSelectedMineId(r.mines[0].id);
    }).catch(console.error);
    fetchRegulations().then((regs) => {
      setRegulations(regs || []);
      if (regs?.length > 0) setSelectedRegId(regs[0].id);
    }).catch(console.error);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMineId || !selectedRegId || !selectedType) {
      toast.error("Please select a mine, regulation, and filing type.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("mine_id", selectedMineId);
      formData.append("regulation_id", selectedRegId);
      formData.append("filing_type", selectedType);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await uploadFiling(formData);
      toast.success(
        `Filing uploaded! Status: ${res.status.toUpperCase()} (OCR Confidence: ${(res.ocr_confidence * 100).toFixed(0)}%)`
      );
      setUploadOpen(false);
      setSelectedFile(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload filing");
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = filings
    .filter((f) =>
      f.filing_type.toLowerCase().includes(search.toLowerCase()) ||
      f.mine_id.toLowerCase().includes(search.toLowerCase()) ||
      (f.source_filename || "").toLowerCase().includes(search.toLowerCase())
    )
    .filter((f) => !statusFilter || f.status === statusFilter);

  const statusCounts = filings.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IconFileCertificate className="text-primary" size={28} />
            Statutory Filings Repository
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filings.length} filings tracked across {mines.length} monitored coal mines
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Neuro-Symbolic AI Scorecard Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDiffModalOpen(true)}
            className="gap-1.5 text-xs border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
          >
            <IconSparkles size={14} className="text-emerald-400" />
            Neuro-Symbolic Diff Scorecard
          </Button>

          {/* Download CSV Report Button */}
          <a href={getReportsCsvUrl()} target="_blank" rel="noopener noreferrer" download>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <IconDownload size={14} />
              Export CSV Dossier
            </Button>
          </a>

          {/* Upload Filing Dialog */}
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                <IconPlus size={15} />
                Upload Statutory Filing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md border-white/15 bg-[#0e1319] text-foreground">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  <IconUpload className="h-4 w-4 text-emerald-400" />
                  Upload Statutory Filing & Run AI Verification
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ingests statutory evidence, executes OCR keyword cross-referencing, and logs to the compliance ledger.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleUploadSubmit} className="space-y-3.5 mt-2 text-xs">
                <div>
                  <Label className="text-xs text-neutral-300">Target Colliery</Label>
                  <select
                    className="w-full mt-1 h-9 rounded-md border border-white/15 bg-white/5 px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    value={selectedMineId}
                    onChange={(e) => setSelectedMineId(e.target.value)}
                  >
                    {mines.map((m) => (
                      <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                        {m.name} ({m.subsidiary})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-neutral-300">Statutory Regulation Clause</Label>
                  <select
                    className="w-full mt-1 h-9 rounded-md border border-white/15 bg-white/5 px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    value={selectedRegId}
                    onChange={(e) => setSelectedRegId(e.target.value)}
                  >
                    {regulations.map((r) => (
                      <option key={r.id} value={r.id} className="bg-neutral-900 text-white">
                        {r.act_name}: {r.clause_number} — {r.filing_type_required}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-neutral-300">Filing Document Type</Label>
                  <select
                    className="w-full mt-1 h-9 rounded-md border border-white/15 bg-white/5 px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    {FILING_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-neutral-900 text-white">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-neutral-300">Document File (PDF / DOCX)</Label>
                  <Input
                    type="file"
                    className="mt-1 h-9 text-xs border-white/15 bg-white/5 file:text-xs file:text-neutral-300"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Optional. If no file is attached, synthetic statutory evidence will be auto-generated for testing.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isUploading}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isUploading ? "Verifying..." : "Upload & Analyze"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status summary buttons */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl border border-white/10 bg-[#0e141d] shadow-sm">
        <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">Filter Status:</span>
        {Object.entries(statusCounts).map(([status, count]) => {
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
          const isSelected = statusFilter === status;
          return (
            <Button
              key={status}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(isSelected ? null : status)}
              className={`gap-1.5 text-xs h-8 font-semibold transition-all duration-150 ${
                isSelected
                  ? "text-white shadow-xs"
                  : "border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10"
              }`}
              style={
                isSelected
                  ? { backgroundColor: config.color, borderColor: config.color }
                  : {}
              }
            >
              <config.icon size={14} />
              {config.label}: {Number(count)}
            </Button>
          );
        })}
        {statusFilter && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter(null)} className="text-xs text-muted-foreground hover:text-white h-8">
            Clear Filter
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by filing type, mine ID, or filename..."
          className="pl-9 h-9 text-xs border-white/10 bg-[#0e141d] text-white placeholder:text-muted-foreground focus:border-emerald-500 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filing list */}
      <div className="space-y-2.5">
        {filtered.slice(0, 50).map((filing) => {
          const config = STATUS_CONFIG[filing.status] || STATUS_CONFIG.pending;
          return (
            <Card
              key={filing.id}
              className="border-white/10 bg-[#0e141d] hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
              style={{ borderLeftWidth: "3px", borderLeftColor: config.color }}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: config.color + "18" }}
                  >
                    <IconFileText size={18} style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{filing.filing_type}</span>
                      <Badge
                        className="text-[10px] px-2 py-0.5 font-mono font-bold uppercase"
                        style={{
                          backgroundColor: config.color + "15",
                          color: config.color,
                          border: `1px solid ${config.color}35`,
                        }}
                      >
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono text-neutral-300 font-semibold">{filing.mine_id}</span>
                      <span>·</span>
                      <span>Due: {filing.due_date ? new Date(filing.due_date).toLocaleDateString("en-IN") : "Annual"}</span>
                      {filing.ocr_confidence && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-400 font-mono">OCR: {(filing.ocr_confidence * 100).toFixed(0)}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  {filing.source_filename && (
                    <span className="text-xs text-muted-foreground truncate max-w-[150px] hidden lg:inline font-mono">
                      {filing.source_filename}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-xs">
          No filings match your search criteria.
        </div>
      )}
      {filtered.length > 50 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing 50 of {filtered.length} filings
        </p>
      )}

      {/* Neuro-Symbolic Document Verification Diff Modal */}
      <DocumentAuditDiff
        open={diffModalOpen}
        onOpenChange={setDiffModalOpen}
        initialFilingType={selectedType}
      />
    </div>
  );
}
