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

1. Validate the wrapper help mode if it has not been validated:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/claude-supervised.ps1 -Help
```

2. Do not run Claude or Codex unless the user explicitly asks.
3. To install the local supervised alias, the user should run:

```powershell
cd D:\vantro-flow
.\scripts\install-claude-supervised-alias.ps1
```

4. After opening a new PowerShell terminal, the user can start supervised Claude with:

```powershell
vclaude
```

5. Before stopping, update `.ai/` files and create a checkpoint commit if possible.
