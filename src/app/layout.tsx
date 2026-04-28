import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import CommandPalette from "@/components/CommandPalette";
import { ToastProvider } from "@/components/Toast";
import { getDefaultOrganizationProfile } from "@/lib/organization-profile";
import type { FeatureModuleId } from "@/lib/onboarding-config";

export const metadata: Metadata = {
  title: "Vantro Flow — Financial Operations",
  description: "AI-powered cashflow, receivables, and risk intelligence.",
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
  plan: "free",
} as const;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationProfile = await getDefaultOrganizationProfile().catch(() => fallbackProfile);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vantro-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        <ToastProvider>
          <AppShell organizationProfile={organizationProfile}>{children}</AppShell>
          <CommandPalette />
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
