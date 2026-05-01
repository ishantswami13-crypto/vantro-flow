# Decisions

## Level 3 Automation Architecture

We will use repo-based memory instead of chat memory.

Reason:
AI chat context can disappear, hit limits, or reset. Git state and markdown handoff files persist inside the project.

## Agent Roles

Claude Code:
- Architecture
- Planning
- Review
- UX/product judgment
- Refactoring guidance

Codex:
- Implementation
- Fixing
- Lint/build repair
- Focused code changes

## Source of Truth

1. Git commits
2. `.ai/PROJECT_STATE.md`
3. `.ai/CURRENT_TASK.md`
4. `.ai/NEXT_AGENT_PROMPT.md`
5. `.ai/TEST_LOG.md`
6. `.ai/DECISIONS.md`
7. `.ai/FAILOVER_LOG.md`
8. `.ai/RUNNING_AGENT.md`
9. `.ai/AUTO_MODE.md`

## Workflow

Claude Architect -> Codex Builder -> Tests -> Claude Reviewer -> Codex Fixer -> Tests -> Git checkpoint.

## Automatic Failover

The orchestrator now treats the repo memory and git state as the source of truth for failover.

Detection:
- Non-zero exit code
- Timeout
- Rate/usage/quota/context-limit output
- Authentication, permission, command, cancellation, failed, or error output

Failover chain:
- Architect: Claude primary, Codex backup
- Builder: Codex primary, Claude backup
- Reviewer: Claude primary, Codex backup
- Fixer: Codex primary, Claude backup

Safety:
- Full prompts stay in `.ai/agent_prompts/*.md`.
- Subprocess calls receive only short file-reference prompts.
- Max failovers per run is 4.
- If primary and backup fail in the same phase, `.ai/NEXT_AGENT_PROMPT.md` requests manual help.

## Supervisor Mode

`python scripts\orchestrator.py --watch` runs the same orchestration cycle with a final supervisor summary and Ctrl+C heartbeat handling.

The orchestrator must not be started recursively by Claude or Codex phases. Child agent processes receive `VANTRO_ORCHESTRATOR_RUNNING=1`, and prompts tell agents to avoid nested orchestrator calls.

## Local Claude Supervisor

Plain `claude` remains untouched and unsupervised.

The supervised entrypoint is `scripts/claude-supervised.ps1`, or `vclaude` after installing the PowerShell profile helper.

Reason:
Automatically continuing into Codex requires a wrapper to observe Claude output and update repo handoff files. A plain terminal `claude` session cannot trigger local Codex failover by itself.

## AI Action Center Product Direction

Approved direction:

- Add a prominent dashboard-level bulk action for overdue follow-ups.
- Let the user approve one queue and watch progress clear account-by-account with visible completion states.
- Keep the experience calm, premium, and operational, not gimmicky.

Guardrails:

- Do not claim a reminder was sent unless the backend actually confirms success.
- Current `/api/remind` generates a message and writes to `follow_ups`; real delivery requires a future provider adapter or more honest UI copy.
- Bulk execution should continue through recoverable failures but surface failed rows separately from completed rows.
- Payment links should use a configured public app origin or request origin with protocol awareness, not hard-coded `http`.
