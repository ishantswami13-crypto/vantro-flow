import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import OnboardingGuard from "@/components/OnboardingGuard";
import { getDefaultOrganizationProfile } from "@/lib/organization-profile";

export const metadata: Metadata = {
  title: "Vantro Flow - Collections OS",
  description: "AI-powered collections management for Indian MSMEs",
};

const appleFontVars = {
  "--font-syne":
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
  "--font-dm-sans":
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
} as CSSProperties;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationProfile = await getDefaultOrganizationProfile();

  return (
    <html lang="en" style={appleFontVars}>
      <body className="min-h-screen antialiased">
        <Navbar organizationProfile={organizationProfile} />
        <div className="min-h-screen">
          <OnboardingGuard>{children}</OnboardingGuard>
        </div>
      </body>
    </html>
  );
}
