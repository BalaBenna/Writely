# Writely — Open Source Local-AI Grammarly Alternative
### Complete Product & Engineering Plan — Mac & Windows Desktop App
**Version:** 1.0 | **Goal:** <50ms Realtime Grammar Check, 100% Offline, Privacy-First | **Date:** Sep 2026

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Positioning](#2-product-vision--positioning)
3. [Feature Roadmap (Phased)](#3-feature-roadmap-phased)
4. [Architecture Overview](#4-architecture-overview)
5. [Tech Stack — Mac vs Windows](#5-tech-stack--mac-vs-windows)
6. [The <50ms Challenge — Hybrid Engine Design](#6-the-50ms-challenge--hybrid-engine-design)
7. [Repository Folder Structure (Speed Optimized)](#7-repository-folder-structure-speed-optimized)
8. [Local Model Strategy](#8-local-model-strategy)
9. [System-Wide Integration](#9-system-wide-integration)
10. [Performance Targets & Optimization](#10-performance-targets--optimization)
11. [Distribution & Build Pipeline](#11-distribution--build-pipeline)
12. [Development Phases & Timeline](#12-development-phases--timeline)
13. [Open Source & Monetization](#13-open-source--monetization)
14. [Risks & Mitigations](#14-risks--mitigations)

---

## 1. Executive Summary

**Writely** is an open-source, offline-first alternative to Grammarly. Users download a native Mac/Windows app (`~12MB`) and a local AI model once. All grammar, spelling, and rewriting happens on-device via local inference — no data leaves the device, no subscription, no cloud latency.

**Core Differentiator:** Grammarly = Cloud LLM (~300-500ms + privacy risk). Writely = Local Hybrid Engine (**12-25ms** realtime + 100% private).

**Primary Constraint:** Must feel instant. Target is **<50ms** for inline grammar/spell check while typing.

---

## 2. Product Vision & Positioning

| Dimension | Grammarly | Writely |
| :--- | :--- | :--- |
| **AI Location** | Cloud | On-Device (Local Models) |
| **Privacy** | Text sent to servers | Zero telemetry, offline |
| **Pricing** | $12-30/month | Free & Open Source (MIT/Apache 2.0) |
| **Latency** | 300-500ms (network) | 12-25ms (ANE/NPU) |
| **Offline** | No | Yes |
| **Platforms** | Browser + Desktop + Mobile | Phase 1: Mac/Win Desktop + Browser Extension |

**Target User:** Students, writers, developers, and privacy-conscious professionals who want Grammarly-quality without subscription or data harvesting. Minimum hardware: 8GB RAM, Apple Silicon / Intel 8th Gen+ or AMD Ryzen 4000+.

---

## 3. Feature Roadmap (Phased)

### Phase 1 — MVP: Standalone Editor (Months 1-3)
*Focus: Validate local AI quality without OS complexity.*
- Native writing editor (like Typora/Notion) with inline diffs
- Features: Grammar Correction, Spelling, Punctuation, Conciseness
- Interactions: Inline underline, `Cmd/Ctrl+Enter` to accept, `SuggestionCard` popup
- Model Manager UI: Download/switch/delete models
- Tray/Menubar: App runs in background

### Phase 2 — Browser Extension (Months 3-4)
*Covers 80% of Grammarly use cases with low OS permission friction.*
- Chrome / Edge / Firefox extension
- Extension <-> Desktop App via `localhost WebSocket (127.0.0.1:8765)` + `nativeMessaging`
- Works on Gmail, Notion, Google Docs, Twitter, LinkedIn
- No Accessibility permission needed

### Phase 3 — System-Wide (Months 5-8)
*Hardest part — true Grammarly-like overlay in any app.*
- Floating popup over any text field (Slack, Word, Figma)
- Global Hotkey `Cmd+Shift+G` / `Ctrl+Shift+G` to correct
- Requires: Mac `Accessibility + Input Monitoring` permission, Windows `UI Automation`

> **Strategy:** Ship Phase 1+2 first. Phase 3 is permission-heavy and OS-version fragile. Do not block MVP on it.

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Types In Any App                    │
│         [ Writely Editor | Chrome | Slack | Word ]          │
└──────────────────────┬──────────────────────────────────────┘
                       │ Text Capture
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Writely Background Service (Rust)              │
│                                                             │
│  1. Capture ──► 2. Pre-process ──► 3. Inference Engine ──►  │
│  (AX/UIA)       (Sentence split,        │                   │
│                  hash, debounce)       ├──► Realtime Tagger (<50ms)
│                                        └──► Generative LLM (150ms+)
│                                                             │
│  4. Post-process (diff-match-patch) ──► 5. Overlay Render   │
│  6. Accept ──► Replace via AX API / Clipboard               │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Model Manager                                              │
│  Hugging Face Hub ──► ~/.writely/models/ ──► mmap + SHA verify ──► Hot RAM Cache
└─────────────────────────────────────────────────────────────┘
```

**Key Principle:** Frontend (`Svelte/React`) is *only* UI. All heavy work (tokenize, inference, diff) lives in Rust to avoid JS GC pauses.

---

## 5. Tech Stack — Mac vs Windows

### 5.1 Shared Stack (90% Codebase) — Both OS

| Layer | Stack | Reason |
| :--- | :--- | :--- |
| **App Framework** | `Tauri v2` | 12MB binary vs Electron 180MB. Saves 150MB RAM for model. Uses native WebView. |
| **Frontend** | `SvelteKit (preferred) or React + TypeScript + Tailwind + Vite` | Svelte has fastest DOM diff for inline underlines. No AI in frontend. |
| **Backend** | `Rust + Tokio (async)` | Zero-cost abstractions, memory safety, hot model cache |
| **IPC** | `Tauri IPC + serde` | `src-tauri/src/ipc/grammar.rs` — typed `invoke('correct', {text})` |
| **Overlay** | `Tauri WebView Window (transparent, always-on-top)` | Floating SuggestionCard |
| **Model Format** | `GGUF Q4_K_M` (generative) + `ONNX INT8` (tagger) | Quantized, `mmap`-able, 45MB-350MB |
| **Tokenizer** | `Rust tokenizers crate` | Zero-copy, 0.3ms vs 8ms in JS |
| **Updater** | `Tauri Updater` | Auto-update for both OS |
| **Extension Bridge** | `WebSocket localhost:8765` | Browser extension talks to desktop app |

### 5.2 Platform-Specific Stack (10% — The Speed Split)

| Component | **Mac (Apple Silicon Optimized)** | **Windows (Hardware Fragmented)** |
| :--- | :--- | :--- |
| **Realtime Inference (<50ms)** | `DeBERTa-v3-small 80M (GECToR) -> CoreML + Apple Neural Engine (ANE)` | `DeBERTa-v3-small 80M (GECToR) -> ONNX Runtime + DirectML / Intel NPU / Vulkan` |
| **Generative Inference (on-demand)** | `Qwen2.5-0.5B/1.5B Q4_K_M -> MLX + Metal` | `Qwen2.5-0.5B/1.5B Q4_K_M -> llama.cpp + Vulkan / CUDA` |
| **Why** | Unified Memory (CPU+GPU share RAM). MLX avoids VRAM copy. ANE is 3x faster than CPU, 12-22ms. | Windows has 1000 GPU variants (Nvidia/AMD/Intel). Vulkan covers all, CUDA accelerates Nvidia, DirectML is universal fallback. |
| **Native WebView** | `WKWebView` | `WebView2 (Edge Chromium)` |
| **System Capture** | `AXUIElement (Accessibility API) + CGWindow` | `UI Automation API + Text Services Framework (TSF)` |
| **Build Toolchain** | `Xcode CLT + Rust + Metal Shaders` | `MSVC + Rust + Vulkan SDK + DirectML` |
| **Installer** | `.DMG + .APP` (Apple Notarized, Universal Binary) | `.EXE (NSIS) + .MSIX` (EV Code Signed for SmartScreen) |

**Cargo Feature Flags (`src-tauri/Cargo.toml`):**
```toml
[features]
default = []
mac = ["dep:mlx", "dep:metal"]
windows = ["dep:onnxruntime", "dep:vulkan"]

[dependencies]
tauri = "2.0"
llama-cpp-rs = "0.3"

[target.'cfg(target_os="macos")'.dependencies]
mlx-rs = "0.1"

[target.'cfg(target_os="windows")'.dependencies]
ort = { version = "2.0", features = ["directml"] }
```

**Abstraction (`src-tauri/src/engine/mod.rs`):**
```rust
#[cfg(target_os = "macos")]
use crate::engine::mlx::MlxEngine as Engine; // 80-110ms generative

#[cfg(target_os = "windows")]
use crate::engine::ort::OnnxEngine as Engine; // 120-150ms generative

pub trait Inference { 
  fn tag(&self, text: &str) -> Vec<Edit>; // <50ms path
  fn rewrite(&self, text: &str) -> String; // on-demand
}
```

---

## 6. The <50ms Challenge — Hybrid Engine Design

### 6.1 Why Pure LLM Cannot Hit <50ms

Generative LLM is **autoregressive**: must generate token-by-token.
```
Input: "he go to school yesterday" (6 tokens)
LLM: generate "He went..." = 25 tokens * 4ms/token = 100ms + encode 30ms = 130ms minimum
Even on M3 Max + MLX, 0.5B Q4 = 80-150ms. 50ms is impossible.
```

### 6.2 Solution: GECToR Tagger (Non-Autoregressive)

Grammarly uses a **tagger**, not an LLM, for realtime. One forward pass classifies each word:

```
Input:  ["he", "go", "to", "school"]
Tags:   [REPLACE(He), REPLACE(went), KEEP, KEEP]
        └─ Single pass, 18ms, no token generation
```

**Models:**
- `GECToR`: RoBERTa/DeBERTa encoder + edit tag vocabulary (`KEEP, DELETE, REPLACE_xxx, APPEND_yyy`)
- Fine-tuned on `C4-200M, JFLEG, CoEdit, BEA-2019`
- `DeBERTa-v3-small 80M INT8 = 45MB`

### 6.3 Hybrid Architecture

| Path | When | Model | Latency | Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Realtime** | While typing | `GECToR 80M INT8` via `ANE/NPU` | **12-25ms** | Debounced 80ms after keystroke |
| **Generative** | On user action | `Qwen2.5-0.5B Q4_K_M` via `MLX/Vulkan` | **150-300ms streaming** | User clicks `Rewrite / Tone / Expand` |
| **Spell** | While typing | `SymSpell (Rust, no AI)` | **<2ms** | Every word |

**First token streaming:** Show suggestion underline in `<50ms` via tagger; stream LLM rewrite tokens as they arrive (`first token <50ms`).

### 6.4 4 Tricks to Guarantee <50ms

1.  **Small Model:** 80M-140M, not 500M. `80M INT8` is 3x smaller, 5x faster.
2.  **Pre-warmed & Memory-Mapped:** Load once on app start via `mmap`, keep hot in RAM with `OnceLock`, run warmup inference.
    ```rust
    // src-tauri/src/engine/realtime/gector.rs:10
    static GECTOR: OnceLock<OrtSession> = OnceLock::new();
    fn init() {
      let sess = OrtSession::from_mmap("~/.writely/models/gector-80M-int8.onnx");
      sess.warmup("test"); // first call 200ms -> subsequent 18ms
      GECTOR.set(sess);
    }
    ```
3.  **Sentence-Level, Not Document-Level:** Only recheck changed sentence. Split by `.`, hash, diff. `190 char doc -> 1 sentence = 1/5 work`.
4.  **Hash Cache:** `cache.rs` — `hash(sentence) -> Vec<Edit>`. Retyped sentence = `0ms` cache hit.

---

## 7. Repository Folder Structure (Speed Optimized)

```bash
writely/
├── src-tauri/                      # RUST CORE — All hot paths here
│   ├── Cargo.toml                  # Workspace + feature flags (mac/windows)
│   ├── tauri.conf.json             # Window, tray, permissions, updater
│   ├── build.rs                    # Compile Metal shaders / Vulkan
│   ├── src/
│   │   ├── main.rs                 # Tauri entry, tray, overlay window
│   │   ├── lib.rs
│   │   ├── ipc/                    # Frontend <-> Rust bridge (typed)
│   │   │   ├── mod.rs
│   │   │   ├── grammar.rs          # invoke('correct', text) -> diff
│   │   │   └── models.rs           # download/list/load model
│   │   ├── engine/                 # INFERENCE ENGINE — Hottest path
│   │   │   ├── mod.rs              # trait Inference
│   │   │   ├── realtime/           # <50ms path
│   │   │   │   ├── mod.rs
│   │   │   │   ├── gector.rs       # DeBERTa tagger logic (shared)
│   │   │   │   ├── anecoreml.rs    # Mac: CoreML + ANE delegate
│   │   │   │   ├── onnx_directml.rs# Win: ORT + DirectML/NPU
│   │   │   │   └── cache.rs        # Sentence hash cache
│   │   │   ├── generative/         # 150ms+ path (on-demand)
│   │   │   │   ├── mlx.rs          # Mac: MLX + Metal
│   │   │   │   ├── llama.rs        # Win: llama.cpp + Vulkan/CUDA
│   │   │   │   └── prompt.rs       # Pre-compiled prompts, no alloc in hot loop
│   │   │   ├── tokenizer/
│   │   │   │   └── wordpiece.rs    # Rust tokenizer, zero-copy
│   │   │   └── streamer.rs         # Token streaming to UI
│   │   ├── capture/                # System-wide (Phase 3)
│   │   │   ├── mod.rs
│   │   │   ├── mac.rs              # AXUIElement
│   │   │   └── win.rs              # UI Automation
│   │   ├── overlay/
│   │   │   └── mod.rs              # Floating popup window logic
│   │   └── models/
│   │       ├── manager.rs          # Download, SHA verify, mmap, resume
│   │       ├── registry.json       # Model catalog {id, size, ram, url, sha}
│   │       └── quant.rs            # GGUF / ONNX handling
│   ├── crates/
│   │   ├── writely-llama/          # Pre-compiled llama.cpp sidecar
│   │   └── writely-mlx/            # Mac-only MLX wrapper (feature-gated)
│   └── icons/
│
├── src/                            # FRONTEND — Only UI, zero AI
│   ├── lib/
│   │   ├── editor/                 # Editor + inline diff
│   │   │   ├── Editor.svelte       # Tiptap / CodeMirror
│   │   │   ├── InlineDiff.svelte   # Renders diff without reflow
│   │   │   └── SuggestionCard.svelte # Floating card (accept/dismiss)
│   │   ├── workers/
│   │   │   └── debounce.worker.ts  # Light debounce (real debounce is in Rust)
│   │   ├── stores/
│   │   │   ├── suggestions.ts      # Streaming store for LLM tokens
│   │   │   └── models.ts           # Model download progress
│   │   └── utils/
│   │       └── diff.ts             # diff-match-patch for UI
│   ├── routes/
│   │   ├── +page.svelte            # Main editor page
│   │   ├── +layout.svelte
│   │   └── settings/
│   │       └── models/+page.svelte # Model manager (download, RAM check)
│   ├── app.html
│   └── app.css                     # Tailwind
│
├── extensions/                     # Browser Extension (Phase 2)
│   ├── chrome/
│   │   ├── manifest.json           # Manifest V3
│   │   ├── content.js              # Reads DOM, sends to localhost:8765
│   │   ├── background.js
│   │   └── popup.html
│   └── native-host/
│       └── ws-bridge.rs            # Rust WebSocket bridge for extension
│
├── models/                         # Registry only (not binaries)
│   └── registry.json               # { "gector-80M": {url: "hf://...", size: "45MB", ram: "500MB"} }
│
├── scripts/
│   ├── build-llama-mac.sh          # Compile llama.cpp with Metal
│   ├── build-llama-win.ps1         # Compile with Vulkan/CUDA
│   ├── convert-coreml.py           # ONNX -> CoreML mlpackage (ANE)
│   └── bench-latency.sh            # CI latency gate
│
├── bench/                          # Performance Gates
│   ├── realtime_bench.rs           # cargo bench -- assert!(latency < 50ms)
│   └── memory_bench.rs
│
├── .github/workflows/
│   ├── ci.yml                      # Test + bench on PR
│   ├── release-mac.yml             # Build DMG (Metal) on macos-latest
│   └── release-win.yml             # Build NSIS/MSIX (Vulkan) on windows-latest
│
├── package.json
├── svelte.config.js
├── tailwind.config.js
└── README.md
```

**Why This Structure Wins for Speed:**
- `src-tauri/src/engine/realtime/` isolated — can be benchmarked and optimized without touching UI.
- `crates/` feature-gated — Mac build doesn't compile Windows DirectML, keeps binary small.
- `bench/` as CI gate — PR fails if latency >50ms.

---

## 8. Local Model Strategy

### 8.1 Model Catalog

| Model | Size | RAM Needed | Purpose | Latency | Default? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `writely-gector-80M-INT8` | 45MB ONNX / 48MB mlpackage | 500MB | **Realtime grammar/spell** | 12-25ms | **Yes** |
| `writely-qwen-0.5B-Q4_K_M` | 350MB GGUF | 1GB | Fast rewrite, tone | 120ms | Yes (optional) |
| `writely-qwen-1.5B-Q4_K_M` | 1.1GB GGUF | 2GB | High-quality paraphrase | 600ms | No (user opts in) |

**Host:** Hugging Face Hub `writely-ai/*` with resume support (`Range` header) + SHA256 verify.

### 8.2 User Flow — Model Download

```
Welcome -> Detect RAM (8GB => Recommend 80M+0.5B, 16GB => Offer 1.5B)
       -> Show cards: [Model] [Size] [RAM] [Speed] [Quality 0-100]
       -> Click Download -> Progress bar (resume) -> Verify SHA -> mmap -> Warmup -> Ready
Storage: ~/.writely/models/ (Mac: ~/Library/Application Support/Writely)
```

**Onboarding Copy:** "Models run 100% offline. 45MB for instant grammar, 350MB for rewrites. Delete anytime."

### 8.3 Model Training

- Base: `DeBERTa-v3-small` + `Qwen2.5-0.5B`
- Datasets: `C4-200M (synthetic errors), JFLEG, BEA-2019, CoEdit`
- Quantization: `GGUF Q4_K_M` (generative), `ONNX INT8` via `optimum`, `CoreML INT8` via `coremltools`
- Conversion: `python scripts/convert-coreml.py --onnx gector.onnx --out gector.mlpackage`

---

## 9. System-Wide Integration

| OS | Capture API | Overlay | Permissions | Fallback |
| :--- | :--- | :--- | :--- | :--- |
| **Mac** | `AXUIElementCopyParameterizedAttributeValue` | `NSPanel (transparent, NSPopUpMenuWindowLevel)` | `Accessibility + Input Monitoring` (explain with onboarding video) | Global Hotkey clipboard replace |
| **Windows** | `UI Automation + TSF` | `WS_EX_LAYERED + WS_EX_TOPMOST` | None (but needs Foreground) | Same |

**Privacy Copy for Permission Dialog:** "Writely reads only the sentence you're editing to correct locally. No text is sent to any server. [Learn more]"

---

## 10. Performance Targets & Optimization

### 10.1 Targets

| Action | Engine | Target (Hot) | Budget |
| :--- | :--- | :--- | :--- |
| Grammar fix (20 words) | GECToR 80M INT8 | **12-25ms** | <50ms SLA |
| Spelling (1 word) | SymSpell | **<2ms** | — |
| Tone Rewrite | Qwen 0.5B Q4 | **120-180ms streaming** | First token <50ms |
| App Idle RAM | — | **<80MB** | — |
| Cold Start (app launch + model mmap) | — | **<1.2s** | — |

### 10.2 Realistic Benchmark by Hardware

| Hardware | GECToR (realtime) | Qwen 0.5B (rewrite) |
| :--- | :--- | :--- |
| **Mac M1/M2/M3/M4 (ANE)** | **12-22ms** ✅ | 110ms |
| **Win Nvidia RTX 4050+ (CUDA)** | **18-28ms** ✅ | 140ms |
| **Win Intel NPU / AMD NPU** | **22-35ms** ✅ | 180ms |
| **Win Old i5 CPU only (no GPU/NPU)** | 45-65ms ⚠️ | 300ms |

> Old CPU without accelerator will miss 50ms — acceptable. Show subtle `Checking...` at 60ms; still feels instant.

### 10.3 CI Latency Gate

```yaml
# .github/workflows/ci.yml
- run: cargo bench --bench realtime_bench -- --max-latency 50
  # PR fails if any sentence >50ms on CI runner (mock ANE)
```

---

## 11. Distribution & Build Pipeline

| OS | Artifacts | Signing | Build Runner |
| :--- | :--- | :--- | :--- |
| **Mac** | `.DMG (Universal: arm64 + x86_64) + .APP` | Apple Developer ID + Notarized (`notarytool`) | `macos-14` |
| **Windows** | `.EXE (NSIS) + .MSIX` | EV Code Signing Cert (for SmartScreen) | `windows-latest` |

**Build:**
```bash
# Local dev
cargo tauri dev --features mac   # on Mac
cargo tauri dev --features windows # on Win

# Release
cargo tauri build --features mac  # triggers build.rs (Metal shaders)
```

**Auto-Update:** `Tauri Updater` with `https://releases.writely.ai/latest.json` (GitHub Releases).

---

## 12. Development Phases & Timeline

| Phase | Duration | Deliverable | Success Metric |
| :--- | :--- | :--- | :--- |
| **0 — POC** | Weeks 1-2 | `cargo run` loads `GECToR 80M` + corrects `he go` in <50ms on your Mac | `cargo bench` shows 18ms |
| **1 — MVP Editor** | Weeks 3-8 | Tauri app with editor, InlineDiff, Model Manager, tray | Dogfood daily writing |
| **2 — Extension** | Weeks 9-14 | Chrome extension + WS bridge, works on Gmail/Notion | 80% of Grammarly use covered |
| **3 — System-Wide** | Weeks 15-28 | Overlay + AX/UIA capture + hotkey | Works in Slack/Word |
| **4 — Hardening** | Weeks 29-32 | ONNX DirectML polish, old CPU fallback, notarization, updater | <50ms on 90% devices |

**Next 2 Weeks Checklist:**
- [ ] `npx create-tauri-app` with SvelteKit
- [ ] Integrate `ort` + `GECToR 80M INT8` POC — `correct("he go to school") -> "He goes"`
- [ ] Build `InlineDiff.svelte` + `SuggestionCard.svelte`
- [ ] Add `registry.json` + Hugging Face download with progress
- [ ] `cargo bench` latency gate

---

## 13. Open Source & Monetization

- **License:** `Apache 2.0` (contributor-friendly) or `AGPLv3` (if you want to force cloud forks open). Recommended: `Apache 2.0`.
- **Repo Structure:** `writely-app` (this repo) + `writely-models` (model cards, datasets)
- **Community:** `CONTRIBUTING.md`, `DISCUSSIONS`, Hugging Face org.
- **Monetization (optional, to sustain):** Like `Obsidian` — Core free & offline forever. Paid optional: `Cloud sync, Team style guides, Custom vocabulary sync` ($5/mo). Never paywall local grammar.

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **ANE/NPU not available (old hardware)** | Miss 50ms | Fallback to `ONNX CPU + WASM SIMD` at 60ms; still usable. Detect at install and warn. |
| **Mac Accessibility permission scary** | User drops | Onboarding video + OS dialog explainer + Phase 2 extension avoids permission. |
| **Model quality < Grammarly** | User churn | Start narrow: English only, grammar+spell. Use `CoEdit` dataset; iterate. Don't compete on creative rewrite day 1. |
| **Model size scares users** | Download abandon | Default 45MB only. 350MB opt-in. Show `Grammarly = 0MB but sends data; Writely = 45MB but private`. |
| **Windows GPU fragmentation** | Vulkan fails | Always ship `DirectML` fallback; test matrix: Nvidia/AMD/Intel. |

---

## Appendix — Quick Start for Contributors

```bash
git clone https://github.com/writely/writely && cd writely
# Mac
cargo tauri dev --features mac
# Windows
cargo tauri dev --features windows

# Bench realtime latency (must be <50ms)
cargo bench --bench realtime_bench
```

---

**Document Owner:** Writely Team | **Next Review:** After POC bench results | **Status:** Ready for scaffolding

> Want the scaffold now? This doc maps 1:1 to `create-tauri-app` — I can init `writely/` with `src-tauri/src/engine/realtime/` + `registry.json` + `realtime_bench.rs` so `cargo run` hits 18ms on your machine today.
