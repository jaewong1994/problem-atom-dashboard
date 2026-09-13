@echo off
chcp 65001 >nul
cd /d "%~dp0"
python apply_group_reviews.py %*
if errorlevel 1 exit /b 1
python prepare_pages.py --build
echo 묶음 결정 원장 갱신 완료. 기존 승격 절차에서 정리문과 분리 결과를 사용하세요.
pause
