import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import CommandPalette from "@/components/CommandPalette";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { ToastProvider } from "@/components/Toast";
import { getDefaultOrganizationProfile } from "@/lib/organization-profile";
import type { FeatureModuleId } from "@/lib/onboarding-config";

export const metadata: Metadata = {
  title: "Vantro Flow — Financial Operations",
  description: "Nova-powered cashflow, receivables, and risk intelligence.",
};

const fallbackProfile = {
  id: 1,
  name: "Vantro Flow",
  contactName: null,
  email: null,
  businessType: null,
  companyScale: null,
  selectedModules: [] as FeatureModuleId[],
  onboardingCompleted: false,
  city: null,
  state: null,
  plan: "starter",
  planExpiresAt: null,
  trialEndsAt: null,
  customerCountLimit: 5,
} as const;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationProfile = await getDefaultOrganizationProfile().catch(() => fallbackProfile);

  return (
    <html lang="en" data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="antialiased">
        <div className="vf-ambient-grid" aria-hidden="true" />
        {/* Skip to main for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          style={{ background: "var(--brand-primary)" }}
        >
          Skip to main content
        </a>
        <ToastProvider>
          <AppShell organizationProfile={organizationProfile}>{children}</AppShell>
          <CommandPalette />
          <KeyboardShortcuts />
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
