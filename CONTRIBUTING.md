# Contributing to Writely

Thanks for helping make Writely the best open-source alternative to Grammarly!

## Quick Start

```bash
git clone https://github.com/BalaBenna/Writely.git
cd Writely
npm install
npm run dev      # web preview at http://localhost:5173
npm run bench    # must stay <50ms — CI gates on this
npm run bridge   # extension bridge ws://127.0.0.1:8765
```

Requires Node 18+ and Rust (for `cargo tauri build`).

## Project Structure

- `src/engine/` — hybrid engine (cache → spell → grammar → rewriter) — hot path, keep <50ms
- `src/components/` — React UI only, no AI in frontend
- `src-tauri/` — Rust backend, Tauri shell, future ANE/DirectML inference
- `extensions/chrome/` — MV3 extension talking to `ws-bridge.ts`
- `bench/` — realtime latency benchmark (CI gate)
- `models/registry.json` — model catalog

## How to Contribute

1. Fork + branch: `git checkout -b feat/my-fix`
2. Keep realtime path <50ms — run `npm run bench` before PR
3. `npx tsc --noEmit` must pass
4. Commit with conventional commits: `feat:`, `fix:`, `docs:`, `perf:`
5. PR against `main` — CI runs latency gate

## Good First Issues

- Improve `src/engine/spell.ts` dictionaries
- Better `diff.ts` word-level rendering
- Extension support for Firefox / Safari
- Model download resume UX in `ModelManagerModal.tsx`

## Code of Conduct

Be respectful. No telemetry, no data exfiltration PRs will be accepted. Privacy-first.

## License

By contributing you agree your contributions are Apache 2.0.
