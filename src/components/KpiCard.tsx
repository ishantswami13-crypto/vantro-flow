"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  label: string;
  rawValue: number;
  displayValue: string;
  icon: string;
  color: string;
  glowColor: string;
  sub: string;
}

export default function KpiCard({ label, rawValue, displayValue, icon, color, glowColor, sub }: Props) {
  const [displayed, setDisplayed] = useState("0");
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const isPercent = displayValue.endsWith("%");
    const isCurrency = displayValue.startsWith("₹");

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = rawValue * eased;

      if (isPercent) {
        setDisplayed(Math.round(current) + "%");
      } else if (isCurrency) {
        setDisplayed(
          new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(current)
        );
      } else {
        setDisplayed(String(Math.round(current)));
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayed(displayValue);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rawValue, displayValue]);

  return (
    <div
      className="kpi-card rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at top left, ${glowColor} 0%, var(--bg-card) 60%)`,
        border: `1px solid rgba(255,255,255,0.06)`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg leading-none">{icon}</span>
        <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="font-syne font-bold leading-none mb-1" style={{ fontSize: "clamp(1.5rem,3vw,2.5rem)", color }}>
        {displayed}
      </p>
      <p className="text-xs text-[#475569] mt-2">{sub}</p>
    </div>
  );
}
