import { Suspense } from "react";
import { Login1 } from "@/components/login1";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ role: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { role } = await params;
  const titles: Record<string, string> = {
    regulator: "DGMS Regulator Portal Sign In",
    "mine-officer": "Colliery Safety Manager Portal Sign In",
    mine_officer: "Colliery Safety Manager Portal Sign In",
    frontline: "Frontline Mining Sirdar Portal Sign In",
    admin: "Platform Administrator Sign In",
  };

  const title = titles[role.toLowerCase()] || "Statutory Colliery Sign In";

  return {
    title: `${title} | Aegis Mining Compliance`,
    description: `Secure statutory gateway login for ${title}.`,
  };
}

export default async function StakeholderSignInPage({ params }: PageProps) {
  const { role } = await params;

  return (
    <main>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#070b10] flex items-center justify-center text-neutral-400">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 mr-3" />
            <span className="text-sm font-mono">Loading Stakeholder Portal...</span>
          </div>
        }
      >
        <Login1 initialRole={role} />
      </Suspense>
    </main>
  );
}
