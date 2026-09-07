"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AegisLogoWithText } from "@/components/logo";
import { login } from "@/lib/api";
import { IconShieldCheck, IconLock, IconUserCheck } from "@tabler/icons-react";

export function Login1() {
  const [userId, setUserId] = useState("REG-001");
  const [password, setPassword] = useState("pass123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const executeLogin = async (uid: string, pwd: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await login(uid, pwd);
      if (typeof window !== "undefined") {
        if (data?.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
        }
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        window.dispatchEvent(new Event("aegis-user-changed"));
      }
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(userId, password);
  };

  const handleDemoFill = async (id: string, pass: string, autoSubmit = false) => {
    setUserId(id);
    setPassword(pass);
    if (autoSubmit) {
      await executeLogin(id, pass);
    }
  };

  return (
    <section className="min-h-screen bg-[#0b0f14] text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <AegisLogoWithText size={40} />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Autonomous Regulatory Intelligence & Compliance Verification for Indian Coal Mines
          </p>
        </div>

        <div className="bg-[#121820]/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <IconShieldCheck className="h-5 w-5 text-emerald-400" />
            Portal Sign In
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Enter your statutory credentials to access the audit platform.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Officer ID / Identifier
              </label>
              <div className="relative">
                <IconUserCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="e.g. REG-001, MINE-001"
                  className="pl-9 bg-white/[0.03] border-white/10 text-sm focus-visible:ring-emerald-500 h-10"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Secure Password
              </label>
              <div className="relative">
                <IconLock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 bg-white/[0.03] border-white/10 text-sm focus-visible:ring-emerald-500 h-10"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium h-10 shadow-lg shadow-emerald-600/20 transition-all"
              disabled={loading}
            >
              {loading ? "Verifying Credentials..." : "Authenticate"}
            </Button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <span className="text-[11px] font-medium text-muted-foreground block mb-2">
              Demo Access Accounts:
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill("REG-001", "pass123", true)}
                className="p-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all group"
              >
                <div className="font-semibold text-emerald-300 text-[11px] group-hover:underline">DGMS Regulator</div>
                <div className="text-[10px] text-emerald-400/80 font-mono">REG-001</div>
                <div className="text-[9px] text-emerald-500/80 mt-0.5">⚡ 1-Click Login</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("MINE-001", "pass123", true)}
                className="p-2.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-left transition-all group"
              >
                <div className="font-semibold text-sky-300 text-[11px] group-hover:underline">Mine Officer</div>
                <div className="text-[10px] text-sky-400/80 font-mono">MINE-001</div>
                <div className="text-[9px] text-sky-500/80 mt-0.5">⚡ 1-Click Login</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("ADMIN-001", "admin123", true)}
                className="p-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-left transition-all group"
              >
                <div className="font-semibold text-purple-300 text-[11px] group-hover:underline">Administrator</div>
                <div className="text-[10px] text-purple-400/80 font-mono">ADMIN-001</div>
                <div className="text-[9px] text-purple-500/80 mt-0.5">⚡ 1-Click Login</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Login1;