"use client";

import * as React from "react";
import {
  IconChartBar,
  IconFileText,
  IconShieldCheck,
  IconBuildingFactory2,
  IconGraph,
  IconTrendingUp,
  IconMessageChatbot,
  IconSettings,
  IconHelp,
  IconMap2,
  IconDeviceMobile,
  IconAlertOctagon,
  IconLink,
  IconUsers,
  IconBook,
  IconPhoneCall,
  IconCpu,
  IconKey,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NavUser } from "@/components/nav-user";
import { AegisLogoWithText } from "@/components/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

interface NavItem {
  title: string;
  url: string;
  icon: any;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const ROLE_NAV: Record<"regulator" | "mine_officer" | "frontline" | "admin", NavGroup[]> = {
  regulator: [
    {
      label: "National Statutory Oversight",
      items: [
        { title: "Executive Dashboard", url: "/dashboard", icon: IconChartBar },
        { title: "GIS Spatial Map", url: "/gis-map", icon: IconMap2 },
        { title: "Violations & Sanctions", url: "/violations", icon: IconAlertOctagon },
        { title: "Compliance Audits", url: "/compliance", icon: IconShieldCheck },
        { title: "Statutory Filings", url: "/filings", icon: IconFileText },
        { title: "Deadline Risk Forecasts", url: "/forecasts", icon: IconTrendingUp },
        { title: "Mines Registry & Ranks", url: "/mines", icon: IconBuildingFactory2 },
      ],
    },
    {
      label: "Legal Intelligence & Integrity",
      items: [
        { title: "Regulatory Knowledge Graph", url: "/knowledge-graph", icon: IconGraph },
        { title: "Blockchain Audit Proof", url: "/audit-trail", icon: IconLink },
        { title: "Regulatory AI Assistant", url: "/chatbot", icon: IconMessageChatbot },
      ],
    },
  ],
  mine_officer: [
    {
      label: "Colliery Management & Safety",
      items: [
        { title: "Mine Operations Dashboard", url: "/dashboard", icon: IconChartBar },
        { title: "Mobile Field Inspector", url: "/inspector", icon: IconDeviceMobile, badge: "GPS" },
        { title: "Violations & CAPA Action", url: "/violations", icon: IconAlertOctagon },
        { title: "Submit Statutory Filings", url: "/filings", icon: IconFileText },
        { title: "Contractors & Welfare", url: "/contractors", icon: IconUsers },
        { title: "GIS Spatial Pit Hazards", url: "/gis-map", icon: IconMap2 },
        { title: "Return Due-Date Forecasts", url: "/forecasts", icon: IconTrendingUp },
      ],
    },
    {
      label: "Guidance & Compliance",
      items: [
        { title: "Colliery Safety AI Assistant", url: "/chatbot", icon: IconMessageChatbot },
      ],
    },
  ],
  frontline: [
    {
      label: "Frontline Shift Supervision",
      items: [
        { title: "Frontline Sirdar Dashboard", url: "/dashboard?role=frontline", icon: IconChartBar, badge: "Live" },
        { title: "Mobile Field Inspector", url: "/inspector", icon: IconDeviceMobile, badge: "PWA/GPS" },
        { title: "Active Hazards & Violations", url: "/violations", icon: IconAlertOctagon },
        { title: "GIS Spatial Pit Hazards", url: "/gis-map", icon: IconMap2 },
        { title: "Shift Safety AI Assistant", url: "/chatbot", icon: IconMessageChatbot },
      ],
    },
    {
      label: "Colliery Overview",
      items: [
        { title: "Mines Registry", url: "/mines", icon: IconBuildingFactory2 },
      ],
    },
  ],
  admin: [
    {
      label: "Platform Telemetry & Security",
      items: [
        { title: "System Telemetry Dashboard", url: "/dashboard", icon: IconChartBar },
        { title: "Blockchain Audit Ledger", url: "/audit-trail", icon: IconLink },
        { title: "Knowledge Graph Ontology", url: "/knowledge-graph", icon: IconGraph },
        { title: "Mines Registry Management", url: "/mines", icon: IconBuildingFactory2 },
      ],
    },
    {
      label: "AI & Engine Services",
      items: [
        { title: "Vector Store & AI Settings", url: "/chatbot", icon: IconMessageChatbot },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const [currentRole, setCurrentRole] = React.useState<"regulator" | "mine_officer" | "frontline" | "admin">("regulator");
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

  // Settings states
  const [apiKey, setApiKey] = React.useState("");
  const [apiUrl, setApiUrl] = React.useState("http://localhost:8000");

  const syncUser = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.role && ROLE_NAV[parsed.role as keyof typeof ROLE_NAV]) {
            setCurrentRole(parsed.role);
            return;
          }
        }
      } catch {}
      setCurrentRole("regulator");
    }
  };

  React.useEffect(() => {
    syncUser();
    const handler = () => syncUser();
    window.addEventListener("aegis-user-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("aegis-user-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setApiKey(localStorage.getItem("groq_api_key") || "");
      setApiUrl(localStorage.getItem("aegis_api_url") || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      if (apiKey) {
        localStorage.setItem("groq_api_key", apiKey.trim());
      } else {
        localStorage.removeItem("groq_api_key");
      }
      if (apiUrl) {
        localStorage.setItem("aegis_api_url", apiUrl.trim());
      } else {
        localStorage.removeItem("aegis_api_url");
      }
    }
    toast.success("Settings saved successfully!");
    setSettingsOpen(false);
  };

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const roleMeta = {
    regulator: {
      name: "DGMS Regulator",
      id: "REG-001",
      roleTag: "Regulator",
      badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    },
    mine_officer: {
      name: "Colliery Safety Manager",
      id: "MINE-001",
      roleTag: "Colliery Mgr",
      badge: "bg-sky-500/10 text-sky-300 border-sky-500/25",
    },
    frontline: {
      name: "Frontline Field Sirdar",
      id: "FIELD-001",
      roleTag: "Field Sirdar",
      badge: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    },
    admin: {
      name: "System Administrator",
      id: "ADMIN-001",
      roleTag: "Admin",
      badge: "bg-purple-500/10 text-purple-300 border-purple-500/25",
    },
  }[currentRole] || {
    name: "DGMS Regulator",
    id: "REG-001",
    roleTag: "Regulator",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  };

  const activeNavGroups = ROLE_NAV[currentRole] || ROLE_NAV.regulator;

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard" onClick={handleLinkClick}>
                  <AegisLogoWithText size={32} />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Active Stakeholder Persona Pill */}
          <div className="px-2 pt-1 group-data-[collapsible=icon]:hidden">
            <div className={`w-full rounded-lg px-2.5 py-1.5 border text-xs flex items-center justify-between ${roleMeta.badge}`}>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full bg-current animate-pulse shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-[11px] leading-tight">{roleMeta.name}</div>
                  <div className="text-[9px] opacity-75 font-mono leading-none mt-0.5">{roleMeta.id}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-current shrink-0 uppercase font-mono">
                {roleMeta.roleTag}
              </Badge>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {activeNavGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-[11px] font-medium tracking-wider text-muted-foreground/80 uppercase px-3 py-2">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className={`transition-all duration-150 rounded-lg px-2.5 py-2 ${
                            isActive
                              ? "bg-[var(--persona-bg,rgba(16,185,129,0.12))] text-[var(--persona-color,#10B981)] font-semibold shadow-xs border-l-2 border-[var(--persona-color,#10B981)]"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                          }`}
                        >
                          <Link href={item.url} onClick={handleLinkClick}>
                            <item.icon className={isActive ? "text-[var(--persona-color,#10B981)] shrink-0" : "shrink-0"} />
                            <span className="truncate">{item.title}</span>
                            {item.badge && (
                              <Badge className="ml-auto text-[9px] py-0.5 px-1.5 bg-[var(--persona-bg)] text-[var(--persona-color,#10B981)] border border-[var(--persona-border)] font-mono font-bold">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="System Settings"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <IconSettings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Statutory Help & Guide"
                    onClick={() => setHelpOpen(true)}
                  >
                    <IconHelp />
                    <span>Statutory Help</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md border-white/15 bg-[#0e1319] text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <IconSettings className="h-4 w-4 text-primary" />
              Platform Settings & AI Configuration
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure backend services and Groq hardware acceleration keys.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className="space-y-4 mt-2 text-xs">
            <div>
              <Label className="text-xs text-neutral-300">FastAPI Backend Endpoint</Label>
              <Input
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="mt-1 h-9 text-xs border-white/15 bg-white/5 font-mono text-neutral-300"
                disabled
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Default local gateway: http://localhost:8000
              </p>
            </div>

            <div>
              <Label className="text-xs text-neutral-300 flex items-center gap-1.5">
                <IconKey className="h-3.5 w-3.5 text-amber-400" />
                Custom Groq API Key (Optional)
              </Label>
              <Input
                type="password"
                placeholder="gsk_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1 h-9 text-xs border-white/15 bg-white/5 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Used for hardware-accelerated LLaMA-3.3-70B synthesis. If empty, local extractive RAG will be used.
              </p>
            </div>

            <div className="rounded-lg bg-white/5 border border-white/10 p-2.5 space-y-1">
              <div className="font-semibold text-white">System Telemetry</div>
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Merkle Ledger:</span>
                <span className="text-emerald-400 font-mono">SHA-256 Active</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Vector Engine:</span>
                <span className="text-cyan-400 font-mono">FAISS IndexFlatIP</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save Preferences
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Statutory Help Modal */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-lg border-white/15 bg-[#0e1319] text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <IconBook className="h-4 w-4 text-emerald-400" />
              Indian Coal Mining Statutory Quick Reference
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Core statutory regulations indexed and enforced by Aegis-Compliance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2 text-xs max-h-[60vh] overflow-y-auto pr-1">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="font-bold text-white text-xs">Coal Mines Regulations, 2017 (CMR 2017)</div>
              <ul className="mt-1 list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                <li><strong>Reg. 104:</strong> Safety Management Plan (SMP) — Hazard identification & emergency plans.</li>
                <li><strong>Reg. 106:</strong> Opencast highwall slope stability (Permissible overall slope angle &le; 45°).</li>
                <li><strong>Reg. 124:</strong> Dust control & suppression — water sprayers on haul roads.</li>
                <li><strong>Reg. 153:</strong> Mine ventilation — CH4 cutoff interlock when methane &ge; 0.75%.</li>
              </ul>
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="font-bold text-white text-xs">The Mines Act, 1952</div>
              <ul className="mt-1 list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                <li><strong>Section 22 / 22A:</strong> DGMS powers to prohibit employment & issue stop-work orders.</li>
                <li><strong>Section 23:</strong> Notice of accidents / dangerous occurrences within 24 hours (Form IV).</li>
                <li><strong>Section 72B & 73:</strong> Penal provisions and statutory fines for non-compliance.</li>
              </ul>
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="font-bold text-white text-xs">Emergency Contacts & Support</div>
              <div className="mt-1 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5">
                  <IconPhoneCall className="h-3.5 w-3.5 text-amber-400" />
                  <span>DGMS National Emergency Control Room: 0326-2221234 (Dhanbad)</span>
                </div>
                <div>Ministry of Coal Support: helpdesk-mining@gov.in</div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHelpOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
