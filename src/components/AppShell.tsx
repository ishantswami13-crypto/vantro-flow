"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, CircleDot, LayoutDashboard, Menu, Plus, Search, Upload, Users, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import type { OrganizationProfile } from "@/lib/organization-profile";
import { normalizePlan } from "@/lib/plan-features";

const navLinks = [
  { href: "/",          label: "Command Center", mobileLabel: "Command", icon: LayoutDashboard },
  { href: "/customers", label: "Accounts",       mobileLabel: "Accounts", icon: Users },
  { href: "/analytics", label: "CFO Analytics",  mobileLabel: "Analytics", icon: BarChart3 },
  { href: "/upload",    label: "Upload",         mobileLabel: "Upload", icon: Upload },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function NavLink({ href, label, active, onClick }: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "text-[var(--text-primary)]"
          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      }`}
      style={active ? { background: "var(--surface-2)" } : {}}
    >
      {active && (
        <span
          className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
          style={{ background: "var(--brand-primary)" }}
        />
      )}
      {label}
    </Link>
  );
}

export default function AppShell({
  organizationProfile,
  children,
}: {
  organizationProfile: OrganizationProfile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const avatarLetter = (organizationProfile.contactName || organizationProfile.name || "V")
    .trim()
    .charAt(0)
    .toUpperCase();
  const plan = normalizePlan(organizationProfile.plan);
  const planBadge = plan === "enterprise" ? "BUSINESS" : plan.toUpperCase();

  return (
    <div className="relative z-[1] min-h-screen" style={{ background: "transparent", color: "var(--text-primary)" }}>
      {/* Topbar */}
      <header
        className="glass-nav sticky top-0 z-40"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="Vantro Flow home"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #4F8CFF, #22D3EE)", boxShadow: "0 0 28px rgba(79,140,255,0.22)" }}
            >
              VF
            </span>
            <span className="hidden min-w-0 leading-tight sm:block">
              <span className="block text-sm font-semibold text-[var(--text-primary)]">Vantro Flow</span>
              <span className="mono hidden text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)] lg:block">Financial Command OS</span>
            </span>
          </Link>
          <Link
            href="/settings/plan"
            className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase transition hover:opacity-90"
            style={{
              background: plan === "pro" ? "var(--brand-primary-soft)" : plan === "enterprise" ? "rgba(168,85,247,0.14)" : "var(--surface-2)",
              border: "1px solid var(--border-subtle)",
              color: plan === "pro" ? "var(--brand-primary)" : plan === "enterprise" ? "#A855F7" : "var(--text-tertiary)",
            }}
            aria-label={`Manage ${planBadge} plan`}
          >
            {planBadge}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {navLinks.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                active={isActive(pathname, href)}
              />
            ))}
          </nav>

          {/* Right controls */}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="mr-1 hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--success)] md:flex"
              style={{ background: "var(--success-soft)", border: "1px solid rgba(34,197,94,0.18)" }}>
              <CircleDot className="h-3.5 w-3.5" aria-hidden="true" />
              Live finance
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("vantro-command"))}
              className="hidden items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[var(--text-tertiary)] transition hover:bg-[var(--surface-2)] md:flex"
              style={{ border: "1px solid var(--border-default)" }}
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Command</span>
              <kbd
                className="mono rounded border px-1.5 py-0.5 text-[10px]"
                style={{ borderColor: "var(--border-default)", background: "var(--surface-2)" }}
              >
                ⌘K
              </kbd>
            </button>
            <ThemeToggle />
            <Link
              href="/upload"
              className="magnetic hidden items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 sm:flex"
              style={{ background: "var(--brand-primary)", boxShadow: "0 10px 28px var(--brand-glow)" }}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add invoice
            </Link>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: "var(--brand-primary)" }}
              aria-label={`Account: ${organizationProfile.name}`}
            >
              {avatarLetter}
            </div>
            {/* Mobile hamburger */}
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition hover:bg-[var(--surface-2)] md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col md:hidden"
          style={{ background: "var(--background)" }}
        >
          <div
            className="flex h-14 items-center justify-between px-4"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span className="serif text-base text-[var(--text-primary)]">Vantro</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "text-[var(--brand-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                  }`}
                  style={active ? { background: "var(--brand-primary-soft)" } : {}}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Page content */}
      <main id="main-content" className="pb-24 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-3 bottom-3 z-40 rounded-2xl p-1.5 md:hidden"
        style={{
          background: "color-mix(in srgb, var(--surface-0) 90%, transparent)",
          border: "1px solid var(--border-subtle)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "var(--shadow-md)",
        }}
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-4 gap-1">
          {navLinks.map(({ href, mobileLabel, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`min-w-0 flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors ${
                  active
                    ? "text-[var(--brand-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
                style={active ? { background: "var(--brand-primary-soft)" } : {}}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="max-w-full truncate">{mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
