export const dynamic = 'force-dynamic';
export const revalidate = 0;

import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function HomePage() {
  // Onboarding redirect is handled client-side by OnboardingGuard (localStorage check)
  return (
    <main className="min-h-screen pt-24 sm:pt-28" style={{ background: "var(--bg-base)" }}>
      <DashboardShell />
    </main>
  );
}
