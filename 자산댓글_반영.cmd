@echo off
chcp 65001 >nul
cd /d "%~dp0"
python ..\tools\apply_asset_comments.py
if errorlevel 1 (
  echo.
  echo 자산 댓글 반영 중 오류가 발생했습니다.
) else (
  echo.
  echo archive/comments/ledger.json 갱신이 끝났습니다. 정의문은 자동으로 바뀌지 않습니다.
)
pause
