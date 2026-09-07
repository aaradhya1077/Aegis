"use client";

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
    badge: "Groq",
  },
];

export function MobileNavDock() {
  const pathname = usePathname();

  // Do not show dock on the landing/login page
  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-safe"
    >
      <div className="relative mx-auto mb-2 flex h-16 max-w-md items-center justify-around rounded-2xl border border-white/15 bg-[#0b0f14]/90 px-2 py-1 shadow-2xl backdrop-blur-xl ring-1 ring-emerald-500/20">
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
                  ? "text-emerald-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute -top-1 h-1 w-6 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}
              
              <div
                className={cn(
                  "relative flex items-center justify-center rounded-xl p-1.5 transition-all",
                  item.highlight && !isActive && "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30",
                  isActive && "bg-emerald-500/20 text-emerald-300"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[8px] font-bold text-black uppercase">
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
