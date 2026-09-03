# Winget / Homebrew publishing — Writely

These are **local templates** for the PRs you will open to the official registries once a release has assets.

## Winget (Windows) — `winget install Writely.Writely`

1. After `v1.1.0` builds, copy the `.exe` URL + SHA256:
   ```bash
   gh release view v1.1.0 --json assets --jq '.assets[] | select(.name|test("exe$")) | .browserDownloadUrl'
   curl -L -o /tmp/Writely.exe <URL>
   shasum -a 256 /tmp/Writely.exe
   ```
2. Fork https://github.com/microsoft/winget-pkgs
3. Add `manifests/w/Writely/Writely/1.1.0/Writely.Writely.yaml` using template `docs/winget/Writely.Writely.yaml` (replace URL + sha256 + version)
4. Validate: `winget validate manifests/w/Writely/Writely/1.1.0/`
5. PR → merges in ~1–3 days → `winget install Writely.Writely` works.

## Homebrew (macOS) — `brew install --cask writely`

1. After `v1.1.0`, copy `.dmg` URL + SHA256:
   ```bash
   gh release view v1.1.0 --json assets --jq '.assets[] | select(.name|test("dmg$")) | .browserDownloadUrl'
   curl -L -o /tmp/Writely.dmg <URL>
   shasum -a 256 /tmp/Writely.dmg
   ```
2. Fork https://github.com/Homebrew/homebrew-cask
3. Add `Casks/w/writely.rb` using template `docs/homebrew/writely.rb` (replace url/sha256/version)
4. Audit: `brew audit --cask writely && brew style --fix writely`
5. PR → merges in ~1 day → `brew install --cask writely` works.

Until PRs merge, users install via Releases page or in-app Download button (fetches latest asset via GitHub API).
