"use client";

import { useEffect, useState } from "react";

const SHORTCUTS = [
  { keys: ["⌘", "K"], action: "Open command palette" },
  { keys: ["⌘", "/"], action: "Show shortcuts" },
  { keys: ["G", "D"], action: "Go to dashboard" },
  { keys: ["G", "C"], action: "Go to customers" },
  { keys: ["G", "A"], action: "Go to analytics" },
  { keys: ["N"], action: "New invoice" },
  { keys: ["?"], action: "Toggle this menu" },
];

export default function KeyboardShortcuts() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" || (e.metaKey && e.key === "/")) {
        e.preventDefault();
        setShow((prev) => !prev);
      }
      if (e.metaKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShow(true);
      }
      if (e.key === "Escape") setShow(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", animation: "fade-in 0.2s ease" }}
      onClick={() => setShow(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-6 shadow-2xl"
        style={{ border: "1px solid var(--line)", animation: "scale-in 0.2s cubic-bezier(.16,1,.3,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="serif mb-5 text-2xl text-[var(--ink)]">Keyboard shortcuts</h3>
        <div className="space-y-1">
          {SHORTCUTS.map((s) => (
            <div
              key={s.action}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--surface-2)]"
            >
              <span className="text-sm text-[var(--ink-2)]">{s.action}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="mono rounded border border-[var(--line)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--ink-3)]"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-[var(--ink-3)]">
          Press{" "}
          <kbd className="mono rounded border border-[var(--line)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[11px]">
            Esc
          </kbd>{" "}
          to close
        </p>
      </div>
    </div>
  );
}
