# Writely — Open Source Local-AI Grammarly Alternative
### <50ms Realtime Grammar, Spelling & Style Assistant • 100% Offline • Zero Telemetry

<p align="center">
  <img src="https://img.shields.io/badge/Latency-12ms_to_25ms-10b981?style=for-the-badge&logo=speedtest&logoColor=white" alt="Latency <50ms" />
  <img src="https://img.shields.io/badge/Privacy-100%25_On--Device-6366f1?style=for-the-badge&logo=shield&logoColor=white" alt="100% Offline" />
  <img src="https://img.shields.io/badge/Platforms-macOS_%7C_Windows-0ea5e9?style=for-the-badge&logo=apple&logoColor=white" alt="Mac and Windows" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-f59e0b?style=for-the-badge" alt="Apache 2.0 License" />
</p>

---

## ⚡ The <50ms Realtime Challenge

Traditional AI grammar tools (like Grammarly) query cloud LLMs over the internet, incurring **300ms–600ms latency** and transmitting your private keystrokes to third-party servers.

**Writely** operates completely on your machine using a **multi-tiered hybrid engine**:

```
Keystroke
   │
   ▼
[ Tier 0: FNV-1a Sentence Hash Cache ] ──► (Cache Hit: <0.2ms)
   │
   ▼
[ Tier 1: SymSpell Lexical Engine ]     ──► (<2ms Typo & Spelling Correction)
   │
   ▼
[ Tier 2: Non-Autoregressive Tagger ]   ──► (<15ms Agreement, Punctuation, Wordiness)
   │
   ▼
[ Tier 3: Local AI Model (GECToR / Qwen)] ──► (<120ms Deep Context & Tone Paraphrasing)
```

---

## 🚀 Download & Installation

Writely is packaged as a native, lightweight installer (~12.4 MB) for both **macOS** and **Windows**.

### macOS (Universal: Apple Silicon & Intel)
* **Direct Download:** [Download `Writely-Universal.dmg`](https://github.com/writely/writely/releases/latest)
* **Homebrew Cask:**
  ```bash
  brew install --cask writely
  ```
* **Hardware Acceleration:** Uses Apple Neural Engine (ANE) and Metal for 12–22ms inference.

### Windows (10 & 11 64-bit)
* **Direct Download:** [Download `Writely-Setup-x64.exe`](https://github.com/writely/writely/releases/latest) (NSIS Installer)
* **WinGet:**
  ```powershell
  winget install Writely.Writely
  ```
* **Hardware Acceleration:** Uses ONNX Runtime with DirectML, Vulkan, and Intel NPU.

---

## 🧩 Features

- **Inline Realtime Highlights:** Color-coded wavy underlines for Grammar (Red), Spelling (Amber), Clarity (Purple), and Tone (Emerald).
- **Floating Suggestion Card:** Instant visual diff (`- original` `+ replacement`), grammatical explanation, and keyboard shortcut (`Cmd/Ctrl+Enter` to accept, `Esc` to dismiss).
- **Fix All in 1-Click:** Safe right-to-left multi-edit application.
- **AI Tone & Paraphrase Studio:** Rewrite any paragraph in **Professional**, **Friendly**, **Concise**, **Academic**, or **Casual** voice with sub-120ms local streaming.
- **Performance Telemetry HUD:** Realtime ms counter displaying tokenization, engine, and cache hit metrics on every keystroke.
- **Document Health & Readability:** Live Flesch-Kincaid Reading Ease index, Grade Level, Clarity rating, word count, and reading time.
- **Browser Extension (Chrome / Edge / Brave):** Connects to the desktop app via `ws://127.0.0.1:8765` to check Gmail, Notion, Slack, and Google Docs with zero telemetry.
- **Personal Offline Dictionary:** One-click "Add to Dictionary" for custom terms and technical jargon.

---

## 🧠 Local AI Model Catalog

Models are downloaded once to `~/.writely/models/` and cached hot in RAM:

| Model | Size | RAM Needed | Purpose | Latency Target |
| :--- | :--- | :--- | :--- | :--- |
| **`writely-gector-80M-int8`** | 45 MB | 500 MB | Realtime grammar & spell tagging | **12–25ms** |
| **`writely-qwen-0.5B-q4`** | 350 MB | 1.0 GB | Fast tone rewriter & conciseness | **110–140ms** |
| **`writely-qwen-1.5B-q4`** | 1.1 GB | 2.2 GB | Academic paraphrasing & dense prose | **450–600ms** |

---

## 🛠️ Quick Start for Development

### Prerequisites
- Node.js 18+ & npm
- Rust toolchain (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`) for Tauri desktop builds.

### 1. Clone & Install
```bash
git clone https://github.com/writely/writely.git
cd writely
npm install
```

### 2. Start Dev Server (Web & Desktop Preview)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run the Automated Latency Benchmark Gate (<50ms SLA)
```bash
npm run bench
```

### 4. Start Localhost WebSocket Bridge for Browser Extension
```bash
npm run bridge
```

### 5. Build Desktop Packages (.DMG / .EXE)
```bash
npm run build
npm run tauri build
```

---

## 🌐 Browser Extension Setup

1. Open Google Chrome or Microsoft Edge and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top right.
3. Click **Load unpacked** and select the `extensions/chrome/` directory from this repository.
4. Ensure the Writely desktop app or background bridge (`npm run bridge`) is running on port `8765`.

---

## 📄 License

Distributed under the **Apache 2.0 License**. See `LICENSE` for details.
