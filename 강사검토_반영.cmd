@echo off
chcp 65001 >nul
cd /d "%~dp0"
python ..	oolspply_pilot_reviews.py %*
if errorlevel 1 (
  echo.
  echo 강사 검토 반영 중 오류가 발생했습니다.
) else (
  echo.
  echo archive/reviews/ledger.json 갱신이 끝났습니다. status는 자동으로 바뀌지 않습니다.
  echo reviewed 승격은 --promote-reviewed 를 붙여 다시 실행할 때만 됩니다.
)
pause
