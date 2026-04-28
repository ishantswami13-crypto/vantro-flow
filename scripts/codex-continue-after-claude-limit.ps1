param(
    [string]$Reason = "Claude local terminal limit detected",
    [string]$Trigger = "limit",
    [int]$ClaudeExitCode = 0,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

if ($Help) {
    Write-Host @"
Vantro Flow Codex continuation after supervised Claude limit

Usage:
  .\scripts\codex-continue-after-claude-limit.ps1 -Reason "usage limit" -Trigger limit -ClaudeExitCode 1

Behavior:
  Updates .ai/NEXT_AGENT_PROMPT.md with the Claude local failover handoff.
  Starts Codex with a short prompt to continue from repo memory.
  Logs output to .ai/codex-after-claude-limit.log.
  Commits .ai checkpoint changes when possible.
"@
    exit 0
}

Set-Location $RepoRoot

$AiDir = Join-Path $RepoRoot ".ai"
New-Item -ItemType Directory -Force -Path $AiDir | Out-Null

$NextPrompt = Join-Path $AiDir "NEXT_AGENT_PROMPT.md"
$FailoverLog = Join-Path $AiDir "FAILOVER_LOG.md"
$RunningAgent = Join-Path $AiDir "RUNNING_AGENT.md"
$CodexLog = Join-Path $AiDir "codex-after-claude-limit.log"

function Resolve-ToolPath {
    param([string[]]$Names)

    foreach ($Name in $Names) {
        $Command = Get-Command $Name -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($Command) {
            return $Command.Source
        }
    }

    return $null
}

function Get-GitStatusText {
    $Text = git status --short 2>$null
    if ($Text) { return $Text }
    return "(clean)"
}

function Get-GitLogText {
    $Text = git log --oneline -5 2>$null
    if ($Text) { return $Text }
    return "(no commits found)"
}

function Write-RunningAgent {
    param(
        [string]$Status,
        [string]$Detail
    )

    $Now = Get-Date -Format o
    Set-Content -Path $RunningAgent -Encoding UTF8 -Value @"
# Running Agent

- active agent: Codex
- phase: continue-after-claude-local-limit
- started_at: $Now
- status: $Status
- reason: $Detail

## Mission

Continue from `.ai/NEXT_AGENT_PROMPT.md` after supervised local Claude Code hit a limit or blocking failure.
"@
}

function Write-NextPrompt {
    param(
        [string]$StatusText,
        [string]$LogText
    )

    Set-Content -Path $NextPrompt -Encoding UTF8 -Value @"
# Next Agent Prompt

Claude local terminal session ended because a supervised wrapper detected a limit or blocking failure.

Codex must continue from the current repo state.

Do not restart from scratch.

## Failover Details

- failed agent: Claude local terminal
- next agent: Codex
- trigger: $Trigger
- reason: $Reason
- Claude exit code: $ClaudeExitCode

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

## Required Checks

- `git status --short`
- `git log --oneline -5`

## Current Git Status

```text
$StatusText
```

## Recent Commits

```text
$LogText
```

## NEXT_AGENT_START_HERE

1. Continue the incomplete task from the current repo state.
2. Inspect changed files before editing.
3. Do not restart completed work.
4. Do not overwrite user work.
5. Update `.ai/` files before stopping.
6. Create a checkpoint commit if possible.
"@
}

function Append-FailoverLog {
    param(
        [string]$StatusText,
        [string]$LogText
    )

    if (!(Test-Path -LiteralPath $FailoverLog)) {
        Set-Content -Path $FailoverLog -Encoding UTF8 -Value "# Failover Log`n"
    }

    $Now = Get-Date -Format o
    Add-Content -Path $FailoverLog -Encoding UTF8 -Value @"

## $Now

- failed agent: Claude local terminal
- backup agent: Codex
- phase: continue-after-claude-local-limit
- trigger: $Trigger
- reason: $Reason
- Claude exit code: $ClaudeExitCode

### Git Status

```text
$StatusText
```

### Recent Commits

```text
$LogText
```

### Next Action

Codex is starting automatically through `scripts/codex-continue-after-claude-limit.ps1`.
"@
}

function Commit-AiCheckpoint {
    git add .ai
    git diff --cached --quiet -- .ai
    if ($LASTEXITCODE -eq 0) {
        Write-Host "No .ai checkpoint changes to commit."
        return
    }

    git commit -m "checkpoint: codex continued after claude local limit"
}

$StatusText = Get-GitStatusText
$LogText = Get-GitLogText

Write-NextPrompt -StatusText $StatusText -LogText $LogText
Append-FailoverLog -StatusText $StatusText -LogText $LogText
Write-RunningAgent -Status "running" -Detail "Codex continuation starting after Claude local failover."

$CodexPath = Resolve-ToolPath @("codex.cmd", "codex")
if (-not $CodexPath) {
    $Message = "Codex command not found. Manual continuation is required."
    Add-Content -Path $CodexLog -Encoding UTF8 -Value "`n## $(Get-Date -Format o)`n$Message"
    Write-RunningAgent -Status "failed" -Detail $Message
    Add-Content -Path $FailoverLog -Encoding UTF8 -Value "`nCodex could not start: $Message`n"
    Commit-AiCheckpoint
    Write-Error $Message
    exit 127
}

$Prompt = "Read .ai/NEXT_AGENT_PROMPT.md and continue from the Claude local limit failover. Do not restart from scratch."

Add-Content -Path $CodexLog -Encoding UTF8 -Value "`n## $(Get-Date -Format o) - Codex continuation started"

$ExitCode = 0
try {
    & $CodexPath exec $Prompt 2>&1 | Tee-Object -FilePath $CodexLog -Append
    $ExitCode = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } else { 0 }
}
catch {
    $ExitCode = 1
    Add-Content -Path $CodexLog -Encoding UTF8 -Value "Codex continuation error: $($_.Exception.Message)"
}

if ($ExitCode -eq 0) {
    Write-RunningAgent -Status "success" -Detail "Codex continuation completed."
}
else {
    Write-RunningAgent -Status "failed" -Detail "Codex continuation exited with code $ExitCode."
}

Commit-AiCheckpoint
exit $ExitCode
