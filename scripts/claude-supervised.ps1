param(
    [switch]$Help,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ClaudeArgs
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

if ($Help) {
    Write-Host @"
Vantro Flow supervised Claude wrapper

Usage:
  .\scripts\claude-supervised.ps1 [claude args]
  .\scripts\claude-supervised.ps1 -Help

Behavior:
  Starts local Claude Code from the repo root.
  Logs the session to .ai/local-claude-session.log.
  If a usage-limit, rate-limit, context-limit, auth, or command failure is detected after Claude exits,
  starts scripts/codex-continue-after-claude-limit.ps1 automatically.

Notes:
  Plain 'claude' is not supervised.
  Use 'vclaude' after installing the alias, or run this script directly.
"@
    exit 0
}

Set-Location $RepoRoot

$AiDir = Join-Path $RepoRoot ".ai"
New-Item -ItemType Directory -Force -Path $AiDir | Out-Null

$SessionLog = Join-Path $AiDir "local-claude-session.log"
$FailoverLog = Join-Path $AiDir "FAILOVER_LOG.md"
$RunningAgent = Join-Path $AiDir "RUNNING_AGENT.md"
$NextPrompt = Join-Path $AiDir "NEXT_AGENT_PROMPT.md"
$CodexFailoverScript = Join-Path $ScriptDir "codex-continue-after-claude-limit.ps1"

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

function Test-Phrase {
    param(
        [string]$Text,
        [string[]]$Phrases
    )

    foreach ($Phrase in $Phrases) {
        if ($Text.IndexOf($Phrase, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            return $Phrase
        }
    }

    return $null
}

function Write-RunningAgent {
    param(
        [string]$Status,
        [string]$Reason
    )

    $Now = Get-Date -Format o
    Set-Content -Path $RunningAgent -Encoding UTF8 -Value @"
# Running Agent

- active agent: Claude
- phase: local-supervised-session
- started_at: $Now
- status: $Status
- reason: $Reason

## Mission

Run local Claude Code under the Vantro Flow supervisor. If a limit or blocking error is detected, hand off to Codex through repo memory.
"@
}

function Append-FailoverLog {
    param(
        [string]$TriggerType,
        [string]$Phrase,
        [int]$ExitCode
    )

    if (!(Test-Path -LiteralPath $FailoverLog)) {
        Set-Content -Path $FailoverLog -Encoding UTF8 -Value "# Failover Log`n"
    }

    $Now = Get-Date -Format o
    $Status = git status --short 2>$null
    $Commits = git log --oneline -5 2>$null
    if (-not $Status) { $Status = "(clean)" }
    if (-not $Commits) { $Commits = "(no commits found)" }

    Add-Content -Path $FailoverLog -Encoding UTF8 -Value @"

## $Now

- failed agent: Claude local terminal
- backup agent: Codex
- phase: local-supervised-session
- trigger: $TriggerType
- phrase: $Phrase
- claude exit code: $ExitCode

### Git Status

```text
$Status
```

### Recent Commits

```text
$Commits
```

### Next Action

Codex must continue from `.ai/NEXT_AGENT_PROMPT.md` and the current repo state. Do not restart from scratch.
"@
}

function Write-LocalNextPrompt {
    param(
        [string]$TriggerType,
        [string]$Phrase,
        [int]$ExitCode
    )

    $Status = git status --short 2>$null
    $Commits = git log --oneline -5 2>$null
    if (-not $Status) { $Status = "(clean)" }
    if (-not $Commits) { $Commits = "(no commits found)" }

    Set-Content -Path $NextPrompt -Encoding UTF8 -Value @"
# Next Agent Prompt

You are taking over inside Vantro Flow after a supervised local Claude Code session ended.

Do not restart from scratch.

## Failover Reason

- failed agent: Claude local terminal
- backup agent: Codex
- trigger: $TriggerType
- detected phrase: $Phrase
- Claude exit code: $ExitCode

## Required Context

First read:

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

## Current Git Status

```text
$Status
```

## Recent Commits

```text
$Commits
```

## NEXT_AGENT_START_HERE

1. Continue from the current repo state.
2. Inspect changed files before editing.
3. Do not restart completed work.
4. Do not overwrite user work.
5. Finish the incomplete task if possible.
6. Update `.ai/` files before stopping.
7. Create a checkpoint commit if possible.
"@
}

$LimitPhrases = @(
    "you've hit your limit",
    "hit your limit",
    "limit reached",
    "usage limit",
    "rate limit",
    "quota",
    "insufficient credits",
    "too many requests",
    "maximum context",
    "context length",
    "context limit"
)

$FailurePhrases = @(
    "authentication",
    "not logged in",
    "permission denied",
    "command not found",
    "not recognized",
    "failed",
    "error"
)

$ClaudePath = Resolve-ToolPath @("claude.cmd", "claude")
$CodexPath = Resolve-ToolPath @("codex.cmd", "codex")

Add-Content -Path $SessionLog -Encoding UTF8 -Value "`n## $(Get-Date -Format o) - supervised Claude session started"
Write-RunningAgent -Status "running" -Reason "Supervised Claude session active."

if (-not $ClaudePath) {
    $Reason = "command not found"
    Add-Content -Path $SessionLog -Encoding UTF8 -Value "Claude command was not found."
    Write-RunningAgent -Status "failed" -Reason "Claude command not found."
    Append-FailoverLog -TriggerType "failure" -Phrase $Reason -ExitCode 127
    Write-LocalNextPrompt -TriggerType "failure" -Phrase $Reason -ExitCode 127
    Write-Host "Claude command not found. Codex failover will be attempted."
    & $CodexFailoverScript -Reason "Claude command not found" -Trigger "failure" -ClaudeExitCode 127
    exit $LASTEXITCODE
}

if (-not $CodexPath) {
    Write-Warning "Codex command was not found. Claude will run, but automatic failover cannot continue unless Codex is installed."
}

Write-Host "Starting supervised Claude Code..."
Write-Host "Repo: $RepoRoot"
Write-Host "Session log: $SessionLog"

$ExitCode = 0
$StartError = $null

try {
    & $ClaudePath @ClaudeArgs 2>&1 | Tee-Object -FilePath $SessionLog -Append
    $ExitCode = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } else { 0 }
}
catch {
    $StartError = $_.Exception.Message
    $ExitCode = 1
    Add-Content -Path $SessionLog -Encoding UTF8 -Value "Claude wrapper caught error: $StartError"
}

$LogText = ""
if (Test-Path -LiteralPath $SessionLog) {
    $LogText = Get-Content -Path $SessionLog -Raw
}

$LimitPhrase = Test-Phrase -Text $LogText -Phrases $LimitPhrases
$FailurePhrase = Test-Phrase -Text $LogText -Phrases $FailurePhrases

if ($StartError) {
    $FailurePhrase = $StartError
}

if ($LimitPhrase) {
    Write-RunningAgent -Status "limited" -Reason $LimitPhrase
    Append-FailoverLog -TriggerType "limit" -Phrase $LimitPhrase -ExitCode $ExitCode
    Write-LocalNextPrompt -TriggerType "limit" -Phrase $LimitPhrase -ExitCode $ExitCode
    Write-Host "Claude limit detected: $LimitPhrase"
    Write-Host "Starting Codex continuation..."
    & $CodexFailoverScript -Reason $LimitPhrase -Trigger "limit" -ClaudeExitCode $ExitCode
    exit $LASTEXITCODE
}

if ($FailurePhrase -or $ExitCode -ne 0) {
    $Reason = if ($FailurePhrase) { $FailurePhrase } else { "Claude exited with code $ExitCode" }
    Write-RunningAgent -Status "failed" -Reason $Reason
    Append-FailoverLog -TriggerType "failure" -Phrase $Reason -ExitCode $ExitCode
    Write-LocalNextPrompt -TriggerType "failure" -Phrase $Reason -ExitCode $ExitCode
    Write-Host "Claude failure detected: $Reason"
    Write-Host "Starting Codex continuation..."
    & $CodexFailoverScript -Reason $Reason -Trigger "failure" -ClaudeExitCode $ExitCode
    exit $LASTEXITCODE
}

Write-RunningAgent -Status "success" -Reason "Claude ended without detected limit or failure."
Write-Host "Claude ended without detected limit. Codex failover not triggered."
