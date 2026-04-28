param(
    [switch]$Help
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$WrapperPath = Join-Path $RepoRoot "scripts\claude-supervised.ps1"
$ProfilePath = $PROFILE

if ($Help) {
    Write-Host @"
Install Vantro Flow supervised Claude alias

Usage:
  .\scripts\install-claude-supervised-alias.ps1

Adds a 'vclaude' function to your current-user PowerShell profile.
It does not override the real 'claude' command.
"@
    exit 0
}

$ProfileDir = Split-Path -Parent $ProfilePath
if ($ProfileDir) {
    New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null
}

if (!(Test-Path -LiteralPath $ProfilePath)) {
    New-Item -ItemType File -Force -Path $ProfilePath | Out-Null
}

$StartMarker = "# >>> Vantro Flow supervised Claude alias >>>"
$EndMarker = "# <<< Vantro Flow supervised Claude alias <<<"
$Block = @"
$StartMarker
function vclaude {
    & "$WrapperPath" @args
}

# Optional advanced override:
# Uncomment the function below only if you intentionally want 'claude'
# to run through the supervised wrapper in this PowerShell profile.
# function claude {
#     & "$WrapperPath" @args
# }
$EndMarker
"@

$Existing = Get-Content -Path $ProfilePath -Raw
$Pattern = [regex]::Escape($StartMarker) + "(.|\r|\n)*?" + [regex]::Escape($EndMarker)

if ($Existing -match $Pattern) {
    $Updated = [regex]::Replace($Existing, $Pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $Block })
}
else {
    $Updated = $Existing.TrimEnd() + "`r`n`r`n" + $Block + "`r`n"
}

Set-Content -Path $ProfilePath -Encoding UTF8 -Value $Updated

Write-Host "Installed supervised Claude alias: vclaude"
Write-Host "Profile: $ProfilePath"
Write-Host "Open a new PowerShell terminal, then run: vclaude"
