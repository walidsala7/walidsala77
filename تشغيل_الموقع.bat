@echo off
chcp 65001 >nul
title Smart Phone Store - تشغيل الموقع
color 0A
cls
echo ================================================================
echo        مرحباً بك! تشغيل موقع Smart Phone على جهازك
echo ================================================================
echo.

where node >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] تشغيل السيرفر عبر Node.js...
    node "%~dp0server.cjs"
    pause
    exit /b
)

echo [تنبيه] Node.js غير مثبت، جاري تشغيل السيرفر المدمج في ويندوز فوراً...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$f='%~dp0dist'; Start-Process 'http://localhost:3000'; $l=New-Object System.Net.HttpListener; $l.Prefixes.Add('http://localhost:3000/'); $l.Start(); Write-Host '================================================================'; Write-Host '   السيرفر يعمل الآن بنجاح! تم فتح الموقع في المتصفح.'; Write-Host '   لإيقاف السيرفر: أغلق هذه النافذة في أي وقت.'; Write-Host '================================================================'; while($l.IsListening){ try { $c=$l.GetContext(); $r=$c.Request; $s=$c.Response; $t=$r.Url.LocalPath.TrimStart('/'); if(!$t){$t='index.html'}; $file=Join-Path $f $t; if(!(Test-Path $file)){$file=Join-Path $f 'index.html'}; $b=[System.IO.File]::ReadAllBytes($file); $ext=[System.IO.Path]::GetExtension($file); switch($ext){'.html'{$s.ContentType='text/html; charset=utf-8'} '.js'{$s.ContentType='application/javascript'} '.css'{$s.ContentType='text/css'} '.png'{$s.ContentType='image/png'} '.svg'{$s.ContentType='image/svg+xml'} default{$s.ContentType='application/octet-stream'}}; $s.ContentLength64=$b.Length; $s.OutputStream.Write($b,0,$b.Length); $s.OutputStream.Close() }catch{} }"
pause
