# Next Agent Prompt

You are taking over inside Vantro Flow.

Do not restart from scratch.

First read:

- `AGENTS.md`
- `CLAUDE.md`
- `.ai/AUTO_MODE.md`
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

## Current Status

The Level 3 orchestrator is installed and upgraded with automatic Claude/Codex failover. Full orchestration should only be run when the user explicitly asks.

## Last Known Git Status

```text
M .ai/TEST_LOG.md
?? .chrome-desktop-redesign/
?? .chrome-dom-redesign/
?? .chrome-mobile-redesign/
?? .dev-redesign.err.log
?? .dev-redesign.log
?? desktop-redesign.png
?? mobile-redesign.png
```

## Recent Commits

```text
6807058 checkpoint: after codex fixer
883723c checkpoint: after claude review
d3ef4a3 checkpoint: after codex builder
57b0ec5 checkpoint: after claude architect
2eda845 checkpoint: fix orchestrator long prompt handling
```

## NEXT_AGENT_START_HERE

1. Read all `.ai/` files.
2. If the user asks to run the automatic failover cycle, execute:

```powershell
cd D:\vantro-flow
python scripts\orchestrator.py --watch
```

3. Do not run nested orchestrator calls from inside Claude or Codex agent phases.
4. Before stopping, update `.ai/PROJECT_STATE.md`, `.ai/TEST_LOG.md`, and `.ai/NEXT_AGENT_PROMPT.md`.
5. Create a checkpoint commit if possible.
