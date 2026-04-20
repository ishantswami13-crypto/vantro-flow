import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import OnboardingGuard from "@/components/OnboardingGuard";
import { getDefaultOrganizationProfile } from "@/lib/organization-profile";

export const metadata: Metadata = {
  title: "Vantro Flow - Collections OS",
  description: "AI-powered collections management for Indian MSMEs",
};

const fallbackProfile = {
  id: 1,
  name: "Vantro Flow",
  contactName: null,
  email: null,
  businessType: null,
  companyScale: null,
  selectedModules: [] as import("@/lib/onboarding-config").FeatureModuleId[],
  onboardingCompleted: false,
  city: null,
  state: null,
  plan: "free",
} as const;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationProfile = await getDefaultOrganizationProfile().catch(() => fallbackProfile);

  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar organizationProfile={organizationProfile} />
        <OnboardingGuard>{children}</OnboardingGuard>
        <Analytics />
      </body>
    </html>
  );
}
