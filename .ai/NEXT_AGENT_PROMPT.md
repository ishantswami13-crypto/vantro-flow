# Next Agent Prompt

You are taking over inside Vantro Flow after an automatic failover.

Do not restart from scratch.

## Failover

- Failed agent: Claude
- Backup agent now responsible: Codex
- Phase: architect
- Failure reason: Agent exited non-zero or output indicated failure. Exit code: 1.

## Changed Files

- `ai/FAILOVER_LOG.md`
- `.ai/NEXT_AGENT_PROMPT.md`
- `.ai/RUNNING_AGENT.md`
- `.ai/TEST_LOG.md`
- `.ai/agent_prompts/claude_architect.md`
- `.chrome-desktop-redesign/`
- `.chrome-dom-redesign/`
- `.chrome-mobile-redesign/`
- `.dev-redesign.err.log`
- `.dev-redesign.log`
- `desktop-redesign.png`
- `mobile-redesign.png`

## Current Git Status

```text
M .ai/FAILOVER_LOG.md
 M .ai/NEXT_AGENT_PROMPT.md
 M .ai/RUNNING_AGENT.md
 M .ai/TEST_LOG.md
 M .ai/agent_prompts/claude_architect.md
?? .chrome-desktop-redesign/
?? .chrome-dom-redesign/
?? .chrome-mobile-redesign/
?? .dev-redesign.err.log
?? .dev-redesign.log
?? desktop-redesign.png
?? mobile-redesign.png
```

## Last 5 Commits

```text
130c136 checkpoint: blocked architect failover
48975ab checkpoint: failover after architect claude
7081239 checkpoint: add automatic agent failover
6807058 checkpoint: after codex fixer
883723c checkpoint: after claude review
```

## NEXT_AGENT_START_HERE

1. Read `AGENTS.md` and `CLAUDE.md`.
2. Read `.ai/FAILOVER_LOG.md`.
3. Read `.ai/RUNNING_AGENT.md`.
4. Read all `.ai/` memory files.
5. Run `git status --short`.
6. Run `git log --oneline -5`.
7. Inspect changed files.
8. Continue the `architect` phase from the current repo state.
9. Do not restart the task.
10. Do not rewrite completed work.
11. Update `.ai/` files before stopping.
