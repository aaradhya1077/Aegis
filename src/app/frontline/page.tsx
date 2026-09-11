"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FrontlineRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "FIELD-001",
          name: "Ramesh Mahto (Mining Sirdar)",
          role: "frontline",
        })
      );
      window.dispatchEvent(new Event("aegis-user-changed"));
      router.replace("/dashboard?role=frontline");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070b10] flex items-center justify-center text-neutral-400">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500 mr-3" />
      <span className="text-sm font-mono">Opening Frontline Mining Sirdar Dashboard...</span>
    </div>
  );
}
