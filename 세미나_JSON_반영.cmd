@echo off
chcp 65001 >nul
cd /d "%~dp0"
python prepare_pages.py --merge-progress
if errorlevel 1 (
  echo.
  echo JSON 반영 중 오류가 발생했습니다.
) else (
  echo.
  echo progress-summary.json 갱신이 끝났습니다. GitHub에 커밋하면 공유 현황이 배포됩니다.
)
pause
