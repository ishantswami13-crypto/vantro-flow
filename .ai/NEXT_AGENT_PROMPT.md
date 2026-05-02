# Next Agent Prompt

You are taking over inside Vantro Flow.

Do not restart from scratch.

## Required Reading

- `CLAUDE.md`
- `.ai/PROJECT_STATE.md`
- `.ai/CURRENT_TASK.md`
- `.ai/DECISIONS.md`
- `.ai/TEST_LOG.md`

Then run:

- `git status --short`
- `git log --oneline -5`

## Current Status

The Vantro OS master build is complete. All 12 blocks implemented. Local lint/build pass, and the production Vercel deployment is live.

## CRITICAL: Database Migration Required

Before any Nova features work in production, run:

```
tsx src/scripts/migrate-nova.ts
```

This creates: `payments_received`, `vendors`, `expenses`, `products`, `inventory`, `nova_briefings`, `health_scores`, `alerts`, `plan_events`

## What Was Built

- `src/lib/nova-plans.ts` — Starter / Pro / Business plan config with `canUse()`, `getLimit()`
- `src/components/NovaUpgrade.tsx` — upgrade gate component (banner/card/inline)
- `src/components/NovaMessageModal.tsx` — WhatsApp message generator modal
- `src/app/api/nova/briefing/route.ts` — daily briefing (cached, Groq for Pro/Business)
- `src/app/api/nova/health-score/route.ts` — 5-component business health score
- `src/app/api/nova/message/route.ts` — Hinglish payment reminder generator
- `src/app/api/payments/route.ts` — record payments, mark invoices paid
- `src/app/page.tsx` — fully updated dashboard with Nova AI briefing card, health KPIs, NovaMessageModal
- Plan names: Business (₹7,999/mo), Pro (₹2,999/mo), Starter (Free)

## Next Steps

## NEXT_AGENT_START_HERE

1. Read the required repo memory files.
2. Run `git status --short`.
3. Run `git log --oneline -5`.
4. If continuing deployment work, confirm the latest GitHub checkpoint is pushed and production still responds at `https://vantro-flow.vercel.app`.
5. Do not run the Nova SQL migration automatically; apply it only when the user explicitly wants the production database schema changed.

## Latest Production Deployment

- Production alias: `https://vantro-flow.vercel.app`
- Deployment URL: `https://vantro-flow-hqd21gg0p-vantro.vercel.app`
- Local checks: `npm run lint` passed, `npm run build` passed.
- Production smoke checks: `/` HTTP 200, `/settings/plan` HTTP 200.

## Product Follow-up Candidates

If the user asks what to build next, the candidates are:

1. **Nova AI Chat** — `/app/ai/page.tsx` and `/app/api/ai-chat/route.ts`, gated to Pro/Business
2. **Expenses + Vendors UI** — pages at `/app/expenses` using the new DB tables
3. **Inventory UI** — pages at `/app/inventory`
4. **Payment recording UI** — inline "Record Payment" button on the priority queue rows
5. **Nova weekly email digest** — cron-triggered email using Groq and the briefing system
6. **Health score history chart** — already stored in `health_scores` table, just needs a frontend

## Before Stopping

1. Update `.ai/PROJECT_STATE.md`
2. Update `.ai/TEST_LOG.md`
3. Update `.ai/DECISIONS.md` if any new decisions were made
4. Update this file with new `NEXT_AGENT_START_HERE`
5. Create a git checkpoint commit
