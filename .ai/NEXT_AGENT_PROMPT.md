# Next Agent Prompt

You are taking over inside Vantro Flow.

Do not restart from scratch.

## Current Status

The local Claude supervisor wrapper has been added.

This is infrastructure-only work. Do not rebuild or redesign the app.

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

## What Changed

- `scripts/claude-supervised.ps1` starts local Claude Code and watches the session log after Claude exits.
- `scripts/codex-continue-after-claude-limit.ps1` updates repo handoff files and starts Codex automatically when the supervisor detects a Claude limit or blocking failure.
- `scripts/install-claude-supervised-alias.ps1` installs the `vclaude` PowerShell profile function.
- `.ai/LOCAL_CLAUDE_SUPERVISOR.md` explains supervised vs unsupervised Claude usage.

## NEXT_AGENT_START_HERE

1. Continue from the latest user request, which is the AI Action Center plan review/build direction, not the older infrastructure-only handoff.
2. Do not restart from scratch. Preserve the existing dirty worktree.
3. `implementation_plan_action_center.md` was not present in the workspace during review.
4. Existing untracked `src/components/dashboard/ActionCenterModal.tsx` implements much of the proposed modal, but it is not wired into `src/app/page.tsx`.
5. If asked to build, wire the modal into the dashboard and tighten it first:
   - Track success and failure per invoice.
   - Check `response.ok` from `/api/remind`.
   - Do not mark failed rows as sent.
   - Keep close/refresh behavior explicit.
   - Filter out paid/disputed invoices once the payload exposes that data.
   - Use honest copy unless real delivery exists.
6. Current `/api/remind` generates a Groq reminder, injects a public payment link, and records a `follow_ups` row. It does not actually deliver via email/SMS/WhatsApp.
7. Before stopping, update `.ai/` files and create a checkpoint commit if possible.
