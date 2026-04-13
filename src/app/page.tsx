export const dynamic = 'force-dynamic';

import DashboardShell from "@/components/dashboard/DashboardShell";

export default function HomePage() {
  return (
    <main className="min-h-screen pt-16" style={{ background: "var(--bg-base)" }}>
      <DashboardShell />
    </main>
  );
}
