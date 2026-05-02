# Current Task

Vantro OS — Complete Master Build (Nova AI Engine)

## Goal

Implement the full Vantro OS feature set with Nova AI at its core.

## Status — COMPLETED 2026-05-02

All 12 blocks from the master build prompt have been implemented.

## What Was Built

### Block 1 — Database Migration
- New Drizzle schema tables: `plan_events`, `payments_received`, `vendors`, `expenses`, `products`, `inventory`, `nova_briefings`, `health_scores`, `alerts`
- SQL migration script at `src/scripts/migrate-nova.ts`

### Block 2 — Plan Features Library
- `src/lib/nova-plans.ts` with Starter / Pro / Business plan config
- `canUse()`, `getLimit()`, `getUpgradePrompt()`, `normalizeNovaPlan()` helpers
- `plan-features.ts` updated: `business` plan maps to `enterprise` for legacy compat

### Block 3 — NovaUpgrade Component
- `src/components/NovaUpgrade.tsx` — banner / card / inline variants

### Block 4 — Nova Briefing API
- `src/app/api/nova/briefing/route.ts`
- Cached per-org per-day; Groq call only for Pro/Business; rule-based for Starter

### Block 5 — Health Score API
- `src/app/api/nova/health-score/route.ts`
- 5-component weighted score: cash (25%), collections (30%), expenses (20%), inventory (15%), revenue (10%)

### Block 6 — Nova Message API
- `src/app/api/nova/message/route.ts`
- Hinglish WhatsApp messages via Groq; Starter daily limit enforced via alerts table

### Block 7 — Payment Recording API
- `src/app/api/payments/route.ts`
- Records payments, updates invoice status, invalidates Nova briefing cache

### Block 8 — Plan Settings Page
- Updated `/settings/plan` to show "Business" plan (₹7,999/mo) as top tier
- Pro updated to ₹2,999/mo

### Block 9 — Dashboard Redesign
- `src/app/page.tsx` completely rewritten
- NovaBriefingCard fetches from `/api/nova/briefing` on load (cached — fast)
- KPIs updated: Cash Runway and Health Score replace hardcoded trend cards
- Priority queue "Remind" → "Ask Nova" → opens NovaMessageModal
- Removed all hardcoded trend percentages

### Block 10 — NovaMessageModal
- `src/components/NovaMessageModal.tsx`
- 3 tones (soft/firm/urgent), copy + WhatsApp open

### Block 11 — Global Nova Rebrand
- "Daily CFO Brief" → "Nova AI" throughout dashboard
- Metadata description updated to "Nova-powered"
- Plan badge shows "BUSINESS" for enterprise plan

### Block 12 — Install Packages
- `zod` installed for payment validation

## Do Not Do

- Do not run the SQL migration automatically — user must run `tsx src/scripts/migrate-nova.ts`
- Do not wire billing — upgrade CTAs route to `/settings/plan` only

## Build Validation

- `npm run build` passed clean.
- TypeScript type check passed.
- 10 routes registered including all Nova API routes.

## Production Deployment Fix — COMPLETED 2026-05-02

Goal:

- Fix current deploy blockers and push the working state to Vercel/GitHub.

Completed:

- Confirmed local lint and production build pass.
- Fixed Vercel deploy packaging failure by excluding generated local artifacts via `.vercelignore`.
- Added matching `.gitignore` entries for generated browser/screenshot artifacts.
- Deployed production successfully to Vercel.
- Smoke checked production `/` and `/settings/plan`.

Do Not Do:

- Do not run the Nova SQL migration automatically.
- Do not commit old generated screenshots, browser profiles, or temp build directories.
