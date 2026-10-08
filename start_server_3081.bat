@echo off
chcp 65001 >nul
title Smart Phone - تشغيل السيرفر على المنفذ 3081
color 0A
cls
echo ========================================================
echo        تشغيل موقع Smart Phone على المنفذ 3081
echo        الرابط: http://148.113.6.63:3081
echo ========================================================
echo.
set APP_PORT=3081

where node >nul 2>&1
if %errorlevel% equ 0 (
    echo جاري التشغيل عبر Node.js على المنفذ 3081...
    start http://localhost:3081
    node server.cjs
    pause
    exit /b
)

echo جاري التشغيل عبر PowerShell على المنفذ 3081...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_server.ps1" -Port 3081
pause
