# Windows Vulkan/DirectML compilation script for local models
Write-Host "[Writely Build] Compiling llama.cpp sidecar with Vulkan and DirectML for Windows x64..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path build-win
Set-Location build-win
cmake -DGGML_VULKAN=ON -DCMAKE_BUILD_TYPE=Release ..
cmake --build . --config Release
Write-Host "[Writely Build] Windows Vulkan/DirectML inference binary ready." -ForegroundColor Green
