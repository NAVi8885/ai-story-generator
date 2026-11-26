# Engineering Highlights & Architectural Deep-Dives

This document examines the core systems engineering problems solved in **Mythos Studio**, the design choices and trade-offs behind each implementation, and direct links to the verified source modules.

---

## 1. Zero-Cost Multi-Provider Inference Waterfall & SSE Stream Sanitizer

### Problem
Free-tier hosted LLM APIs enforce strict per-minute token quotas (`HTTP 429`), vary in native reasoning-token schemas (`delta.reasoning` vs. inline `<thinking>` blocks), and often emit noisy planning preambles (*"We need to write..."*, *"Outline:"*, *"Here is the story:"*) or truncated boundary tags (`[STORY_START]`, `[STORY_END]`) when streamed chunk-by-chunk over slow or fluctuating connections. Missing `</thinking>` tags on mid-stream truncation previously risked swallowing the entire narrative into the scratchpad.

### Implementation
- **Priority Waterfall & Intra-Provider OTPM Failover** ([`inferenceRouterService.js`](../backend/services/inferenceRouterService.js), [`groqProvider.js`](../backend/services/providers/groqProvider.js)):
  - Dynamically builds an ordered execution chain: optional per-request BYOK keys (`x-byok-*`) → server environment keys → built-in zero-auth fallback (`Pollinations`, `https://text.pollinations.ai/`).
  - Within Groq, primary inference on `qwen/qwen3.8-27b` (`max_tokens` capped at `1300`) intercepts `HTTP 429` OTPM exhaustion and retries immediately on `allam-2-7b` (`max_tokens` up to `2048`) before escalating to Google Gemini (`gemini-1.5-flash`), OpenRouter (`meta-llama/llama-3.3-70b-instruct:free`), Hugging Face Router (`Qwen/Qwen2.5-72B-Instruct`, `6000ms` abort guard), or Pollinations.
  - Shared OpenAI-compatible stream parsing in [`sseStreamParser.js`](../backend/services/providers/sseStreamParser.js) eliminates duplicate `ReadableStream` / `TextDecoder` loops across providers while extracting `delta.reasoning`.
- **Two-Stage Real-Time Delimiter & Preamble Sanitizer** ([`backend/models/storyModel.js`](../backend/models/storyModel.js#L761-L996), [`frontend/src/models/streamModel.js`](../frontend/src/models/streamModel.js#L48-L176)):
  - **Unclosed-Thinking Rescue**: If `<thinking>` opens without a closing `</thinking>`, the arrival of `[STORY_START]` automatically terminates the reasoning capture and releases subsequent text as clean reader prose.
  - **Trailing Partial-Tag Withholding**: Suffix matching checks trailing characters against `['[STORY_START]', '[STORY_END]', '[BRANCH_CHOICES]', '[/BRANCH_CHOICES]', '</thinking>']` so partial chunks like `[STOR` never flash on screen while waiting for the next TCP frame.
  - **Conversational Preamble Stripping & Legitimate Prose Shield**: `stripLeadingPreamble()` routes planning chatter (`We need to write...`, `Outline:`, `Let's plan`, `Here is the story:`) into the Blueprint drawer while explicitly sparing valid opening fiction lines such as `"All right, Evan thought..."` or `"Plan B was in motion."`.
  - **Deterministic Branch Fallback**: `parseStoryStreamOutput()` extracts `[BRANCH_CHOICES]...[/BRANCH_CHOICES]`, recovers unwrapped numbered lists after `[STORY_END]`, and supplies 3 distinct plot trajectories whenever a model omits choices cleanly.

### Trade-offs
- Maintaining an identical pure sanitizer (`sanitizeStreamBuffer` + `sanitizeClientStreamBuffer`) on both server and client adds minor duplication across deployment boundaries in exchange for **zero-dependency browser bundling** and resilient frame recovery even when network buffers re-chunk SSE deltas.
- Once `hasEmittedContent` becomes `true`, the router concludes rather than failing over to a second LLM mid-paragraph, favoring narrative coherence over stitched dual-model output.

---

## 2. 19-Dial Narrative Craft Compiler & Cross-Constraint Conflict Harmonizer

### Problem
Exposing 19+ orthogonal narrative parameters (`pov`, `tense`, `dialogueRatio`, `proseStylist`, `conflictType`, `dramaticStakes`, `endingTurn`, `sensoryAnchor`, `environmentalMood`, `visceralIntensity`, `protagonistState`, `unreliableNarrator`, `moralAlignment`, `creativity`, `strictness`, `tone`, `pacing`, `targetLength`, `thinkingDepth`) plus 4 user-authored Feature Station payloads creates two failure modes: (a) contradictory prompt instructions that confuse smaller models, and (b) prompt/delimiter injection via user-supplied station text fields.

### Implementation
- **Prompt Assembly & Conflict Harmonization** ([`compileNarrativePayload`](../backend/models/storyModel.js#L381-L759), `resolveConflicts` lines `328–357`):
  - Resolves conflicting parameter combinations dynamically before emission:
    1. High `creativity >= 1.1` + high `strictness >= 80` → restricts invention strictly to language/metaphor while locking canon facts.
    2. `unreliableNarrator !== 'off'` + `pov === 'third_omniscient'` → subordinates objective omniscience to an editorializing, biased lens.
    3. `dialogueRatio === 'dialogue_heavy'` + `pacing === 'slow-burn'` vs. `'action'` → switches between subtext-heavy pauses and urgent fractured combat banter.
    4. High `visceralIntensity >= 4` + light/whimsical `tone` → channels intensity into kinetic narrow escapes and physical stakes rather than grim mortal trauma.
- **Architectural Pre-Flight Checklist & Delimiter Isolation**:
  - When `thinkingDepth !== 'off'`, emits `[NARRATIVE PRE-FLIGHT ARCHITECTURE]` inside `<thinking>` so reviewers and writers can audit whether every active POV, dial, location hazard, catalyst wildcard, and lore lock was acknowledged prior to prose generation.
  - `sanitizeStationField()` and `sanitizeChecklistField()` strip newline-breaking sequences and contiguous or word-attached delimiter injections (`<thinking>`, `[STORY_START]`, `[STORY_END]`, `[BRANCH_CHOICES]`) before prompt interpolation.

### Trade-offs
- Structured markdown prompt blocks (`# ROLE & IDENTITY`, `# NARRATIVE PERSPECTIVE & VOICE`, `# PINNED LORE MICRO-LOCKS`, etc.) increase system prompt size (`~450–900` tokens in Master mode), deliberately spending modest prompt budget upfront to minimize plot drift and out-of-character hallucinations in free-tier models.

---

## 3. Sub-2s Saga Continuation Synthesizer with Deterministic Heuristic Fallback

### Problem
Sequential chapter writing stalls if authors must wait `10–20s` for an LLM just to draft Chapter `N+1` premise options—or breaks completely when rate-limited or offline. Conversely, concatenating entire prior chapters blows past free-tier context windows and encourages repetitive recaps.

### Implementation
- **Context Bounding & Strict `1800ms` SLA Race** ([`promptCompilerService.js`](../backend/services/promptCompilerService.js#L16-L117), [`storyController.js`](../backend/controllers/storyController.js#L45-L87)):
  - `compileContinuationPromptPayload` normalizes 0-based or 1-based chapter arrays (`normalizeChapterExtraction`), extracts a bounded tail (`prose.slice(-1800)`), appends a concise `formatStoryBibleSummary`, and forces structured JSON output (`{ suggestedPrompt, suggestedHooks[3] }`).
  - An `AbortController` races the upstream LLM call with `timeoutMs = 1800`. Any abort, timeout, HTTP error, or non-conforming JSON triggers `synthesizeHeuristicContinuationHooks` instantly.
- **Genre-Aware Offline Fallback** ([`backend/models/storyModel.js`](../backend/models/storyModel.js#L1129-L1222)):
  - Extracts the latest character/entity anchor from Story Bible or closing prose sentences and builds **3 contrasting trajectories** (*Action & Peril Escalation*, *Investigation & Hidden Truth*, *Moral Compromise & Gamble*) tailored across 7 genres (`fantasy`, `scifi`, `cyberpunk`, `horror`, `mystery`, `romance`, `custom`) in **sub-millisecond time** (benchmarked at **`0.004ms` per call** across 50 iterations in the SLA suite).

### Trade-offs
- Setting a strict `1800ms` cutoff prioritizes UI responsiveness over waiting on slow cold-start models; offline or congested runs smoothly degrade to schema-identical heuristic trajectories that can still be edited before streaming Chapter `N+1`.

---

## 4. Six Browser-Native Studio Feature Stations

Each Studio Station combines lightweight deterministic client/server algorithms with prompt compiler integration and persistent reducer storage (`stationModel.js`):

| Station | Core Engineering Mechanism | Primary Modules |
|---|---|---|
| **1. Dramatis Personae** | Weighted dialogue-attribution regex scoring (`+2` frontend with `35` `DIALOGUE_VERBS`; `+3` / `+4` titled backend) + non-stopword capitalized entity detection; active POV character injects a strict `[FOCAL POV CHARACTER]` Lens Mandate into the compiler. | [`castExtractor.js`](../frontend/src/utils/castExtractor.js), [`proseAuditorService.js`](../backend/services/proseAuditorService.js), [`DramatisPersonaeStation.jsx`](../frontend/src/components/stations/DramatisPersonaeStation.jsx) |
| **2. Plot Catalyst & Dice** | 6 narrative disruption archetypes (`Ticking Clock`, `Betrayal`, `Sensory Anomaly`, `Forbidden Revelation`, `Mechanical Failure`, `Unwelcome Guest`) × 5 clamped severity tiers (`30` specific complications) supporting deterministic `seed` / `diceRoll` or random rolls. | [`narrativeDice.js`](../frontend/src/utils/narrativeDice.js), [`PlotCatalystStation.jsx`](../frontend/src/components/stations/PlotCatalystStation.jsx) |
| **3. Scene Illustrator** | 5 curated art style presets with positive/negative prompts (`IMAGE_STYLE_PRESETS`), `8s` LLM visual extraction (`POST /api/image/extract-scene-prompt` + heuristic fallback), and 3-tier generation: Hugging Face SDXL (`12s` abort) → Pollinations (`15s` abort + MIME check) → sanitized Base64 SVG (`generateFallbackDataUrl`). | [`imageService.js`](../backend/services/imageService.js), [`imageModel.js`](../backend/models/imageModel.js), [`SceneIllustratorStation.jsx`](../frontend/src/components/stations/SceneIllustratorStation.jsx) |
| **4. Audio Theater** | Paragraph-by-paragraph `SpeechSynthesisUtterance` pipeline with character-offset `onboundary` sentence tracking (`tokenizeSentences`, `mapCharIndexToSentence`) plus a **zero-asset procedural Web Audio API synthesizer** (pink noise buffers, bandpass ember crackles, `0.18 Hz` / `0.08 Hz` LFO filters, `55 Hz` / `55.45 Hz` / `27.5 Hz` stacked oscillators). | [`audioController.js`](../frontend/src/controllers/audioController.js), [`ambientAudio.js`](../frontend/src/utils/ambientAudio.js), [`AudioTheaterStation.jsx`](../frontend/src/components/stations/AudioTheaterStation.jsx) |
| **5. Location & Lore Codex** | 6 structured physical anchors (setting, terrain, hazards, lighting, temperature, faction) + **double-enforced max-2 active Lore Micro-Locks** (auto-deactivating excess locks in `stationReducer` and `.slice(0, 2)` in `compileNarrativePayload`) to prevent instruction overload. | [`stationModel.js`](../frontend/src/models/stationModel.js#L309-L340), [`LocationCodexStation.jsx`](../frontend/src/components/stations/LocationCodexStation.jsx) |
| **6. Literary Auditor & Prose Radar** | Single-pass deterministic engine evaluating **298 sensory terms** (`84` visual, `69` tactile, `78` auditory, `67` olfactory/gustatory), quoted dialogue ratio, **35 regex AI cliché patterns** with replacement hints, Flesch-Kincaid Grade Level, Flesch Reading Ease, and sentence-length burstiness (`stdDev / mean`). | [`proseAuditModel.js`](../backend/models/proseAuditModel.js), [`literaryAuditor.js`](../frontend/src/utils/literaryAuditor.js), [`LiteraryAuditorStation.jsx`](../frontend/src/components/stations/LiteraryAuditorStation.jsx) |

---

## 5. Security Hardening & Production Bundle Architecture

- **CR/LF `.env` Injection Prevention** ([`settingsModel.js`](../backend/models/settingsModel.js#L18-L89)): `sanitizeEnvValue()` strips `\r` and `\n` sequences before updating `.env`, preventing forged keys (e.g., `gsk_abc\nPORT=9999`) from appending arbitrary directives; `validateAndApplyProviderKeys()` rejects non-string types with `HTTP 400`.
- **SVG XSS Neutralization** ([`imageModel.js`](../backend/models/imageModel.js#L47-L56)): `sanitizeSvgText()` strips `[<>&"]` and bounds string length before interpolating fallback scene prompts/styles into SVG XML markup.
- **Transport & Origin Controls** ([`app.js`](../backend/app.js#L13-L32)): Enforces `express.json({ limit: '2mb' })` alongside CORS origin validation permitting loopback interfaces and explicit `FRONTEND_URL` in production.
- **Deterministic Vite Chunking** ([`vite.config.js`](../frontend/vite.config.js)): Splits React runtime (`vendor-react`: `133.92 kB` / `43.13 kB` gzip) and Lucide icons (`vendor-icons`: `51.83 kB` / `12.47 kB` gzip) from application code (`197.97 kB` / `52.35 kB` gzip) + minified CSS (`79.95 kB` / `12.90 kB` gzip) across `2071` transformed modules in `2.34s`.
