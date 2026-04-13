"use client";

import { useState, useEffect } from "react";

export default function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="text-right hidden md:block">
      <p className="font-syne font-bold text-[#F8FAFC] text-xl tabular-nums leading-tight">{timeStr}</p>
      <p className="text-[#475569] text-xs mt-0.5">{dateStr}</p>
    </div>
  );
}
