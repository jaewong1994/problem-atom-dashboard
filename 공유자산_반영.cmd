@echo off
chcp 65001 >nul
cd /d "%~dp0"
python build_asset_library.py
if errorlevel 1 (
  echo.
  echo 공유 자산 반영 중 오류가 발생했습니다.
) else (
  echo.
  echo asset-library.json 갱신이 끝났습니다. GitHub에 커밋하면 구성원 페이지에 반영됩니다.
)
pause
