"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { IconClock } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { SihJuryPanel } from "@/components/sih-jury-panel";
import { StakeholderSwitcher } from "@/components/stakeholder-switcher";
import { GoogleLanguageSelector } from "@/components/google-translator";

const TITLE_MAP: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Executive Compliance Dashboard", subtitle: "Real-time compliance monitoring across 30 Indian coal mines" },
  "/mines": { title: "Mine Registry & Risk Radar", subtitle: "30 mines indexed across 6 coal-producing states" },
  "/filings": { title: "Statutory Filings Repository", subtitle: "Audited safety, environmental & labor returns" },
  "/compliance": { title: "Regulatory Cross-Reference Engine", subtitle: "Clause-level statutory compliance verification" },
  "/forecasts": { title: "Deadline Risk Forecaster", subtitle: "Predictive filing compliance alerts & trend analytics" },
  "/knowledge-graph": { title: "Regulatory Knowledge Graph", subtitle: "Interactive graph of acts, clauses, obligations & mine relations" },
  "/chatbot": { title: "Regulatory Intelligence Assistant", subtitle: "AI-powered legal & compliance query assistant" },
  "/violations": { title: "Statutory Violations & CAPA Action", subtitle: "Tracking penalties, sanctions, and corrective remediation" },
  "/gis-map": { title: "National Mining GIS Radar", subtitle: "Spatial colliery telemetry, seam boundaries & pit face hazards" },
  "/inspector": { title: "Mobile Field Safety Inspector", subtitle: "GPS geotagged pit face logging and statutory checklists" },
  "/audit-trail": { title: "Blockchain Immutable Audit Proof", subtitle: "Cryptographic SHA-256 ledger of all regulatory actions" },
  "/contractors": { title: "Contractor Compliance & PME Welfare", subtitle: "Mines Rules 1955 periodic medical examinations & safety audits" },
};

export function SiteHeader() {
  const pathname = usePathname();
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setNow(
        d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) +
          " • " +
          d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const pageInfo = TITLE_MAP[pathname] || {
    title: pathname.replace(/^\//, "").split("/")[0].toUpperCase() || "Aegis-Compliance",
    subtitle: "Indian Mining Regulatory Intelligence System",
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-white/10 bg-[#0b0f14]/90 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) sticky top-0 z-30">
      <div className="flex w-full items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
          <Separator
            orientation="vertical"
            className="mx-1 h-4 bg-white/10 hidden sm:block"
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2.5 min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-foreground tracking-tight truncate">
              {pageInfo.title}
            </h1>
            <span className="hidden 2xl:inline text-[11px] text-muted-foreground truncate border-l border-white/10 pl-2.5">
              {pageInfo.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Badge variant="outline" className="hidden md:inline-flex text-[10px] text-emerald-400/90 border-emerald-500/20 bg-emerald-500/5 font-mono notranslate" translate="no">
            Shift II • 14:00 - 22:00 IST
          </Badge>

          {now && (
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-muted-foreground font-mono notranslate" translate="no">
              <IconClock className="h-3 w-3 text-muted-foreground/70" />
              <span>{now}</span>
            </div>
          )}

          {/* Regional Colliery Language Switcher (Google Translate) */}
          <GoogleLanguageSelector />

          {/* Active Stakeholder Persona Switcher */}
          <StakeholderSwitcher />

          {/* SIH 2026 Jury Evaluator Mode */}
          <SihJuryPanel />
        </div>
      </div>
    </header>
  );
}

