# Check ADB Environment & Device Connectivity
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " SMART FORENSIC SYSTEM — ADB & ENVIRONMENT CHECK      " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Check Node.js
Write-Host "[1/4] Checking Node.js runtime..." -NoNewline
try {
    $nodeVer = & node -v
    Write-Host " OK ($nodeVer)" -ForegroundColor Green
} catch {
    Write-Host " FAILED (Node.js is not found in PATH)" -ForegroundColor Red
}

# 2. Check npm
Write-Host "[2/4] Checking npm package manager..." -NoNewline
try {
    $npmVer = & npm -v
    Write-Host " OK ($npmVer)" -ForegroundColor Green
} catch {
    Write-Host " FAILED (npm is not found in PATH)" -ForegroundColor Red
}

# 3. Check ADB executable
Write-Host "[3/4] Checking Android Debug Bridge (ADB)..." -NoNewline
$adbCmd = Get-Command adb -ErrorAction SilentlyContinue
if ($adbCmd) {
    $adbVer = & adb version | Select-Object -First 1
    Write-Host " OK ($($adbCmd.Source))" -ForegroundColor Green
    Write-Host "      Version: $adbVer" -ForegroundColor Gray
} else {
    Write-Host " WARNING (adb.exe not found in PATH)" -ForegroundColor Yellow
    Write-Host "      Please install Android Platform Tools and add to PATH or configure ADB_PATH in .env" -ForegroundColor Gray
}

# 4. Check Connected Devices
Write-Host "[4/4] Enumerating connected USB / Emulated devices..."
try {
    $devOutput = & adb devices -l
    Write-Host $devOutput -ForegroundColor Gray
} catch {
    Write-Host " Could not execute 'adb devices'. ADB daemon may not be running." -ForegroundColor Yellow
}

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " Environment check completed." -ForegroundColor Cyan
