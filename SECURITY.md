# Security Policy

Writely is 100% offline — your text never leaves your device. That is our core security guarantee.

## Reporting a Vulnerability

Email **balabenna@gmail.com** with subject `[Writely Security]`.

Do not open public issues for sensitive bugs. We aim to respond within 48h.

## Scope

- `src-tauri/` Rust backend
- `extensions/chrome/` bridge (`ws://127.0.0.1:8765` — localhost only, no remote)
- Model download verification (SHA256 in `models/registry.json`)

## Guarantees

- Zero telemetry, zero keystroke exfiltration
- All inference on-device (ONNX / CoreML / GGUF)
- No cloud fallback without explicit opt-in
