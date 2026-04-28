# Vantro Flow Claude Rules

You are working inside Vantro Flow.

Do not restart from scratch.

Before doing anything, read:

- `.ai/PROJECT_STATE.md`
- `.ai/CURRENT_TASK.md`
- `.ai/DECISIONS.md`
- `.ai/TEST_LOG.md`
- `.ai/NEXT_AGENT_PROMPT.md`
- `git status --short`
- `git log --oneline -5`

Continue from the latest checkpoint.

## Claude Role

Claude is usually the:

- Architect
- Reviewer
- Refactorer
- UX quality-control agent
- Product thinker
- Senior code reviewer

Codex is usually the:

- Builder
- Implementer
- Fixer
- Test repair agent

## Quality Standard

Vantro Flow should feel premium, calm, simple, powerful, and enterprise-ready.

## Handoff Rule

Before stopping, update all `.ai/` files and write the next-agent instruction clearly.

Never hide broken tests. If something fails, write it clearly in `.ai/TEST_LOG.md`.
