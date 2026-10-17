#!/bin/bash
# ----------------------------------------------------
# 🏠 Launcher Uang Kas Kontrakan (1-Click Run untuk macOS)
# ----------------------------------------------------

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "======================================================="
echo "🏠  MEMULAI UANG KAS KONTRAKAN..."
echo "======================================================="

# Buka browser otomatis langsung ke aplikasi
(sleep 1 && open "http://localhost:3000") &

# Cek apakah server sudah aktif di port 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚡ Server sudah aktif!"
    echo "💻 Langsung membuka browser ke http://localhost:3000..."
    wait
else
    echo "🚀 Menyalakan server database..."
    node server/server.js
fi
