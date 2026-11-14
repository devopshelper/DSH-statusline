<#
.SYNOPSIS
    Install or update the DSH statusline bundle in a DeepSeek Harness profile.

.DESCRIPTION
    One command, from anywhere:

        irm https://raw.githubusercontent.com/devopshelper/DSH-statusline/main/install.ps1 | iex

    The script installs a checkout (cloned to -InstallDir, or the checkout the
    profile is already linked to) and performs both halves of a bundle install:

      1. link the package into the profile's dependencies
             dsh plugin --profile <p> add <checkout>
      2. register it in the profile's `dsh.profile.bundles` list, which is what
         actually activates it; this half has no CLI of its own.

    It finds the DSH profile and the CLI/runtime without assuming `dsh` is on
    PATH, repairs a profile whose bundle list lost the package, and is
    idempotent - re-running is safe. Run it again to update: an existing git
    checkout is pulled, a zip install is re-downloaded, then the package is
    relinked.

.PARAMETER Profile
    Profile name under %USERPROFILE%\.dsh\profiles. Defaults to $env:DSH_PROFILE,
    then to desktop, then web, then the only profile present.

.PARAMETER Source
    Package directory to install. Defaults to the directory the profile is
    already linked to, then this script's directory, then -InstallDir.

.PARAMETER InstallDir
    Checkout used when no source is found. Defaults to
    %LOCALAPPDATA%\DSH\dsh-statusline (or $env:DSH_STATUSLINE_HOME).

.PARAMETER RepoUrl
    Repository cloned / downloaded when no checkout exists.

.PARAMETER Branch
    Branch used for clone / zip. Defaults to main.

.PARAMETER DshPath
    Explicit dsh.cmd path. Defaults to $env:DSH_CLI, then PATH, then the
    Desktop app's bundled runtime.

.PARAMETER Update
    Pull the checkout before installing (git), and relink the package so a new
    module generation is built. The one-line install implies this.

.PARAMETER Force
    Relink even without -Update.

.PARAMETER DryRun
    Print the plan, change nothing.

.EXAMPLE
    .\install.ps1
    .\install.ps1 -Profile web -DryRun
    .\install.ps1 -Update
    irm https://raw.githubusercontent.com/devopshelper/DSH-statusline/main/install.ps1 | iex
#>
[CmdletBinding()]
param(
    [string]$Profile = $(if ($env:DSH_PROFILE) { $env:DSH_PROFILE } else { '' }),
    [string]$Source = '',
    [string]$InstallDir = $(if ($env:DSH_STATUSLINE_HOME) { $env:DSH_STATUSLINE_HOME } else { Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'DSH\dsh-statusline' }),
    [string]$RepoUrl = 'https://github.com/devopshelper/DSH-statusline',
    [string]$Branch = 'main',
    [string]$DshPath = '',
    [switch]$Update,
    [switch]$Force,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
# PowerShell 5.1 can still default to TLS 1.0 on older Windows; GitHub needs 1.2.
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch { }
$script:step = 0
$script:PackageName = '@local/dsh-statusbar'

# Under `irm ... | iex` there is no script path; the one-liner installs AND
# updates, so turn on -Update when that is how we were started.
$script:Remote = [string]::IsNullOrWhiteSpace($PSScriptRoot)
if ($script:Remote) { $Update = $true }

function Write-Step([string]$Message) {
    $script:step++
    Write-Host ('[{0}] {1}' -f $script:step, $Message) -ForegroundColor Cyan
}
function Write-Ok([string]$Message) { Write-Host "    $Message" -ForegroundColor DarkGray }
function Write-Warn([string]$Message) { Write-Host "    ! $Message" -ForegroundColor Yellow }
function Fail([string]$Message) {
    Write-Host ''
    Write-Host "FAILED: $Message" -ForegroundColor Red
    # `iem ... | iex` runs inside the caller's session, so `exit` would close
    # their terminal; throw instead. A normal script still ends with exit 1.
    if ($script:Remote) { throw "statusline install failed: $Message" }
    exit 1
}

function Test-ManifestBom([string]$ManifestPath) {
    $bytes = [System.IO.File]::ReadAllBytes($ManifestPath)
    return ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
}

function Repair-ManifestBom([string]$ManifestPath) {
    $bytes = [System.IO.File]::ReadAllBytes($ManifestPath)
    if ($bytes.Length -lt 3 -or $bytes[0] -ne 0xEF -or $bytes[1] -ne 0xBB -or $bytes[2] -ne 0xBF) { return $false }
    $clean = New-Object byte[] ($bytes.Length - 3)
    [Array]::Copy($bytes, 3, $clean, 0, $clean.Length)
    [System.IO.File]::WriteAllBytes($ManifestPath, $clean)
    return $true
}

function Get-ProfileManifest([string]$ProfileDir) {
    $path = Join-Path $ProfileDir 'package.json'
    if (-not (Test-Path -LiteralPath $path)) { return $null }
    try {
        return (Get-Content -LiteralPath $path -Raw | ConvertFrom-Json)
    } catch {
        return $null
    }
}

function Test-Package([string]$Dir) {
    if ([string]::IsNullOrWhiteSpace($Dir)) { return $false }
    $pkg = Join-Path $Dir 'package.json'
    if (-not (Test-Path -LiteralPath $pkg)) { return $false }
    try { $manifest = Get-Content -LiteralPath $pkg -Raw | ConvertFrom-Json } catch { return $false }
    if ($manifest.name -ne $script:PackageName) { return $false }
    return (Test-Path -LiteralPath (Join-Path $Dir 'client.js'))
}

function Get-LinkedSource([string]$ProfileDir) {
    $manifest = Get-ProfileManifest $ProfileDir
    if ($manifest -eq $null) { return $null }
    $dep = $null
    if ($manifest.dependencies -ne $null) { $dep = $manifest.dependencies.PSObject.Properties[$script:PackageName] }
    if ($dep -eq $null) { return $null }
    $value = [string]$dep.Value
    if (-not $value.StartsWith('link:')) { return $null }
    $candidate = $value.Substring(5).Trim('"')
    if (Test-Path -LiteralPath $candidate) { return (Resolve-Path -LiteralPath $candidate).Path }
    return $null
}

function Get-AppExe {
    $proc = Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue |
        Where-Object { $_.Path } | Select-Object -First 1
    if ($proc -ne $null) { return $proc.Path }
    $roots = @()
    if ($env:LOCALAPPDATA) { $roots += (Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness\DeepSeek Harness.exe') }
    if ($env:ProgramFiles) { $roots += (Join-Path $env:ProgramFiles 'DeepSeek Harness\DeepSeek Harness.exe') }
    if (${env:ProgramFiles(x86)}) { $roots += (Join-Path ${env:ProgramFiles(x86)} 'DeepSeek Harness\DeepSeek Harness.exe') }
    foreach ($candidate in $roots) {
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
    return $null
}

function Get-DshCmd([string]$AppExe) {
    if (-not [string]::IsNullOrWhiteSpace($DshPath)) {
        if (-not (Test-Path -LiteralPath $DshPath)) { Fail "dsh.cmd not found: $DshPath" }
        return (Resolve-Path -LiteralPath $DshPath).Path
    }
    if ($env:DSH_CLI -and (Test-Path -LiteralPath $env:DSH_CLI)) {
        return (Resolve-Path -LiteralPath $env:DSH_CLI).Path
    }
    $command = Get-Command dsh -ErrorAction SilentlyContinue
    if ($command -ne $null) { return $command.Source }
    if ($AppExe -ne $null) {
        $candidate = Join-Path (Split-Path -Path $AppExe -Parent) 'resources\runtime\cli\bin\dsh.cmd'
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
    return $null
}

function Invoke-DshCli([string[]]$CliArgs) {
    if ($script:DshCmd -ne $null) {
        & $script:DshCmd @CliArgs | Out-Host
        return $LASTEXITCODE
    }
    if ($script:AppExe -ne $null) {
        $cli = Join-Path (Split-Path -Path $script:AppExe -Parent) 'resources\app.asar\dsh\node_modules\@deepseek-ai\dsh-desktop-host\lib\cli.js'
        if (-not (Test-Path -LiteralPath $cli)) { return 127 }
        $old = $env:ELECTRON_RUN_AS_NODE
        $env:ELECTRON_RUN_AS_NODE = '1'
        try {
            & $script:AppExe --expose-internals $cli @CliArgs | Out-Host
            return $LASTEXITCODE
        } finally {
            if ($old -eq $null) { Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue }
            else { $env:ELECTRON_RUN_AS_NODE = $old }
        }
    }
    return 127
}

function Invoke-Node([string]$ScriptPath, [string[]]$ScriptArgs) {
    if ($script:NodeExe -ne $null) {
        & $script:NodeExe $ScriptPath @ScriptArgs | Out-Host
        return $LASTEXITCODE
    }
    if ($script:AppExe -ne $null) {
        $old = $env:ELECTRON_RUN_AS_NODE
        $env:ELECTRON_RUN_AS_NODE = '1'
        try {
            & $script:AppExe $ScriptPath @ScriptArgs | Out-Host
            return $LASTEXITCODE
        } finally {
            if ($old -eq $null) { Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue }
            else { $env:ELECTRON_RUN_AS_NODE = $old }
        }
    }
    return 127
}

function Get-RepoBaseUrl {
    $url = $RepoUrl.TrimEnd('/')
    if ($url.EndsWith('.git')) { $url = $url.Substring(0, $url.Length - 4) }
    return $url
}

function Install-FromZip([string]$Destination) {
    $base = Get-RepoBaseUrl
    $zipUrl = "$base/archive/refs/heads/$Branch.zip"
    $tempRoot = Join-Path $env:TEMP ('dsh-statusline-' + [guid]::NewGuid().ToString('N'))
    $zipPath = Join-Path $tempRoot 'repo.zip'
    $unpacked = Join-Path $tempRoot 'unpacked'
    New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
    try {
        Write-Ok "downloading $zipUrl"
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
        Expand-Archive -LiteralPath $zipPath -DestinationPath $unpacked -Force
        $root = Get-ChildItem -LiteralPath $unpacked -Directory | Select-Object -First 1
        if ($root -eq $null) { Fail 'the downloaded archive was empty' }
        if (-not (Test-Path -LiteralPath $Destination)) {
            New-Item -ItemType Directory -Force -Path $Destination | Out-Null
        }
        Copy-Item -Path (Join-Path $root.FullName '*') -Destination $Destination -Recurse -Force
    } finally {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# ---------------------------------------------------------------- preflight --
Write-Host ''
Write-Host 'DeepSeek Harness - statusline installer' -ForegroundColor White
Write-Host ''

$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$profilesRoot = Join-Path $dshHome 'profiles'
if (-not (Test-Path -LiteralPath $profilesRoot)) {
    Fail "no DSH profiles under $profilesRoot`n       Start DeepSeek Harness once, then run this again."
}
$availableProfiles = @(Get-ChildItem -LiteralPath $profilesRoot -Directory | Select-Object -ExpandProperty Name)

if ([string]::IsNullOrWhiteSpace($Profile)) {
    if ($availableProfiles -contains 'desktop') { $Profile = 'desktop' }
    elseif ($availableProfiles -contains 'web') { $Profile = 'web' }
    elseif ($availableProfiles.Count -eq 1) { $Profile = $availableProfiles[0] }
    else { Fail "more than one profile; pass -Profile <name> (available: $($availableProfiles -join ', '))" }
}
$profileDir = Join-Path $profilesRoot $Profile
if (-not (Test-Path -LiteralPath $profileDir)) {
    Fail "profile not found: $profileDir`n       available: $($availableProfiles -join ', ')"
}
$manifestPath = Join-Path $profileDir 'package.json'
if (-not (Test-Path -LiteralPath $manifestPath)) { Fail "profile has no package.json: $profileDir" }
if (Test-ManifestBom $manifestPath) {
    if ($DryRun) {
        Write-Warn 'the profile manifest has a UTF-8 BOM; the install would remove it'
    } else {
        $null = Repair-ManifestBom $manifestPath
        Write-Warn 'removed a UTF-8 BOM from the profile manifest (DSH cannot parse it)'
    }
}
if ((Get-ProfileManifest $profileDir) -eq $null) { Fail "the profile manifest is not valid JSON: $manifestPath" }
Write-Ok "profile: $profileDir"

$script:AppExe = Get-AppExe
$script:DshCmd = Get-DshCmd $script:AppExe
if ($script:DshCmd -eq $null -and $script:AppExe -eq $null) {
    Fail "could not find the DSH CLI or the DeepSeek Harness app.`n       Start the app once, or pass -DshPath <path to dsh.cmd>."
}
if ($script:DshCmd -ne $null) { Write-Ok "cli:     $($script:DshCmd)" }
else { Write-Ok "cli:     bundled runtime via $($script:AppExe)" }

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand -ne $null) { $script:NodeExe = $nodeCommand.Source }
elseif ($script:AppExe -ne $null) { $script:NodeExe = $null; Write-Ok 'node:    using the Desktop app runtime' }
else { $script:NodeExe = $null; Write-Warn 'node is not on PATH and the app runtime was not found; registration may fail' }

$gitCommand = Get-Command git -ErrorAction SilentlyContinue
$script:FreshCheckout = $false

# ----------------------------------------------------------- source resolution --
Write-Step 'Resolving the source checkout'

$linked = Get-LinkedSource $profileDir
if ($linked -ne $null) { Write-Ok "already linked: $linked" }

if (-not [string]::IsNullOrWhiteSpace($Source)) {
    if (-not (Test-Path -LiteralPath $Source)) { Fail "source directory not found: $Source" }
    $Source = (Resolve-Path -LiteralPath $Source).Path
    if (-not (Test-Package $Source)) { Fail "not a statusline package: $Source" }
} elseif ($linked -ne $null -and (Test-Package $linked)) {
    $Source = $linked
} elseif (-not [string]::IsNullOrWhiteSpace($PSScriptRoot) -and (Test-Package $PSScriptRoot)) {
    $Source = (Resolve-Path -LiteralPath $PSScriptRoot).Path
} elseif (Test-Package $InstallDir) {
    $Source = (Resolve-Path -LiteralPath $InstallDir).Path
}

if ($Source -eq '' -or $Source -eq $null) {
    if ($DryRun) {
        Write-Ok "would set up a checkout in $InstallDir"
        if ($gitCommand -ne $null) { Write-Ok "would run: git clone --depth 1 --branch $Branch $RepoUrl `"$InstallDir`"" }
        else { Write-Ok "would download $(Get-RepoBaseUrl)/archive/refs/heads/$Branch.zip" }
        Write-Step 'Dry run complete - nothing was changed.'
        return
    }
    if ((Test-Path -LiteralPath $InstallDir) -and -not (Test-Package $InstallDir)) {
        Fail "InstallDir exists but is not a statusline checkout: $InstallDir`n       Move it aside, or pass -InstallDir with a free path."
    }
    if ($gitCommand -ne $null) {
        Write-Ok "cloning $RepoUrl ($Branch)"
        New-Item -ItemType Directory -Force -Path (Split-Path -Path $InstallDir -Parent) | Out-Null
        & $gitCommand clone --depth 1 --branch $Branch $RepoUrl $InstallDir | Out-Host
        if ($LASTEXITCODE -ne 0) { Fail "git clone failed with $LASTEXITCODE" }
    } else {
        Install-FromZip $InstallDir
    }
    $script:FreshCheckout = $true
    $Source = (Resolve-Path -LiteralPath $InstallDir).Path
    if (-not (Test-Package $Source)) { Fail "the checkout is incomplete: $Source" }
} elseif ($Update) {
    if ($DryRun) {
        if (Test-Path -LiteralPath (Join-Path $Source '.git')) { Write-Ok 'would pull the checkout before installing' }
        else { Write-Ok 'would re-download the zip checkout before installing' }
    } elseif (Test-Path -LiteralPath (Join-Path $Source '.git')) {
        if ($gitCommand -ne $null) {
            Write-Ok 'pulling the latest changes'
            & $gitCommand -C $Source pull --ff-only | Out-Host
            if ($LASTEXITCODE -ne 0) { Write-Warn 'git pull failed; installing the checkout as it is' }
        } else {
            Write-Warn 'git is not installed; using the checkout as it is'
        }
    } else {
        Write-Ok 'zip checkout: re-downloading the archive'
        Install-FromZip $Source
        $script:FreshCheckout = $true
    }
}

if (-not (Test-Package $Source)) { Fail "not a statusline package: $Source" }
$package = Get-Content -LiteralPath (Join-Path $Source 'package.json') -Raw | ConvertFrom-Json
Write-Ok "source:  $Source (v$($package.version))"

# Rebuild client.js when the editable sources are newer (developer checkout only;
# release checkouts ship a current client.js).
if (-not $DryRun -and -not $script:FreshCheckout -and -not $Update) {
    $clientPath = Join-Path $Source 'client.js'
    $editable = @((Join-Path $Source 'client.src.js'), (Join-Path $Source 'styles\statusbar.css'))
    $stale = $false
    foreach ($file in $editable) {
        if ((Test-Path -LiteralPath $file) -and (Get-Item -LiteralPath $file).LastWriteTimeUtc -gt (Get-Item -LiteralPath $clientPath).LastWriteTimeUtc) { $stale = $true }
    }
    if ($stale) {
        Write-Step 'Rebuilding client.js (editable sources are newer)'
        if ($script:NodeExe -eq $null -and $script:AppExe -eq $null) { Fail 'client.js is stale and node is unavailable; run node scripts/build.mjs' }
        $code = Invoke-Node (Join-Path $Source 'scripts\build.mjs') @()
        if ($code -ne 0) { Fail "build failed with $code" }
    }
}

# ---------------------------------------------------------------- link --
Write-Step 'Linking the package into the profile'
$addArgs = @('plugin', '--profile', $Profile, 'add', $Source)
if ($DryRun) {
    Write-Ok "would run: dsh $($addArgs -join ' ')"
} else {
    if ($Update -or $Force) {
        Write-Ok 'relinking for a fresh module generation'
        $null = Invoke-DshCli @('plugin', '--profile', $Profile, 'remove', $script:PackageName)
    }
    $code = Invoke-DshCli $addArgs
    if ($code -ne 0) { Fail "dsh plugin add exited with $code" }
    Write-Ok 'dependency linked'
}

# ------------------------------------------------------------ register --
Write-Step 'Registering the bundle (this is what activates it)'
$current = Get-ProfileManifest $profileDir
$registered = $false
if ($current -ne $null -and $current.dsh -ne $null -and $current.dsh.profile -ne $null) {
    $registered = @($current.dsh.profile.bundles) -contains $script:PackageName
}

if ($DryRun) {
    Write-Ok "would ensure $($script:PackageName) is in dsh.profile.bundles"
} elseif ($registered) {
    Write-Ok "already registered: $($script:PackageName)"
} else {
    $backup = Join-Path $profileDir ('package.json.bak-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    Copy-Item -LiteralPath $manifestPath -Destination $backup -Force
    Write-Ok "manifest backed up to $(Split-Path -Path $backup -Leaf)"
    $registerScript = Join-Path $Source 'scripts\register.mjs'
    if (-not (Test-Path -LiteralPath $registerScript)) { Fail "register.mjs is missing from $Source" }
    $code = Invoke-Node $registerScript @($profileDir, $script:PackageName, 'add')
    if ($code -ne 0) {
        Copy-Item -LiteralPath $backup -Destination $manifestPath -Force
        Fail "registration failed; profile manifest restored from $backup"
    }
}

# --------------------------------------------------------------- verify --
Write-Step 'Verifying the profile'
if ($DryRun) {
    Write-Ok "would verify the dependency and dsh.profile.bundles entry"
    Write-Host ''
    Write-Host 'Dry run complete - nothing was changed.' -ForegroundColor Green
    Write-Host 'Re-run without -DryRun to install.' -ForegroundColor Green
    return
}
$final = Get-ProfileManifest $profileDir
if ($final -eq $null) { Fail 'profile manifest could not be read back' }
$dep = $null
if ($final.dependencies -ne $null) { $dep = $final.dependencies.PSObject.Properties[$script:PackageName] }
if ($dep -eq $null) { Fail "$($script:PackageName) is not in the profile dependencies" }
$bundles = @($final.dsh.profile.bundles)
if ($bundles -notcontains $script:PackageName) { Fail "$($script:PackageName) is not in dsh.profile.bundles after registration" }
Write-Ok "dependency: $($dep.Value)"
Write-Ok ('bundles:    ' + ($bundles -join ', '))

Write-Step 'Done'

$updateCommand = 'irm https://raw.githubusercontent.com/devopshelper/DSH-statusline/main/install.ps1 | iex'
Write-Host ''
Write-Host "Installed $($script:PackageName) v$($package.version) into profile '$Profile'." -ForegroundColor Green
Write-Host ''
Write-Host '  Reload the Harness Web UI with Ctrl+Shift+R.' -ForegroundColor Gray
Write-Host '  If the strip does not appear, restart DeepSeek Harness: the client bundle' -ForegroundColor Gray
Write-Host '  is fetched once per module generation.' -ForegroundColor Gray
Write-Host ''
Write-Host '  Update later with the same one-liner:' -ForegroundColor Gray
Write-Host "      $updateCommand" -ForegroundColor DarkCyan
Write-Host '  or, from a checkout:' -ForegroundColor Gray
Write-Host '      .\update.cmd' -ForegroundColor DarkCyan
Write-Host ''
