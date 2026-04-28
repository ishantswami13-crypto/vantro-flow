"""Vantro Flow Level 3 multi-agent orchestrator.

This script coordinates Claude Code and Codex through repo-based memory,
automatic failover, safe git checkpoints, and lint/build checks.

It intentionally uses only the Python standard library.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Iterable


SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
AI_DIR = ROOT / ".ai"
TEST_LOG = AI_DIR / "TEST_LOG.md"
NEXT_AGENT_PROMPT = AI_DIR / "NEXT_AGENT_PROMPT.md"
FAILOVER_LOG = AI_DIR / "FAILOVER_LOG.md"
RUNNING_AGENT = AI_DIR / "RUNNING_AGENT.md"
AUTO_MODE = AI_DIR / "AUTO_MODE.md"
AGENT_PROMPT_DIR = AI_DIR / "agent_prompts"

CONTEXT_FILES = [
    "AGENTS.md",
    "CLAUDE.md",
    ".ai/AUTO_MODE.md",
    ".ai/PROJECT_STATE.md",
    ".ai/CURRENT_TASK.md",
    ".ai/DECISIONS.md",
    ".ai/TEST_LOG.md",
    ".ai/FAILOVER_LOG.md",
    ".ai/RUNNING_AGENT.md",
    ".ai/NEXT_AGENT_PROMPT.md",
]

LIMITED_PHRASES = (
    "rate limit",
    "usage limit",
    "limit reached",
    "quota",
    "insufficient credits",
    "context length",
    "context limit",
    "maximum context",
    "too many requests",
    "overloaded",
)
TIMEOUT_PHRASES = ("timeout",)
FAILED_PHRASES = (
    "authentication",
    "not logged in",
    "permission denied",
    "command not found",
    "not recognized",
    "failed",
    "error",
    "cancelled",
)

AGENT_TIMEOUT_SECONDS = 60 * 30
CHECK_TIMEOUT_SECONDS = 60 * 12
GIT_TIMEOUT_SECONDS = 60 * 2
MAX_FAILOVERS_PER_RUN = 4

SKIP_CHECKPOINT_PREFIXES = (
    ".next/",
    "node_modules/",
    ".chrome-",
    ".tmp",
    "tmp-",
)
SKIP_CHECKPOINT_SUFFIXES = (
    ".log",
    ".pid",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
)

PHASE_CHECKPOINTS = {
    "architect": "checkpoint: after claude architect",
    "builder": "checkpoint: after codex builder",
    "reviewer": "checkpoint: after claude review",
    "fixer": "checkpoint: after codex fixer",
}


@dataclass(frozen=True)
class AgentSpec:
    name: str
    tool: str
    args: list[str]


@dataclass
class CommandResult:
    args: list[str]
    returncode: int
    stdout: str
    stderr: str
    timed_out: bool = False

    @property
    def output(self) -> str:
        return "\n".join(part for part in [self.stdout.strip(), self.stderr.strip()] if part).strip()


@dataclass
class AgentResult:
    agent_name: str
    phase: str
    command: str
    exit_code: int
    stdout: str
    stderr: str
    status: str
    failure_reason: str
    started_at: str
    finished_at: str

    @property
    def output(self) -> str:
        return "\n".join(part for part in [self.stdout.strip(), self.stderr.strip()] if part).strip()


@dataclass
class RunState:
    watch: bool = False
    failovers_used: int = 0
    failed_agents: list[AgentResult] = field(default_factory=list)
    backup_agents_used: list[str] = field(default_factory=list)
    check_results: list[CommandResult] = field(default_factory=list)
    manual_help_needed: bool = False


CLAUDE = AgentSpec("Claude", "claude", ["-p"])
CODEX = AgentSpec("Codex", "codex", ["exec"])


def timestamp() -> str:
    return datetime.now().isoformat(timespec="seconds")


def ensure_ai_dir() -> None:
    AI_DIR.mkdir(parents=True, exist_ok=True)
    AGENT_PROMPT_DIR.mkdir(parents=True, exist_ok=True)
    if not FAILOVER_LOG.exists():
        FAILOVER_LOG.write_text("# Failover Log\n", encoding="utf-8")
    if not AUTO_MODE.exists():
        AUTO_MODE.write_text(
            "# Auto Mode\n\n"
            "The orchestrator runs with automatic failover.\n\n"
            "If Claude fails, reaches limit, times out, or cannot continue, Codex automatically continues from the latest repo state.\n\n"
            "If Codex fails, reaches limit, times out, or cannot continue, Claude automatically continues from the latest repo state.\n\n"
            "The source of truth is:\n\n"
            "1. Git status\n"
            "2. Git commits\n"
            "3. `.ai/PROJECT_STATE.md`\n"
            "4. `.ai/CURRENT_TASK.md`\n"
            "5. `.ai/NEXT_AGENT_PROMPT.md`\n"
            "6. `.ai/TEST_LOG.md`\n"
            "7. `.ai/FAILOVER_LOG.md`\n\n"
            "Agents must never restart from scratch.\n",
            encoding="utf-8",
        )


def append_file(path: Path, message: str) -> None:
    ensure_ai_dir()
    with path.open("a", encoding="utf-8") as handle:
        handle.write(f"\n\n{message.strip()}\n")


def append_log(message: str) -> None:
    append_file(TEST_LOG, f"## {timestamp()}\n\n{message.strip()}")


def append_project_state(message: str) -> None:
    append_file(AI_DIR / "PROJECT_STATE.md", f"## {timestamp()} Automation Update\n\n{message.strip()}")


def append_decision(message: str) -> None:
    append_file(AI_DIR / "DECISIONS.md", f"## {timestamp()} Decision Update\n\n{message.strip()}")


def tool_path(name: str) -> str | None:
    return shutil.which(name)


def child_env() -> dict[str, str]:
    env = os.environ.copy()
    env["VANTRO_ORCHESTRATOR_RUNNING"] = "1"
    return env


def run_command(
    args: list[str],
    *,
    timeout: int,
    env: dict[str, str] | None = None,
    log_output: bool = True,
) -> CommandResult:
    display = " ".join(args)
    print(f"\n$ {display}")
    try:
        completed = subprocess.run(
            args,
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        result = CommandResult(
            args=args,
            returncode=completed.returncode,
            stdout=completed.stdout,
            stderr=completed.stderr,
        )
    except subprocess.TimeoutExpired as error:
        result = CommandResult(
            args=args,
            returncode=124,
            stdout=error.stdout or "",
            stderr=error.stderr or "",
            timed_out=True,
        )
    except OSError as error:
        winerror = getattr(error, "winerror", None)
        if winerror == 206:
            stderr = (
                "WinError 206: command line is too long. "
                "Agent prompts must be written to .ai/agent_prompts and invoked with a short file-reference prompt."
            )
        else:
            stderr = f"{error.__class__.__name__}: {error}"
        result = CommandResult(args=args, returncode=1, stdout="", stderr=stderr)

    if log_output:
        summary = result.output or "(no output)"
        append_log(
            f"Command: `{display}`\n\n"
            f"Exit code: `{result.returncode}`\n\n"
            f"Timed out: `{result.timed_out}`\n\n"
            f"```text\n{summary[-6000:]}\n```"
        )
    return result


def read_context() -> str:
    blocks: list[str] = []
    for relative in CONTEXT_FILES:
        path = ROOT / relative
        if path.exists():
            content = path.read_text(encoding="utf-8", errors="replace")
        else:
            content = "(missing)"
        blocks.append(f"--- {relative} ---\n{content.strip()}")
    return "\n\n".join(blocks)


def package_scripts() -> dict[str, str]:
    package_json = ROOT / "package.json"
    if not package_json.exists():
        append_log("`package.json` not found. npm scripts cannot be detected.")
        return {}
    try:
        payload = json.loads(package_json.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        append_log(f"Could not parse `package.json`: {error}")
        return {}
    scripts = payload.get("scripts", {})
    if not isinstance(scripts, dict):
        return {}
    return {str(key): str(value) for key, value in scripts.items()}


def git_status_short() -> str:
    git = tool_path("git")
    if not git:
        return ""
    result = run_command([git, "status", "--short"], timeout=GIT_TIMEOUT_SECONDS, log_output=False)
    return result.stdout.strip()


def git_log_recent() -> str:
    git = tool_path("git")
    if not git:
        return ""
    result = run_command([git, "log", "--oneline", "-5"], timeout=GIT_TIMEOUT_SECONDS, log_output=False)
    return result.stdout.strip()


def parse_status_paths(status: str) -> list[str]:
    paths: list[str] = []
    for line in status.splitlines():
        if not line.strip() or len(line) < 4:
            continue
        path = line[3:].strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1].strip()
        path = path.strip('"')
        if path:
            paths.append(path)
    return paths


def should_skip_checkpoint(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if normalized in {"desktop-redesign.png", "mobile-redesign.png"}:
        return True
    if any(normalized.startswith(prefix) for prefix in SKIP_CHECKPOINT_PREFIXES):
        return True
    return normalized.lower().endswith(SKIP_CHECKPOINT_SUFFIXES)


def stage_paths(git: str, paths: Iterable[str]) -> None:
    for path in paths:
        run_command([git, "add", "--", path], timeout=GIT_TIMEOUT_SECONDS, log_output=False)


def has_staged_changes(git: str) -> bool:
    result = subprocess.run(
        [git, "diff", "--cached", "--quiet"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    return result.returncode != 0


def commit_checkpoint(message: str) -> bool:
    git = tool_path("git")
    if not git:
        append_log(f"Skipped checkpoint `{message}`: `git` not found on PATH.")
        return False

    status = git_status_short()
    if not status:
        append_log(f"No changes available for checkpoint `{message}`.")
        return False

    all_paths = parse_status_paths(status)
    paths = [path for path in all_paths if not should_skip_checkpoint(path)]
    skipped = [path for path in all_paths if should_skip_checkpoint(path)]
    if skipped:
        append_log("Skipped generated/artifact paths during checkpoint:\n\n" + "\n".join(f"- `{path}`" for path in skipped))
    if not paths:
        append_log(f"No safe paths to stage for checkpoint `{message}`.")
        return False

    stage_paths(git, paths)
    if not has_staged_changes(git):
        append_log(f"No staged changes for checkpoint `{message}`.")
        return False

    result = run_command([git, "commit", "-m", message], timeout=GIT_TIMEOUT_SECONDS)
    if result.returncode == 0:
        append_log(f"Created checkpoint commit: `{message}`.")
        return True
    append_log(f"Checkpoint commit failed for `{message}`. See command output above.")
    return False


def prompt_filename(agent: AgentSpec, phase: str, failover: bool = False) -> str:
    suffix = "_failover" if failover else ""
    return f"{agent.name.lower()}_{phase}{suffix}.md"


def relative_prompt_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def write_agent_prompt(agent: AgentSpec, phase: str, mission: str, *, failover: bool = False) -> Path:
    ensure_ai_dir()
    context = read_context()
    path = AGENT_PROMPT_DIR / prompt_filename(agent, phase, failover=failover)
    prompt = f"""You are {agent.name} running the `{phase}` phase inside Vantro Flow.

VANTRO_ORCHESTRATOR_RUNNING=1 is set.
Do not run scripts/orchestrator.py or scripts/run-orchestrator.ps1 from inside this task.

Mission:
{mission}

Automatic failover protocol:
- Do not restart from scratch.
- Read `.ai/FAILOVER_LOG.md`, `.ai/RUNNING_AGENT.md`, and `.ai/NEXT_AGENT_PROMPT.md`.
- Run `git status --short` and `git log --oneline -5`.
- Continue from the current repo state and incomplete task.
- Do not rewrite completed work.
- Before stopping, update all `.ai/` handoff files.
- Record test/check failures honestly in `.ai/TEST_LOG.md`.

Repo memory snapshot:

{context}
"""
    path.write_text(prompt, encoding="utf-8")
    append_log(f"Wrote full prompt for **{agent.name} {phase}** to `{relative_prompt_path(path)}`.")
    return path


def short_agent_prompt(prompt_file: Path) -> str:
    relative = relative_prompt_path(prompt_file)
    return (
        f"Read {relative} and follow it exactly. "
        "Do not run scripts/orchestrator.py or scripts/run-orchestrator.ps1 from inside this task."
    )


def failover_short_prompt() -> str:
    return "Read .ai/NEXT_AGENT_PROMPT.md and continue from the failover handoff. Do not restart from scratch."


def classify_agent_result(result: AgentResult) -> str:
    if result.status == "skipped":
        return "skipped"
    if result.status == "timeout" or result.exit_code == 124:
        return "timeout"
    output = result.output.lower()
    if any(phrase in output for phrase in LIMITED_PHRASES):
        return "limited"
    if any(phrase in output for phrase in TIMEOUT_PHRASES):
        return "timeout"
    if any(phrase in output for phrase in FAILED_PHRASES):
        return "failed"
    if result.exit_code != 0:
        return "failed"
    return "success"


def write_running_agent(
    *,
    agent_name: str,
    phase: str,
    started_at: str,
    mission: str,
    status: str,
    finished_at: str | None = None,
    failure_reason: str = "",
    exit_code: int | None = None,
) -> None:
    ensure_ai_dir()
    lines = [
        "# Running Agent",
        "",
        f"- active agent: {agent_name}",
        f"- phase: {phase}",
        f"- started_at: {started_at}",
        f"- status: {status}",
    ]
    if finished_at:
        lines.append(f"- finished_at: {finished_at}")
    if exit_code is not None:
        lines.append(f"- exit_code: {exit_code}")
    if failure_reason:
        lines.append(f"- failure_reason: {failure_reason}")
    lines.extend(["", "## Mission", "", mission.strip()])
    RUNNING_AGENT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def failure_reason_for(status: str, result: AgentResult) -> str:
    if result.failure_reason:
        return result.failure_reason
    if status == "timeout":
        return "Agent timed out or output indicated a timeout."
    if status == "limited":
        return "Agent output indicated a rate, usage, quota, or context limit."
    if status == "skipped":
        return "Agent command was unavailable and the phase was skipped."
    if status == "failed":
        return f"Agent exited non-zero or output indicated failure. Exit code: {result.exit_code}."
    return ""


def run_agent(agent: AgentSpec, phase: str, mission: str, *, failover: bool = False) -> AgentResult:
    started_at = timestamp()
    write_running_agent(agent_name=agent.name, phase=phase, started_at=started_at, mission=mission, status="running")

    executable = tool_path(agent.tool)
    if not executable:
        finished_at = timestamp()
        result = AgentResult(
            agent_name=agent.name,
            phase=phase,
            command=f"{agent.tool} {' '.join(agent.args)}",
            exit_code=127,
            stdout="",
            stderr=f"{agent.tool}: command not found",
            status="skipped",
            failure_reason=f"`{agent.tool}` CLI not found on PATH.",
            started_at=started_at,
            finished_at=finished_at,
        )
        write_running_agent(
            agent_name=agent.name,
            phase=phase,
            started_at=started_at,
            mission=mission,
            status="skipped",
            finished_at=finished_at,
            failure_reason=result.failure_reason,
            exit_code=result.exit_code,
        )
        append_log(f"Skipped {agent.name} {phase}: `{agent.tool}` CLI not found on PATH.")
        return result

    prompt_file = write_agent_prompt(agent, phase, mission, failover=failover)
    command_prompt = failover_short_prompt() if failover else short_agent_prompt(prompt_file)
    command = [executable, *agent.args, command_prompt]
    append_log(f"Starting agent phase: **{agent.name} {phase}**.")
    command_result = run_command(command, timeout=AGENT_TIMEOUT_SECONDS, env=child_env())
    finished_at = timestamp()
    result = AgentResult(
        agent_name=agent.name,
        phase=phase,
        command=" ".join(command),
        exit_code=command_result.returncode,
        stdout=command_result.stdout,
        stderr=command_result.stderr,
        status="failed",
        failure_reason="",
        started_at=started_at,
        finished_at=finished_at,
    )
    if command_result.timed_out:
        result.status = "timeout"
        result.failure_reason = "Process timed out."
    else:
        result.status = classify_agent_result(result)
        result.failure_reason = failure_reason_for(result.status, result)

    write_running_agent(
        agent_name=agent.name,
        phase=phase,
        started_at=started_at,
        mission=mission,
        status=result.status,
        finished_at=finished_at,
        failure_reason=result.failure_reason,
        exit_code=result.exit_code,
    )
    append_log(
        f"Agent phase finished: **{agent.name} {phase}**\n\n"
        f"- status: `{result.status}`\n"
        f"- exit_code: `{result.exit_code}`\n"
        f"- reason: {result.failure_reason or 'none'}"
    )
    return result


def changed_files_text() -> str:
    status = git_status_short()
    if not status:
        return "(clean)"
    paths = parse_status_paths(status)
    return "\n".join(f"- `{path}`" for path in paths) if paths else "(clean)"


def write_failover_handoff(failed_agent: str, next_agent: str, phase: str, reason: str) -> None:
    ensure_ai_dir()
    git_status = git_status_short() or "(clean)"
    recent_commits = git_log_recent() or "(unavailable)"
    changed_files = changed_files_text()
    now = timestamp()
    next_action = (
        f"{next_agent} must continue the `{phase}` phase from the current repo state. "
        "Read `.ai/NEXT_AGENT_PROMPT.md`, `.ai/FAILOVER_LOG.md`, `.ai/RUNNING_AGENT.md`, "
        "inspect changed files, and do not restart from scratch."
    )

    append_file(
        FAILOVER_LOG,
        f"## {now}\n\n"
        f"- failed agent: {failed_agent}\n"
        f"- backup agent: {next_agent}\n"
        f"- phase: {phase}\n"
        f"- reason: {reason}\n\n"
        "### Git Status\n\n"
        f"```text\n{git_status}\n```\n\n"
        f"### Next Action\n\n{next_action}",
    )
    append_project_state(
        "Automatic failover was triggered.\n\n"
        f"- failed agent: {failed_agent}\n"
        f"- backup agent: {next_agent}\n"
        f"- phase: {phase}\n"
        f"- reason: {reason}\n\n"
        "Changed files:\n\n"
        f"{changed_files}"
    )
    append_log(
        "Automatic failover handoff written.\n\n"
        f"- failed agent: {failed_agent}\n"
        f"- backup agent: {next_agent}\n"
        f"- phase: {phase}\n"
        f"- reason: {reason}\n\n"
        "Git status:\n\n"
        f"```text\n{git_status}\n```\n\n"
        "Last 5 commits:\n\n"
        f"```text\n{recent_commits}\n```"
    )
    NEXT_AGENT_PROMPT.write_text(
        "# Next Agent Prompt\n\n"
        "You are taking over inside Vantro Flow after an automatic failover.\n\n"
        "Do not restart from scratch.\n\n"
        "## Failover\n\n"
        f"- Failed agent: {failed_agent}\n"
        f"- Backup agent now responsible: {next_agent}\n"
        f"- Phase: {phase}\n"
        f"- Failure reason: {reason}\n\n"
        "## Changed Files\n\n"
        f"{changed_files}\n\n"
        "## Current Git Status\n\n"
        f"```text\n{git_status}\n```\n\n"
        "## Last 5 Commits\n\n"
        f"```text\n{recent_commits}\n```\n\n"
        "## NEXT_AGENT_START_HERE\n\n"
        "1. Read `AGENTS.md` and `CLAUDE.md`.\n"
        "2. Read `.ai/FAILOVER_LOG.md`.\n"
        "3. Read `.ai/RUNNING_AGENT.md`.\n"
        "4. Read all `.ai/` memory files.\n"
        "5. Run `git status --short`.\n"
        "6. Run `git log --oneline -5`.\n"
        "7. Inspect changed files.\n"
        f"8. Continue the `{phase}` phase from the current repo state.\n"
        "9. Do not restart the task.\n"
        "10. Do not rewrite completed work.\n"
        "11. Update `.ai/` files before stopping.\n",
        encoding="utf-8",
    )


def write_manual_help_prompt(phase: str, primary: AgentResult, backup: AgentResult | None) -> None:
    git_status = git_status_short() or "(clean)"
    recent_commits = git_log_recent() or "(unavailable)"
    backup_text = "No backup result." if backup is None else f"{backup.agent_name}: {backup.status} - {backup.failure_reason}"
    NEXT_AGENT_PROMPT.write_text(
        "# Next Agent Prompt\n\n"
        "Manual help is needed. Both the primary and backup automation paths failed or failover limit was reached.\n\n"
        "Do not restart from scratch.\n\n"
        f"## Phase\n\n`{phase}`\n\n"
        "## Primary Result\n\n"
        f"{primary.agent_name}: {primary.status} - {primary.failure_reason}\n\n"
        "## Backup Result\n\n"
        f"{backup_text}\n\n"
        "## Current Git Status\n\n"
        f"```text\n{git_status}\n```\n\n"
        "## Last 5 Commits\n\n"
        f"```text\n{recent_commits}\n```\n\n"
        "## NEXT_AGENT_START_HERE\n\n"
        "1. Read every `.ai/` file.\n"
        "2. Inspect changed files.\n"
        "3. Fix the blocker manually or ask the user for the missing credential/limit reset.\n"
        "4. Do not restart completed work.\n",
        encoding="utf-8",
    )
    append_log(f"Manual help prompt written for `{phase}` phase.")


def run_with_failover(primary_agent: AgentSpec, backup_agent: AgentSpec, phase: str, mission: str, state: RunState) -> AgentResult:
    print(f"\n=== {phase}: primary {primary_agent.name}, backup {backup_agent.name} ===")
    primary = run_agent(primary_agent, phase, mission)
    primary.status = classify_agent_result(primary)
    if primary.status == "success":
        append_log(f"{primary_agent.name} completed `{phase}` successfully.")
        commit_checkpoint(PHASE_CHECKPOINTS.get(phase, f"checkpoint: after {phase}"))
        return primary

    state.failed_agents.append(primary)
    if state.failovers_used >= MAX_FAILOVERS_PER_RUN:
        state.manual_help_needed = True
        reason = f"Maximum failovers per run reached ({MAX_FAILOVERS_PER_RUN})."
        append_log(reason)
        write_manual_help_prompt(phase, primary, None)
        return primary

    reason = failure_reason_for(primary.status, primary)
    state.failovers_used += 1
    state.backup_agents_used.append(backup_agent.name)
    write_failover_handoff(primary_agent.name, backup_agent.name, phase, reason)
    commit_checkpoint(f"checkpoint: failover after {phase} {primary_agent.name.lower()}")

    backup_mission = (
        f"Continue the `{phase}` phase after {primary_agent.name} failed. "
        "Use `.ai/NEXT_AGENT_PROMPT.md` and repo state as the source of truth. "
        "Do not restart from scratch."
    )
    backup = run_agent(backup_agent, phase, backup_mission, failover=True)
    backup.status = classify_agent_result(backup)
    if backup.status == "success":
        append_log(f"Backup agent {backup_agent.name} completed `{phase}` successfully.")
        commit_checkpoint(f"checkpoint: after {backup_agent.name.lower()} {phase} failover")
        return backup

    state.failed_agents.append(backup)
    state.manual_help_needed = True
    append_log(
        f"Both primary and backup failed in `{phase}`.\n\n"
        f"- primary: {primary_agent.name} / {primary.status} / {primary.failure_reason}\n"
        f"- backup: {backup_agent.name} / {backup.status} / {backup.failure_reason}"
    )
    write_manual_help_prompt(phase, primary, backup)
    commit_checkpoint(f"checkpoint: blocked {phase} failover")
    return backup


def run_checks(label: str, state: RunState) -> None:
    append_log(f"Starting check phase: **{label}**.")
    npm = tool_path("npm")
    if not npm:
        append_log("Skipped npm checks: `npm` was not found on PATH.")
        print("Skipping npm checks: npm not found.")
        return

    scripts = package_scripts()
    for script in ("lint", "build"):
        if script not in scripts:
            append_log(f"Skipped `npm run {script}`: package.json has no `{script}` script.")
            continue
        result = run_command([npm, "run", script], timeout=CHECK_TIMEOUT_SECONDS, env=os.environ.copy())
        state.check_results.append(result)


def write_final_next_prompt(state: RunState) -> None:
    status = git_status_short() or "(clean)"
    recent_log = git_log_recent() or "(unavailable)"
    failed = "\n".join(f"- {item.agent_name} {item.phase}: {item.status} ({item.failure_reason})" for item in state.failed_agents) or "- None"
    backups = "\n".join(f"- {agent}" for agent in state.backup_agents_used) or "- None"
    checks = "\n".join(f"- {' '.join(result.args)}: exit {result.returncode}" for result in state.check_results) or "- Not run"
    mode = "manual help needed" if state.manual_help_needed else "ready"
    content = f"""# Next Agent Prompt

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

Automatic failover orchestrator status: {mode}.

## Failed Agents This Run

{failed}

## Backup Agents Used

{backups}

## Check Summary

{checks}

## Last Known Git Status

```text
{status}
```

## Recent Commits

```text
{recent_log}
```

## NEXT_AGENT_START_HERE

1. Read all `.ai/` files.
2. Inspect changed files.
3. Continue from the current repo state.
4. Do not restart completed work.
5. If the user asks to run the auto failover cycle, execute:

```powershell
python scripts\\orchestrator.py --watch
```

6. Before stopping, update `.ai/PROJECT_STATE.md`, `.ai/TEST_LOG.md`, and `.ai/NEXT_AGENT_PROMPT.md`.
"""
    NEXT_AGENT_PROMPT.write_text(content, encoding="utf-8")
    append_log("Updated `.ai/NEXT_AGENT_PROMPT.md` with final automatic failover handoff.")


def print_watch_summary(state: RunState) -> None:
    print("\n=== Level 3 Orchestrator Summary ===")
    print(f"Final status: {'manual help needed' if state.manual_help_needed else 'finished'}")
    print("Failed agents:")
    if state.failed_agents:
        for item in state.failed_agents:
            print(f"- {item.agent_name} {item.phase}: {item.status} ({item.failure_reason})")
    else:
        print("- None")
    print("Backup agents used:")
    if state.backup_agents_used:
        for agent in state.backup_agents_used:
            print(f"- {agent}")
    else:
        print("- None")
    print("Test result summary:")
    if state.check_results:
        for result in state.check_results:
            print(f"- {' '.join(result.args)}: exit {result.returncode}")
    else:
        print("- No checks run")
    print("Next command:")
    print("cd D:\\vantro-flow")
    print("python scripts\\orchestrator.py --watch")


def run_cycle(state: RunState) -> None:
    git = tool_path("git")
    if git:
        run_command([git, "status", "--short"], timeout=GIT_TIMEOUT_SECONDS)
        run_command([git, "log", "--oneline", "-5"], timeout=GIT_TIMEOUT_SECONDS)
    else:
        append_log("`git` CLI not found. Git status, log, and checkpoint commits will be skipped.")

    run_with_failover(
        CLAUDE,
        CODEX,
        "architect",
        "Review repo memory, refine the implementation plan, update `.ai/` files, and leave a precise builder prompt.",
        state,
    )
    if state.manual_help_needed:
        return

    run_with_failover(
        CODEX,
        CLAUDE,
        "builder",
        "Implement the next concrete step from `.ai/NEXT_AGENT_PROMPT.md`, update `.ai/` files, and keep changes scoped.",
        state,
    )
    if state.manual_help_needed:
        return

    run_checks("first lint/build", state)

    run_with_failover(
        CLAUDE,
        CODEX,
        "reviewer",
        "Review the implementation, fix only small safe issues if needed, update `.ai/` files, and leave precise fixer instructions.",
        state,
    )
    if state.manual_help_needed:
        return

    run_with_failover(
        CODEX,
        CLAUDE,
        "fixer",
        "Fix errors recorded in `.ai/TEST_LOG.md`, update `.ai/` files, and keep changes focused.",
        state,
    )
    if state.manual_help_needed:
        return

    run_checks("final lint/build", state)
    commit_checkpoint("checkpoint: after codex fixer")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Vantro Flow Level 3 automatic failover orchestrator.")
    parser.add_argument("--watch", action="store_true", help="Run with supervisor-style summary and interruption heartbeat.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    ensure_ai_dir()
    state = RunState(watch=args.watch)
    print("Vantro Flow Level 3 Orchestrator Started")

    if os.environ.get("VANTRO_ORCHESTRATOR_RUNNING") == "1":
        append_log("Orchestrator launched with `VANTRO_ORCHESTRATOR_RUNNING=1`. Nested agent-triggered orchestrator calls are not allowed.")
    else:
        append_log("Orchestrator launched manually. Child agent phases will receive `VANTRO_ORCHESTRATOR_RUNNING=1`.")

    try:
        run_cycle(state)
    except KeyboardInterrupt:
        now = timestamp()
        write_running_agent(
            agent_name="orchestrator",
            phase="supervisor",
            started_at=now,
            mission="Run interrupted by user.",
            status="interrupted",
            finished_at=now,
            failure_reason="Interrupted by Ctrl+C.",
        )
        append_log("Orchestrator interrupted by Ctrl+C. `.ai/RUNNING_AGENT.md` marked interrupted.")
        state.manual_help_needed = True
    finally:
        write_final_next_prompt(state)
        if args.watch:
            print_watch_summary(state)

    print("Level 3 Orchestrator Finished")
    return 1 if state.manual_help_needed else 0


if __name__ == "__main__":
    raise SystemExit(main())
