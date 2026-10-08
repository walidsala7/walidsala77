@echo off
chcp 65001 >nul
title Smart Phone Store - تشغيل الموقع
color 0B
cls
echo ========================================================
echo        مرحباً بك في موقع Smart Phone - وليد صلاح
echo ========================================================
echo.

:: فحص هل تم فك الضغط أم تم الفتح من داخل ZIP مباشرة
if not exist "%~dp0dist\" if not exist "%~dp0src\" (
    color 0C
    echo [تنبيه هام جداً]
    echo يبدو أنك قمت بفتح الملف من داخل الأرشيف المضغوط مباشرة دون فك الضغط!
    echo.
    echo الحل السهل:
    echo 1. اضغط كليك يمين على ملف (smart-phone-server.zip).
    echo 2. اختر "استخراج الكل" أو "Extract All".
    echo 3. ادخل إلى المجلد المستخرج الجديد وافتح هذا الملف مرة أخرى.
    echo.
    pause
    exit /b
)

:: فحص هل Node.js متوفر على الجهاز
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] بيئة Node.js متوفرة على جهازك.
    echo.
    echo اختر طريقة التشغيل:
    echo [1] تشغيل فوري وسريع بدون تثبيت (موصى به - يفتح فوراً)
    echo [2] تشغيل وضع المطورين (Node.js / Vite Dev Server)
    echo.
    set /p mode="أدخل اختيارك (1 أو 2) ثم اضغط Enter [الافتراضي: 1]: "
    if "%mode%"=="2" goto RUN_NODE
)

:RUN_INSTANT
echo.
echo [جاري التشغيل الفوري] يتم الآن إطلاق السيرفر المحلي...
echo سيفتح المتصفح تلقائياً على الرابط: http://localhost:3000
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_server.ps1"
if %errorlevel% neq 0 (
    echo فشل تشغيل السكريبت، جاري المحاولة بأمر مباشر...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $f='%~dp0dist'; Start-Process 'http://localhost:3000'; $l=New-Object System.Net.HttpListener; $l.Prefixes.Add('http://localhost:3000/'); $l.Start(); while($l.IsListening){ try { $c=$l.GetContext(); $r=$c.Request; $s=$c.Response; $t=$r.Url.LocalPath.TrimStart('/'); if(!$t){$t='index.html'}; $file=Join-Path $f $t; if(!(Test-Path $file)){$file=Join-Path $f 'index.html'}; $b=[System.IO.File]::ReadAllBytes($file); $s.ContentLength64=$b.Length; $s.OutputStream.Write($b,0,$b.Length); $s.OutputStream.Close() }catch{} } }"
)
pause
exit /b

:RUN_NODE
echo.
echo [1/2] فحص وتحميل المكتبات...
if not exist "%~dp0node_modules\" (
    echo جاري تحميل المكتبات، يرجى الانتظار دقيقة...
    call npm install --legacy-peer-deps
)
echo.
echo [2/2] تشغيل سيرفر Vite...
start http://localhost:3000
call npm run dev
pause
