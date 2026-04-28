"""Vantro Flow Level 3 multi-agent orchestrator.

This script coordinates Claude Code and Codex through repo-based memory files,
lint/build checks, and safe git checkpoint commits.

It intentionally uses only the Python standard library.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable


SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
AI_DIR = ROOT / ".ai"
TEST_LOG = AI_DIR / "TEST_LOG.md"
NEXT_AGENT_PROMPT = AI_DIR / "NEXT_AGENT_PROMPT.md"
AGENT_PROMPT_DIR = AI_DIR / "agent_prompts"

PHASE_PROMPT_FILES = {
    "Claude Architect": "claude_architect.md",
    "Codex Builder": "codex_builder.md",
    "Claude Reviewer": "claude_reviewer.md",
    "Codex Fixer": "codex_fixer.md",
}

CONTEXT_FILES = [
    "AGENTS.md",
    "CLAUDE.md",
    ".ai/PROJECT_STATE.md",
    ".ai/CURRENT_TASK.md",
    ".ai/DECISIONS.md",
    ".ai/TEST_LOG.md",
    ".ai/NEXT_AGENT_PROMPT.md",
]

AGENT_TIMEOUT_SECONDS = 60 * 30
CHECK_TIMEOUT_SECONDS = 60 * 12
GIT_TIMEOUT_SECONDS = 60 * 2

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


def timestamp() -> str:
    return datetime.now().isoformat(timespec="seconds")


def ensure_ai_dir() -> None:
    AI_DIR.mkdir(parents=True, exist_ok=True)
    AGENT_PROMPT_DIR.mkdir(parents=True, exist_ok=True)


def append_log(message: str) -> None:
    ensure_ai_dir()
    with TEST_LOG.open("a", encoding="utf-8") as handle:
        handle.write(f"\n\n## {timestamp()}\n\n{message.strip()}\n")


def tool_path(name: str) -> str | None:
    return shutil.which(name)


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
                "The orchestrator should pass only short agent prompts; check prompt-file handling."
            )
        else:
            stderr = f"{error.__class__.__name__}: {error}"
        result = CommandResult(
            args=args,
            returncode=1,
            stdout="",
            stderr=stderr,
        )

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


def child_env() -> dict[str, str]:
    env = os.environ.copy()
    env["VANTRO_ORCHESTRATOR_RUNNING"] = "1"
    return env


def agent_prompt(role: str, mission: str) -> str:
    context = read_context()
    return f"""You are {role} inside the Vantro Flow repository.

VANTRO_ORCHESTRATOR_RUNNING=1 is set. Do not run scripts/orchestrator.py or scripts/run-orchestrator.ps1 from inside this task.

Mission:
{mission}

Rules:
- Do not restart from scratch.
- Read and respect the repo memory.
- Do not reset git.
- Do not delete user work.
- Preserve existing functionality.
- Keep work scoped to the current incomplete task.
- Before stopping, update all `.ai/` handoff files.
- Record test/check failures honestly in `.ai/TEST_LOG.md`.

Repo memory snapshot:

{context}
"""


def prompt_path_for_phase(role: str) -> Path:
    filename = PHASE_PROMPT_FILES.get(role)
    if filename:
        return AGENT_PROMPT_DIR / filename
    safe_name = role.lower().replace(" ", "_").replace("/", "_").replace("\\", "_")
    return AGENT_PROMPT_DIR / f"{safe_name}.md"


def relative_prompt_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def write_agent_prompt(role: str, prompt: str) -> Path:
    ensure_ai_dir()
    path = prompt_path_for_phase(role)
    path.write_text(prompt, encoding="utf-8")
    append_log(f"Wrote full prompt for **{role}** to `{relative_prompt_path(path)}`.")
    return path


def short_agent_prompt(prompt_file: Path) -> str:
    relative = relative_prompt_path(prompt_file)
    return (
        f"Read {relative} and follow it exactly. "
        "Do not run scripts/orchestrator.py or scripts/run-orchestrator.ps1 from inside this task."
    )


def run_agent(role: str, command: list[str], prompt: str) -> None:
    append_log(f"Starting agent phase: **{role}**.")
    prompt_file = write_agent_prompt(role, prompt)
    result = run_command(command + [short_agent_prompt(prompt_file)], timeout=AGENT_TIMEOUT_SECONDS, env=child_env())
    if result.returncode == 0:
        append_log(f"Agent phase completed: **{role}**.")
    else:
        if "WinError 206" in result.stderr:
            append_log(
                f"Agent phase hit WinError 206 despite short prompt handling: **{role}**. "
                "Check CLI invocation length and prompt-file routing."
            )
        append_log(
            f"Agent phase failed or exited non-zero: **{role}**. "
            f"Exit code `{result.returncode}`. Continuing safely."
        )


def run_claude_phase(phase: str, mission: str) -> None:
    claude = tool_path("claude")
    if not claude:
        append_log(f"Skipped {phase}: `claude` CLI not found on PATH.")
        print(f"Skipping {phase}: claude CLI not found.")
        return

    run_agent(phase, [claude, "-p"], agent_prompt(phase, mission))


def run_codex_phase(phase: str, mission: str) -> None:
    codex = tool_path("codex")
    if not codex:
        append_log(f"Skipped {phase}: `codex` CLI not found on PATH.")
        print(f"Skipping {phase}: codex CLI not found.")
        return

    run_agent(phase, [codex, "exec"], agent_prompt(phase, mission))


def run_checks(label: str) -> None:
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
        run_command([npm, "run", script], timeout=CHECK_TIMEOUT_SECONDS, env=os.environ.copy())


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


def commit_checkpoint(message: str) -> None:
    git = tool_path("git")
    if not git:
        append_log(f"Skipped checkpoint `{message}`: `git` not found on PATH.")
        return

    status = git_status_short()
    if not status:
        append_log(f"No changes available for checkpoint `{message}`.")
        return

    paths = [path for path in parse_status_paths(status) if not should_skip_checkpoint(path)]
    skipped = [path for path in parse_status_paths(status) if should_skip_checkpoint(path)]
    if skipped:
        append_log("Skipped generated/artifact paths during checkpoint:\n\n" + "\n".join(f"- `{path}`" for path in skipped))

    if not paths:
        append_log(f"No safe paths to stage for checkpoint `{message}`.")
        return

    stage_paths(git, paths)
    if not has_staged_changes(git):
        append_log(f"No staged changes for checkpoint `{message}`.")
        return

    result = run_command([git, "commit", "-m", message], timeout=GIT_TIMEOUT_SECONDS)
    if result.returncode == 0:
        append_log(f"Created checkpoint commit: `{message}`.")
    else:
        append_log(f"Checkpoint commit failed for `{message}`. See command output above.")


def write_final_next_prompt() -> None:
    status = git_status_short() or "(clean)"
    recent_log = git_log_recent() or "(unavailable)"
    content = f"""# Next Agent Prompt

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

## Current Status

The Level 3 orchestrator is installed. Full orchestration should only be run when the user explicitly asks.

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
2. If the user asks to run the Level 3 cycle, execute:

```powershell
.\\scripts\\run-orchestrator.ps1
```

3. Do not run nested orchestrator calls from inside Claude or Codex agent phases.
4. Before stopping, update `.ai/PROJECT_STATE.md`, `.ai/TEST_LOG.md`, and `.ai/NEXT_AGENT_PROMPT.md`.
5. Create a checkpoint commit if possible.
"""
    NEXT_AGENT_PROMPT.write_text(content, encoding="utf-8")
    append_log("Updated `.ai/NEXT_AGENT_PROMPT.md` with final orchestrator handoff.")


def main() -> int:
    ensure_ai_dir()
    print("Vantro Flow Level 3 Orchestrator Started")

    if os.environ.get("VANTRO_ORCHESTRATOR_RUNNING") == "1":
        append_log("Orchestrator launched with `VANTRO_ORCHESTRATOR_RUNNING=1`. Nested agent-triggered orchestrator calls are not allowed.")
    else:
        append_log("Orchestrator launched manually. Child agent phases will receive `VANTRO_ORCHESTRATOR_RUNNING=1`.")

    git = tool_path("git")
    if git:
        run_command([git, "status", "--short"], timeout=GIT_TIMEOUT_SECONDS)
        run_command([git, "log", "--oneline", "-5"], timeout=GIT_TIMEOUT_SECONDS)
    else:
        append_log("`git` CLI not found. Git status, log, and checkpoint commits will be skipped.")

    run_claude_phase(
        "Claude Architect",
        "Review repo memory, refine the implementation plan, update `.ai/` files, and leave a precise builder prompt. Do not run the orchestrator.",
    )
    commit_checkpoint("checkpoint: after claude architect")

    run_codex_phase(
        "Codex Builder",
        "Implement the next concrete step from `.ai/NEXT_AGENT_PROMPT.md`, update `.ai/` files, and keep changes scoped. Do not run the orchestrator.",
    )
    commit_checkpoint("checkpoint: after codex builder")

    run_checks("first lint/build")

    run_claude_phase(
        "Claude Reviewer",
        "Review the implementation, fix only small safe issues if needed, update `.ai/` files, and leave precise fixer instructions. Do not run the orchestrator.",
    )
    commit_checkpoint("checkpoint: after claude review")

    run_codex_phase(
        "Codex Fixer",
        "Fix errors recorded in `.ai/TEST_LOG.md`, update `.ai/` files, and keep changes focused. Do not run the orchestrator.",
    )

    run_checks("final lint/build")
    commit_checkpoint("checkpoint: after codex fixer")
    write_final_next_prompt()

    print("Level 3 Orchestrator Finished")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
