"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import QuickAddButton from "@/components/QuickAddButton";

const navigation = [
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

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/90 backdrop-blur-xl"
      style={{
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-white transition-transform group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #0A8F84 0%, #0DC4B4 100%)",
              boxShadow: "0 4px 12px rgba(10,143,132,0.4)",
              fontFamily: "var(--font-syne, 'Bricolage Grotesque')",
            }}
          >
            V
          </div>
          <div className="hidden sm:block" style={{ fontFamily: "var(--font-syne, 'Bricolage Grotesque')" }}>
            <span className="text-lg font-bold text-gray-900">Vantro</span>
            <span className="text-lg font-bold" style={{ color: "var(--teal)" }}>
              {" "}
              Flow
            </span>
          </div>
        </Link>

        <div
          className="hidden items-center gap-1 rounded-2xl p-1 sm:flex"
          style={{
            background: "rgba(255,255,255,0.78)",
            border: "1px solid rgba(255,255,255,0.92)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {navigation.map(({ href, label }) => {
            const active = isActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                className="relative rounded-xl px-4 py-2 text-sm font-medium transition-all"
                style={{
                  color: active ? "var(--teal)" : "var(--text-3)",
                  fontFamily: "var(--font-dm-sans, 'DM Sans')",
                }}
              >
                {active ? (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "var(--teal-light)" }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                ) : null}
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            href="/upload"
            className="hidden rounded-xl px-4 py-2 text-sm font-medium transition-all md:inline-flex"
            style={{
              color: "var(--text-2)",
              border: "1px solid var(--border)",
              background: "white",
              boxShadow: "var(--shadow-sm)",
              fontFamily: "var(--font-dm-sans, 'DM Sans')",
            }}
          >
            Upload CSV
          </Link>
          <QuickAddButton />
        </div>
      </div>
    </motion.nav>
  );
}
