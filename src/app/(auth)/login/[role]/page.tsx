import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ role: string }>;
}

export default async function LoginRolePage({ params }: PageProps) {
  const { role } = await params;
  redirect(`/sign-in/${role}`);
}
