#!/usr/bin/env bash
# 파이썬 스크립트를 실행하면서 시간과 메모리 사용량을 기록한다.
# 사용법: bash phase1_simulation/run_monitored.sh <script.py> <이름>
set -u
cd "$(dirname "$0")/.."
script="$1"
name="$2"
out="outputs/logs"
mkdir -p "$out"

# 2초마다 시스템 메모리(used MB) 기록
( while true; do free -m | awk 'NR==2 {print strftime("%H:%M:%S"), $3}' >> "$out/$name.mem"; sleep 2; done ) &
mon=$!

/usr/bin/time -o "$out/$name.time" -f "WALL=%es MAXRSS=%MKB EXIT=%x" \
    .venv/bin/python "$script" > "$out/$name.log" 2>&1

kill "$mon"
sync

echo "== time: $(cat "$out/$name.time" | tail -1)"
echo "== peak system memory used: $(sort -k2 -n "$out/$name.mem" | tail -1 | awk '{print $2}') MB"
echo "== log (INFO/WARNING 제외):"
grep -v -E '^(INFO|WARNING)|^\s*$' "$out/$name.log" | tail -40
