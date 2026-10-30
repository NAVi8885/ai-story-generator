import React, { useState } from 'react';
import { useStory } from '../context/StoryContext';
import BranchChoices from './BranchChoices';

export default function StoryViewer() {
  const {
    story,
    thinking,
    chapters,
    isGenerating,
    error,
    telemetry,
    activeTab,
    setActiveTab,
    exportStory,
    saveCurrentToHistory
  } = useStory();

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(story);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy story:', err);
    }
  };

  const handleSave = () => {
    saveCurrentToHistory();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (error) {
    return (
      <div className="error-card glass-panel">
        <div className="error-header">
          <span className="error-icon">⚠️</span>
          <h4>Generation Notice</h4>
        </div>
        <p className="error-message-text">{error}</p>
        <p className="error-hint">
          Check if your prompt is clear, or open <strong>Settings</strong> to configure an optional free API key (Groq, Gemini, OpenRouter).
        </p>
      </div>
    );
  }

  if (!story && !isGenerating && !thinking) {
    return (
      <div className="empty-state glass-panel">
        <div className="empty-icon">🖋️</div>
        <h3>Ready to Craft Your Narrative</h3>
        <p>
          Configure the <strong>Narrative Control Matrix</strong> sliders above, enter a seed premise, and watch your story stream in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="story-viewer-container">
      {/* Telemetry Bar */}
      <div className="telemetry-bar glass-panel">
        <div className="telemetry-item">
          <span className="telemetry-label">Words</span>
          <span className="telemetry-value">{telemetry.wordCount}</span>
        </div>
        <div className="telemetry-divider" />
        <div className="telemetry-item">
          <span className="telemetry-label">Read Time</span>
          <span className="telemetry-value">~{telemetry.readingTimeMinutes} min</span>
        </div>
        <div className="telemetry-divider" />
        <div className="telemetry-item">
          <span className="telemetry-label">Speed</span>
          <span className="telemetry-value">{telemetry.tokensPerSec || '0.0'} tok/s</span>
        </div>
        <div className="telemetry-divider" />
        <div className="telemetry-item engine-item">
          <span className="telemetry-label">Engine</span>
          <span className="telemetry-value badge">{telemetry.activeProvider}</span>
        </div>
      </div>

      {/* Main Viewer Glass Panel */}
      <div className="glass-panel story-display-panel">
        <div className="viewer-header">
          {/* Tabs */}
          <div className="viewer-tabs">
            <button
              className={`viewer-tab-btn ${activeTab === 'prose' ? 'active' : ''}`}
              onClick={() => setActiveTab('prose')}
            >
              📖 Story Prose
            </button>
            {thinking && (
              <button
                className={`viewer-tab-btn ${activeTab === 'thinking' ? 'active' : ''}`}
                onClick={() => setActiveTab('thinking')}
              >
                🧠 Narrative Blueprint
                <span className={`tab-pill ${isGenerating && !story ? 'pulsing' : ''}`}>
                  {isGenerating && !story ? '● Active' : 'CoT'}
                </span>
              </button>
            )}
          </div>

          {/* Actions Toolbar */}
          <div className="viewer-actions">
            <button
              className={`action-btn ${copied ? 'success' : ''}`}
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button
              className="action-btn"
              onClick={() => exportStory('markdown')}
              title="Download as Markdown file"
            >
              📥 Markdown
            </button>
            <button
              className="action-btn"
              onClick={() => exportStory('json')}
              title="Download as JSON"
            >
              📦 JSON
            </button>
            <button
              className={`action-btn ${saved ? 'success' : ''}`}
              onClick={handleSave}
              title="Save to local browser history"
            >
              {saved ? '✓ Saved' : '💾 Save'}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content-area">
          {activeTab === 'prose' ? (
            <div className="prose-container">
              {!story && isGenerating && (
                <div className="thinking-planning-banner glass-panel">
                  <div className="planning-spinner" />
                  <div className="planning-text">
                    <strong>Plot Architect is formulating narrative beats & characters...</strong>
                    <p>The reasoning model is drafting the plot structure before prose generation begins.</p>
                  </div>
                  {thinking && (
                    <button
                      className="view-blueprint-btn"
                      onClick={() => setActiveTab('thinking')}
                    >
                      View Live Blueprint →
                    </button>
                  )}
                </div>
              )}

              {chapters.length > 1 && (
                <div className="chapters-archive">
                  {chapters.slice(0, -1).map((ch, idx) => (
                    <div key={idx} className="archived-chapter">
                      <h4 className="chapter-marker">Chapter {idx + 1}</h4>
                      <div className="chapter-body">{ch.content}</div>
                    </div>
                  ))}
                  <h4 className="chapter-marker active-marker">Chapter {chapters.length} (Current)</h4>
                </div>
              )}

              <div className="story-content-prose">
                {story}
                {isGenerating && <span className="streaming-cursor" />}
              </div>

              {/* Interactive Plot Branching */}
              {!isGenerating && <BranchChoices />}
            </div>
          ) : (
            <div className="thinking-container">
              <div className="thinking-info-banner">
                <strong>Internal Reasoning Architecture:</strong> This outline was generated
                by the model's Chain-of-Thought planning phase before generating the prose.
              </div>
              <pre className="thinking-raw">{thinking}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

