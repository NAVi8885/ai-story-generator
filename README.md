# Mythos Studio — AI Story Generator & Multi-Chapter Saga Suite

> **Project Started:** January 27, 2026  
> **Architecture:** Full-Stack MVC (React 18 + Vite Frontend | Node.js + Express Backend)  
> **Inference:** Zero-Cost Multi-Provider Streaming Waterfall with Optional BYOK

Mythos Studio is an editorial AI fiction workstation that transforms brief story sparks into multi-chapter sagas with fine-grained narrative craft controls, real-time Server-Sent Event (SSE) token streaming, Chain-of-Thought blueprint isolation, procedural plot catalysts, scene illustration, synchronized voice & ambient audio theater, and algorithmic prose diagnostics.

---

## Project Genesis & AI-Driven Evolution

### Origins — Baseline v1.0 (Started January 27, 2026)

When development began on **January 27, 2026**, the project was a minimal single-file proof-of-concept built around a single blocking inference call:

- **Single-Provider Lock-In**: The backend (`huggingface.js`) depended solely on `@huggingface/inference` (`mistralai/Mixtral-8x7B-Instruct-v0.1`) and failed immediately unless a `HUGGINGFACE_API_KEY` was configured in `.env`.
- **Blocking Synchronous Request Flow**: Only one REST endpoint (`POST /api/generate`) existed—no streaming output, no abort/cancellation support, no rate-limit failover, and no provider telemetry.
- **Static Prompt Wrapper**: A 43-line `promptEngineering.js` template injected a single generic system prompt with zero tunable parameters for point of view, tense, pacing, conflict structure, or continuity memory.
- **Minimal 3-Component UI**: The React frontend (`App.jsx`, `PromptInput.jsx`, `LoadingIndicator.jsx`, `StoryOutput.jsx`) consisted of a single textarea, a submit button, a spinner, and an output card with a clipboard copy button—without state persistence, chapter pagination, or automated tests.

### How AI-Assisted Engineering Transformed the Project (v2.0 → v3.0 MVC)

Through iterative AI-assisted architecture, automated refactoring, and adversarial testing workflows, the codebase evolved from a single-prompt wrapper into a modular **Model-View-Controller (MVC)** studio application:

| Engineering Dimension | Initial Baseline (Jan 27, 2026) | Current Architecture (Mythos Studio v3.0 MVC) |
|---|---|---|
| **Architecture Pattern** | Monolithic route & single-file React state | Explicit **MVC separation** (`models/`, `views/`, `controllers/`, `routes/`, `services/`) across both backend and frontend |
| **Inference Reliability** | Single Hugging Face model (`Mixtral-8x7B`), hard API key requirement | **5-tier streaming waterfall**: Groq (`Qwen 3.8 27B` / `Allam 2 7B`) → Google Gemini Flash → OpenRouter `:free` → Hugging Face → Zero-Auth Pollinations fallback, with automatic `HTTP 429` failover & BYOK |
| **Streaming & Sanitization** | Blocking JSON response | Real-time **SSE streaming** with 12s keep-alive heartbeats, `AbortController` cancellation, `<thinking>` isolation, `[STORY_START]`/`[STORY_END]` boundary delimiters, and preamble stripping |
| **Narrative Control Engine** | 1 static system prompt (43 lines) | **19+ Narrative Craft Dials** across 5 accordions, 5 Master Style Presets, cross-dial conflict harmonization, and `[NARRATIVE PRE-FLIGHT ARCHITECTURE]` checklists |
| **Saga Continuity** | Single-shot standalone text | **Per-chapter data model** (`{ number, title, content, thinking, timestamp }`), paginated Book Reader, Story Bible canon lock, and `POST /api/generate-next-chapter-prompt` (`<1800ms` LLM timeout + `<2ms` heuristic fallback) |
| **Creative Studio Stations** | None | **6 integrated Studio Stations**: Dramatis Personae, Plot Catalyst Dice, Scene Illustrator, Audio Theater (Web Speech + Web Audio), Location & Lore Codex, and Literary Auditor |
| **UI & Reading Experience** | Basic glass card with Copy button | 3-pane Obsidian/Sepia/Light editorial studio, typography controls, Distraction-Free Focus Mode, Narrative Blueprint drawer, Chronicle history, and Markdown/JSON export |
| **Quality Assurance** | Zero automated tests | Comprehensive automated unit, contract, E2E saga, and Tier-5 adversarial stress test suites + production Vite bundle checks |

---

## Core Capabilities

### 1. Zero-Cost Multi-Provider Inference Waterfall
- Runs **out of the box with zero API keys** via the built-in zero-auth engine (`Pollinations`).
- Automatically routes through configured or **BYOK (Bring Your Own Key)** providers in priority order:
  1. **Groq** (`qwen/qwen3.8-27b`, automatic `429` OTPM fallback to `allam-2-7b`)
  2. **Google Gemini** (`gemini-1.5-flash`)
  3. **OpenRouter** (`meta-llama/llama-3.3-70b-instruct:free`)
  4. **Hugging Face Router** (`Qwen/Qwen2.5-72B-Instruct` or custom `HF_MODEL`)
  5. **Pollinations Zero-Auth Fast Engine** (`openai` streaming endpoint)
- Includes live API key validation (`POST /api/settings/validate-key`) and safe `.env` + `localStorage` persistence (`POST /api/settings/save-keys`).

### 2. Master Narrative Craft Engine
- **Foundations & Genre**: 7 genre presets (Fantasy, Sci-Fi, Horror, Mystery/Noir, Romance, Cyberpunk, Custom), Creativity dial (`0.2–1.4`), Canon Strictness (`10%–100%`), Tone (5 stops), Pacing (5 stops), Target Length (Flash/Short/Standard/Chapter), and Chain-of-Thought Blueprint Depth (`off`/`fast`/`balanced`/`deep`).
- **Voice & Perspective**: 1st / 2nd / 3rd Limited / 3rd Omniscient POV, Past vs. Present tense, Dialogue Density, and 5 Authorial Stylists (Terse, Lyrical, Hardboiled, Baroque, Cinematic).
- **Plot, Sensory & Psychology**: Conflict taxonomy, Dramatic Stakes, Ending Turns, Sensory Anchors, Environmental Mood, Visceral Realism (`1–5`), Protagonist Mental State, Unreliable Narrator filter, and Moral Alignment—with automatic cross-dial conflict resolution.

### 3. Six Integrated Feature Stations
1. **Dramatis Personae**: Interactive character roster cards (Protagonist, Foil, Antagonist, Ally), active POV lens toggle, tension gauges (`1–5`), and one-click cast extraction from prose.
2. **Plot Catalyst & Procedural Narrative Dice**: D6 procedural complications (Ticking Clock, Betrayal, Sensory Anomaly, Forbidden Revelation, Mechanical Failure, Unwelcome Guest) across severity levels `1–5` injected into scene prompts.
3. **Scene Illustrator**: Visual prompt extraction (`POST /api/image/extract-scene-prompt`), 5 curated art style presets, Hugging Face / Pollinations / local SVG fallback rendering (`POST /api/image/generate`), session gallery, and PNG/Data URL export.
4. **Audio Theater**: Browser-native Web Speech API narration (play, pause, resume, seek, voice selection, cadence, pitch) with sentence/paragraph read-along highlighting and procedural Web Audio API ambient soundscapes (Hearth Fire, Rain & Storm, Cosmic Drone).
5. **Location & Lore Codex**: Scene setting pins (landmark, terrain, hazards, lighting, temperature, faction) plus up to 2 immutable **Pinned Lore Micro-Locks** enforced during prompt compilation.
6. **Literary Auditor & Prose Radar**: Deterministic 4-pole sensory distribution radar (Visual, Tactile, Auditory, Olfactory/Gustatory), dialogue-to-narration ratio meter, 35-pattern AI cliché scanner with replacement suggestions, Flesch-Kincaid Grade/Reading Ease, and sentence burstiness diagnostics.

### 4. Multi-Chapter Saga Engine & Paginated Book Reader
- Isolated per-chapter storage (`{ number, title, content, thinking, timestamp }`) prevents chapter overwrites and vertical scroll concatenation.
- Top chapter navigation pills, bottom book pagination stepper (`Previous Chapter` / `Next Chapter`), Guided CTA Card, Continuation Guide Banner, and `<2s` SLA next-chapter premise synthesis (`POST /api/generate-next-chapter-prompt`).
- Full Story Bible canon memory drawer, local Chronicle history (with legacy v1 restoration), and Markdown (`.md`) / JSON (`.json`) export.

---

## MVC Architecture

Both the Express backend and the React frontend follow explicit Model-View-Controller boundaries:

```text
ai-story-generator/
├── package.json                               # Root orchestrator scripts (start, dev, build, test, verify:full)
├── .env.example                               # Documented environment template (no secrets committed)
├── LICENSE                                    # MIT License
│
├── backend/
│   ├── app.js                                 # Express composition root (CORS, JSON middleware, error handler)
│   ├── server.js                              # HTTP server bootstrapper & { app } export
│   ├── models/                                # [MODEL] Pure domain schemas, presets, sanitization & heuristics
│   │   ├── storyModel.js                      # Craft directives, prompt compiler, stream sanitizer, continuation hooks
│   │   ├── settingsModel.js                   # BYOK header extraction, CR/LF-safe .env persistence
│   │   ├── imageModel.js                      # Art presets, prompt builder, SVG fallback, visual heuristics
│   │   └── proseAuditModel.js                 # Sensory lexicons, cliché scanner, readability & cast heuristics
│   ├── views/                                 # [VIEW] Response presenters & SSE stream framing
│   │   └── streamView.js                      # SSE init, keep-alive heartbeats, event frames & JSON presenters
│   ├── controllers/                           # [CONTROLLER] Request validation & orchestration
│   │   ├── healthController.js
│   │   ├── settingsController.js
│   │   ├── storyController.js
│   │   ├── mediaController.js
│   │   └── analysisController.js
│   ├── routes/                                # [ROUTES] Declarative Express API router
│   │   └── apiRoutes.js
│   ├── services/                              # [SERVICES] External provider & AI orchestration adapters
│   │   ├── inferenceRouterService.js
│   │   ├── promptCompilerService.js
│   │   ├── imageService.js
│   │   ├── proseAuditorService.js
│   │   └── providers/                         # Groq, Gemini, OpenRouter, Hugging Face, Pollinations + shared SSE parser
│   ├── lib/                                   # Backward-compatible module re-export facades
│   └── tests/                                 # Backend unit, integration, SLA, adversarial & MVC tests
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                            # Root MVC container binding StoryProvider + StudioWorkspaceView
│       ├── models/                            # [MODEL] Client domain schemas, reducers & pure sanitizers
│       │   ├── storyModel.js
│       │   ├── stationModel.js
│       │   └── streamModel.js
│       ├── controllers/                       # [CONTROLLER] REST/SSE transport, media & Web Speech/Audio control
│       │   ├── storyController.js
│       │   ├── mediaController.js
│       │   └── audioController.js
│       ├── views/                             # [VIEW] Top-level workspace composition
│       │   └── StudioWorkspaceView.jsx
│       ├── context/                           # Slim React Context bridge connecting Models & Controllers to Views
│       │   └── StoryContext.jsx
│       ├── components/                        # Editorial UI views & 6 modular feature stations
│       └── utils/                             # Browser-safe utilities (auditor, cast extractor, dice, audio, presets)
│
└── tests/
    ├── e2e-saga.test.js                       # 4-tier opaque-box E2E saga verification suite
    └── tier5-adversarial-stress.test.js       # Concurrency, scaling, race immunity & boundary stress suite
```

---

## Quick Start

### Prerequisites
- **Node.js 18+** (`node -v`)
- **npm**

### 1. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure Environment (Optional)

The studio runs immediately with **zero keys configured** using the zero-auth engine. To connect optional free-tier cloud providers, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Environment variables supported in `.env`:
- `PORT` (default `3001`)
- `FRONTEND_URL` (default `http://localhost:5173`)
- `GROQ_API_KEY` (optional)
- `GEMINI_API_KEY` (optional)
- `OPENROUTER_API_KEY` (optional)
- `HUGGINGFACE_API_KEY` (optional)
- `HF_MODEL` (optional, defaults to `Qwen/Qwen2.5-72B-Instruct`)

### 3. Start Backend & Frontend

Terminal 1 (Backend API on `http://localhost:3001`):
```bash
npm start
```

Terminal 2 (Frontend Vite Dev Server on `http://localhost:5173`):
```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Server health check & active provider list |
| `GET` | `/api/providers/status` | Server-side provider configuration flags |
| `POST` | `/api/settings/save-keys` | Persist sanitized BYOK keys to runtime env & `.env` |
| `POST` | `/api/settings/validate-key` | Live credential verification (`groq`, `gemini`, `openrouter`, `huggingface`) |
| `POST` | `/api/enhance-prompt` | Expand short seed into sensory narrative premise |
| `POST` | `/api/generate/stream` | Real-time SSE token streaming with CoT & branch parsing |
| `POST` | `/api/generate` | Synchronous non-streaming generation endpoint |
| `POST` | `/api/generate-next-chapter-prompt` | Synthesize Chapter `N+1` prompt & 3 trajectory hooks (`<2s` SLA) |
| `POST` | `/api/image/generate` | Scene artwork generation (HF / Pollinations / SVG fallback) |
| `POST` | `/api/image/extract-scene-prompt` | Extract visual composition prompt from chapter prose (alias: `/api/image/extract-prompt`) |
| `POST` | `/api/cast/extract` | Extract Dramatis Personae roster from prose |
| `POST` | `/api/audit/prose` | Compute sensory radar, dialogue ratio, clichés & readability |

---

## Verification & Testing

Run the full verification suite (frontend production build + backend tests + frontend tests + root E2E & Tier-5 adversarial suites) from the repository root:

```bash
npm run verify:full
```

Or run individual targets:

```bash
npm run build           # Vite production bundle
npm run test:backend    # Backend unit, SLA, isolation & MVC tests
npm run test:frontend   # Frontend models, reducers, utilities & MVC tests
npm run test:e2e        # Root E2E saga & Tier-5 adversarial stress suites
```

---

## License

MIT License — see [LICENSE](LICENSE) for full details.
