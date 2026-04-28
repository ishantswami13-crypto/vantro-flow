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

## Workflow

Claude Architect -> Codex Builder -> Tests -> Claude Reviewer -> Codex Fixer -> Tests -> Git checkpoint.
