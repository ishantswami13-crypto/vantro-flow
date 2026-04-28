# Next Agent Prompt

You are taking over inside Vantro Flow.

Do not restart from scratch.

First read:

- `AGENTS.md`
- `CLAUDE.md`
- `.ai/PROJECT_STATE.md`
- `.ai/CURRENT_TASK.md`
- `.ai/DECISIONS.md`
- `.ai/TEST_LOG.md`
- `.ai/NEXT_AGENT_PROMPT.md`

Then run:

- `git status --short`
- `git log --oneline -5`

Continue from the latest incomplete task.

Current next action:

1. Level 3 orchestrator exists.
2. `scripts/orchestrator.py` passed Python syntax check.
3. `scripts/run-orchestrator.ps1` exists.
4. Do not run full orchestration unless the user explicitly asks.
5. If asked to run full automation, execute:

```powershell
cd D:\vantro-flow
.\scripts\run-orchestrator.ps1
```

Before stopping:

- Update `.ai/PROJECT_STATE.md`
- Update `.ai/TEST_LOG.md`
- Update `.ai/NEXT_AGENT_PROMPT.md`
- Create a checkpoint commit if possible.
