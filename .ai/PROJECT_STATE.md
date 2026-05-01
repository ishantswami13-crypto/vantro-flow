# Project State

## Product

Vantro Flow is a premium AI-powered cashflow, collections, and financial operations product for startups, SMEs, finance teams, and enterprises.

## Current Feature

Level 3 multi-agent automation setup.

## Current Status

Automation infrastructure is ready for manual orchestration.

## Completed

- Created shared repo-memory system.
- Created agent instruction files.
- Created orchestrator script.
- Created PowerShell runner.
- Added package helper script `ai:orchestrate`.
- Validated Python syntax for `scripts/orchestrator.py`.

## Incomplete

- Run the orchestrator manually after setup.
- Verify Claude Code and Codex CLIs are installed.
- Verify npm lint/build commands exist and work.

## Known Problems

- None recorded yet.

## Commands Run

- `python -m py_compile scripts/orchestrator.py`
- `git status --short`

## Latest Test Result

- Python syntax check passed for `scripts/orchestrator.py`.
- Full orchestration was not run, by design.

## NEXT_AGENT_START_HERE

1. Read all `.ai/` files.
2. Check `git status --short`.
3. Check `git log --oneline -5`.
4. Continue from `.ai/NEXT_AGENT_PROMPT.md`.

## Orchestrator Long Prompt Fix Update

The Level 3 orchestrator was patched to avoid Windows command length failures.

## Added

- Created `.ai/agent_prompts/`.
- Updated `scripts/orchestrator.py` to write full Claude/Codex prompts into phase-specific markdown files.
- Updated agent invocation so subprocess receives only a short instruction to read the prompt file.
- Added explicit `OSError` handling for WinError 206 and safe continuation logging.

## Latest Validation

- `python -m py_compile scripts/orchestrator.py` passed.
- `git status --short` was checked.
- Full orchestration was not run after this patch.

## NEXT_AGENT_START_HERE

1. Read all `.ai/` files.
2. Run `git status --short`.
3. Run `git log --oneline -5`.
4. To manually test the fixed orchestrator, run `.\scripts\run-orchestrator.ps1`.

## Automatic Failover Upgrade

The Level 3 orchestrator is being upgraded from a linear Claude/Codex runner into an automatic failover supervisor.

## Added

- `AgentResult` records for every agent phase.
- Agent result classification: success, failed, limited, skipped, timeout.
- Failover handoff writer for `.ai/PROJECT_STATE.md`, `.ai/TEST_LOG.md`, `.ai/NEXT_AGENT_PROMPT.md`, and `.ai/FAILOVER_LOG.md`.
- Heartbeat file `.ai/RUNNING_AGENT.md`.
- Auto mode file `.ai/AUTO_MODE.md`.
- `python scripts/orchestrator.py --watch` supervisor mode.

## Validation Status

- Passed: `python -m py_compile scripts/orchestrator.py`.
- Checked: `git status --short`.
- Full orchestration must not run during this patch.

## Automatic Failover Ready

The orchestrator now supports supervisor mode with automatic Claude/Codex failover.

## Latest Validation

- `python -m py_compile scripts/orchestrator.py` passed.
- `git status --short` was checked.
- Full orchestration was not run after this patch.

## NEXT_AGENT_START_HERE

1. Read all `.ai/` files.
2. Run `git status --short`.
3. Run `git log --oneline -5`.
4. To run automatic failover supervision manually, run `python scripts\orchestrator.py --watch`.

## Local Claude Supervisor Update

The repo now includes a local PowerShell wrapper for supervised Claude Code sessions.

## Added

- `scripts/claude-supervised.ps1`
- `scripts/codex-continue-after-claude-limit.ps1`
- `scripts/install-claude-supervised-alias.ps1`
- `.ai/LOCAL_CLAUDE_SUPERVISOR.md`
- `.ai/local-claude-session.log`

## Current Status

The wrapper passed help-mode validation. Claude and Codex have not been launched by this setup task.


## 2026-04-28T21:47:42 Automation Update

Automatic failover was triggered.

- failed agent: Claude
- backup agent: Codex
- phase: architect
- reason: Agent exited non-zero or output indicated failure. Exit code: 1.

Changed files:

- `ai/RUNNING_AGENT.md`
- `.ai/TEST_LOG.md`
- `.ai/agent_prompts/claude_architect.md`
- `.chrome-desktop-redesign/`
- `.chrome-dom-redesign/`
- `.chrome-mobile-redesign/`
- `.dev-redesign.err.log`
- `.dev-redesign.log`
- `desktop-redesign.png`
- `mobile-redesign.png`


## 2026-04-28T21:51:03 Automation Update

Automatic failover was triggered.

- failed agent: Claude
- backup agent: Codex
- phase: architect
- reason: Agent exited non-zero or output indicated failure. Exit code: 1.

Changed files:

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

## 2026-05-01 Action Center Plan Review

The latest user-facing request is to review the proposed AI Action Center direction for the morning dashboard.

Current repo observations:

- `implementation_plan_action_center.md` was not present in the workspace when checked.
- An untracked `src/components/dashboard/ActionCenterModal.tsx` already exists and matches the proposed bulk action concept, but it is not wired into `src/app/page.tsx`.
- `src/app/api/remind/route.ts` now accepts `tone` and injects a payment link, but the endpoint currently generates a Groq message and records a `follow_ups` row. It does not deliver via a real email/SMS/WhatsApp provider.
- Public payment portal files exist under `src/app/pay/[invoice_number]` and `src/app/api/pay/[invoice_number]`, but they are untracked.

Plan review outcome:

- Direction approved for UX/product value.
- Build should be guarded so the UI does not claim messages were delivered unless the configured backend actually sends them.
- The next implementation step should wire the modal into the dashboard only after handling failure states, response checking, disputed/paid invoice filtering, and honest delivery wording.
