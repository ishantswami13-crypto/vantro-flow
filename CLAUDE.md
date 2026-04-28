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

## Automatic Failover Protocol

If you are started after another agent failed, reached limit, timed out, or stopped:

1. Read `.ai/FAILOVER_LOG.md`
2. Read `.ai/RUNNING_AGENT.md`
3. Read `.ai/NEXT_AGENT_PROMPT.md`
4. Run `git status --short`
5. Run `git log --oneline -5`
6. Inspect changed files
7. Continue from the current repo state
8. Do not restart the task
9. Do not rewrite completed work
10. Update `.ai/` files before stopping

## Local Claude Supervisor Rule

If a Claude session was launched through `scripts/claude-supervised.ps1` and then fails or hits a limit, Codex will continue using `.ai/NEXT_AGENT_PROMPT.md`.

Agents must:

- Read `.ai/FAILOVER_LOG.md`
- Read `.ai/NEXT_AGENT_PROMPT.md`
- Check `git status --short`
- Check `git log --oneline -5`
- Continue from repo state
- Never restart from scratch
