# Check ADB Environment & Device Connectivity
$ErrorActionPreference = 'Stop'
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " SMART FORENSIC SYSTEM — ADB & ENVIRONMENT CHECK    " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Check Node.js
Write-Host "[1/4] Checking Node.js runtime..." -NoNewline
try { $nodeVer = & node -v; Write-Host " OK ($nodeVer)" -ForegroundColor Green }
catch { Write-Host " FAILED (Node.js is not found in PATH)" -ForegroundColor Red }

# 2. Check npm
Write-Host "[2/4] Checking npm package manager..." -NoNewline
try { $npmVer = & npm -v; Write-Host " OK ($npmVer)" -ForegroundColor Green }
catch { Write-Host " FAILED (npm is not found in PATH)" -ForegroundColor Red }

# 3. Resolve ADB from ADB_PATH, PATH, or the standard Windows Downloads location
Write-Host "[3/4] Checking Android Debug Bridge (ADB)..." -NoNewline
$adbPath = $env:ADB_PATH
if (-not $adbPath -or -not (Test-Path -LiteralPath $adbPath)) {
    $adbCommand = Get-Command adb.exe -ErrorAction SilentlyContinue
    if ($adbCommand) { $adbPath = $adbCommand.Source }
}
if (-not $adbPath -or -not (Test-Path -LiteralPath $adbPath)) {
    $candidate = Join-Path $env:USERPROFILE 'Downloads\platform-tools-latest-windows\platform-tools\adb.exe'
    if (Test-Path -LiteralPath $candidate) { $adbPath = $candidate }
}

if ($adbPath -and (Test-Path -LiteralPath $adbPath)) {
    $env:ADB_PATH = $adbPath
    $adbVer = & $adbPath version | Select-Object -First 1
    Write-Host " OK" -ForegroundColor Green
    Write-Host "      Path: $adbPath" -ForegroundColor Gray
    Write-Host "      Version: $adbVer" -ForegroundColor Gray
} else {
    Write-Host " FAILED (adb.exe was not found)" -ForegroundColor Red
    Write-Host "      Install Android Platform Tools or set ADB_PATH to adb.exe." -ForegroundColor Gray
    exit 1
}

# 4. Check connected devices using the resolved executable
Write-Host "[4/4] Enumerating connected USB / Emulated devices..."
try {
    $devOutput = & $adbPath devices -l
    Write-Host ($devOutput -join "`n") -ForegroundColor Gray
} catch {
    Write-Host " Could not execute 'adb devices'. ADB daemon may not be running." -ForegroundColor Yellow
}

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " ADB environment check completed." -ForegroundColor Cyan
