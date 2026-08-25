$ErrorActionPreference = "Stop"
$dashboardUrl = "http://127.0.0.1:8876/"
$apiUrl = "$($dashboardUrl)api/data"
$scriptPath = Join-Path $PSScriptRoot "server.py"
$exePath = Join-Path $PSScriptRoot "ProblemAtomDashboard.exe"

try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $apiUrl -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "현황판이 이미 실행 중입니다. 브라우저에서 엽니다."
        Start-Process $dashboardUrl
        exit 0
    }
} catch {
    # 실행 중인 현황판이 없으면 아래에서 새로 시작한다.
}

if (Test-Path -LiteralPath $exePath) {
    Write-Host "포터블 현황판을 시작합니다. 이 창은 닫지 마세요."
    & $exePath
    exit $LASTEXITCODE
}

$pythonCommand = Get-Command py -ErrorAction SilentlyContinue
if ($pythonCommand) {
    Write-Host "현황판을 시작합니다. 이 창은 닫지 마세요."
    & $pythonCommand.Source -3 $scriptPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "현황판 실행에 실패했습니다. 위 오류 내용을 확인해 주세요." -ForegroundColor Red
        Read-Host "Enter를 누르면 창이 닫힙니다"
        exit 1
    }
    exit 0
}

$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
if ($pythonCommand) {
    Write-Host "현황판을 시작합니다. 이 창은 닫지 마세요."
    & $pythonCommand.Source $scriptPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "현황판 실행에 실패했습니다. 위 오류 내용을 확인해 주세요." -ForegroundColor Red
        Read-Host "Enter를 누르면 창이 닫힙니다"
        exit 1
    }
    exit 0
}

$bundledPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if (Test-Path -LiteralPath $bundledPython) {
    Write-Host "현황판을 시작합니다. 이 창은 닫지 마세요."
    & $bundledPython $scriptPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "현황판 실행에 실패했습니다. 위 오류 내용을 확인해 주세요." -ForegroundColor Red
        Read-Host "Enter를 누르면 창이 닫힙니다"
        exit 1
    }
    exit 0
}

Write-Host "Python 3를 찾지 못했습니다." -ForegroundColor Red
Write-Host "Python을 설치하거나 프로젝트 운영자에게 실행 파일 패키징을 요청해 주세요."
Read-Host "Enter를 누르면 창이 닫힙니다"
exit 1
