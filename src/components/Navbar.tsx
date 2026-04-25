"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import QuickAddButton from "@/components/QuickAddButton";
import type { OrganizationProfile } from "@/lib/organization-profile";

interface Props {
  organizationProfile: OrganizationProfile;
}

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function subscribeToLocalStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getLocalOnboarded() {
  return typeof window !== "undefined" && !!window.localStorage.getItem("vantro_onboarded");
}

function getLocalUserName() {
  return typeof window === "undefined" ? null : window.localStorage.getItem("vantro_user_name");
}

export default function Navbar({ organizationProfile }: Props) {
  const pathname = usePathname();
  const localOnboarded = useSyncExternalStore(subscribeToLocalStorage, getLocalOnboarded, () => false);
  const localUserName = useSyncExternalStore(subscribeToLocalStorage, getLocalUserName, () => null);

  const isOnboarded = localOnboarded || organizationProfile.onboardingCompleted;
  const avatarInitial = (localUserName || organizationProfile.contactName || organizationProfile.name || "V")
    .trim()
    .charAt(0)
    .toUpperCase();

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/customers", label: "Customers" },
    { href: "/analytics", label: "Analytics" },
  ];

  return (
    <nav
      className="relative flex items-center gap-6 px-6"
      style={{
        height: "56px",
        background: "var(--white)",
        borderBottom: "1px solid var(--border)",
        zIndex: 10,
      }}
    >
      <Link href="/" className="mr-4 flex shrink-0 items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold tracking-[0.12em] text-white"
          style={{ background: "linear-gradient(135deg, var(--teal-dark), var(--teal-primary))" }}
        >
          VF
        </div>
        <span className="hidden text-xl italic sm:block" style={{ fontFamily: "var(--font-heading)", color: "var(--ink)" }}>
          Vantro Flow
        </span>
      </Link>

      {isOnboarded ? (
        <div className="hidden flex-1 items-center justify-center gap-7 md:flex">
          {navLinks.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className="border-b-2 pb-[2px] text-sm transition-colors"
                style={{
                  color: active ? "var(--ink)" : "var(--ink-muted)",
                  borderBottomColor: active ? "var(--teal-primary)" : "transparent",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      ) : (
        <div
          className="hidden items-center rounded-full px-3 py-1 text-xs font-semibold md:inline-flex"
          style={{
            background: "var(--teal-wash)",
            color: "var(--teal-dark)",
            border: "1px solid rgba(10,143,132,0.15)",
          }}
        >
          Setup in progress
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-3">
        {isOnboarded ? (
          <>
            <Link href="/upload" className="hidden text-sm font-medium transition-colors md:inline-flex" style={{ color: "var(--ink-muted)" }}>
              Upload
            </Link>
            <QuickAddButton />
          </>
        ) : (
          <Link href="/onboarding" className="apple-button apple-button-primary px-4 py-2 text-sm font-semibold">
            Get Started
          </Link>
        )}

        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{
            background: "linear-gradient(135deg, var(--teal-dark), var(--teal-primary))",
            boxShadow: "0 4px 10px rgba(10,143,132,0.22)",
          }}
          title={localUserName || organizationProfile.name}
        >
          {avatarInitial}
        </div>
      </div>
    </nav>
  );
}
