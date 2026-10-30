# MythosAI — Zero-Cost Interactive AI Story Generator

> Transform story seeds into rich, multi-chapter sagas with granular narrative sliders, real-time token streaming, and an intelligent zero-cost inference waterfall.

---

## 🌟 Key Highlights

- **Zero-Cost Multi-Provider Inference Waterfall**:
  - Automatically rotates through free-tier providers: **Groq** (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`), **Google Gemini Flash** (`gemini-1.5-flash`), **OpenRouter** (`:free` models), and **Hugging Face**.
  - Built-in **Zero-Auth Fast Engine**: Runs immediately out-of-the-box with **no credit card, no billing, and zero API keys required**.
  - Automatic `HTTP 429` rate-limit detection and seamless provider failover.
  - Optional **BYOK (Bring Your Own Key)** settings drawer so visitors can bypass public rate limits.
- **Granular Narrative Control Matrix**:
  - **Creativity Dial (`0.2 – 1.4`)**: Maps to LLM `temperature`, `top_p`, and figurative vs. literal prose directives.
  - **Tone & Atmosphere (5 stops)**: Whimsical, Light, Balanced, Gritty, Dark Grimdark.
  - **Pacing & Detail Density (5 stops)**: Fast Action, Brisk, Dynamic, Atmospheric, Slow-Burn Lore.
  - **Prompt Strictness (`10% – 100%`)**: Enforces canon fidelity vs. creative extrapolation.
  - **Target Length (4 stops)**: Flash (~350w), Short (~650w), Standard (~1.2kw), Chapter (~2kw) with natural sentence boundary closure.
  - **Thinking / CoT Depth (4 stops)**: Generates a structured narrative blueprint (`<thinking>`) before prose drafting.
  - **Genre Presets**: One-click configuration for Fantasy, Sci-Fi, Horror, Mystery/Noir, Romance, Cyberpunk, and Custom.
- **High-Leverage Differentiator Features**:
  - **Real-Time Token Streaming**: SSE streaming with live telemetry (Words, Reading Time, Tokens/sec, Active Engine).
  - **Stop Generating Button**: Clean `AbortController` cancellation that halts the stream while preserving partial text.
  - **Interactive Story Branching**: Generates 2–3 distinct plot-fork choices at the end of each segment to steer multi-chapter sagas.
  - **Story Bible & Context Lock**: Slide-out drawer to pin character rosters, world rules/magic laws, and canon history into the prompt payload.
  - **Narrative Blueprint View**: Tab toggle between polished story prose and the model's internal Chain-of-Thought outline.
  - **Enhance Premise Button**: Auto-expands short or vague prompts into sensory narrative setups.
  - **Zero-Database Persistence & Export**: Auto-saves story chronicle to `localStorage` and exports to **Markdown (`.md`)** or **JSON (`.json`)**.
- **Liquid Glass Design System**:
  - Deep atmospheric background with animated ambient orbs.
  - Frosted glassmorphism panels, glowing slider tracks, responsive segmented buttons, and WCAG-compliant contrast.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MythosAI (React 18 + Vite)                      │
│                                                                        │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ NarrativeControlPanel  │  │ StoryBibleModal (Context Lock)       │  │
│  │ - 7 Param Sliders      │  │ - Characters, World Rules, Canon     │  │
│  │ - Genre Preset Chips   │  └──────────────────────────────────────┘  │
│  └────────────────────────┘                                            │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ PromptInput + Expander │  │ StoryViewer (Streaming + Branches)   │  │
│  │ - "✨ Enhance Premise" │  │ - Telemetry: WPM, reading time, tok/s│  │
│  │ - Quick Spark Chips    │  │ - Dual Tabs: Prose vs. Blueprint     │  │
│  └────────────────────────┘  │ - 2-3 Interactive Chapter Fork Cards │  │
│                              │ - Export (Markdown / JSON) & History │  │
│                              └──────────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ SSE POST /api/generate/stream
                                     │ (AbortController cancellation)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Express 4 Backend (Node.js)                      │
│                                                                        │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ PromptCompiler Layer   │  │ Multi-Provider Inference Router      │  │
│  │ - Sliders -> Prompts   │  │ 1. Groq (Llama 3.3 70B & 8B)         │  │
│  │ - Conflict normalizer  │  │ 2. Google Gemini Flash Free Tier     │  │
│  │ - CoT thinking blocks  │  │ 3. OpenRouter :free models           │  │
│  │ - Story Bible context  │  │ 4. Hugging Face Router               │  │
│  │ - Branch choices tag   │  │ 5. Zero-Auth Fast Engine (Zero Keys) │  │
│  └────────────────────────┘  └──────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js 18+** installed (`node -v`)

### 2. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment (Optional)
The application works **immediately with zero keys set** via the built-in fast engine.

To connect additional free-tier cloud providers, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Available free-tier keys (no credit card required):
```env
PORT=3001
FRONTEND_URL=http://localhost:5173

# Groq Free Tier: https://console.groq.com/
# GROQ_API_KEY=gsk_your_key_here

# Google Gemini Free Tier: https://aistudio.google.com/
# GEMINI_API_KEY=AIzaSy_your_key_here

# OpenRouter Free Tier: https://openrouter.ai/
# OPENROUTER_API_KEY=sk-or-v1-your_key_here
```

### 4. Start the Application

In terminal 1 (Backend API):
```bash
cd backend
npm start
```
*API runs on `http://localhost:3001`*

In terminal 2 (Frontend UI):
```bash
cd frontend
npm run dev
```
*UI runs on `http://localhost:5173`*

---

## 🎛️ Narrative Parameter Matrix

| Slider | UI Range | Model Hyperparameter | System Prompt Compilation Directive |
|---|---|---|---|
| **Creativity** | `0.2 – 1.4` | `temperature: 0.2 - 1.3`<br>`top_p: 0.85 - 0.98` | Directs figurative language density, metaphor boldness, and lexical variety. |
| **Tone** | 5 segmented stops | Style directive | Shifts vocabulary from lyrical warmth to visceral textures (rust, bone, moral ambiguity). |
| **Pacing** | 5 segmented stops | Syntax constraints | Fast: short punchy sentences, high verb velocity.<br>Slow: lingering sensory layering and world lore. |
| **Strictness** | `10% – 100%` | Constraint weights | High: strict fidelity to premise bounds.<br>Low: creative liberties and unexpected plot twists. |
| **Target Length** | 4 stops | `max_tokens: 750 - 3500` | Word budget: 20% setup, 60% conflict, 20% natural closure. Guarantees complete sentence landing. |
| **Thinking Depth** | 4 stops | `<thinking>` XML block | Directs the model to output a plot beat outline before drafting prose. |

---

## 📄 License

MIT License. Designed and built as a production-ready, zero-cost AI showcase application.
