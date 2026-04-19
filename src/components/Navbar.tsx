"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function Navbar({ organizationProfile }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [localOnboarded] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !!window.localStorage.getItem("vantro_onboarded");
  });
  const [localUserName] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem("vantro_user_name");
  });

  const isOnboarded = localOnboarded || organizationProfile.onboardingCompleted;

  const navigation = [
    { href: "/", label: "Dashboard", visible: isOnboarded },
    { href: "/customers", label: "Customers", visible: isOnboarded },
    { href: "/analytics", label: "Analytics", visible: isOnboarded },
  ].filter((item) => item.visible);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 12);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div
        className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3 rounded-[18px] px-4 py-3 sm:px-5"
        style={{
          background: "rgba(255,255,255,0.92)",
          border: scrolled ? "1px solid var(--border-strong)" : "1px solid var(--border)",
          boxShadow: scrolled ? "var(--shadow-md)" : "var(--shadow-sm)",
        }}
      >
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[12px] text-[11px] font-semibold tracking-[0.12em] text-white transition-transform group-hover:scale-[1.03]"
            style={{
              background: "var(--accent)",
              boxShadow: "0 8px 18px rgba(94, 106, 210, 0.22)",
            }}
          >
            VF
          </div>
          <div className="leading-none">
            <div className="text-[15px] font-semibold tracking-[-0.02em]" style={{ color: "var(--text-1)" }}>
              {isOnboarded ? (organizationProfile.name !== "Vantro Workspace" ? organizationProfile.name : "Vantro Flow") : "Vantro Flow"}
            </div>
            <div className="mt-1 text-[11px]" style={{ color: "var(--text-4)" }}>
              {isOnboarded ? "Collections OS" : "Setup in progress"}
            </div>
          </div>
        </Link>

        {isOnboarded ? (
          <div
            className="hidden items-center gap-1 rounded-[14px] bg-[var(--bg-surface-2)] p-1 md:flex"
            style={{
              border: "1px solid var(--border)",
            }}
          >
            {navigation.map(({ href, label }) => {
              const active = isActive(pathname, href);

              return (
                <Link
                  key={href}
                  href={href}
                  className="relative rounded-[10px] px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    color: active ? "var(--text-1)" : "var(--text-3)",
                  }}
                >
                  {active ? (
                    <div
                      className="absolute inset-0 rounded-[10px]"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    />
                  ) : null}
                  <span className="relative z-10">{label}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="apple-pill hidden text-xs font-semibold md:inline-flex">First-run setup</div>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {isOnboarded ? (
            <Link
              href="/upload"
              className="apple-button apple-button-secondary hidden px-4 py-2.5 text-sm font-medium md:inline-flex"
              style={{ color: "var(--text-2)" }}
            >
              Upload CSV
            </Link>
          ) : null}
          {isOnboarded ? (
            <>
              <QuickAddButton />
              {localUserName && (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    background: "#0D9488",
                    boxShadow: "0 4px 10px rgba(13,148,136,0.28)",
                  }}
                  title={localUserName}
                >
                  {localUserName[0].toUpperCase()}
                </div>
              )}
            </>
          ) : (
            <Link href="/onboarding" className="apple-button apple-button-primary px-4 py-2.5 text-sm font-semibold">
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
