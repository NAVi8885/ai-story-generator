# AI Story Generator

## Transform short prompts into elaborate narratives with AI

A production-ready web application that leverages Hugging Face's advanced LLMs to expand short story prompts into highly detailed, coherent, and stylistically consistent narratives. Features a premium "Liquid Glass" UI aesthetic.

---

## 🚀 Features

- **Advanced Prompt Engineering**: Custom-built system prompt ensures narrative consistency, sensory detail, and logical continuity
- **Hugging Face Integration**: Uses Mixtral-8x7B-Instruct for high-quality story generation
- **Premium UI**: Liquid Glass design with glassmorphism, fluid animations, and micro-interactions
- **Responsive Design**: Works seamlessly on desktop and tablet devices
- **Error Handling**: Comprehensive validation and user-friendly error messages
- **Accessibility**: WCAG AA compliant with keyboard navigation and reduced motion support

---

## 🛠️ Tech Stack

**Frontend**:
- React 18
- Vite (dev server & build tool)
- Vanilla CSS (Liquid Glass design system)

**Backend**:
- Node.js + Express
- @huggingface/inference SDK
- CORS middleware

---

## 📋 Prerequisites

- Node.js 18+ and npm
- Hugging Face API token (get one at https://huggingface.co/settings/tokens)

---

## ⚙️ Setup Instructions

### 1. Clone or navigate to the project

```bash
cd ai-story-generator
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure environment variables

Copy `.env.example` to `.env` in the root directory:

```bash
cd ..
cp .env.example .env
```

Edit `.env` and add your Hugging Face API token:

```
HUGGINGFACE_API_KEY=hf_your_actual_token_here
PORT=3001
HF_MODEL=mistralai/Mixtral-8x7B-Instruct-v0.1
FRONTEND_URL=http://localhost:5173
```

### 5. Start the backend server

```bash
cd backend
npm start
```

You should see:
```
════════════════════════════════════════════════
🚀 AI Story Generator API Server
📡 Running on: http://localhost:3001
...
════════════════════════════════════════════════
```

### 6. Start the frontend (new terminal)

```bash
cd frontend
npm run dev
```

### 7. Open the application

Navigate to **http://localhost:5173** in your browser.

---

## 🎨 Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────────┐
│   Browser   │────────▶│    Express   │────────▶│  Hugging Face API   │
│  (React UI) │   POST  │   Server     │  System │  (Mixtral-8x7B)     │
│  Port 5173  │◀────────│  Port 3001   │◀────────│                     │
└─────────────┘  Story  └──────────────┘  Prompt └─────────────────────┘
```

### Flow:
1. User enters a short prompt in the React frontend
2. Frontend sends POST request to `/api/generate`
3. Backend constructs advanced system prompt using prompt engineering logic
4. Backend calls Hugging Face Inference API
5. Elaborated story is returned to frontend
6. Story is displayed in premium Liquid Glass UI

---

## 🧠 Prompt Engineering

The system uses a sophisticated prompt structure that enforces:

- **Narrative Consistency**: Maintains timeline, world rules, and character behavior
- **Sensory Detail**: Expands scenes with sight, sound, texture, and atmosphere
- **Logical Continuity**: Ensures coherent scene transitions and plot progression
- **Stylistic Control**: "Show, don't tell" approach with vivid but controlled language

See `backend/lib/promptEngineering.js` for the full system prompt.

---

## 🔧 Customization

### Change the AI Model

Edit `.env` and update the `HF_MODEL` variable:

```
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

### Adjust Generation Parameters

Edit `backend/lib/huggingface.js`:

```javascript
parameters: {
  max_new_tokens: 2048,   // Longer stories
  temperature: 0.75,       // 0.1-1.0 (lower = more focused)
  top_p: 0.9              // 0.1-1.0 (nucleus sampling)
}
```

---

## 📁 Project Structure

```
ai-story-generator/
├── backend/
│   ├── lib/
│   │   ├── huggingface.js          # HF API client
│   │   └── promptEngineering.js    # System prompt logic
│   ├── server.js                   # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PromptInput.jsx
│   │   │   ├── LoadingIndicator.jsx
│   │   │   └── StoryOutput.jsx
│   │   ├── App.jsx                 # Main component
│   │   ├── App.css                 # Liquid Glass design system
│   │   ├── index.css               # Global styles
│   │   └── main.jsx                # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .env                            # Environment variables (gitignored)
├── .env.example                    # Template
└── README.md
```

---

## 🐛 Troubleshooting

**Backend won't start**:
- Ensure `.env` file exists in root directory
- Verify `HUGGINGFACE_API_KEY` is set correctly
- Check that port 3001 is not already in use

**Frontend shows network error**:
- Ensure backend is running on port 3001
- Check browser console for CORS errors

**Story generation fails**:
- Verify your Hugging Face API key has access to Mixtral model
- Check if you've hit rate limits (free tier has limits)
- Try a different model if Mixtral is unavailable

**Liquid Glass effects not showing**:
- Ensure you're using a modern browser with backdrop-filter support
- Clear browser cache and reload

---

## 📝 License

This project is provided as-is for educational and commercial use.

---

## 🙏 Credits

- **UI Design**: Inspired by modern glassmorphism trends
- **AI Model**: Hugging Face Mixtral-8x7B-Instruct
- **Fonts**: Inter by Rasmus Andersson (Google Fonts)

---

**Built with ❤️ as a production-ready AI story generation tool**
