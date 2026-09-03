# Writely vs Grammarly — Deep Gap Analysis & Build Roadmap
**Research date:** 3 Sep 2026 | **Sources:** `grammarly.com/features`, `/grammar-check`, `/plans`, `/plagiarism-checker`, `/citations`, `/business/*`, `support.grammarly.com` (Goals, Domains, Tone, Go, Docs), web search 2026 review cycle | **Writely audit:** `src/*`, `src-tauri/*`, `extensions/*`, `bench/*` (see §2)

---

## 1. Grammarly — Complete Feature Catalog (2026)

Grouped by *capability*, not marketing page. Tier tags: **F**=Free, **P**=Plus/Pro ($12–30/mo, 2k prompts), **E**=Enterprise/Business ($15–33/user/mo), **Edu**=Education.

### A. Core Correctness (the Grammarly promise)
| # | Feature | Tier | What it does completely |
|---|---------|------|--------------------------|
| A1 | **Grammar** — 400+ rules: subject-verb, articles, prepositions, pronouns, tense, conditionals, comparisons, conjunctions | F | Inline underline, explain + fix |
| A2 | **Spelling** — typo + contextual (their/there, than/then) | F | |
| A3 | **Punctuation** — comma, semicolon, apostrophe, ellipsis, period, colon, hyphen, quotes | F | |
| A4 | **Commonly confused words** | F | |
| A5 | **Fluency** — ESL-specific rephrasing for non-native speakers | P | |
| A6 | **Inclusive language** | P | Flags non-inclusive terms + suggests alternative |

### B. Clarity & Style
| # | Feature | Tier | Notes |
|---|---------|------|-------|
| B1 | **Conciseness / wordiness** | F (basic) / P (full) | Remove filler, redundant phrases |
| B2 | **Clarity rewrites** — sentence splitting, jargon simplification | P |  |
| B3 | **Sentence variety / engagement** | P | Vary length/structure |
| B4 | **Vocabulary / word choice** | P | More precise / vivid synonyms |
| B5 | **Passive voice checker** | P (via domain) | Explicit toggle per domain |
| B6 | **Punctuation / sentence checker** — run-on, fragment, parallelism | P | |

### C. Tone & Intent
| C1 | **Tone detector** — identifies overall tone (formal, confident, friendly, etc.) with emoji radar | F (detect) | Shows tone at top of editor |
| C2 | **Tone suggestions** — sentence-level rewrite to target tone (formal↔friendly, confident, etc.) | P | Accept per sentence |
| C3 | **Goals personalization** — Audience (General/Knowledgeable/Expert) × Formality (Informal/Neutral/Formal) × Intent (Inform/Tell-a-Story/Convince/Describe) × Domain (General/Academic/Business/Email/Casual/Creative) | P | Tailors all suggestions; Academic flags contractions/passive/“I”, Casual ignores fragments/run-ons, Creative most permissive |
| C4 | **Brand Tones** (team voice profile) | E | Turn brand voice into tone profile, org-wide enforcement |

### D. Generative AI (the 2024–2026 expansion)
| D1 | **Full-paragraph / full-sentence rewrites** — one-click “Rewrite” | P | Paragraph-level blue sidebar |
| D2 | **Paraphraser** — creative/professional/you voice | P | Preserves ideas |
| D3 | **AI Chat / Compose** — brainstorm, outline, draft, reply from prompt, context-aware | P (100 prompts F, 2k P, unlimited E) |  |
| D4 | **Summarizer** (part of rewrite sidebar) | P | Shorten/longen |
| D5 | **Translator** — inline translation across 19 languages + paragraph rewrites in lang | F/P |  |
| D6 | **Multilingual grammar** — 20+ languages (ES/FR/IT/DE/PT/TR/PL/NL/CS/UK/VI/HU/SV/RO/ID/SK/DA/FI/NO/TL/KO/HI/JA + EN dialects US/UK/AU/CA) | F/P | Grammar + spelling per language |

### E. Originality & Academic
| E1 | **Plagiarism checker** — 16B web pages + ProQuest academic DB, % similarity, source URLs, exact/near/structural match | P | Free only says “plagiarism found?” |
| E2 | **Auto-citations** — while browsing source sites, one-click APA/MLA/Chicago citation generated (Wikipedia, PubMed, arXiv, Springer, etc.) | F | From 20+ DBs |
| E3 | **Citation style formatting** — proofread existing citations (periods, parens) vs APA/MLA/Chicago latest editions | P | |
| E4 | **Citation Finder** (Docs agent) — verifies claims, finds reputable sources, inserts in-text citation + bibliography | P/E | |
| E5 | **AI Detector** — flags AI-generated text with % | P | |
| E6 | **AI Humanizer / AI Rewriter** — removes “AI tells” (robotic phrasing), alternatives less used by AI | P | |
| E7 | **Authorship** — tracks editing history (typed/pasted/AI/DB), replay + shareable transparency report for LMS (Blackboard/Canvas/Word) | Edu/P | Opt-in, preview before share |
| E8 | **AI Grader** — evaluates vs rubric, pre-grade + tips | Edu | |
| E9 | **Reader Reactions** — predicts how audience (teammate/teacher) will interpret content, key takeaways/questions | P | |
| E10 | **Essay Checker / Proofreader agent** | P | Structure + phrasing |

### F. Team / Business (the moat)
| F1 | **Style Guide** — upload full guide or add rules: brand terms (“Writely” not “writely”), banned words, Oxford comma, caps, numbers, abbreviations; org-wide real-time enforcement | E (Pro: 1 guide, Ent: unlimited) |
| F2 | **Knowledge Share** — hover jargon/acronym → definition + related docs + key people | E |
| F3 | **Snippets** — pre-approved templates, text shortcuts (`/refund` → paragraph) | E |
| F4 | **Analytics dashboard** — team + individual: correctness/clarity/engagement time series, ROI Report, Effective Communication Score | E |
| F5 | **Strategic suggestions** — what info to include/highlight for impact | P/E |

### G. Editor & Surface (Docs / Go / Mail / Superhuman suite)
| G1 | **Docs** — AI-native doc editor (Notion/Coda-like) with tables, charts, Kanban, forms, sync-page access control, agents panel | E |
| G2 | **Go** — proactive assistant that lives in every tab, uses active window context, connectors: Gmail/Outlook/Calendar, Drive, Jira, Asana, Notion, Salesforce, Zendesk, Slack | E |
| G3 | **Mail** — Superhuman Mail: inbox triage, Smart Send, follow-ups, AI that sounds like you | E |
| G4 | **Resume Builder**, Cover Letter Generator, etc. — vertical tools | F |

### H. Platform Coverage
| H1 | Browser: Chrome / Firefox / Edge / Safari + **Google Docs** + Gmail/Outlook Web + 1M+ sites | F/P/E |
| H2 | Desktop: Windows + Mac (Word, Slack, Teams, PowerPoint, Apple Mail, Notion, Figma, …) | |
| H3 | Mobile: iOS keyboard + Android keyboard + iPad | |
| H4 | MS Office add-in (Word/Outlook), Slack, PowerPoint specifically tested | |

### I. Utilities
| I1 | Word / character / paragraph / sentence counters | F |
| I2 | Personal dictionary (add word) | F |
| I3 | Goals-relative readability (per audience), engagement analytics | P |

> **Plan comparison (grammarly.com/plans)** confirms F: tone detection + 100 prompts; P: all rewrites + fluency + plagiarism + AI detector + 2k prompts + citations formatting; E: unlimited prompts + Go + Docs + style guide/brand tones/snippets/analytics + SSO/SCIM/BYOK/DLP/audit logs.

---

## 2. Writely — What Is Actually Built Today

Audited 48 files. Verdict: **high-fidelity functional prototype** that *claims* <50ms via neural engine but *implements* it via regex; Rust inference layer is scaffolding.

| Capability | Status | Evidence | Gap depth |
|------------|--------|----------|-----------|
| **Grammar (30 regex rules)** — SVA `he go→He goes`, `they is→they are`, `their are/over their`, `its a→it's a`, `your welcome`, `than/then`, `in order to→to`, capitalization | ✅ Real (regex tier) | `src/engine/grammar.ts:12-230` `GRAMMAR_RULES` | Shallow: ~30 rules vs Grammarly's 400+; no article/preposition/tense/comparison logic |
| **Spelling** — 68 common typos + 400-word dict + Levenshtein ≤1 + user dict via localStorage | ✅ Real (partial) | `src/engine/spell.ts:6-299` | Tiny lexicon (170k needed); no SymSpell; misses technical terms |
| **Punctuation** | ⚠️ Partial | Only via grammar rules (comma rules minimal) | No dedicated punctuation checker (semicolon/colon/ellipsis) |
| **Clarity / conciseness** | ⚠️ Thin | 3 rules `in order to/at this point/due to the fact that` + `clarityScore=100 - wps*0.8` | No sentence splitting, engagement, passive voice, variety |
| **Tone detector** | ❌ Stub | Only 2 Tone rules (`very unique`, `asap`) flagged as `tone` | No radar, no emoji, no analysis |
| **Tone suggestions (rewrite to target tone)** | ⚠️ Fake | `rewriter.ts:60-121` regex prepends/replaces (professional/friendly/concise/academic/casual) | Not LLM; no fluency, no inclusive language |
| **Goals (Audience×Formality×Domain×Intent)** | ❌ Missing | No UI, no state, no tailoring | Prompt’s biggest UX gap |
| **Full paragraph rewrite** | ❌ Mock | Simulated streaming `8ms/tok` | Needs real on-device model (Qwen) or BYOK |
| **Paraphraser** | ❌ Missing | — | Cover via rewrite tones |
| **Translator / multilingual** | ❌ Missing | English only + no dialect handling | Grammarly supports 20+ languages |
| **Plagiarism** | ❌ Missing | — | Black hole; offline-first must rethink |
| **Citations (auto + formatting)** | ❌ Missing | — | Academic moat |
| **AI Detector / Humanizer** | ❌ Missing | — | Can be local classifier |
| **Authorship / AI Grader / Reader Reactions** | ❌ Missing | — | Edu features low priority but differentiating |
| **Style Guide / Brand Tones** | ❌ Missing | WRITELY_PLAN mentions as $5/mo future | Business moat; requested |
| **Knowledge Share / Snippets / Analytics** | ❌ Missing | — | Business moat |
| **Docs / Go / Mail** | ❌ Missing | — | Superhuman suite; out of scope for Writely but vision to consider |
| **Browser extension** | ⚠️ Minimal | Badge count only, no inline underlines into Gmail/Notion/DOM | Needs content-script injection |
| **Desktop system-wide** | ❌ Scaffold | `src-tauri/src/main.rs:13` stub, no AX/UIA, no overlay | PLAN Phase 3 aspirational |
| **Mobile** | ❌ Missing | 1180×780 desktop window only | |
| **Personal dictionary** | ✅ Real | Full CRUD, export JSON | |
| **History / drafts** | ✅ Real | `writely_saved_drafts` dedup | |
| **Document stats** | ✅ Real | Flesch-Kincaid, grade, words, readingTime, clarity | Needs word/char/para/sent counters UI |
| **Latency HUD** | ✅ Real | <50ms pill, cache HIT/miss | |
| **Model catalog** | ⚠️ Simulated | `localModel.ts` fake progress, no download/SHA/mmap; BYOK OpenAI/Groq works, Anthropic/Gemini/Ollama partially wired | |
| **Settings** | ⚠️ Stub | Debounce slider wired, rule toggles are UI-only (not passed to `hybridEngine`) | |
| **Perf /** | ✅ Real | `bench/realtime_bench.ts` 6 cases, SLA gate <50ms hot, <150ms cold | Only benchmarks regex, not neural |

**Hard truth:** The `<50ms` SLA is *true for regex* (≈0.1–1ms) but not for the advertised GECToR/CoreML/ONNX neural stack. Rust `src-tauri/src/engine/realtime/gector.rs` etc. sketched in `WRITELY_PLAN.md:229-254` does not exist.

---

## 3. Gap Matrix — What to Build (priority × effort × offline fit)

Legend: **P0** blocker for “Grammarly alternative” credibility, **P1** competitive parity, **P2** delight/differentiation. **Offline fit:** ✅ local-first feasible, ⚠️ hybrid (local + opt-in BYOK), ☁️ must stay cloud.

| Gap | Tier in Grammarly | Priority | Offline fit | Effort | Offline-first design for Writely |
|-----|-------------------|----------|-------------|--------|----------------------------------|
| **G1. Real spell lexicon (170k) + contextual typo** | F | **P0** | ✅ | M | Replace 400-word Set with Hunspell/British+US dicts (10MB), bundle `en_US.dic` via WASM or Rust `symspell` crate; tri-gram context for there/their/than |
| **G2. Grammar expansion 30→200 rules** — articles, prepositions, tense consistency, comparisons, punctuation (comma/semicolon/colon), double negatives, subject-pronoun agreement | F/P | **P0** | ✅ | M | Local rule engine (LanguageTool XML port) or fine-tuned GECToR ONNX — keep regex but expand rule catalog 6×; wire Settings toggles |
| **G3. Inline extension (Gmail/Google Docs/Notion/Slack/Word)** | F | **P0** | ✅ | M | Rework `content.js` to inject wavy `<mark>` into page DOM (shadow DOM), mirror textarea overlay technique; add site adapters for Docs (canvas) vs plain editors |
| **G4. Goals — Audience×Formality×Domain×Intent** | P | **P0** | ✅ | S | 4-segment control in editor header + sidebar; Domain selects rule strictness (Academic flags contractions/passive/I-you, Casual ignores fragments). Store in `writely_goals`. |
| **G5. Passive voice + inclusive language + wordiness with explanations** | P | **P0** | ✅ | S | Add detectors (passive: `be + past participle` parse; inclusive: list 150 terms); surface as `clarity`/`tone` cards with “Why” explanation |
| **G6. Counters (word/char/para/sentence) + synonyms on right-click** | F | **P0** | ✅ | XS | Already computed — expose in DocumentStats; synonym lookup via offline WordNet (wn dict 2MB) or Datamuse proxy with local fallback |
| **G7. Tone detector (overall) + sentence tone suggestions (real)** | F/P | **P0** | ✅ | M | Train tiny 4-class classifier (formal/neutral/informal/confident) ~2MB ONNX, runs <5ms; replaces 2 regex rules. Show radar bar. Sentence rewrite via local Qwen0.5B *or* BYOK when offline unavailable. |
| **G8. True local inference (GECToR 45MB INT8 + Qwen0.5B)** | — | **P0** | ✅ | L | Rust `ort` + `llama.cpp` sidecar, mmap+warmup, feature-gated `mac/windows`. This is the credibility gap. Until then, ship with expanded regex + label “Neural engine (beta): enable in Models” transparently. |
| **G9. Plagiarism — offline rethink** | P | **P1** | ⚠️ | M | Offline can’t scan 16B web. Offer: (a) local **self-plagiarism** (n-gram fingerprint against `History` + uploaded docs) instantly, (b) **opt-in BYOK** checker via pluggable API (Copyscape/OpenAI search + Crossref) with “Run plagiarism (cloud)” button, clearly disclosed. Don’t fake offline web search. |
| **G10. Citations — generator + formatter** | F/P | **P1** | ✅ | M | Bundle `citeproc-js` + CSL styles (APA/MLA/Chicago) + Crossref lookup (online, cached) + manual entry form. Citation Finder agent = local claim extractor → Crossref search → insert. Works offline for manual + cached. |
| **G11. Translator (19 langs) + multilingual grammar** | F/P | **P1** | ⚠️ | L | Phase: EN full parity first; then ES/FR/DE via separate GECToR models. Local translator: Qwen or dedicated NLLB 200M Q4 per lang, downloaded on demand. Use same ModelCatalog pattern. |
| **G12. AI Detector + Humanizer** | P | **P1** | ✅ | M | Tiny detector: perplexity + burstiness classifier (RoBERTa 20MB) on-device <10ms; Humanizer is just a rewrite tone (“more human”). Ship locally. |
| **G13. Paraphraser / full-paragraph rewrite (real)** | P | **P1** | ⚠️ | M | Wire local Qwen0.5B via `server/ws-bridge` streaming to UI; BYOK fallback already partially done for OpenAI/Groq — add Anthropic/Gemini/Ollama wiring. |
| **G14. Style Guide + Snippets (team moat)** | E | **P1** | ✅ | M | Local JSON `styleRules: {terms: {Writely: caseSensitive}, bannedWords: [...], conventions: {oxfordComma:true}}` applied as regex layer before grammar. Snippets = `writely_snippets.json` with `/shortcut` expansion via inline suggestion. No server: team shares via file import/export (+ optional git sync). On-brand win without SaaS. |
| **G15. Knowledge Share (hover glossary)** | E | **P2** | ✅ | S | `writely_glossary.json` — hover any marked term shows definition + `related docs` links (local files). No Notion API needed. |
| **G16. Analytics (personal, not team surveillance)** | E | **P1** | ✅ | S | Personal dashboard: weekly words, top error types, clarity trend, time saved — all from local history; no org tracking. Privacy-respecting alternative to Grammarly Analytics. |
| **G17. Authorship transparency** | Edu | **P2** | ✅ | S | Track `typed/pasted/AI` per sentence in editor (already have history); generate local Authorship report HTML export. No LMS integration needed for v1. |
| **G18. Reader Reactions / AI Grader** | P/Edu | **P2** | ⚠️ | M | On-device LLM prompts with audience rubric; local inference. Lower priority. |
| **G19. Desktop system-wide overlay + mobile** | F | **P2** | ✅ | XL | Tauri AX/UIA capture + transparent overlay — PLAN Phase 3, permission-heavy. Defer until extension is perfect. Mobile keyboard out of scope for desktop app. |

### What Writely should *not* copy (and why it’s an advantage)

| Grammarly piece | Why Writely wins by *not* copying | Writely pitch |
|-----------------|-----------------------------------|---------------|
| Cloud telemetry + subscription gate on basic clarity/plagiarism | Privacy-first, offline, Apache 2.0 forever free. Premium gates tone/fluency — Writely gives it locally. | “Your keystrokes never leave your device. No $30/mo.” |
| Superhuman Go/Mail/Docs suite (Gmail/Calendar/Jira connectors) | Anti-feature for Writely’s audience that distrusts inbox scraping | Keep Writely **writing-focused**, not a surveillance agent. Docs = existing History + local markdown files. |
| Requirement to sign up to see suggestions | No account, no cloud document storage | Instant open → type → fix |

---

## 4. Implementation Roadmap — What to Ship (effort-sized)

### Phase 1 — Credibility fixes (1–2 weeks, ships to main, no new infra)
**Goal:** make the “Grammarly alternative” claim defensible without pretending to be neural.

1. **G4 Goals UI** — `src/components/GoalsBar.tsx` + wiring to `hybridEngine` (domain → rule enablement). Effort S.
2. **G2 Grammar expansion** — add 40 rules: articles (a/an), prepositions (in/on/at), tense, double negatives, comma semicolon, apostrophe possessive — expand `grammar.ts` to ~70 rules. Wire Settings toggles (they currently do nothing). M.
3. **G1 Lexicon** — import `hunspell-en` dict (or `typo-js` word list) → replace 400-word Set with 50k entries; keep Levenshtein but over full dict + tri-gram context. M.
4. **G5 Passive/inclusive/wordiness explainers** — enrich `Suggestion.explanation` with “Why” strings; surface in `SuggestionCard`. S.
5. **G6 Counters + synonyms** — expand `DocumentStats` to 2×3 grid + right-click synonym via offline WordNet JSON (2MB). XS.
6. **G7 Tone detector (rule-based v1)** — keyword radar (formal words, hedges, exclamation) + overall tone badge; sentence tone rewrite stays regex but labeled honestly. M.

> **Shim:** add SettingLabel “Neural engine (experimental)” that clearly states regex vs ONNX — avoids credibility loss while real engine lands.

### Phase 2 — Extension that actually competes (1 week)
7. **G3 Inline injection** — `extensions/chrome/content.js` → shadow-DOM wavy underlines for `textarea/input/contentEditable`; adapter for Google Docs approximation; keep badge fallback. M.

### Phase 3 — Local intelligence (2–3 weeks, needs Rust)
8. **G8 Real engine scaffolding** — Rust `ort` (GECToR) + `llama.cpp` sidecar, download/SHA/mmap, stream tokens to `ws-bridge`; feature-flag `src-tauri/Cargo.toml` (`mac=mlx, win=ort`). L.
9. **G13 Paraphraser real** — wire Qwen0.5B streaming + finish Anthropic/Gemini/Ollama cloud wiring (currently only OpenAI/Groq rewrites). M.
10. **G12 AI Detector/Humanizer** — on-device classifier (<10ms) + rewrite pass. M.

### Phase 4 — Academic / team moat that *can* be offline (1–2 weeks)
11. **G9 Plagiarism (hybrid)** — local n-gram self-check + opt-in cloud button. M.
12. **G10 Citations** — `citeproc-js` + Crossref lookup + manual entry + insert flow. M.
13. **G14 Style Guide + Snippets + Glossary** — local JSON rules engine, `/` expansion, hover definitions. M.
14. **G16 Personal Analytics** — weekly chart from history. S.

### Phase 5 — Optional differentiators
15. **G17 Authorship export** — HTML report from edit history. S.
16. **G18 Reader Reactions** — LLM rubric prompt. M.
17. **G11 Multilingual** — one language at a time via extra model in catalog. L (per lang).

---

## 5. Specific Next-File Changes (ready to implement)

- `src/engine/spell.ts:71-166` — swap `BASE_DICTIONARY` for `import enDict from './dict/en_US.json'` (50k).
- `src/engine/grammar.ts:12-230` — append `PASSIVE_RULES`, `INCLUSIVE_RULES`, `ARTICLE_RULES`; add `shouldApply(rule, goals)` guard.
- `src/types/index.ts:1-93` — add `type Goals = {audience:'general'|'knowledgeable'|'expert', formality:'informal'|'neutral'|'formal', domain:'general'|'academic'|'business'|'email'|'casual'|'creative', intent:'inform'|'describe'|'convince'|'tellStory'}`.
- `src/App.tsx:22` — lift `goals` state, pass to `analyzeDocument(text, goals)`.
- `extensions/chrome/content.js:7-95` — add `injectUnderlines(el, suggestions)` with shadow DOM + `MutationObserver` for Gmail/Notion.
- `src-tauri/Cargo.toml:8-26` — add `ort = {version="2.0", features=["directml"]}` gated by `windows`, `mlx-rs` gated by `mac`.
- New files: `src/components/GoalsBar.tsx`, `src/engine/toneDetector.ts`, `src/engine/styleGuide.ts`, `src/utils/citations.ts`, `public/dict/en_US.json`.

---

## 6. Bottom Line

Writely today is a **polished UI with a toy engine** that passes `<50ms` because the engine is trivial. Grammarly today is a **suite** (correctness + tone + goals + 20 languages + plagiarism/citations + Go/Docs/Mail + style guide/snippets/analytics + 1M integrations) with metered generative AI.

To be a credible open-source Grammarly alternative, Writely does **not** need to clone Go/Mail/Docs or scan 16B pages offline. It needs to:

1. **Make correctness real** (lexicon + 200 rules + Goals + passive/inclusive) — **P0, local**
2. **Make the extension truly inline** — **P0**
3. **Be honest about the neural engine** while scaffolding real ONNX/GGUF in Rust — **P0**
4. **Own the offline moat** — citations, snippets, style guide, detector, analytics **locally** where Grammarly forces cloud/subscription.

Implement Phases 1–2 first (2–3 weeks). That closes the credibility gap with zero infra. Phases 3–4 turn “alternative” into “superior for privacy.”

Want me to start Phase 1 now (Goals + 40 grammar rules + lexicon + counters)?
