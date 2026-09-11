"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AegisLogo, AegisLogoWithText } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconShieldCheck,
  IconGraph,
  IconBrain,
  IconTrendingUp,
  IconMessageChatbot,
  IconEye,
  IconArrowRight,
  IconLoader2,
} from "@tabler/icons-react";

const features = [
  {
    icon: IconGraph,
    title: "Regulatory Knowledge Graph",
    description:
      "25+ clauses from Mines Act 1952, Coal Mines Regulations 2017, DGMS circulars, and MoEF&CC conditions encoded as a queryable graph — not a static checklist.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: IconBrain,
    title: "NLP-Based Document Matching",
    description:
      "OCR-extracted filings are matched against clause-specific evidence fields. The system reads the document — you don't tick boxes.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: IconEye,
    title: "Verification Layer",
    description:
      "Goes beyond 'does the filing exist' to 'does it contain the mandated content with substantive evidence.' Catches hollow compliance.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: IconShieldCheck,
    title: "Clause-Level Explainability",
    description:
      "Every risk score traces back to a specific regulation and document passage. Regulators audit the AI's reasoning, not just its output.",
    color: "from-emerald-600 to-green-700",
  },
  {
    icon: IconTrendingUp,
    title: "Deadline Forecasting",
    description:
      "Predicts which mines are trending toward violations based on filing punctuality patterns — early-warning, not just current-status.",
    color: "from-rose-500 to-red-600",
  },
  {
    icon: IconMessageChatbot,
    title: "Regulator Chatbot",
    description:
      'Natural-language Q&A: "Which mines in Jharkhand have overdue EC reports?" — answers grounded in structured compliance data.',
    color: "from-sky-500 to-blue-600",
  },
];

export default function LandingPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();

  async function executeLogin(uid: string, pwd: string) {
    setError("");
    setLoading(true);
    try {
      const data = await login(uid, pwd);
      if (typeof window !== "undefined") {
        if (data?.accessToken) localStorage.setItem("accessToken", data.accessToken);
        const roleMap: Record<string, string> = {
          "REG-001": "regulator",
          "MINE-001": "mine_officer",
          "FIELD-001": "frontline",
          "ADMIN-001": "admin",
        };
        const targetRole = data?.user?.role || roleMap[uid.trim().toUpperCase()] || "regulator";
        const userObj = data?.user || { id: uid, role: targetRole, name: uid === "FIELD-001" ? "Ramesh Mahto (Mining Sirdar)" : uid };
        localStorage.setItem("user", JSON.stringify(userObj));
        window.dispatchEvent(new Event("aegis-user-changed"));
        router.push(`/dashboard?role=${targetRole}`);
      }
    } catch {
      setError("Invalid credentials. Try REG-001, MINE-001, FIELD-001, or ADMIN-001");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await executeLogin(userId, password);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <AegisLogoWithText size={32} />
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Features
            </Button>
            <Button
              size="sm"
              onClick={() => setShowLogin(true)}
              className="bg-primary hover:bg-primary/90"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-300 text-xs font-semibold mb-6 border border-amber-500/25 shadow-sm">
              <IconShieldCheck size={15} className="text-amber-400" />
              <span>Ministry of Coal, Govt. of India • DGMS Dhanbad</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-emerald-400 font-mono">SIH 2026 (ID: SIH1748)</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-5 text-white">
              Autonomous Regulatory Intelligence
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                for Indian Coal Mines
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Replacing manual, paper-heavy audits with continuous automated verification against{" "}
              <span className="text-white font-semibold">
                The Mines Act 1952, Coal Mines Regulations 2017 (CMR 2017), DGMS Circulars & MoEF&CC Clearance Norms
              </span>
              . Powered by FAISS Vector Graph and Groq ultra-low latency hardware acceleration.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-5">
              <Button
                size="lg"
                onClick={() => setShowLogin(true)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg shadow-emerald-900/30"
              >
                Sign In to Portal
                <IconArrowRight size={18} className="ml-2" />
              </Button>
            </div>

            {/* 4 Primary Stakeholder Quick Access Cards */}
            <div className="max-w-5xl mx-auto pt-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  ⚡ Select Primary Stakeholder Persona (SIH 2026):
                </p>
                <Link
                  href="/sign-in"
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-medium"
                >
                  <span>Open Dedicated Sign-In &rarr;</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. DGMS Regulator */}
                <button
                  type="button"
                  onClick={() => executeLogin("REG-001", "pass123")}
                  className="p-4 rounded-xl bg-[#0e141d] hover:bg-[#121a26] border border-white/10 border-l-[3px] border-l-emerald-500 text-left transition-all duration-200 group flex flex-col justify-between shadow-lg hover:shadow-emerald-950/20 hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-emerald-400 text-sm group-hover:text-emerald-300">DGMS Regulator</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono font-bold">REG-001</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">National oversight, high-risk colliery sanctions & Sec. 22(1A) powers</div>
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold mt-3 flex items-center gap-1">
                    Enter as Regulator &rarr;
                  </div>
                </button>

                {/* 2. Colliery Management */}
                <button
                  type="button"
                  onClick={() => executeLogin("MINE-001", "pass123")}
                  className="p-4 rounded-xl bg-[#0e141d] hover:bg-[#121a26] border border-white/10 border-l-[3px] border-l-sky-500 text-left transition-all duration-200 group flex flex-col justify-between shadow-lg hover:shadow-sky-950/20 hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-sky-400 text-sm group-hover:text-sky-300">Colliery Safety Mgr</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-mono font-bold">MINE-001</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Internal safety compliance, CAPA formulation & overdue returns</div>
                  </div>
                  <div className="text-xs text-sky-400 font-semibold mt-3 flex items-center gap-1">
                    Enter as Colliery Mgr &rarr;
                  </div>
                </button>

                {/* 3. Frontline Field Inspector */}
                <button
                  type="button"
                  onClick={() => executeLogin("FIELD-001", "pass123")}
                  className="p-4 rounded-xl bg-[#0e141d] hover:bg-[#121a26] border border-white/10 border-l-[3px] border-l-amber-500 text-left transition-all duration-200 group flex flex-col justify-between shadow-lg hover:shadow-amber-950/20 hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-amber-400 text-sm group-hover:text-amber-300">Frontline Sirdar</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono font-bold">FIELD-001</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Pre-shift gas audits, strata crack logs, berm checks & offline PWA</div>
                  </div>
                  <div className="text-xs text-amber-400 font-semibold mt-3 flex items-center gap-1">
                    Enter as Field Sirdar &rarr;
                  </div>
                </button>

                {/* 4. Platform Administrator */}
                <button
                  type="button"
                  onClick={() => executeLogin("ADMIN-001", "admin123")}
                  className="p-4 rounded-xl bg-[#0e141d] hover:bg-[#121a26] border border-white/10 border-l-[3px] border-l-purple-500 text-left transition-all duration-200 group flex flex-col justify-between shadow-lg hover:shadow-purple-950/20 hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-purple-400 text-sm group-hover:text-purple-300">System Admin</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-mono font-bold">ADMIN-001</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">Merkle Blockchain verification, Knowledge Graph sync & telemetry</div>
                  </div>
                  <div className="text-xs text-purple-400 font-semibold mt-3 flex items-center gap-1">
                    Enter as Admin &rarr;
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto"
          >
            {[
              { value: "30", label: "Mines Monitored", highlight: "text-emerald-400" },
              { value: "25+", label: "Regulation Clauses", highlight: "text-sky-400" },
              { value: "1,300+", label: "Filings Analyzed", highlight: "text-amber-400" },
              { value: "88%", label: "Compliance Rate", highlight: "text-emerald-400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-5 rounded-xl bg-[#0e141d] border border-white/10 shadow-sm"
              >
                <div className={`text-2xl md:text-3xl font-extrabold tracking-tight ${stat.highlight}`}>
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              What Makes This Different
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Not a static document repository. Not a yes/no checklist tool.
              Three capabilities combined that rarely appear together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-[#0e141d] border-white/10 hover:border-white/20 transition-all duration-200 group shadow-sm hover:-translate-y-0.5">
                  <CardHeader className="pb-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}
                    >
                      <feature.icon size={20} className="text-white" />
                    </div>
                    <CardTitle className="text-base font-bold text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data Sources ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-card border-y border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Grounded in Real Data</h2>
          <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
            Regulations sourced from official Indian government publications.
            Synthetic filings modeled on real PARIVESH compliance report
            templates.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              "Mines Act 1952",
              "Coal Mines Regulations 2017",
              "DGMS Safety Circulars",
              "MoEF&CC EC Conditions",
              "data.gov.in Datasets",
              "PARIVESH Portal",
              "CIL Safety Reports",
              "SCCL Compliance Data",
            ].map((source) => (
              <div
                key={source}
                className="px-4 py-3 rounded-lg bg-background border border-border/50 text-muted-foreground"
              >
                {source}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 text-center text-sm text-muted-foreground">
        <AegisLogoWithText size={28} className="justify-center mb-4" />
        <p>
          Built for regulatory accountability. Designed for trust.
        </p>
        <p className="mt-1 text-xs">
          Aegis-Compliance &copy; {new Date().getFullYear()}
        </p>
      </footer>

      {/* ── Login Modal ───────────────────────────────────────────────── */}
      {showLogin && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setShowLogin(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            <Card className="w-full shadow-2xl border-white/15 bg-[#0e141d] text-white backdrop-blur-xl">
              <CardHeader className="text-center pb-3 pt-6">
                <AegisLogo size={44} className="mx-auto mb-2" />
                <CardTitle className="text-xl font-extrabold tracking-tight">Sign In to Aegis</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ministry of Coal & DGMS Statutory Portal
                </p>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="userId" className="text-xs font-semibold text-neutral-300">
                      User Designation ID
                    </Label>
                    <Input
                      id="userId"
                      placeholder="REG-001"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                      className="bg-white/5 border-white/15 text-white h-10 text-sm focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-neutral-300">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/15 text-white h-10 text-sm focus:border-emerald-500"
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                      {error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-10 shadow-lg shadow-emerald-950/40"
                    disabled={loading}
                  >
                    {loading ? (
                      <IconLoader2 size={16} className="animate-spin mr-2" />
                    ) : null}
                    Authorize & Enter
                  </Button>

                  {/* 1-Click Role Presets */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <p className="text-[11px] text-muted-foreground text-center font-semibold tracking-wide uppercase">
                      ⚡ Quick Stakeholder Evaluation Access:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => executeLogin("REG-001", "pass123")}
                        className="text-[10px] px-1 h-10 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 flex flex-col items-center justify-center leading-tight hover:border-emerald-500"
                      >
                        <span className="font-bold">Regulator</span>
                        <span className="text-[9px] text-emerald-400/80 font-mono">REG-001</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => executeLogin("MINE-001", "pass123")}
                        className="text-[10px] px-1 h-10 border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 flex flex-col items-center justify-center leading-tight hover:border-sky-500"
                      >
                        <span className="font-bold">Colliery Mgr</span>
                        <span className="text-[9px] text-sky-400/80 font-mono">MINE-001</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => executeLogin("FIELD-001", "pass123")}
                        className="text-[10px] px-1 h-10 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 flex flex-col items-center justify-center leading-tight hover:border-amber-500"
                      >
                        <span className="font-bold">Frontline Sirdar</span>
                        <span className="text-[9px] text-amber-400/80 font-mono">FIELD-001</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => executeLogin("ADMIN-001", "admin123")}
                        className="text-[10px] px-1 h-10 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 flex flex-col items-center justify-center leading-tight hover:border-purple-500"
                      >
                        <span className="font-bold">Admin</span>
                        <span className="text-[9px] text-purple-400/80 font-mono">ADMIN-001</span>
                      </Button>
                    </div>

                    <div className="pt-2 text-center">
                      <Link
                        href="/sign-in"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Open Full Statutory Stakeholder Gateway &rarr;</span>
                      </Link>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
