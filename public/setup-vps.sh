#!/bin/bash
# ========================================================
# Smart Phone Store - سكريبت التثبيت والتشغيل التلقائي على السيرفر
# Server IP: 148.113.6.63 | Port: 3081
# ========================================================

set -e

PORT=3081
APP_DIR="/var/www/smartphone"

echo "========================================================"
echo "      جاري إعداد وتشغيل موقع Smart Phone على السيرفر..."
echo "      المنفذ المستهدف: $PORT"
echo "========================================================"

# 1. إنشاء المجلد
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# 2. تحميل ملفات الموقع الحديثة
echo "[1/4] جاري تحميل ملفات الموقع..."
curl -sL "https://ais-dev-d5bj6hhdskxnzdy3obigtj-279790062587.europe-west2.run.app/smart-phone-server.zip" -o smartphone.zip

# 3. فك الضغط
echo "[2/4] فك ضغط الملفات..."
if command -v unzip >/dev/null 2>&1; then
    unzip -o -q smartphone.zip
elif command -v python3 >/dev/null 2>&1; then
    python3 -c "import zipfile; zipfile.ZipFile('smartphone.zip').extractall('.')"
else
    apt-get update -qq && apt-get install -y -qq unzip
    unzip -o -q smartphone.zip
fi
rm -f smartphone.zip

# 4. فحص بيئة Node.js
echo "[3/4] فحص Node.js..."
if ! command -v node >/dev/null 2>&1; then
    echo "جاري تثبيت Node.js السريع..."
    if command -v apt-get >/dev/null 2>&1; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1 || true
        apt-get install -y -qq nodejs >/dev/null 2>&1 || true
    elif command -v yum >/dev/null 2>&1; then
        yum install -y -q nodejs npm >/dev/null 2>&1 || true
    fi
fi

# 5. فتح المنفذ 3081 في الجدار الناري
echo "[4/4] فتح المنفذ $PORT في الجدار الناري..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow $PORT/tcp >/dev/null 2>&1 || true
fi
if command -v iptables >/dev/null 2>&1; then
    iptables -I INPUT -p tcp --dport $PORT -j ACCEPT 2>/dev/null || true
fi

# 6. إيقاف أي سيرفر قديم يعمل على 3081
fuser -k $PORT/tcp 2>/dev/null || true

# 7. تشغيل السيرفر بالخلفية
if command -v pm2 >/dev/null 2>&1; then
    pm2 delete smartphone 2>/dev/null || true
    APP_PORT=$PORT pm2 start server.cjs --name "smartphone"
    pm2 save 2>/dev/null || true
else
    nohup env APP_PORT=$PORT node server.cjs > server.log 2>&1 &
fi

sleep 2

# فحص عمل السيرفر
if curl -s -I "http://127.0.0.1:$PORT" | grep -q "200 OK"; then
    echo ""
    echo "========================================================"
    echo "   [تهانينا] تم تشغيل الموقع بنجاح على سيرفرك الخاص!"
    echo "   🌐 الرابط المباشر الآن: http://148.113.6.63:$PORT"
    echo "========================================================"
    echo ""
else
    echo ""
    echo "========================================================"
    echo "   تم إطلاق السيرفر في الخلفية على المنفذ $PORT!"
    echo "   🌐 جرب فتح الرابط الآن: http://148.113.6.63:$PORT"
    echo "========================================================"
    echo ""
fi
