import { Suspense } from "react";
import { Login1 } from "@/components/login1";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statutory Portal Sign In | Aegis Mining Compliance",
  description: "Secure role-based statutory authentication gateway for DGMS Regulators, Colliery Safety Managers, Frontline Mining Sirdars, and System Administrators.",
};

export default function SignInPage() {
  return (
    <main>
      <Suspense fallback={
        <div className="min-h-screen bg-[#070b10] flex items-center justify-center text-neutral-400">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 mr-3" />
          <span className="text-sm font-mono">Initializing Statutory Portal...</span>
        </div>
      }>
        <Login1 />
      </Suspense>
    </main>
  );
}