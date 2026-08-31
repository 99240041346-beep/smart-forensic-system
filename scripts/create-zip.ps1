# Create a clean ZIP archive of the smart-forensic-system project
$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
$zipPath = "C:\Users\VARDHAN\.gemini\antigravity\scratch\smart-forensic-system.zip"
$stageDir = "C:\Users\VARDHAN\.gemini\antigravity\scratch\smart-forensic-system-staging"

Write-Host "Creating clean staging directory..."
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path $stageDir) { Remove-Item $stageDir -Recurse -Force }

New-Item -ItemType Directory -Path $stageDir | Out-Null

Write-Host "Copying project files..."
# Copy all items except node_modules, .next, dist, dev.db
$items = Get-ChildItem -Path $rootDir
foreach ($item in $items) {
    if ($item.Name -in @('node_modules', '.next', 'dist', 'dev.db', 'dev.db-journal', '.turbo')) {
        continue
    }
    Copy-Item -Path $item.FullName -Destination $stageDir -Recurse -Force
}

# Clean any nested node_modules or build caches in subdirectories
Get-ChildItem -Path $stageDir -Recurse -Directory | Where-Object {
    $_.Name -in @('node_modules', '.next', 'dist', '.turbo', 'build')
} | ForEach-Object {
    Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

# Remove any stray .db files from staging
Get-ChildItem -Path $stageDir -Recurse -Filter "*.db*" | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Compressing into $zipPath..."
Compress-Archive -Path "$stageDir\*" -DestinationPath $zipPath -CompressionLevel Optimal -Force

Remove-Item $stageDir -Recurse -Force

$zipItem = Get-Item $zipPath
Write-Host "SUCCESS! Archive created at: $($zipItem.FullName)"
Write-Host "Archive Size: $([math]::Round($zipItem.Length / 1MB, 2)) MB"
