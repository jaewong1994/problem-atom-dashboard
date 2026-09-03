param(
  [string]$SourceBankRoot = $env:PROBLEM_BANK_ROOT
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($SourceBankRoot)) {
  throw "PROBLEM_BANK_ROOT 환경 변수 또는 -SourceBankRoot 인수로 원문 저장소 경로를 지정하세요."
}
$dashboardRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $dashboardRoot "vendor\problem-rendering"
$sources = @{
  "수식공통.js" = "problem-math.js"
  "표시공통.js" = "problem-display.js"
}

New-Item -ItemType Directory -Force -Path $target | Out-Null
foreach ($entry in $sources.GetEnumerator()) {
  $sourcePath = Join-Path $SourceBankRoot $entry.Key
  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    throw "표시 규칙 파일을 찾을 수 없습니다: $sourcePath"
  }
  Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $target $entry.Value) -Force
}

Get-FileHash -Algorithm SHA256 -LiteralPath @(
  (Join-Path $target "problem-math.js"),
  (Join-Path $target "problem-display.js")
) | Select-Object Path, Hash
