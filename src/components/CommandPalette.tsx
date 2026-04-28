"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, FileUp, Home, Plus, Search, Users, X } from "lucide-react";

const commands = [
  { label: "Open Command Center", hint: "Today's Financial Command", href: "/", icon: Home, keys: ["G", "D"] },
  { label: "View Flow Queue", hint: "Prioritized financial actions", href: "/#priority-queue", icon: Search, keys: ["F", "Q"] },
  { label: "Search account intelligence", hint: "Accounts, exposure, and risk", href: "/customers", icon: Users, keys: ["G", "C"] },
  { label: "Open CFO Analytics", hint: "Aging, concentration, and performance", href: "/analytics", icon: BarChart3, keys: ["G", "A"] },
  { label: "Upload invoice file", hint: "Turn documents into Flow Queue actions", href: "/upload", icon: FileUp, keys: ["U"] },
  { label: "Add invoice", hint: "Create a receivable manually", href: "/upload", icon: Plus, keys: ["N"] },
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
    if (!normalized) return commands;
    return commands.filter((command) => `${command.label} ${command.hint}`.toLowerCase().includes(normalized));
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
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 px-4 pt-20 backdrop-blur-xl sm:pt-28"
      onClick={closePalette}
      style={{ animation: "fade-in 0.16s ease-out" }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_90px_rgba(0,0,0,0.46)]"
        onClick={(event) => event.stopPropagation()}
        style={{ animation: "reveal-scale 0.18s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--ink-4)]" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands, accounts, invoices..."
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)]"
          />
          <button
            type="button"
            onClick={closePalette}
            className="magnetic flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-4)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {filtered.map((command) => {
            const Icon = command.icon;
            return (
              <button
                key={command.label}
                type="button"
                onClick={() => {
                  closePalette();
                  router.push(command.href);
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[var(--surface-2)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--teal-wash)] text-[var(--teal)]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--ink)]">{command.label}</span>
                  <span className="block truncate text-xs text-[var(--ink-3)]">{command.hint}</span>
                </span>
                <span className="hidden gap-1 sm:flex">
                  {command.keys.map((key) => (
                    <kbd key={key} className="mono rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-[10px] text-[var(--ink-3)]">
                      {key}
                    </kbd>
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--ink-4)]">
          <span>Command center navigation</span>
          <span>
            Press <kbd className="mono rounded border border-[var(--line)] bg-[var(--surface-2)] px-1.5 py-0.5">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
