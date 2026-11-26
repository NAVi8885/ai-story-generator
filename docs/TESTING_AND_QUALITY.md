# Testing Strategy & Quality Verification Report

**Mythos Studio** is verified continuously across a **215-test automated suite** organized into **16 test files** spanning **5 adversarial testing tiers**, paired with production **Vite bundle validation** and a smoke pipeline script. Every automated test runs deterministically using Node.js’s native test runner (`node --test`) without requiring live paid API keys.

---

## Verification Summary (Latest Run)

| Verification Layer | Command | Test Files | Suites / Cases | Result | Duration |
|---|---|---|---|---|---|
| **Frontend Production Bundle** | `npm run build` | Vite 5 (`2071` modules) | App (`197.97 kB` / `52.35 kB` gzip) + `vendor-react` (`133.92 kB`) + `vendor-icons` (`51.83 kB`) + CSS (`79.95 kB`) | **Passed** | `2.34s` |
| **Backend MVC & Pipeline Suites** | `npm run test:backend` | `8` files (`backend/tests/`) | `25` suites, **`93`** test cases | **`93` pass / `0` fail / `0` skip** | `8.70s` |
| **Frontend MVC & Station Suites** | `npm run test:frontend` | `6` files (`frontend/tests/`) | `26` suites, **`73`** test cases | **`73` pass / `0` fail / `0` skip** | `0.17s` |
| **Root E2E & Tier-5 Stress Suites** | `npm run test:e2e` | `2` files (`tests/`) | `11` suites, **`49`** test cases | **`49` pass / `0` fail / `0` skip** | `0.80s` |
| **Full Automated Verification** | `npm run verify:full` | **`16` test files + Vite build** | **`62` suites, `215` tests** | **`215` pass / `0` fail / `0` skip** | **~12.0s** |

---

## Five-Tier Adversarial Testing Methodology

Instead of isolated happy-path unit checks alone, the test suites follow a structured progression:

1. **Tier 1 — Feature Coverage**: Validates every exported contract, genre preset, style preset, craft dial, studio reducer action, stream delimiter rule, and REST endpoint.
2. **Tier 2 — Boundary & Corner Cases**: Exercises empty strings, `null` payloads, single-word inputs, index out-of-bounds clamping (`-5`, `99`), partial UTF-8/SSE chunk splits (`<think`, `[STOR`), strict `< 2000ms` SLA latency (`1800ms` abort cutoff), and sub-millisecond (`< 2ms`) offline fallback execution.
3. **Tier 3 — Pairwise Cross-Feature Interactions**: Tests combinations across subsystems—for example, Chapter 2 streaming preserving Chapter 1 immutability, switching chapters cancelling Web Speech narration cleanly, max-2 Lore Micro-Lock caps under toggle sequences, and all $2^4 = 16$ Feature Station pin permutations into `compileNarrativePayload()`.
4. **Tier 4 — Real-World Saga Workloads**: Simulates multi-chapter High-Fantasy, Cyberpunk Heist, and Cosmic Gothic authoring sessions, including legacy v1 single-story chronicle migration into paginated chapters and Story Bible continuity injection.
5. **Tier 5 — Adversarial Stress, Concurrency & Hardening**: Fires **30 simultaneous concurrent requests** to `/api/generate-next-chapter-prompt` under latency constraints, stresses **20+ to 50 chapter** state scaling for heap stability, runs **500 rapid pseudo-random chapter switches**, tests **100 KB** payloads against the `1800`-char tail slice bound, and verifies resistance against delimiter smuggling and `.env` CR/LF injection.

---

## Complete Test Suite Inventory (16 Files)

### Backend Suites (`backend/tests/` — 8 Files, 93 Cases)

| Test File | Lines | Scope & Engineering Properties Verified |
|---|---:|---|
| [`mvc-architecture.test.js`](../backend/tests/mvc-architecture.test.js) | `133` | Express MVC wiring (`createApp()`), `/api/health`, dual `/api/image/extract-scene-prompt` + `/api/image/extract-prompt` routes, `/api/audit/prose`, HTTP `400` validation guards, `sanitizeEnvValue` CR/LF `.env` injection defense, `ImageModel` determinism |
| [`promptCompiler-craft.test.js`](../backend/tests/promptCompiler-craft.test.js) | `170` | All 19 Master Narrative Craft directives, conflict harmonization (`resolveConflicts`), `LENGTH_PROFILES` token budgets, `MASTER_STYLE_PRESETS` compilation |
| [`promptCompiler-stations.test.js`](../backend/tests/promptCompiler-stations.test.js) | `627` | All $2^4 = 16$ Feature Station combinations (Cast, Location, Catalyst, Lore), delimiter smuggling sanitization (`sanitizeStationField`, `sanitizeChecklistField`), max-2 lore rule capping, active POV enforcement |
| [`story-isolation.test.js`](../backend/tests/story-isolation.test.js) | `164` | Unclosed `<thinking>` rescue on `[STORY_START]`, partial trailing delimiter withholding (`[STOR`), multi-block preamble extraction (`stripLeadingPreamble`), protection of valid fiction lines starting with `"All right..."` / `"Plan B..."` |
| [`saga-continuation.test.js`](../backend/tests/saga-continuation.test.js) | `410` | `normalizeChapterExtraction`, `formatStoryBibleSummary`, genre-specific continuation synthesis (`compileContinuationPromptPayload`), `POST /api/generate-next-chapter-prompt` end-to-end contracts |
| [`saga-adversarial.test.js`](../backend/tests/saga-adversarial.test.js) | `341` | Pathological/undefined arguments, corrupted chapter arrays, non-JSON model output recovery, HTTP malformed payload resilience |
| [`challenger-sla-fallback.test.js`](../backend/tests/challenger-sla-fallback.test.js) | `470` | Empirical latency SLA under `< 2000ms`, `1800ms` injected stall abort recovery (`~835ms` / `~301ms` tests), client socket abort cancellation, anti-repetition guardrails, heuristic speed (`0.004ms`/call) |
| [`image-generator.test.js`](../backend/tests/image-generator.test.js) | `337` | 5 `IMAGE_STYLE_PRESETS`, `buildEnhancedPrompt`, Hugging Face BYOK → Pollinations → `generateFallbackDataUrl` Base64 SVG fallback chain, `sanitizeSvgText` XSS stripping, visual scene extraction fallback |

### Frontend Suites (`frontend/tests/` — 6 Files, 73 Cases)

| Test File | Lines | Scope & Engineering Properties Verified |
|---|---:|---|
| [`mvc-architecture.test.js`](../frontend/tests/mvc-architecture.test.js) | `146` | `storyModel.js` chapter normalization & Markdown/JSON exports, `stationModel.js` reducer & session JSON roundtrip, `streamModel.js` BYOK header assembly & `tokenizeSentences`, `mediaController.js` `/api/image/extract-scene-prompt` contract |
| [`storyContext-saga.test.js`](../frontend/tests/storyContext-saga.test.js) | `215` | Canonical Chapter schema conformance, `clampChapterIndex` bounds (`isGenerating` true vs. false), legacy v1 history upgrade (`normalizeRestoredHistoryEntry`), client offline next-chapter synthesis |
| [`storyContext-state.test.js`](../frontend/tests/storyContext-state.test.js) | `690` | 6-station reducer isolation, `localStorage` corrupt-JSON resilience (`safeLoadState`/`safeSaveState`), max-2 active lore lock enforcement, audio cadence/pitch/volume clamping, sentence boundary index mapping (`mapCharIndexToSentence`) |
| [`castExtractor.test.js`](../frontend/tests/castExtractor.test.js) | `367` | Quoted dialogue attribution scoring (`+2`), stop-word filtering (`COMMON_STOP_WORDS`), role/tension ordering (`Protagonist` → `Foil` → `Antagonist` → `Ally`), empty/unicode prose safety |
| [`narrativeDice.test.js`](../frontend/tests/narrativeDice.test.js) | `344` | All 6 complication archetypes × 5 severity tiers (`30` complications), deterministic `seed`/`diceRoll` generation, severity bounds clamping (`clampSeverity`), prompt block formatting (`formatCatalystDirective`) |
| [`literaryAuditor.test.js`](../frontend/tests/literaryAuditor.test.js) | `259` | 4-pole sensory distribution across `298` lexical cues, quoted dialogue vs. narration percentage, `35` AI cliché matches & suggestions, Flesch-Kincaid Grade/Ease math, burstiness cadence classification |

### Root E2E & Adversarial Stress Suites (`tests/` — 2 Files, 49 Cases)

| Test File | Lines | Scope & Engineering Properties Verified |
|---|---:|---|
| [`e2e-saga.test.js`](../tests/e2e-saga.test.js) | `1,369` | 4-tier opaque-box integration suite covering 15 multi-chapter workflows (`F1–F15`), backend-to-frontend stream + state parity, chapter switching audio cancellation, legacy saga continuation |
| [`tier5-adversarial-stress.test.js`](../tests/tier5-adversarial-stress.test.js) | `536` | 30 concurrent `/api/generate-next-chapter-prompt` burst load under `2000ms` SLA, 25–50 chapter heap stability, 500 rapid pseudo-random chapter switches, delimiter contamination immunity, 100 KB payload truncation bounds |

---

## Reproducible Verification Commands

```bash
# 1. Full build + all 215 tests (identical to GitHub Actions CI)
npm run verify:full

# 2. Targeted suites
npm run build           # Production Vite bundle into frontend/dist/
npm run test:backend    # 93 backend MVC, SLA, compiler & image tests
npm run test:frontend   # 73 frontend model, reducer & station tests
npm run test:e2e        # 49 root E2E saga & Tier-5 adversarial stress tests

# 3. Live HTTP SSE smoke pipeline (requires running backend on :3001)
npm --prefix backend run smoke
```

- Automated CI runs on every push and pull request to `main` across Node.js `20.x` and `22.x` via [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
