"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { MobileNavDock } from "@/components/mobile-nav-dock";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { EmergencyAlertBanner } from "@/components/emergency-alert-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<string>("regulator");

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

  return (
    <SidebarProvider
      data-persona={role}
      className={`persona-${role}`}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {/* Sidebar */}
      <AppSidebar variant="inset" />

      {/* Main Content Area */}
      <SidebarInset className="bg-[#0b0f14] min-h-screen">
        {/* Header */}
        <SiteHeader />

        {/* Global Emergency Notification & Siren Broadcast Bar */}
        <EmergencyAlertBanner />

        {/* Children = every dashboard page */}
        <main className="flex flex-1 flex-col gap-4 p-4 pb-24 sm:p-6 sm:pb-24 md:gap-6 md:p-8 md:pb-12 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>

      {/* Mobile Floating Bottom Navigation */}
      <MobileNavDock />
    </SidebarProvider>
  );
}

