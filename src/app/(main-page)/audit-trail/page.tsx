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
} from "@tabler/icons-react";
import { fetchAuditBlocks, verifyAuditChain, AuditBlock } from "@/lib/api";
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

        <Button
          onClick={verifyChain}
          disabled={isVerifying}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <IconRefresh size={15} className={isVerifying ? "animate-spin" : ""} />
          {isVerifying ? "Verifying Hashes..." : "Re-Verify Chain Continuity"}
        </Button>
      </div>

      {/* Verification Status Banner */}
      <Card
        className={`border transition-all ${
          verification?.valid
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-rose-500/40 bg-rose-500/5"
        }`}
      >
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-full ${
                verification?.valid ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"
              }`}
            >
              <IconShieldCheck size={28} />
            </div>
            <div>
              <div className="font-bold text-lg flex items-center gap-2">
                <span>{verification?.valid ? "Audit Chain Integrity: 100% Mathematically Valid" : "Tampering Detected"}</span>
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 text-xs">
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
              <span className="text-muted-foreground block">Total Blocks:</span>
              <span className="font-bold text-base text-foreground">{verification?.total_blocks ?? blocks.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Latest Block Hash:</span>
              <span className="truncate max-w-[140px] block text-primary" title={verification?.latest_hash}>
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
          <Card key={block.index} className="border-border/60 hover:border-primary/40 transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-xs font-bold">
                    Block #{block.index}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {block.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">by</span>
                  <strong className="text-xs font-semibold text-foreground">{block.actor_id}</strong>
                </div>

                <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
                  <IconClock size={13} />
                  {new Date(block.timestamp).toLocaleString("en-IN")}
                </div>
              </div>

              {/* Hash details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-2 rounded bg-muted/40 border border-border/30">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Target Entity</span>
                  <span className="font-bold text-foreground truncate block">{block.entity_id}</span>
                </div>

                <div className="p-2 rounded bg-muted/40 border border-border/30">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Previous Block Hash</span>
                  <span className="text-muted-foreground truncate block" title={block.prev_hash}>
                    {block.prev_hash.slice(0, 24)}...
                  </span>
                </div>

                <div className="p-2 rounded bg-primary/5 border border-primary/20">
                  <span className="text-[10px] text-primary uppercase tracking-wider block font-semibold">
                    Current Block Hash
                  </span>
                  <span className="font-bold text-primary truncate block" title={block.block_hash}>
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
