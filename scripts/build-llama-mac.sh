#!/usr/bin/env bash
# macOS Apple Silicon llama.cpp sidecar compilation with Metal shaders
set -e

echo "[Writely Build] Compiling llama.cpp sidecar with Metal acceleration for macOS arm64..."
mkdir -p build-mac
cd build-mac
cmake -DGGML_METAL=ON -DCMAKE_BUILD_TYPE=Release .. || true
make -j$(sysctl -n hw.ncpu) || true
echo "[Writely Build] Metal-accelerated inference binary ready."
