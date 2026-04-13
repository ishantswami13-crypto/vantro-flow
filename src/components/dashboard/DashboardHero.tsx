"use client";

import { motion } from "framer-motion";
import DashboardHeroScene from "@/components/DashboardHeroScene";
import type { DashboardPayload } from "./types";
import { formatDashboardDate, formatDashboardTime, formatIndian, getGreeting } from "./utils";

interface Props {
  clock: Date | null;
  data: DashboardPayload | null;
  visibleFollowUps: number;
}

export default function DashboardHero({ clock, data, visibleFollowUps }: Props) {
  return (
    <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <div
        className="surface-panel relative overflow-hidden rounded-[34px] px-6 py-7 sm:px-8"
        style={{ border: "1px solid rgba(255,255,255,0.92)", boxShadow: "var(--shadow-lg)" }}
      >
        <div
          className="absolute -top-16 left-1/3 h-48 w-48 rounded-full blur-3xl"
          style={{ background: "rgba(10,143,132,0.14)" }}
        />
        <div
          className="absolute right-10 bottom-0 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "rgba(124,58,237,0.08)" }}
        />
        <div className="absolute inset-y-0 right-0 hidden w-[42%] xl:block">
          <DashboardHeroScene />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 xl:max-w-[58%]">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-1 text-4xl font-bold"
                style={{ color: "var(--text-1)" }}
              >
                {clock ? getGreeting(clock) : "Good morning"}, Ishant
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ color: "var(--text-3)" }}
              >
                {clock
                  ? `Your collections command center — ${formatDashboardDate(clock)}`
                  : "Your collections command center"}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-[24px] px-5 py-3 text-right"
              style={{
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(255,255,255,0.92)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <div className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>
                {clock ? formatDashboardTime(clock) : "--:--:--"}
              </div>
              <div className="text-xs" style={{ color: "var(--text-4)" }}>
                India Standard Time
              </div>
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              {
                label: "Outstanding",
                value: data ? `₹${formatIndian(data.totalOutstanding)}` : "Loading...",
              },
              {
                label: "Need action today",
                value: data ? `${visibleFollowUps} invoices` : "Loading...",
              },
              {
                label: "Expected this week",
                value: data ? `₹${formatIndian(data.weekForecast.expectedThisWeek)}` : "Loading...",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-full px-4 py-2 text-sm"
                style={{
                  background: "rgba(255,255,255,0.86)",
                  border: "1px solid rgba(255,255,255,0.92)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <span style={{ color: "var(--text-3)" }}>{item.label}</span>
                <span className="ml-2 font-semibold" style={{ color: "var(--text-1)" }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
