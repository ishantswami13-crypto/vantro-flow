"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const ToastContext = createContext<{ toast: (t: Omit<Toast, "id">) => void }>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = t.type === "success" ? CheckCircle : t.type === "error" ? AlertCircle : Info;
          const colorClass =
            t.type === "success"
              ? "bg-[var(--sage-wash)] border-[var(--sage)] text-[var(--sage)]"
              : t.type === "error"
                ? "bg-[var(--coral-wash)] border-[var(--coral)] text-[var(--coral)]"
                : "bg-[var(--teal-wash)] border-[var(--teal)] text-[var(--teal-dark)]";

          return (
            <div
              key={t.id}
              className={`flex min-w-[280px] items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${colorClass}`}
              style={{ animation: "slide-right 0.3s ease-out" }}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 text-sm font-medium">{t.message}</span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="shrink-0 opacity-60 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
