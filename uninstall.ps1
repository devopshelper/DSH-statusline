<#
.SYNOPSIS
    Remove the DSH statusline bundle from a DeepSeek Harness profile.

.DESCRIPTION
    Reverses install.ps1: unregisters the bundle (which deactivates it), then
    removes the linked dependency. The shipped status pills return on their own,
    because they were only ever shadowed - never replaced.

.PARAMETER Profile
    Profile name. Defaults to $env:DSH_PROFILE, then to "desktop".

.PARAMETER Source
    The package directory (used for its name and scripts). Defaults to this script's directory.

.PARAMETER DryRun
    Print what would happen, change nothing.
#>
[CmdletBinding()]
param(
    [string]$Profile = $(if ($env:DSH_PROFILE) { $env:DSH_PROFILE } else { 'desktop' }),
    [string]$Source = '',
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$script:step = 0

# See install.ps1: $PSScriptRoot is empty during parameter binding in PS 5.1.
if ([string]::IsNullOrWhiteSpace($Source)) { $Source = $PSScriptRoot }
if ([string]::IsNullOrWhiteSpace($Source)) { $Source = (Get-Location).Path }

function Write-Step([string]$Message) {
    $script:step++
    Write-Host ("[{0}] {1}" -f $script:step, $Message) -ForegroundColor Cyan
}
function Write-Ok([string]$Message) { Write-Host "    $Message" -ForegroundColor DarkGray }
function Fail([string]$Message) { Write-Host "`nFAILED: $Message" -ForegroundColor Red; exit 1 }

Write-Step 'Checking the source package'

if (-not (Test-Path -LiteralPath (Join-Path $Source 'package.json'))) { Fail "no package.json in $Source" }
$packageName = (Get-Content -LiteralPath (Join-Path $Source 'package.json') -Raw | ConvertFrom-Json).name
Write-Ok "package: $packageName"

Write-Step 'Locating the DSH profile'

$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }
$profileDir = Join-Path (Join-Path $dshHome 'profiles') $Profile
if (-not (Test-Path -LiteralPath $profileDir)) { Fail "profile not found: $profileDir" }
Write-Ok "profile: $profileDir"

Write-Step 'Unregistering the bundle'

if ($DryRun) {
    Write-Ok "would run: node scripts/register.mjs `"$profileDir`" $packageName remove"
} else {
    $backup = Join-Path $profileDir ("package.json.bak-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    Copy-Item -LiteralPath (Join-Path $profileDir 'package.json') -Destination $backup -Force
    & node (Join-Path $Source 'scripts/register.mjs') $profileDir $packageName remove
    if ($LASTEXITCODE -ne 0) { Fail "bundle unregistration failed; manifest left untouched (backup: $backup)" }
    Write-Ok "manifest backed up to $(Split-Path -Leaf $backup)"
}

Write-Step 'Removing the linked dependency'

$dsh = Get-Command dsh -ErrorAction SilentlyContinue
if (-not $dsh) { Fail 'dsh is not on PATH' }

if ($DryRun) {
    Write-Ok "would run: dsh plugin --profile $Profile remove $packageName"
} else {
    & dsh plugin --profile $Profile remove $packageName
    if ($LASTEXITCODE -ne 0) { Write-Host '    ! dsh plugin remove failed - the bundle is already unregistered, so it is inert either way.' -ForegroundColor Yellow }
    else { Write-Ok 'dependency removed' }
}

if ($DryRun) {
    Write-Host "`nDry run complete - nothing was changed. Re-run without -DryRun to remove." -ForegroundColor Green
    exit 0
}

Write-Host "`nRemoved from profile '$Profile'. Reload the Web UI (Ctrl+Shift+R); the shipped status pills are back." -ForegroundColor Green
