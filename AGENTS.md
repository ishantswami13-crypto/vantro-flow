# Vantro Flow Agent Operating System

You are working inside Vantro Flow.

Vantro Flow is a premium AI-powered cashflow, collections, and financial operations product for startups, SMEs, finance teams, and enterprises.

## Absolute Rule

Do not restart from scratch.

Before doing any work, always read:

- `.ai/PROJECT_STATE.md`
- `.ai/CURRENT_TASK.md`
- `.ai/DECISIONS.md`
- `.ai/TEST_LOG.md`
- `.ai/NEXT_AGENT_PROMPT.md`
- `git status --short`
- `git log --oneline -5`

Continue from the latest checkpoint and the `NEXT_AGENT_START_HERE` section.

## Product Feeling

Vantro Flow must feel:

- Apple-level clean
- premium
- calm
- fast
- useful
- enterprise-ready
- emotionally satisfying
- not generic SaaS
- not cheap startup template
- simple but powerful

## Engineering Rules

- Do not delete large files without permission.
- Do not reset git.
- Do not overwrite existing work blindly.
- Do not install new dependencies unless truly required.
- Prefer clean, simple, maintainable code.
- Preserve existing functionality.
- Run lint/build/tests when possible.
- Record failures honestly.

## Handoff Rule

Before stopping, always update:

- `.ai/PROJECT_STATE.md`
- `.ai/CURRENT_TASK.md`
- `.ai/DECISIONS.md`
- `.ai/TEST_LOG.md`
- `.ai/NEXT_AGENT_PROMPT.md`

## Git Rule

After a meaningful chunk, create a checkpoint commit if possible:

- `checkpoint: after claude architect`
- `checkpoint: after codex builder`
- `checkpoint: after claude review`
- `checkpoint: after codex fixer`

If commit fails because there are no changes, record that in `.ai/TEST_LOG.md`.

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
