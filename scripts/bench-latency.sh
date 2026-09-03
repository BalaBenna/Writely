#!/usr/bin/env bash
set -e

echo "=== Running Writely Realtime Latency Gate (<50ms) ==="
npx tsx bench/realtime_bench.ts
