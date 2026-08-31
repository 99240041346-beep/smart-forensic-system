# Smart Forensic local ADB agent launcher
$ErrorActionPreference = 'Stop'
$RootPath = Resolve-Path "$PSScriptRoot\.."
Set-Location -Path "$RootPath\apps\api"

Write-Host "=====================================================" -ForegroundColor Green
Write-Host " SMART FORENSIC LOCAL ADB AGENT (PORT 3001)" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

# The local agent only needs ADB. Cloud PostgreSQL migrations must never run here.
$env:LOCAL_AGENT_MODE = "true"
if (-not $env:PUBLIC_API_URL) { $env:PUBLIC_API_URL = "https://smart-forensic-api.onrender.com" }
if (-not $env:AGENT_POLL_MS) { $env:AGENT_POLL_MS = "2000" }

Write-Host "Cloud API     : $env:PUBLIC_API_URL" -ForegroundColor Gray
Write-Host "Agent mode    : $env:LOCAL_AGENT_MODE" -ForegroundColor Gray
Write-Host "Database sync : SKIPPED (local ADB agent)" -ForegroundColor Gray
Write-Host ""

# Fail early with a useful message instead of EADDRINUSE.
$portOwner = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($portOwner) {
    Write-Host "Port 3001 is already in use by PID $($portOwner[0].OwningProcess)." -ForegroundColor Yellow
    Write-Host "Stop that process, then run this script again." -ForegroundColor Yellow
    exit 1
}

npm run dev
