"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconChartBar,
  IconMap2,
  IconDeviceMobile,
  IconAlertOctagon,
  IconMessageChatbot,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const mobileDockItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconChartBar,
    badge: null,
  },
  {
    title: "GIS Map",
    url: "/gis-map",
    icon: IconMap2,
    badge: "Live",
  },
  {
    title: "Inspector",
    url: "/inspector",
    icon: IconDeviceMobile,
    badge: "GPS",
    highlight: true,
  },
  {
    title: "Violations",
    url: "/violations",
    icon: IconAlertOctagon,
    badge: "CAPA",
  },
  {
    title: "Aegis AI",
    url: "/chatbot",
    icon: IconMessageChatbot,
    badge: "AI",
  },
];

export function MobileNavDock() {
  const pathname = usePathname();
  const [role, setRole] = useState<"regulator" | "mine_officer" | "admin">("regulator");

  useEffect(() => {
    const syncRole = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.role) {
            setRole(parsed.role);
            return;
          }
        }
      } catch {}
      setRole("regulator");
    };

    syncRole();
    window.addEventListener("aegis-user-changed", syncRole);
    window.addEventListener("storage", syncRole);
    return () => {
      window.removeEventListener("aegis-user-changed", syncRole);
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  // Do not show dock on landing or sign-in page
  if (pathname === "/" || pathname === "/sign-in") {
    return null;
  }

  const roleStyles = {
    regulator: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/20 text-emerald-300",
      highlight: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30",
      bar: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
      badge: "bg-emerald-500",
      dockRing: "ring-emerald-500/20",
    },
    mine_officer: {
      text: "text-sky-400",
      bg: "bg-sky-500/20 text-sky-300",
      highlight: "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30",
      bar: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]",
      badge: "bg-sky-500",
      dockRing: "ring-sky-500/20",
    },
    admin: {
      text: "text-purple-400",
      bg: "bg-purple-500/20 text-purple-300",
      highlight: "bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/30",
      bar: "bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]",
      badge: "bg-purple-500",
      dockRing: "ring-purple-500/20",
    },
  }[role];

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-safe"
    >
      <div
        className={cn(
          "relative mx-auto mb-2 flex h-16 max-w-md items-center justify-around rounded-2xl border border-white/15 bg-[#0e141d]/95 px-2 py-1 shadow-2xl backdrop-blur-xl ring-1 transition-all duration-300",
          roleStyles.dockRing
        )}
      >
        {mobileDockItems.map((item) => {
          const isActive = pathname === item.url;
          const Icon = item.icon;

          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition-all",
                isActive
                  ? cn(roleStyles.text, "font-semibold")
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className={cn("absolute -top-1 h-1 w-6 rounded-full", roleStyles.bar)} />
              )}

              <div
                className={cn(
                  "relative flex items-center justify-center rounded-xl p-1.5 transition-all",
                  item.highlight && !isActive && roleStyles.highlight,
                  isActive && roleStyles.bg
                )}
              >
                <Icon className="h-5 w-5" />
                {item.badge && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 flex h-3.5 items-center justify-center rounded-full px-1 text-[8px] font-bold text-black uppercase",
                      roleStyles.badge
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="leading-none tracking-tight">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

