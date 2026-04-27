"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import QuickAddButton from "@/components/QuickAddButton";
import ThemeToggle from "@/components/ThemeToggle";
import type { OrganizationProfile } from "@/lib/organization-profile";

interface Props {
  organizationProfile: OrganizationProfile;
}

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/analytics", label: "Analytics" },
];

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

function getLocalUserName() {
  return typeof window === "undefined" ? null : window.localStorage.getItem("vantro_user_name");
}

export default function Navbar({ organizationProfile }: Props) {
  const pathname = usePathname();
  const localUserName = useSyncExternalStore(subscribeToLocalStorage, getLocalUserName, () => null);
  const avatarInitial = (localUserName || organizationProfile.contactName || organizationProfile.name || "V")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <nav
      className="relative z-20 border-b"
      style={{
        height: "60px",
        background: "color-mix(in srgb, var(--surface) 86%, transparent)",
        backdropFilter: "blur(16px)",
        borderColor: "var(--line)",
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Vantro dashboard">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-dark))" }}
          >
            VF
          </span>
          <span className="serif hidden text-lg italic text-[var(--ink)] min-[360px]:inline">Vantro</span>
        </Link>

        <div className="mx-auto hidden items-center gap-7 md:flex">
          {navLinks.map(({ href, label }) => {
            const active = isActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                className={`group relative py-5 text-sm font-medium transition-colors duration-200 ${
                  active ? "text-[var(--ink)]" : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                }`}
              >
                {label}
                <span
                  className="absolute bottom-0 left-0 h-0.5 bg-[var(--teal)] transition-all duration-200"
                  style={{ width: active ? "100%" : "0%" }}
                />
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[var(--teal)] transition-all duration-200 group-hover:w-full" />
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }))}
            className="magnetic hidden items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 transition hover:border-[var(--line-2)] md:flex"
            aria-label="Open keyboard shortcuts"
          >
            <Search className="h-3.5 w-3.5 text-[var(--ink-3)]" aria-hidden="true" />
            <span className="text-xs text-[var(--ink-3)]">Search</span>
            <kbd className="mono rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--ink-4)]">
              ⌘K
            </kbd>
          </button>
          <ThemeToggle />
          <Link
            href="/upload"
            className="magnetic hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--ink-3)] transition hover:bg-[var(--surface-2)] hover:text-[var(--ink)] sm:inline-flex"
          >
            Upload
          </Link>
          <QuickAddButton />
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--teal), var(--teal-dark))" }}
            title={localUserName || organizationProfile.name}
          >
            {avatarInitial}
          </div>
        </div>
      </div>
    </nav>
  );
}
