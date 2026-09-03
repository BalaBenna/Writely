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

Writely ships 4 ways: **Electron Desktop** (recommended, familiar) + **Tauri Desktop** (lightweight ~12.4 MB) + **Web** (PWA) + **Browser Extension**. All 100% offline.

### Where to download (regular releases)

Every `git tag v*` auto-builds installers via GitHub Actions (`.github/workflows/release.yml:1` — **Tauri + Electron in parallel**) and attaches them to **GitHub Releases**.

* **Releases page (all versions):** https://github.com/BalaBenna/Writely/releases
* **Latest (always fresh):** https://github.com/BalaBenna/Writely/releases/latest
* **In-app:** Download button (top bar → Download) fetches latest assets via GitHub API and offers the newest `.dmg/.exe`.
* **Install docs:** see `docs/INSTALL.md` for notarization / SmartScreen notes.

| Platform | Electron (recommended) | Tauri (lightweight) | Web |
|---|---|---|---|
| **macOS 12+ Universal (M1–M4 + Intel)** | `Writely-1.2.0.dmg` (~85 MB, Electron) | `Writely_*_universal.dmg` (~12.4 MB, Tauri) | https://balabenna.github.io/Writely/ |
| **Windows 10/11 64-bit** | `Writely Setup 1.2.0.exe` (Electron NSIS) | `Writely_*_x64-setup.exe` + `.msi` (Tauri) | — |
| Install | Open DMG → drag to Applications → right-click Open (ad-hoc) | Same (12 MB, faster) | PWA caches offline |
| Dev | `npm run dev:electron` | `npm run tauri dev` | `npm run dev` |

* **Homebrew Cask:** `brew install --cask writely` *(points to Electron or Tauri DMG; PR pending)*
* **WinGet:** `winget install Writely.Writely` *(winget-pkgs PR pending)*
* **Hardware Acceleration:** macOS ANE + Metal (12–22ms), Windows DirectML / Vulkan / Intel NPU; local models in `~/.writely/models/`.

---

## 🧩 Features (Parity with Grammarly — Offline)

- **Goals:** Audience × Formality × Domain (General/Academic/Business/Email/Casual/Creative) × Intent — `src/components/Goals/GoalsBar.tsx:1` tailors rules (Academic flags contractions, Casual ignores fragments).
- **Inline Realtime Highlights:** Wavy underlines per type (Grammar Red `grammar.ts:12`, Spelling Amber `spell.ts:1`, Clarity Purple, Tone Emerald) + **inline desktop + extension** (`extensions/chrome/content.js:1` shadow marks for Gmail/Notion, popup Fix-All for textarea).
- **Suggestion Card:** Word-level diff + Why explanation + `Cmd+Enter`/`Esc`, Add to Dictionary.
- **Fix All, Counters, Analytics:** Words/chars (with/without spaces)/paragraphs/sentences/avg w/s/longest sentence warning + personal analytics (no tracking) `src/components/Analytics/AnalyticsPanel.tsx:1`.
- **Tone Detector & Studio:** Overall tone radar (formal/neutral/informal/confident/friendly + emoji) `src/engine/toneDetector.ts:1` + 5-voice rewrite (Professional/Friendly/Concise/Academic/Casual).
- **Plagiarism — Local Self-Check:** n-gram Jaccard vs saved drafts/history (100% offline) `src/engine/plagiarism.ts:1` + `PlagiarismPanel`; for web-scale (16B) opt-in cloud via Copyscape/Crossref.
- **Citations:** APA/MLA/Chicago formatter + in-text `src/engine/citations.ts:1` + Crossref lookup (opt-in) + copy.
- **AI Detector + Humanizer:** Heuristic burstiness/perplexity detector `src/engine/detector.ts:1` (<30ms offline) + one-click humanize (contractions, burst).
- **Style Guide & Snippets:** Local JSON brand rules (e.g. Writely not writely, Oxford comma) + `/trigger` expansion `src/engine/styleGuide.ts:1`, import/export for team via git.
- **Document Health:** Flesch-Kincaid, Grade, Clarity, reading time, density.
- **Dictionary & History:** Personal dict CRUD + saved drafts.
- **Models:** BYOK cloud (OpenAI/Groq/Anthropic/Gemini/Ollama) + local catalog placeholders.

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
git clone https://github.com/BalaBenna/Writely.git
cd Writely
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
