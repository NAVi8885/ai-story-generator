import React, { useState } from 'react';
import './App.css';
import { StoryProvider, useStory } from './context/StoryContext';
import NarrativeControlPanel from './components/NarrativeControlPanel';
import PromptInput from './components/PromptInput';
import StoryViewer from './components/StoryViewer';
import StoryBibleModal from './components/StoryBibleModal';
import HistoryDrawer from './components/HistoryDrawer';
import SettingsModal from './components/SettingsModal';

function StoryGeneratorApp() {
  const { storyBible, history } = useStory();
  const [isBibleOpen, setIsBibleOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const hasBibleData = Boolean(
    storyBible.characters?.trim() || storyBible.worldRules?.trim() || storyBible.canonNotes?.trim()
  );

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="top-nav">
        <div className="nav-brand">
          <span className="brand-logo">✨</span>
          <span className="brand-title">MythosAI</span>
          <span className="brand-badge">Zero-Cost Inference</span>
        </div>

        <div className="nav-actions">
          <button
            className={`nav-pill-btn ${hasBibleData ? 'has-badge' : ''}`}
            onClick={() => setIsBibleOpen(true)}
            title="Open Story Bible to lock character profiles and world rules"
          >
            <span>📖 Story Bible</span>
            {hasBibleData && <span className="pill-dot" />}
          </button>

          <button
            className="nav-pill-btn"
            onClick={() => setIsHistoryOpen(true)}
            title="View saved stories chronicle"
          >
            <span>📚 Chronicle ({history.length})</span>
          </button>

          <button
            className="nav-pill-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="BYOK & Inference settings"
          >
            <span>⚙️ Settings</span>
          </button>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="header">
        <h1>AI Story Generator</h1>
        <p>Granular Narrative Control Panel • Real-Time Streaming • Branching Multi-Chapter Sagas</p>
      </header>

      {/* Main Workspace Layout */}
      <main className="content-wrapper">
        {/* Narrative Sliders Matrix */}
        <NarrativeControlPanel />

        {/* Prompt Input & Expander */}
        <div className="glass-panel main-input-panel">
          <PromptInput />
        </div>

        {/* Streaming Story Viewer & Telemetry */}
        <StoryViewer />
      </main>

      {/* Modals & Drawers */}
      <StoryBibleModal isOpen={isBibleOpen} onClose={() => setIsBibleOpen(false)} />
      <HistoryDrawer isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Footer */}
      <footer className="footer-credits">
        <p>Built with Liquid Glass UI • Zero-Cost Model Waterfall (Groq, Gemini, OpenRouter, Pollinations)</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <StoryProvider>
      <StoryGeneratorApp />
    </StoryProvider>
  );
}
