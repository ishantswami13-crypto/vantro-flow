# Next Agent Prompt

You are taking over inside Vantro Flow.

Do not restart from scratch.

## Required Reading

- `AGENTS.md`
- `CLAUDE.md`
- `.ai/AUTO_MODE.md`
- `.ai/LOCAL_CLAUDE_SUPERVISOR.md`
- `.ai/PROJECT_STATE.md`
- `.ai/CURRENT_TASK.md`
- `.ai/DECISIONS.md`
- `.ai/TEST_LOG.md`
- `.ai/FAILOVER_LOG.md`
- `.ai/RUNNING_AGENT.md`
- `.ai/NEXT_AGENT_PROMPT.md`

Then run:

- `git status --short`
- `git log --oneline -5`

## Current User Roadmap

The user provided three phases:

1. Phase 1: Plan/subscription system.
2. Phase 2: Vantro AI Chat.
3. Phase 3: Live score ticker, collection celebration, benchmarks, weekly report email, onboarding magic moment.

## Current Status

Phase 1 has been implemented in this Codex pass.

Added:

- `src/lib/plan-features.ts`
- `src/components/UpgradePrompt.tsx`
- `src/app/settings/plan/page.tsx`
- Plan badge in `src/components/AppShell.tsx`
- Plan fields and `plans` table in `src/db/schema.ts`
- SQL helper updates in `src/db/migrate.ts`, `src/scripts/create-tables.ts`, `src/scripts/create-tables-vercel.ts`, and `src/scripts/fix-schema.ts`
- Starter normalization in `src/lib/organization-profile.ts`

Validation:

- `npm run lint` passed.
- `npm run build` initially failed because the configured database did not yet have `plan_expires_at`.
- `/settings/plan` was made resilient with a Starter fallback before migration.
- Final `npm run build` passed.
- Final `npm run lint` passed.
- Local dev server was started because port 3000 was not listening.
- `http://localhost:3000/settings/plan` returned HTTP 200.
- `http://localhost:3000` returned HTTP 200.

## NEXT_AGENT_START_HERE

1. Preserve the existing dirty worktree; many files were already modified or untracked before this pass.
2. Do not rewrite the previous AI Action Center, payment portal, scanner, cashflow, or redesign work.
3. If continuing Phase 1, run the database migration or `src/scripts/fix-schema.ts` against the target database before depending on the new plan columns.
4. Billing is not implemented. Upgrade CTAs are intentionally non-claiming until a real billing/payment provider exists.
5. If the user asks for the next product build, start Phase 2: `/app/ai/page.tsx` and `/app/api/ai-chat/route.ts`, gated to Pro and Enterprise.
6. Before stopping, update `.ai/PROJECT_STATE.md`, `.ai/CURRENT_TASK.md`, `.ai/DECISIONS.md`, `.ai/TEST_LOG.md`, and `.ai/NEXT_AGENT_PROMPT.md`.
7. Create a checkpoint commit if possible without staging unrelated user work.
