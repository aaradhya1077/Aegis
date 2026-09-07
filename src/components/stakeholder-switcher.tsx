"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconShieldCheck,
  IconHelmet,
  IconSettings,
  IconChevronDown,
  IconArrowsExchange,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";

export interface StakeholderProfile {
  id: string;
  name: string;
  role: "regulator" | "mine_officer" | "admin";
  title: string;
  organization: string;
  badgeColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

export const STAKEHOLDERS: Record<string, StakeholderProfile> = {
  regulator: {
    id: "REG-001",
    name: "Dr. Priya Sharma",
    role: "regulator",
    title: "DGMS Director / Regulator",
    organization: "Directorate General of Mines Safety, Dhanbad",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    borderColor: "hover:border-emerald-500/50",
    icon: IconShieldCheck,
  },
  mine_officer: {
    id: "MINE-001",
    name: "Rajesh Kumar",
    role: "mine_officer",
    title: "Mine Safety Manager / Agent",
    organization: "BCCL Colliery Division • Jharia Seam #4",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    borderColor: "hover:border-sky-500/50",
    icon: IconHelmet,
  },
  admin: {
    id: "ADMIN-001",
    name: "System Administrator",
    role: "admin",
    title: "Infrastructure & Platform Admin",
    organization: "Ministry of Coal • Central IT Cell",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    borderColor: "hover:border-purple-500/50",
    icon: IconSettings,
  },
};

export function StakeholderSwitcher({ variant = "header" }: { variant?: "header" | "compact" | "badge" }) {
  const [activeRole, setActiveRole] = React.useState<"regulator" | "mine_officer" | "admin">("regulator");

  const syncUser = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.role && STAKEHOLDERS[parsed.role]) {
            setActiveRole(parsed.role as any);
            return;
          }
        }
      } catch {}
      setActiveRole("regulator");
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

  const handleSwitch = (roleKey: "regulator" | "mine_officer" | "admin") => {
    const profile = STAKEHOLDERS[roleKey];
    if (!profile) return;

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: profile.id,
          name: profile.name,
          role: profile.role,
        })
      );
      window.dispatchEvent(new Event("aegis-user-changed"));
      toast.success(`Switched active stakeholder to ${profile.title}`, {
        description: `Logged in as ${profile.id} (${profile.organization})`,
      });
    }
  };

  const current = STAKEHOLDERS[activeRole] || STAKEHOLDERS.regulator;
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-7 sm:h-8 px-2 sm:px-2.5 gap-1.5 text-xs font-medium border ${current.badgeColor} transition-all shadow-sm`}
        >
          <CurrentIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="font-semibold truncate max-w-[95px] sm:max-w-[140px]">
            {current.title.split("/")[0].trim()}
          </span>
          <Badge
            variant="outline"
            className="hidden sm:inline-flex text-[9px] px-1 py-0 border-current font-mono"
          >
            {current.id}
          </Badge>
          <IconChevronDown className="h-3 w-3 opacity-60 ml-0.5 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72 bg-[#0e141d] border-white/15 text-white p-1.5 shadow-2xl z-50"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between">
          <span className="font-semibold uppercase tracking-wider">Switch Stakeholder Persona</span>
          <IconArrowsExchange className="h-3.5 w-3.5 text-muted-foreground" />
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10 my-1" />

        {(Object.keys(STAKEHOLDERS) as Array<"regulator" | "mine_officer" | "admin">).map((roleKey) => {
          const item = STAKEHOLDERS[roleKey];
          const Icon = item.icon;
          const isSelected = activeRole === roleKey;

          return (
            <DropdownMenuItem
              key={item.id}
              onClick={() => handleSwitch(roleKey)}
              className={`p-2 rounded-lg cursor-pointer my-0.5 flex items-start gap-2.5 transition-colors ${
                isSelected
                  ? "bg-white/10 text-white font-medium"
                  : "text-neutral-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`p-1.5 rounded-md border shrink-0 mt-0.5 ${item.badgeColor}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-white truncate">
                    {item.title}
                  </span>
                  {isSelected && (
                    <IconCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {item.name} • <span className="font-mono text-[9px]">{item.id}</span>
                </div>
                <div className="text-[9px] text-neutral-400 truncate mt-0.5">
                  {item.organization}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
