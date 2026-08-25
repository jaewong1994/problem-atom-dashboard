$ErrorActionPreference = "Stop"

$entry = Join-Path $PSScriptRoot "server.py"
$output = Join-Path $PSScriptRoot "ProblemAtomDashboard.exe"
$buildRoot = Join-Path $env:TEMP ("problem-atom-dashboard-" + [guid]::NewGuid().ToString("N"))
$work = Join-Path $buildRoot "work"
$spec = Join-Path $buildRoot "spec"

try {
    $python = Get-Command py -ErrorAction SilentlyContinue
    if (-not $python) {
        throw "Python launcher (py) was not found. Build this on the owner PC."
    }

    New-Item -ItemType Directory -Path $work, $spec -Force | Out-Null
    & $python.Source -m PyInstaller `
        --noconfirm `
        --clean `
        --onefile `
        --console `
        --name "ProblemAtomDashboard" `
        --distpath $PSScriptRoot `
        --workpath $work `
        --specpath $spec `
        $entry

    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $output)) {
        throw "EXE build failed."
    }
    Write-Host "Build complete: $output" -ForegroundColor Green
    Write-Host "Share the entire dashboard folder to keep assets and JSON synchronization."
} finally {
    if (Test-Path -LiteralPath $buildRoot) {
        Remove-Item -LiteralPath $buildRoot -Recurse -Force
    }
}
