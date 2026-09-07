"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { MobileNavDock } from "@/components/mobile-nav-dock";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
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
      <SidebarInset>
        {/* Header */}
        <SiteHeader />

        {/* Children = every dashboard page */}
        <div className="flex flex-1 flex-col gap-4 p-3 pb-24 sm:p-4 sm:pb-24 md:gap-6 md:p-6 lg:p-8 md:pb-8 max-w-full overflow-x-hidden">
          {children}
        </div>
      </SidebarInset>

      {/* Mobile Floating Bottom Navigation */}
      <MobileNavDock />
    </SidebarProvider>
  );
}
