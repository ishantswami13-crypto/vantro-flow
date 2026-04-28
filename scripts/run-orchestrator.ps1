param()

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

Set-Location $RepoRoot

Write-Host "Starting Vantro Flow Level 3 Orchestrator..."
Write-Host "Repo: $RepoRoot"

$Python = Get-Command python -ErrorAction SilentlyContinue
if (-not $Python) {
  throw "Python was not found on PATH. Install Python or add it to PATH, then rerun this script."
}

python scripts/orchestrator.py

Write-Host "Orchestrator finished."
