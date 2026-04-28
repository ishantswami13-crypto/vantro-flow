# Current Task

Build the Level 3 multi-agent automation system for Vantro Flow.

## Goal

Create a system where Claude Code and Codex can hand off work through repo memory, git checkpoints, tests, and an orchestrator.

## Scope

- Create AGENTS.md
- Create CLAUDE.md
- Create `.ai/` memory files
- Create Python orchestrator
- Create PowerShell runner
- Add package.json helper script if safe
- Validate orchestrator syntax

## Do Not Do

- Do not rebuild the product UI.
- Do not redesign the app.
- Do not delete existing app files.
- Do not reset git.
- Do not install unnecessary dependencies.
- Do not run full orchestration automatically inside this current Codex session.

## Current Upgrade

Upgrade the Level 3 orchestrator into automatic failover mode.

## Automatic Failover Scope

- Detect Claude/Codex non-zero exits, timeouts, limit errors, blocked/auth states, and command failures.
- Write `.ai/RUNNING_AGENT.md` before and after each agent phase.
- Write `.ai/FAILOVER_LOG.md` when failover happens.
- Hand off from Claude to Codex or Codex to Claude automatically.
- Stop safely if both primary and backup fail in the same phase.
- Keep full prompts in `.ai/agent_prompts/*.md` and pass only short command-line prompts.
