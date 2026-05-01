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

## Local Claude Supervisor Scope

Create a local terminal wrapper so supervised Claude sessions can automatically hand off to Codex after a detected usage limit, rate limit, context limit, quota issue, auth failure, command failure, or other blocking error.

Do not run Claude or Codex during wrapper creation.

## Latest User Request - 2026-05-01

Review the proposed AI Action Center plan for the dashboard before implementation.

Review result:

- Approved in direction: a morning dashboard bulk action that clears overdue follow-ups is a strong fit for Vantro Flow.
- Do not overclaim delivery: current `/api/remind` generates and logs a reminder but has no real delivery adapter.
- Before building, make sure the bulk flow handles API failures, does not mark failed rows as sent, avoids disputed/paid invoices, and uses a reliable app origin for payment links.

The old infrastructure handoff remains completed context, but the active product discussion is the Action Center plan.

## Latest User Request - Localhost

User asked to see the app on localhost.

Current result:

- Existing Next dev server is running at `http://localhost:3000`.
- Dashboard page and `/api/dashboard` both responded with HTTP 200.
- Action Center modal has not been wired into the dashboard yet.
