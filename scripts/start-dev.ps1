# Start the local forensic API and web dashboard with real Windows ADB
$ErrorActionPreference = 'Stop'
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " SMART FORENSIC SYSTEM — FULL STACK DEVELOPER RUNNER " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

$RootPath = Resolve-Path "$PSScriptRoot\.."
Set-Location -Path $RootPath

# Local mode means the API executes adb.exe on this investigator PC directly.
$env:LOCAL_AGENT_MODE = 'true'
$env:PUBLIC_API_URL = ''

Write-Host "[1/3] Verifying ADB & Environment..." -ForegroundColor Gray
& powershell -ExecutionPolicy Bypass -File "$RootPath\scripts\check-adb.ps1"

# Resolve ADB again in this parent process so the API inherits the exact executable path.
if (-not $env:ADB_PATH -or -not (Test-Path -LiteralPath $env:ADB_PATH)) {
    $candidate = Join-Path $env:USERPROFILE 'Downloads\platform-tools-latest-windows\platform-tools\adb.exe'
    if (Test-Path -LiteralPath $candidate) { $env:ADB_PATH = $candidate }
}
if (-not $env:ADB_PATH) {
    $adbCommand = Get-Command adb.exe -ErrorAction SilentlyContinue
    if ($adbCommand) { $env:ADB_PATH = $adbCommand.Source }
}
if (-not $env:ADB_PATH -or -not (Test-Path -LiteralPath $env:ADB_PATH)) {
    throw 'ADB executable could not be resolved. Set ADB_PATH to the full path of adb.exe.'
}

Write-Host "      ADB_PATH    : $env:ADB_PATH" -ForegroundColor Gray
Write-Host "      Agent mode  : LOCAL (API executes ADB directly)" -ForegroundColor Gray

Write-Host "[2/3] Initializing Database & Seed Data..." -ForegroundColor Gray
Set-Location -Path "$RootPath\apps\api"
& npx prisma db push --skip-generate
& npx tsx src/db/seed.ts

Set-Location -Path $RootPath
Write-Host "[3/3] Starting API (Port 3001) & Web Dashboard (Port 3000)..." -ForegroundColor Green
& npm run dev
