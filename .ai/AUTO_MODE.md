# Auto Mode

The orchestrator runs with automatic failover.

If Claude fails, reaches limit, times out, or cannot continue, Codex automatically continues from the latest repo state.

If Codex fails, reaches limit, times out, or cannot continue, Claude automatically continues from the latest repo state.

The source of truth is:

1. Git status
2. Git commits
3. `.ai/PROJECT_STATE.md`
4. `.ai/CURRENT_TASK.md`
5. `.ai/NEXT_AGENT_PROMPT.md`
6. `.ai/TEST_LOG.md`
7. `.ai/FAILOVER_LOG.md`

Agents must never restart from scratch.
