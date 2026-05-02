"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Command,
  FileUp,
  Home,
  Plus,
  Search,
  ShieldAlert,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

const commands = [
  { group: "Navigate", label: "Open Command Center", hint: "Daily CFO brief, Flow Lens, and priority actions", href: "/", icon: Home, keys: ["G", "D"] },
  { group: "Navigate", label: "Open account intelligence", hint: "Exposure, risk, and next best action by account", href: "/customers", icon: Users, keys: ["G", "C"] },
  { group: "Navigate", label: "Open CFO Analytics", hint: "Aging, concentration, and collection performance", href: "/analytics", icon: BarChart3, keys: ["G", "A"] },
  { group: "Create", label: "Upload invoice file", hint: "Turn invoices into Flow Queue actions", href: "/upload", icon: FileUp, keys: ["U"] },
  { group: "Create", label: "Add manual invoice", hint: "Create one receivable and route it into Flow", href: "/upload", icon: Plus, keys: ["N"] },
  { group: "Act", label: "Review overdue exposure", hint: "Jump to the accounts that are weakening forecast confidence", href: "/#priority-queue", icon: ShieldAlert, keys: ["O"] },
  { group: "Act", label: "Open cash forecast signal", hint: "Inspect expected inflow and forecast pressure", href: "/#flow-lens", icon: TrendingUp, keys: ["F"] },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function closePalette() {
    setOpen(false);
    setQuery("");
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const visible = normalized
      ? commands.filter((command) => `${command.group} ${command.label} ${command.hint}`.toLowerCase().includes(normalized))
      : commands;

    return visible.reduce<Record<string, typeof commands>>((groups, command) => {
      groups[command.group] ??= [];
      groups[command.group].push(command);
      return groups;
    }, {});
  }, [query]);

  useEffect(() => {
    const openFromShortcut = () => {
      setQuery("");
      setOpen(true);
    };
    const closeFromShortcut = () => {
      setOpen(false);
      setQuery("");
    };

    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        openFromShortcut();
      }
      if (event.key === "Escape") {
        closeFromShortcut();
      }
    };

    const openHandler = () => openFromShortcut();
    window.addEventListener("keydown", handler);
    window.addEventListener("vantro-command", openHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("vantro-command", openHandler);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/70 px-4 pt-16 backdrop-blur-xl sm:pt-24"
      onClick={closePalette}
      style={{ animation: "fade-in 0.16s ease-out" }}
    >
      <div
        className="vf-command-surface w-full max-w-2xl overflow-hidden rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
        style={{ animation: "reveal-scale 0.18s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
            <Command className="h-4 w-4" aria-hidden="true" />
          </div>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Command finance: add invoice, review risk, open analytics..."
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <button
            type="button"
            onClick={closePalette}
            className="magnetic flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[460px] overflow-y-auto p-2">
          {Object.entries(filtered).length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Search className="mx-auto mb-3 h-5 w-5 text-[var(--text-muted)]" aria-hidden="true" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">No command found</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Try “invoice”, “risk”, or “analytics”.</p>
            </div>
          ) : (
            Object.entries(filtered).map(([group, items]) => (
              <div key={group} className="py-2">
                <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {group}
                </div>
                <div className="space-y-1">
                  {items.map((command) => {
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.label}
                        type="button"
                        onClick={() => {
                          closePalette();
                          router.push(command.href);
                        }}
                        className="vf-hover-depth flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-[var(--text-primary)]">{command.label}</span>
                          <span className="block truncate text-xs text-[var(--text-tertiary)]">{command.hint}</span>
                        </span>
                        <span className="hidden gap-1 sm:flex">
                          {command.keys.map((key) => (
                            <kbd key={key} className="mono rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-[10px] text-[var(--text-tertiary)]">
                              {key}
                            </kbd>
                          ))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-3 text-xs text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-[var(--brand-primary)]" aria-hidden="true" />
            Operate finance from the keyboard
          </span>
          <span>
            Press <kbd className="mono rounded border border-[var(--border-subtle)] bg-[var(--surface-2)] px-1.5 py-0.5">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
