$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot
$runtimeNode = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
if (-not (Test-Path -LiteralPath $runtimeNode)) { $runtimeNode = (Get-Command node -ErrorAction Stop).Source }
$codexCommand = (Get-Command codex -ErrorAction Stop).Source
$env:PA_CODEX_BIN = $codexCommand
$stateDir = Join-Path $projectDir '.pa-session'
New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
if (-not (Test-Path -LiteralPath (Join-Path $projectDir '_site/connections.html'))) { throw '먼저 python prepare_pages.py --build 로 화면을 준비해 주세요.' }
$listener = Get-NetTCPConnection -LocalPort 8987 -State Listen -ErrorAction SilentlyContinue
if (-not $listener) {
    $servicePath = Join-Path $projectDir 'server/session-service.cjs'
    $process = Start-Process -FilePath $runtimeNode -ArgumentList @('"' + $servicePath + '"') -WorkingDirectory $projectDir -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $stateDir 'service.log') -RedirectStandardError (Join-Path $stateDir 'service-error.log')
    Set-Content -LiteralPath (Join-Path $stateDir 'service.pid') -Value $process.Id
}
$ready = $false
for ($attempt = 0; $attempt -lt 20; $attempt++) {
    try {
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8987/health' -TimeoutSec 2
        if ($health.service -ne 'problem-atom-codex-companion') { throw '다른 서비스가 포트 8987을 사용하고 있습니다.' }
        $ready = $true
        break
    } catch { Start-Sleep -Milliseconds 250 }
}
if (-not $ready) { throw '연결 도우미를 시작하지 못했습니다. .pa-session/service-error.log와 포트 8987을 확인해 주세요.' }
Write-Output '제작 화면: http://127.0.0.1:8987/connections.html'
Write-Output 'API 키 없이 현재 Codex의 ChatGPT 로그인으로 제작합니다.'
