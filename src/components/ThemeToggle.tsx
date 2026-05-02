"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("vantro-theme-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("vantro-theme-change", onStoreChange);
  };
}

function getThemeSnapshot() {
  return window.localStorage.getItem("vantro-theme") ?? "dark";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => "dark");
  const dark = theme === "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  function toggle() {
    const next = dark ? "light" : "dark";
    localStorage.setItem("vantro-theme", next);
    window.dispatchEvent(new Event("vantro-theme-change"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="magnetic flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
