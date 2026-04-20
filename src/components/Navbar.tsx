"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import QuickAddButton from "@/components/QuickAddButton";
import type { OrganizationProfile } from "@/lib/organization-profile";

interface Props {
  organizationProfile: OrganizationProfile;
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar({ organizationProfile }: Props) {
  const pathname = usePathname();

  const [localOnboarded] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!window.localStorage.getItem("vantro_onboarded");
  });

  const [localUserName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("vantro_user_name");
  });

  const isOnboarded = localOnboarded || organizationProfile.onboardingCompleted;

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/customers", label: "Customers" },
    { href: "/analytics", label: "Analytics" },
  ];

  return (
    <nav
      className="flex items-center px-6"
      style={{
        height: "56px",
        background: "var(--white)",
        borderBottom: "1px solid var(--border)",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-8">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold tracking-[0.12em] text-white"
          style={{
            background: "linear-gradient(135deg, var(--teal-dark), var(--teal-primary))",
          }}
        >
          VF
        </div>
        <span
          className="text-xl italic hidden sm:block"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            color: "var(--ink)",
          }}
        >
          Vantro Flow
        </span>
      </Link>

      {/* Nav links */}
      {isOnboarded && (
        <div className="hidden md:flex items-center gap-7 flex-1">
          {navLinks.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className="relative text-sm transition-colors"
                style={{
                  color: active ? "var(--ink)" : "var(--ink-muted)",
                  fontWeight: active ? 500 : 400,
                  paddingBottom: "2px",
                  borderBottom: active ? "2px solid var(--teal-primary)" : "2px solid transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}

      {!isOnboarded && (
        <div
          className="hidden text-xs font-semibold md:inline-flex items-center px-3 py-1 rounded-full"
          style={{
            background: "var(--teal-wash)",
            color: "var(--teal-dark)",
            border: "1px solid rgba(10,143,132,0.15)",
          }}
        >
          Setup in progress
        </div>
      )}

      {/* Right actions */}
      <div className="flex items-center gap-3 ml-auto shrink-0">
        {isOnboarded && (
          <>
            <Link
              href="/upload"
              className="hidden md:inline-flex text-sm font-medium transition-colors"
              style={{ color: "var(--ink-muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-muted)";
              }}
            >
              Upload
            </Link>
            <QuickAddButton />
          </>
        )}

        {!isOnboarded && (
          <Link
            href="/onboarding"
            className="apple-button apple-button-primary px-4 py-2 text-sm font-semibold"
          >
            Get Started
          </Link>
        )}

        {localUserName && (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{
              background: "var(--teal-primary)",
              boxShadow: "0 4px 10px rgba(10,143,132,0.28)",
            }}
            title={localUserName}
          >
            {localUserName[0].toUpperCase()}
          </div>
        )}
      </div>
    </nav>
  );
}
