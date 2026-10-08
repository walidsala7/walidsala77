param(
    [int]$Port = 3000
)

$ErrorActionPreference = "SilentlyContinue"
$root = $PSScriptRoot
if (Test-Path (Join-Path $root "dist")) {
    $folder = Join-Path $root "dist"
} else {
    $folder = $root
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Smart Phone Store - سيرفر محلي فوري على جهازك" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " المجلد: $folder" -ForegroundColor Gray
Write-Host " الرابط المحلي: http://localhost:$Port" -ForegroundColor Green
Write-Host " المتصفح يفتح تلقائياً الآن..." -ForegroundColor White
Write-Host " اضغط Ctrl + C لإيقاف السيرفر في أي وقت" -ForegroundColor Gray
Write-Host "========================================================" -ForegroundColor Cyan

Start-Process "http://localhost:$Port"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
    $listener.Start()
} catch {
    Write-Host "[تنبيه] المنفذ $Port مشغول، جاري المحاولة على 3001..." -ForegroundColor Yellow
    $Port = 3001
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Start()
    Start-Process "http://localhost:$Port"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response
        
        $path = $req.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($path)) {
            $path = "index.html"
        }
        
        $targetFile = Join-Path $folder $path
        if (!(Test-Path $targetFile) -or (Get-Item $targetFile).PSIsContainer) {
            $targetFile = Join-Path $folder "index.html"
        }
        
        $bytes = [System.IO.File]::ReadAllBytes($targetFile)
        $ext = [System.IO.Path]::GetExtension($targetFile).ToLower()
        
        switch ($ext) {
            ".html" { $res.ContentType = "text/html; charset=utf-8" }
            ".js"   { $res.ContentType = "application/javascript; charset=utf-8" }
            ".css"  { $res.ContentType = "text/css; charset=utf-8" }
            ".json" { $res.ContentType = "application/json; charset=utf-8" }
            ".png"  { $res.ContentType = "image/png" }
            ".jpg"  { $res.ContentType = "image/jpeg" }
            ".jpeg" { $res.ContentType = "image/jpeg" }
            ".svg"  { $res.ContentType = "image/svg+xml" }
            ".ico"  { $res.ContentType = "image/x-icon" }
            default { $res.ContentType = "application/octet-stream" }
        }
        
        $res.Headers.Add("Access-Control-Allow-Origin", "*")
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.OutputStream.Close()
    } catch {
        # continue loop
    }
}
