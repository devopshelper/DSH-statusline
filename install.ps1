<#
.SYNOPSIS
    Install the DSH statusline bundle into a DeepSeek Harness profile.

.DESCRIPTION
    Installing a bundle is two steps, and only one of them is a pnpm command:

      1. link the package into the profile's dependencies
             dsh plugin --profile <p> add <this directory>
      2. register it in the profile's `dsh.profile.bundles` list, which is what
         actually activates it

    Step 2 has no CLI, so this script performs it and backs up the profile
    manifest first. Every step is idempotent - re-running is safe.

.PARAMETER Profile
    Profile name under %USERPROFILE%\.dsh\profiles. Defaults to $env:DSH_PROFILE,
    then to "desktop".

.PARAMETER Source
    Package directory to install. Defaults to the directory holding this script.

.PARAMETER DryRun
    Print what would happen, change nothing.

.EXAMPLE
    .\install.ps1
    .\install.ps1 -Profile web -DryRun
#>
[CmdletBinding()]
param(
    [string]$Profile = $(if ($env:DSH_PROFILE) { $env:DSH_PROFILE } else { 'desktop' }),
    [string]$Source = '',
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$script:step = 0

# $PSScriptRoot is not populated yet while parameter defaults are evaluated
# (Windows PowerShell 5.1), so resolve the default here instead.
if ([string]::IsNullOrWhiteSpace($Source)) { $Source = $PSScriptRoot }
if ([string]::IsNullOrWhiteSpace($Source)) { $Source = (Get-Location).Path }

function Write-Step([string]$Message) {
    $script:step++
    Write-Host ("[{0}] {1}" -f $script:step, $Message) -ForegroundColor Cyan
}
function Write-Ok([string]$Message) { Write-Host "    $Message" -ForegroundColor DarkGray }
function Write-Warn([string]$Message) { Write-Host "    ! $Message" -ForegroundColor Yellow }
function Fail([string]$Message) { Write-Host "`nFAILED: $Message" -ForegroundColor Red; exit 1 }

# ---------------------------------------------------------------- preflight --
Write-Step 'Checking the source package'

if (-not (Test-Path -LiteralPath $Source)) { Fail "source directory not found: $Source" }
$Source = (Resolve-Path -LiteralPath $Source).Path

$manifestPath = Join-Path $Source 'package.json'
if (-not (Test-Path -LiteralPath $manifestPath)) { Fail "no package.json in $Source" }

$package = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if (-not $package.dsh.bundle.patch) { Fail 'package.json has no dsh.bundle.patch - this is not an installable bundle' }
if (-not $package.dsh.client) { Write-Warn 'package.json declares no dsh.client section; nothing will render in the Web UI' }
if (-not (Test-Path -LiteralPath (Join-Path $Source 'client.js'))) { Fail 'client.js is missing - run: node scripts/build.mjs' }

$packageName = $package.name
Write-Ok "package: $packageName"
Write-Ok "source:  $Source"

Write-Step 'Locating the DSH profile'

$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }
$profileDir = Join-Path (Join-Path $dshHome 'profiles') $Profile
if (-not (Test-Path -LiteralPath $profileDir)) { Fail "profile not found: $profileDir`n       Existing profiles: $(Get-ChildItem (Join-Path $dshHome 'profiles') -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)" }
Write-Ok "profile: $profileDir"

$dsh = Get-Command dsh -ErrorAction SilentlyContinue
if (-not $dsh) { Fail 'dsh is not on PATH. Start DeepSeek Harness once, or add its runtime\cli\bin directory to PATH.' }
Write-Ok "dsh:     $($dsh.Source)"

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Fail 'node is not on PATH (needed to edit the profile manifest safely)' }

# ------------------------------------------------------------------ install --
Write-Step 'Linking the package into the profile'

if ($DryRun) {
    Write-Ok "would run: dsh plugin --profile $Profile add `"$Source`""
} else {
    & dsh plugin --profile $Profile add "$Source"
    if ($LASTEXITCODE -ne 0) { Fail "dsh plugin add exited with $LASTEXITCODE" }
    Write-Ok 'dependency linked'
}

Write-Step 'Registering the bundle (this is what activates it)'

$registeredNow = @((Get-Content -LiteralPath (Join-Path $profileDir 'package.json') -Raw | ConvertFrom-Json).dsh.profile.bundles) -contains $packageName

if ($DryRun) {
    Write-Ok "would run: node scripts/register.mjs `"$profileDir`" $packageName add"
} elseif ($registeredNow) {
    # Already active: no manifest edit, so no backup litter.
    Write-Ok "already registered: $packageName"
    Write-Ok ("bundles: " + (@((Get-Content -LiteralPath (Join-Path $profileDir 'package.json') -Raw | ConvertFrom-Json).dsh.profile.bundles) -join ', '))
} else {
    $backup = Join-Path $profileDir ("package.json.bak-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    Copy-Item -LiteralPath (Join-Path $profileDir 'package.json') -Destination $backup -Force
    Write-Ok "manifest backed up to $(Split-Path -Leaf $backup)"

    & node (Join-Path $Source 'scripts/register.mjs') $profileDir $packageName add
    if ($LASTEXITCODE -ne 0) {
        Copy-Item -LiteralPath $backup -Destination (Join-Path $profileDir 'package.json') -Force
        Fail "bundle registration failed; profile manifest restored from $backup"
    }

    # Read back rather than trusting the writer.
    $after = Get-Content -LiteralPath (Join-Path $profileDir 'package.json') -Raw | ConvertFrom-Json
    $bundles = @($after.dsh.profile.bundles)
    if ($bundles -notcontains $packageName) { Fail 'bundle is not listed in dsh.profile.bundles after registration' }
    Write-Ok ("bundles now: " + ($bundles -join ', '))
}

Write-Step 'Done'

if ($DryRun) {
    Write-Host @"

Dry run complete - nothing was changed.
Re-run without -DryRun to install.
"@ -ForegroundColor Green
    exit 0
}

Write-Host @"

Installed into profile '$Profile'.

  Next: reload the Harness Web UI (Ctrl+Shift+R). The two composer status
        cells are replaced by the statusline; the shipped pills stay registered
        underneath at priority 0, so removing this bundle restores them.

  Verify: open any session and look under the prompt box. Hover the
          "* DeepSeek Harness" chip for the detail card and palette.

  Remove: .\uninstall.ps1 -Profile $Profile

  If nothing changed after a reload, DSH was already running with this package
  linked - restart DeepSeek Harness so a fresh module generation loads.
"@ -ForegroundColor Green
