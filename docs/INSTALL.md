# Installing Writely

## Quick Download (Recommended)

Every push of a version tag `v*` builds fresh installers and attaches them to **GitHub Releases**.

- **Releases page:** https://github.com/BalaBenna/Writely/releases
- **Latest:** https://github.com/BalaBenna/Writely/releases/latest

| Platform | File | How to install |
|---|---|---|
| **macOS 12+ Universal (M1–M4 + Intel)** | `Writely_*_universal.dmg` | Open DMG → drag Writely to Applications → right-click → Open (first launch, ad-hoc sign). |
| **Windows 10/11 64-bit** | `Writely_*_x64-setup.exe` (NSIS) / `.msi` | Double-click → Next → Install. SmartScreen may warn on first unsigned build — click More info → Run anyway. |
| **Web (no install)** | — | https://balabenna.github.io/Writely/ — full editor, PWA caches for offline. |
| **Chrome / Edge / Brave extension** | `extensions/chrome/` | `chrome://extensions` → Developer mode → Load unpacked → select `extensions/chrome` → ensure desktop app or `npm run bridge` on `ws://127.0.0.1:8765`. |

### Regular updates

- **Auto-update:** Tauri updater checks `https://github.com/BalaBenna/Writely/releases/latest` on launch (when configured). Until Apple cert is added, macOS will prompt on update — accept.
- **Manual:** Re-download latest `.dmg`/`.exe` from Releases and reinstall (settings + dictionary in `~/.writely/` / `localStorage` are preserved).

### Package managers (coming)

- `brew install --cask writely` — requires Homebrew cask PR (formula points to Releases `.dmg` + `sha256`). Until merged, use DMG.
- `winget install Writely.Writely` — requires winget-pkgs PR (installer URL + hash). Until merged, use `.exe`.

### Building locally

```bash
git clone https://github.com/BalaBenna/Writely.git
cd Writely
npm ci
npm run build        # web
npm run tauri build  # local dmg/exe (needs Rust toolchain)
```

### Signing notes

- macOS is currently **ad-hoc signed** (`signingIdentity: null`). For Gatekeeper bypass-free distribution, enroll in Apple Developer Program, set `APPLE_SIGNING_IDENTITY` and `notarytool` credentials in `release.yml`.
- Windows is unsigned. For SmartScreen-free, add EV cert `certificateThumbprint` + `timestampUrl` in `tauri.conf.json:windows` and store cert as GitHub secret.
