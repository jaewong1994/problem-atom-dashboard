param(
  [string]$Ngd2Root = $env:NGD2_ROOT
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($Ngd2Root)) {
  throw "NGD2_ROOT 환경 변수 또는 -Ngd2Root 인수로 NGD2 루트 경로를 지정하세요."
}
$dashboardRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $dashboardRoot "vendor\ngd2"
$sources = @{
  "수식공통.js" = "ngd2-math.js"
  "표시공통.js" = "ngd2-display.js"
}

New-Item -ItemType Directory -Force -Path $target | Out-Null
foreach ($entry in $sources.GetEnumerator()) {
  $sourcePath = Join-Path $Ngd2Root $entry.Key
  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    throw "NGD2 표시 규칙 파일을 찾을 수 없습니다: $sourcePath"
  }
  Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $target $entry.Value) -Force
}

Get-FileHash -Algorithm SHA256 -LiteralPath @(
  (Join-Path $target "ngd2-math.js"),
  (Join-Path $target "ngd2-display.js")
) | Select-Object Path, Hash
