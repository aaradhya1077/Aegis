"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { IconShieldCheck, IconClock } from "@tabler/icons-react";
import { useEffect, useState } from "react";

const TITLE_MAP: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Executive Compliance Dashboard", subtitle: "Real-time compliance monitoring across all Indian coal mines" },
  "/mines": { title: "Mine Registry & Risk Radar", subtitle: "30 mines indexed across 6 coal-producing states" },
  "/filings": { title: "Statutory Filings Repository", subtitle: "Audited safety, environmental & labor returns" },
  "/compliance": { title: "Regulatory Cross-Reference Engine", subtitle: "Clause-level statutory compliance verification" },
  "/forecasts": { title: "Deadline Risk Forecaster", subtitle: "Predictive filing compliance alerts & trend analytics" },
  "/knowledge-graph": { title: "Regulatory Knowledge Graph", subtitle: "Interactive graph of acts, clauses, obligations & mine relations" },
  "/chatbot": { title: "Regulatory Intelligence Assistant", subtitle: "AI-powered legal & compliance query assistant" },
};

import { SihJuryPanel } from "@/components/sih-jury-panel";
import { StakeholderSwitcher } from "@/components/stakeholder-switcher";

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
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-white/10 bg-[#0b0f14]/85 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) sticky top-0 z-30">
      <div className="flex w-full items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator
            orientation="vertical"
            className="mx-1 h-4 bg-white/10 hidden sm:block"
          />
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-foreground tracking-tight truncate">
              {pageInfo.title}
            </h1>
            <Badge variant="outline" className="hidden xl:inline-flex text-[10px] text-muted-foreground border-white/10">
              Shift II • 14:00 - 22:00 IST
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {now && (
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-muted-foreground">
              <IconClock className="h-3 w-3 text-muted-foreground" />
              <span>{now}</span>
            </div>
          )}

          {/* Active Stakeholder Persona Switcher */}
          <StakeholderSwitcher />

          {/* SIH 2026 Jury Evaluator Mode */}
          <SihJuryPanel />
        </div>
      </div>
    </header>
  );
}
