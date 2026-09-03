# Installing Writely

## Quick Download (Recommended) — Electron + Tauri

Every push of a version tag `v*` builds **both Electron and Tauri** installers in parallel via `.github/workflows/release.yml` and attaches them to **GitHub Releases**.

- **Releases page:** https://github.com/BalaBenna/Writely/releases
- **Latest:** https://github.com/BalaBenna/Writely/releases/latest
- **Web (no install):** https://balabenna.github.io/Writely/ — full editor, PWA caches for offline.
- **Extension:** `extensions/chrome/` → `chrome://extensions` → Developer mode → Load unpacked → ensure `npm run bridge` on `ws://127.0.0.1:8765`.

| Platform | Electron (recommended, familiar) | Tauri (lightweight) |
|---|---|---|
| **macOS 12+ Universal** | `Writely-1.2.0.dmg` (~85 MB, Electron) — `npm run dev:electron` | `Writely_*_universal.dmg` (~12.4 MB) — `npm run tauri dev` |
| **Windows 10/11 64-bit** | `Writely Setup 1.2.0.exe` (Electron NSIS) | `Writely_*_x64-setup.exe` / `.msi` (Tauri NSIS) |

Install: Open DMG → drag to Applications → right-click Open (ad-hoc sign until Apple cert). Windows: More info → Run anyway on first unsigned build.

### Regular updates

- **Manual:** Re-download latest `.dmg`/`.exe` from Releases and reinstall (settings in `~/.writely/` / `localStorage` preserved).
- **Auto-update:** Electron autoUpdater (electron-builder) and Tauri updater both check `https://github.com/BalaBenna/Writely/releases/latest` when configured.

### Package managers (coming)

- `brew install --cask writely` — cask PR points to Releases `.dmg` + `sha256` (choose Electron or Tauri URL).
- `winget install Writely.Writely` — winget-pkgs PR.

### Building locally

```bash
git clone https://github.com/BalaBenna/Writely.git
cd Writely
npm ci
npm run build                 # web → dist/
npm run dev:electron          # Electron dev (vite + electron)
npm run build:electron        # Electron prod → release-electron/*.dmg/*.exe (no Rust)
npm run tauri build           # Tauri local dmg/exe (needs Rust)
```

### Signing notes

- macOS ad-hoc signed (`tauri.conf.json:macOS.signingIdentity: null`, `electron builder dmg.sign: false`). Add Apple Developer `APPLE_SIGNING_IDENTITY` + notarytool for gatekeeper-free.
- Windows unsigned. Add EV cert for SmartScreen-free in `electron-builder nsis` + `tauri.conf.json:windows`.
