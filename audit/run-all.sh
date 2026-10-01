#!/bin/bash
# AUDIT LENGKAP — Kuis A/B + Absensi + Gesture Battle PRO + mode HP. Butuh koneksi (Chrome/jsdom diunduh sekali).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p /tmp/smoke && cd /tmp/smoke
[ -d node_modules/jsdom ] && [ -d node_modules/puppeteer ] || npm i --no-audit --no-fund jsdom puppeteer
[ -d "$HOME/.cache/puppeteer/chrome" ] || npx puppeteer browsers install chrome
ln -sfn /tmp/smoke/node_modules "$DIR/node_modules"
node "$DIR/ab-reg.js";  R1=$?
node "$DIR/ab-add.js";  R2=$?
node "$DIR/aw3.js";     R3=$?
node "$DIR/gbp.js";     R4=$?
node "$DIR/mobile.js";  R5=$?
echo; echo "=== SELESAI: regresi=$R1 tambahan=$R2 absensi=$R3 gbp=$R4 mobile=$R5 ==="
