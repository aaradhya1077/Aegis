"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconLink,
  IconShieldCheck,
  IconCheck,
  IconClock,
  IconRefresh,
  IconLock,
  IconCpu,
  IconArrowsExchange,
  IconBug,
} from "@tabler/icons-react";
import {
  fetchAuditBlocks,
  verifyAuditChain,
  tamperAuditLedger,
  restoreAuditLedger,
  AuditBlock,
} from "@/lib/api";
import { toast } from "sonner";

export default function AuditTrailPage() {
  const [blocks, setBlocks] = useState<AuditBlock[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadLedger();
  }, []);

  const loadLedger = () => {
    fetchAuditBlocks(40).then((r) => setBlocks(r.blocks || [])).catch(console.error);
    verifyChain();
  };

  const verifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyAuditChain();
      setVerification(res);
      if (res.valid) {
        toast.success("Cryptographic SHA-256 Merkle chain verified intact!");
      } else {
        toast.error(`Chain breach detected at block #${res.broken_at_block}`);
      }
    } catch (err: any) {
      toast.error("Failed to verify audit ledger");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamper = async () => {
    setIsVerifying(true);
    try {
      const res = await tamperAuditLedger(1);
      toast.warning(res.message);
      loadLedger();
    } catch {
      toast.error("Tamper simulation failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRestore = async () => {
    setIsVerifying(true);
    try {
      const res = await restoreAuditLedger();
      toast.success(res.message);
      loadLedger();
    } catch {
      toast.error("Restore failed");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <IconLink className="text-primary" size={28} />
            Cryptographic Blockchain Audit Trail
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Immutable SHA-256 Merkle ledger providing tamper-proof evidence for statutory inspections, filings, and resolutions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tamper Test Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleTamper}
            disabled={isVerifying}
            className="border-red-500/40 bg-red-950/20 text-red-300 hover:bg-red-900/40 text-xs gap-1.5"
            title="Test mathematical tamper detection"
          >
            <IconBug size={14} className="text-red-400" />
            Tamper Block #1
          </Button>

          {/* Restore Integrity Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRestore}
            disabled={isVerifying}
            className="border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/40 text-xs gap-1.5"
            title="Restore SHA-256 chain continuity"
          >
            <IconShieldCheck size={14} className="text-emerald-400" />
            Restore Continuity
          </Button>

          <Button
            onClick={verifyChain}
            disabled={isVerifying}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs h-9"
          >
            <IconRefresh size={14} className={isVerifying ? "animate-spin" : ""} />
            {isVerifying ? "Verifying Hashes..." : "Re-Verify Chain"}
          </Button>
        </div>
      </div>

      {/* Verification Status Banner */}
      <Card
        className={`border transition-all bg-[#0e141d] shadow-sm ${
          verification?.valid
            ? "border-emerald-500/30 border-l-[3px] border-l-emerald-500"
            : "border-red-500/30 border-l-[3px] border-l-red-500"
        }`}
      >
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl ${
                verification?.valid ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
              }`}
            >
              <IconShieldCheck size={28} />
            </div>
            <div>
              <div className="font-bold text-lg flex items-center gap-2 text-white">
                <span>{verification?.valid ? "Audit Chain Integrity: 100% Mathematically Valid" : "Tampering Detected"}</span>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs font-mono">
                  SHA-256
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {verification?.message || "Validating cryptographic blocks..."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-muted-foreground block text-[11px]">Total Blocks:</span>
              <span className="font-extrabold text-base text-white">{verification?.total_blocks ?? blocks.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Latest Block Hash:</span>
              <span className="truncate max-w-[140px] block text-purple-400 font-bold" title={verification?.latest_hash}>
                {verification?.latest_hash?.slice(0, 16)}...
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocks Explorer Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          <span>Cryptographic Block History</span>
          <span>Showing Last {blocks.length} Blocks</span>
        </div>

        {blocks.map((block) => (
          <Card key={block.index} className="border-white/10 bg-[#0e141d] hover:border-white/20 transition-all duration-150 border-l-[3px] border-l-purple-500 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-mono text-xs font-bold border border-purple-500/25">
                    Block #{block.index}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[11px] bg-white/5 border border-white/10 text-white">
                    {block.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">by</span>
                  <strong className="text-xs font-semibold text-neutral-200">{block.actor_id}</strong>
                </div>

                <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
                  <IconClock size={13} />
                  {new Date(block.timestamp).toLocaleString("en-IN")}
                </div>
              </div>

              {/* Hash details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Target Entity</span>
                  <span className="font-bold text-white truncate block mt-0.5">{block.entity_id}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Previous Block Hash</span>
                  <span className="text-neutral-400 truncate block mt-0.5" title={block.prev_hash}>
                    {block.prev_hash.slice(0, 24)}...
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <span className="text-[10px] text-purple-400 uppercase tracking-wider block font-semibold">
                    Current Block Hash
                  </span>
                  <span className="font-bold text-purple-300 truncate block mt-0.5" title={block.block_hash}>
                    {block.block_hash.slice(0, 24)}...
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
