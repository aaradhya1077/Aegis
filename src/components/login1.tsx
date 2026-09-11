"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AegisLogoWithText } from "@/components/logo";
import { login } from "@/lib/api";
import {
  IconShieldCheck,
  IconHelmet,
  IconPick,
  IconSettings,
  IconLock,
  IconEye,
  IconEyeOff,
  IconUserCheck,
  IconArrowLeft,
  IconBolt,
  IconCheck,
  IconLoader2,
  IconSparkles,
} from "@tabler/icons-react";
import { toast } from "sonner";

export type StakeholderRole = "regulator" | "mine_officer" | "frontline" | "admin";

export interface StakeholderConfig {
  role: StakeholderRole;
  id: string;
  name: string;
  defaultPass: string;
  title: string;
  badgeLabel: string;
  department: string;
  statutoryScope: string;
  mandates: string[];
  theme: {
    accentText: string;
    accentBg: string;
    border: string;
    borderActive: string;
    glow: string;
    button: string;
    ring: string;
    tabActive: string;
  };
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

export const STAKEHOLDER_DATA: Record<StakeholderRole, StakeholderConfig> = {
  regulator: {
    role: "regulator",
    id: "REG-001",
    name: "Dr. Priya Sharma",
    defaultPass: "pass123",
    title: "DGMS National Regulator",
    badgeLabel: "DGMS Dhanbad Command",
    department: "Directorate General of Mines Safety • Govt. of India",
    statutoryScope: "Pan-India Statutory Oversight & Section 22(1A) Emergency Prohibitions",
    mandates: [
      "Mines Act 1952 Sec. 22(1A) Prohibition Powers",
      "CMR 2017 Reg. 153 Methane Threshold Enforcement",
      "Nationwide Colliery Risk Ranking & Penalty Sanctions",
    ],
    theme: {
      accentText: "text-emerald-400",
      accentBg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      borderActive: "border-emerald-500",
      glow: "bg-emerald-500/15",
      button: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25",
      ring: "focus-visible:ring-emerald-500",
      tabActive: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    },
    icon: IconShieldCheck,
  },
  mine_officer: {
    role: "mine_officer",
    id: "MINE-001",
    name: "Rajesh Kumar",
    defaultPass: "pass123",
    title: "Colliery Safety & Compliance Manager",
    badgeLabel: "Colliery Management",
    department: "Coal India Limited • Colliery Safety & Environmental Cell",
    statutoryScope: "Internal Safety Audits, CAPA Formulations & SMP Execution",
    mandates: [
      "Safety Management Plan (SMP) Form IV Verification",
      "Corrective Action Plans (CAPA) Submission & Tracking",
      "MoEF&CC Environmental Clearance Punctuality Logs",
    ],
    theme: {
      accentText: "text-sky-400",
      accentBg: "bg-sky-500/10",
      border: "border-sky-500/30",
      borderActive: "border-sky-500",
      glow: "bg-sky-500/15",
      button: "bg-sky-600 hover:bg-sky-500 shadow-sky-600/25",
      ring: "focus-visible:ring-sky-500",
      tabActive: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    },
    icon: IconHelmet,
  },
  frontline: {
    role: "frontline",
    id: "FIELD-001",
    name: "Ramesh Mahto",
    defaultPass: "pass123",
    title: "Frontline Mining Sirdar / Field Inspector",
    badgeLabel: "Shift Safety Supervision",
    department: "Frontline Shift Operations • Underground & Opencast Pit",
    statutoryScope: "Pre-Shift Gas Audits, Strata Convergence & Haul Road Berm Inspections",
    mandates: [
      "CMR 2017 Reg. 113 Statutory Pre-Shift Gas Audits",
      "Tell-Tale Extensometer & Strata Convergence Logs",
      "Offline PWA Field Hazard Reporting & Rapid Sync",
    ],
    theme: {
      accentText: "text-amber-400",
      accentBg: "bg-amber-500/10",
      border: "border-amber-500/30",
      borderActive: "border-amber-500",
      glow: "bg-amber-500/15",
      button: "bg-amber-600 hover:bg-amber-500 shadow-amber-600/25",
      ring: "focus-visible:ring-amber-500",
      tabActive: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    },
    icon: IconPick,
  },
  admin: {
    role: "admin",
    id: "ADMIN-001",
    name: "System Administrator",
    defaultPass: "admin123",
    title: "Platform Operations & IT Administrator",
    badgeLabel: "Central IT & Operations",
    department: "Ministry of Coal • Central Enterprise IT Operations",
    statutoryScope: "Merkle Blockchain Integrity, Knowledge Graph Sync & System Telemetry",
    mandates: [
      "SHA-256 Merkle Ledger Chain Cryptographic Verification",
      "NetworkX Regulatory Knowledge Graph Re-Indexing",
      "User Role Governance & API Microservice Telemetry",
    ],
    theme: {
      accentText: "text-purple-400",
      accentBg: "bg-purple-500/10",
      border: "border-purple-500/30",
      borderActive: "border-purple-500",
      glow: "bg-purple-500/15",
      button: "bg-purple-600 hover:bg-purple-500 shadow-purple-600/25",
      ring: "focus-visible:ring-purple-500",
      tabActive: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    },
    icon: IconSettings,
  },
};

const ROLE_KEYS: StakeholderRole[] = ["regulator", "mine_officer", "frontline", "admin"];

interface Login1Props {
  initialRole?: StakeholderRole | string;
}

export function Login1({ initialRole }: Login1Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Normalize initial role from props or URL
  const resolveRole = (val?: string | null): StakeholderRole => {
    if (!val) return "regulator";
    const clean = val.toLowerCase().replace("-", "_");
    if (clean === "regulator" || clean === "mine_officer" || clean === "frontline" || clean === "admin") {
      return clean;
    }
    if (clean === "colliery" || clean === "manager" || clean === "mine") return "mine_officer";
    if (clean === "sirdar" || clean === "field" || clean === "inspector") return "frontline";
    return "regulator";
  };

  const [activeRole, setActiveRole] = useState<StakeholderRole>(() => {
    return resolveRole(initialRole || searchParams?.get("role"));
  });

  const activeConfig = STAKEHOLDER_DATA[activeRole];

  const [userId, setUserId] = useState(activeConfig.id);
  const [password, setPassword] = useState(activeConfig.defaultPass);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync credentials when active role changes
  const switchRole = (role: StakeholderRole) => {
    setActiveRole(role);
    const cfg = STAKEHOLDER_DATA[role];
    setUserId(cfg.id);
    setPassword(cfg.defaultPass);
    setError(null);
  };

  // Sync if initialRole prop or URL search param changes
  useEffect(() => {
    const urlRole = searchParams?.get("role");
    if (urlRole) {
      const resolved = resolveRole(urlRole);
      if (resolved !== activeRole) {
        switchRole(resolved);
      }
    }
  }, [searchParams]);

  const executeLogin = async (uid: string, pwd: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await login(uid, pwd);
      if (typeof window !== "undefined") {
        if (data?.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
        }
        const roleMap: Record<string, string> = {
          "REG-001": "regulator",
          "MINE-001": "mine_officer",
          "FIELD-001": "frontline",
          "ADMIN-001": "admin",
        };
        const targetRole = data?.user?.role || roleMap[uid.trim().toUpperCase()] || activeRole;
        const userObj = data?.user || { id: uid, role: targetRole, name: uid === "FIELD-001" ? "Ramesh Mahto (Mining Sirdar)" : activeConfig.title };
        localStorage.setItem("user", JSON.stringify(userObj));
        window.dispatchEvent(new Event("aegis-user-changed"));
      }

      const roleMap: Record<string, string> = {
        "REG-001": "regulator",
        "MINE-001": "mine_officer",
        "FIELD-001": "frontline",
        "ADMIN-001": "admin",
      };
      const targetRole = data?.user?.role || roleMap[uid.trim().toUpperCase()] || activeRole;

      toast.success(`Authenticated as ${data?.user?.name || activeConfig.title}`, {
        description: `Active Statutory Scope: ${activeConfig.badgeLabel}`,
      });

      router.push(`/dashboard?role=${targetRole}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Statutory authentication failed";
      setError(message);
      toast.error("Authentication Failed", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(userId, password);
  };

  const handleInstantDemoLogin = async (roleKey: StakeholderRole) => {
    switchRole(roleKey);
    const cfg = STAKEHOLDER_DATA[roleKey];
    await executeLogin(cfg.id, cfg.defaultPass);
  };

  const ActiveIcon = activeConfig.icon;

  return (
    <section className="min-h-screen bg-[#070b10] text-foreground flex items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Dynamic Ambient Background Glows tailored to active stakeholder */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] ${activeConfig.theme.glow} rounded-full blur-[140px] pointer-events-none transition-all duration-700`}
      />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 py-6">
        {/* Top Header & Branding */}
        <div className="flex flex-col items-center mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors mb-4 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-white/20"
          >
            <IconArrowLeft size={14} />
            <span>Return to Public Colliery Portal</span>
          </Link>

          <AegisLogoWithText size={42} />
          <div className="inline-flex items-center gap-2 mt-2.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Statutory Colliery Authentication Gateway • SIH 2026</span>
          </div>
        </div>

        {/* ── 4-Stakeholder Persona Switcher Ribbon ─────────────────────── */}
        <div className="mb-4 bg-[#0d131b]/90 border border-white/10 rounded-2xl p-1.5 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between px-3 py-1.5 mb-1 text-[11px] text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <IconSparkles size={13} className={activeConfig.theme.accentText} />
              Select Statutory Stakeholder Persona (4 Portals):
            </span>
            <span className="font-mono text-[10px] hidden sm:inline text-neutral-400">
              Active: <strong className={activeConfig.theme.accentText}>{activeConfig.id}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {ROLE_KEYS.map((rKey) => {
              const item = STAKEHOLDER_DATA[rKey];
              const isSelected = activeRole === rKey;
              const IconComp = item.icon;

              return (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => switchRole(rKey)}
                  className={`relative p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? `${item.theme.tabActive} shadow-lg font-semibold`
                      : "border-white/5 bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/[0.06] hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <IconComp size={16} className={isSelected ? item.theme.accentText : "text-neutral-400"} />
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-neutral-300 border border-white/5">
                      {item.id}
                    </span>
                  </div>
                  <div className="text-xs font-semibold leading-tight line-clamp-1">
                    {rKey === "regulator" && "DGMS Regulator"}
                    {rKey === "mine_officer" && "Mine Officer"}
                    {rKey === "frontline" && "Frontline Sirdar"}
                    {rKey === "admin" && "Administrator"}
                  </div>
                  <div className="text-[10px] opacity-75 truncate mt-0.5">
                    {item.badgeLabel}
                  </div>
                  {isSelected && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute inset-0 border-2 rounded-xl pointer-events-none"
                      style={{ borderColor: "currentColor" }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Login Card ─────────────────────────────────────────── */}
        <div className="bg-[#0f1621]/95 border border-white/10 rounded-2xl p-5 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          {/* Subtle Persona Accent Header Line */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 transition-all duration-500 ${
              activeRole === "regulator"
                ? "bg-emerald-500"
                : activeRole === "mine_officer"
                ? "bg-sky-500"
                : activeRole === "frontline"
                ? "bg-amber-500"
                : "bg-purple-500"
            }`}
          />

          {/* Active Persona Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${activeConfig.theme.accentBg} ${activeConfig.theme.border} border shadow-inner`}>
                <ActiveIcon size={26} className={activeConfig.theme.accentText} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                    {activeConfig.title}
                  </h2>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${activeConfig.theme.accentBg} ${activeConfig.theme.accentText} ${activeConfig.theme.border}`}>
                    {activeConfig.id}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeConfig.department}
                </p>
              </div>
            </div>

            {/* Instant 1-Click Fast Fill Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleInstantDemoLogin(activeRole)}
              disabled={loading}
              className={`h-9 text-xs font-semibold border ${activeConfig.theme.border} ${activeConfig.theme.accentBg} hover:${activeConfig.theme.accentBg} ${activeConfig.theme.accentText} transition-all duration-150 flex items-center gap-1.5 shadow-sm`}
            >
              <IconBolt size={14} className="animate-pulse" />
              <span>1-Click Instant Login</span>
            </Button>
          </div>

          {/* Persona Statutory Jurisdiction & Legal Mandates */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 mb-5 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-neutral-300">Authorized Legal Jurisdiction:</span>
              <span className={`font-mono text-[10px] ${activeConfig.theme.accentText}`}>
                Mandate Level: Certified
              </span>
            </div>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              {activeConfig.statutoryScope}
            </p>
            <div className="pt-1.5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px] text-neutral-400">
              {activeConfig.mandates.map((mandate, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <IconCheck size={11} className={`${activeConfig.theme.accentText} shrink-0`} />
                  <span className="truncate">{mandate}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <IconUserCheck size={14} className={activeConfig.theme.accentText} />
                  Officer ID / Statutory Designation
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Default: <span className="text-white">{activeConfig.id}</span>
                </span>
              </div>
              <Input
                type="text"
                placeholder="e.g. REG-001, MINE-001, FIELD-001, ADMIN-001"
                className={`bg-black/40 border-white/15 text-white font-mono text-sm h-10 ${activeConfig.theme.ring}`}
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <IconLock size={14} className={activeConfig.theme.accentText} />
                  Statutory Password
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Default: <span className="text-white">{activeConfig.defaultPass}</span>
                </span>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`bg-black/40 border-white/15 text-white text-sm h-10 pr-10 ${activeConfig.theme.ring}`}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
                <span className="font-semibold">Authentication Error:</span>
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                type="submit"
                className={`w-full ${activeConfig.theme.button} text-white font-semibold h-11 transition-all flex items-center justify-center gap-2`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <IconLoader2 size={16} className="animate-spin" />
                    <span>Verifying Statutory Role...</span>
                  </>
                ) : (
                  <>
                    <IconShieldCheck size={16} />
                    <span>Authenticate & Enter Portal</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleInstantDemoLogin(activeRole)}
                className={`w-full border ${activeConfig.theme.border} bg-white/[0.03] hover:bg-white/[0.08] text-white font-medium h-11 transition-all flex items-center justify-center gap-1.5`}
                disabled={loading}
              >
                <IconBolt size={16} className={activeConfig.theme.accentText} />
                <span>Instant 1-Click Entry ({activeConfig.id})</span>
              </Button>
            </div>
          </form>

          {/* ── 4-Stakeholder Quick Access Grid ─────────────────────────── */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <IconBolt size={13} className="text-amber-400" />
                All 4 Stakeholder Access Presets:
              </span>
              <span className="text-[10px] text-neutral-400">Click card for instant login</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLE_KEYS.map((rKey) => {
                const item = STAKEHOLDER_DATA[rKey];
                const isCurrent = activeRole === rKey;
                const IconComp = item.icon;

                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => handleInstantDemoLogin(rKey)}
                    className={`p-2.5 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                      isCurrent
                        ? `${item.theme.borderActive} ${item.theme.accentBg} shadow-md`
                        : `${item.theme.border} bg-white/[0.02] hover:bg-white/[0.05]`
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <IconComp size={15} className={item.theme.accentText} />
                        <span className="text-[9px] font-mono font-bold text-neutral-400">
                          {item.id}
                        </span>
                      </div>
                      <div className="font-bold text-[11px] text-white group-hover:underline line-clamp-1">
                        {rKey === "regulator" && "DGMS Regulator"}
                        {rKey === "mine_officer" && "Colliery Mgr"}
                        {rKey === "frontline" && "Mining Sirdar"}
                        {rKey === "admin" && "Administrator"}
                      </div>
                      <div className="text-[9px] text-neutral-400 truncate mt-0.5">
                        {item.name}
                      </div>
                    </div>
                    <div className={`text-[9px] font-semibold mt-2 flex items-center gap-1 ${item.theme.accentText}`}>
                      <span>⚡ Instant Login</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info badge */}
        <div className="mt-5 text-center text-[11px] text-neutral-400 flex flex-wrap items-center justify-center gap-2">
          <span>Protected by AES-256 GCM & JWT Role Verification</span>
          <span>•</span>
          <span>Directorate General of Mines Safety (DGMS)</span>
          <span>•</span>
          <span className="text-emerald-400">Ministry of Coal, GoI</span>
        </div>
      </div>
    </section>
  );
}

export default Login1;