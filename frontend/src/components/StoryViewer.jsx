import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStory } from '../context/StoryContext';
import BranchChoices from './BranchChoices';

/**
 * Splits prose content into structured chapters with titles and paragraph blocks.
 * Automatically generates Chapter Dividers (Chapter 1: ..., Chapter 2: ...) if missing.
 */
function parseStoryIntoChapters(content, defaultChapterNum = 1) {
  if (!content || typeof content !== 'string' || !content.trim()) {
    return [];
  }

  const clean = content.trim();

  // Regex matching explicit chapter headings e.g. "Chapter 1: The Dark Forest", "CHAPTER 2 - Rebirth", "### Chapter 3"
  const chapterRegex = /(?:^|\n\n+)(?:#{1,3}\s+)?((?:Chapter|CHAPTER|Act|ACT)\s+(?:\d+|[IVXLCDM]+)[\s:–—.-]*[^\n]*|Prologue|PROLOGUE|Epilogue|EPILOGUE)/gi;

  const matches = [...clean.matchAll(chapterRegex)];

  if (matches.length === 0) {
    // Single chapter with automatic default title
    const paragraphs = clean
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    return [
      {
        title: `Chapter ${defaultChapterNum}`,
        paragraphs
      }
    ];
  }

  const result = [];

  // Check if there is prose before the first matched chapter heading
  if (matches[0].index > 0) {
    const preamble = clean.slice(0, matches[0].index).trim();
    if (preamble) {
      const preambleParas = preamble
        .split(/\n\s*\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      result.push({
        title: `Chapter ${defaultChapterNum}`,
        paragraphs: preambleParas
      });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const rawTitle = currentMatch[1].trim().replace(/^#{1,3}\s*/, '');
    const startIndex = currentMatch.index + currentMatch[0].length;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index : clean.length;
    const body = clean.slice(startIndex, endIndex).trim();

    const paragraphs = body
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    result.push({
      title: rawTitle,
      paragraphs
    });
  }

  return result;
}

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
  const [readingProgress, setReadingProgress] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const viewerContainerRef = useRef(null);

  // Tab isolation: If activeTab is 'thinking' but thinking is empty, auto-fallback to 'prose'
  useEffect(() => {
    if (activeTab === 'thinking' && (!thinking || !thinking.trim())) {
      setActiveTab('prose');
    }
  }, [thinking, activeTab, setActiveTab]);

  // Dynamic reading progress tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!viewerContainerRef.current) return;
      const el = viewerContainerRef.current;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Distance from top of reader to bottom of viewport
      const totalDistance = rect.height - windowHeight * 0.4;
      if (totalDistance <= 0) {
        setReadingProgress(100);
        return;
      }

      const scrolled = Math.max(0, -rect.top + windowHeight * 0.2);
      const pct = Math.min(100, Math.max(0, Math.round((scrolled / totalDistance) * 100)));
      setReadingProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [story, chapters, activeTab]);

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

  // Parse archived chapters and current active story into structured chapter blocks
  const structuredArchivedChapters = useMemo(() => {
    if (!chapters || chapters.length <= 1) return [];
    return chapters.slice(0, -1).map((ch, idx) => ({
      chapterNumber: idx + 1,
      blocks: parseStoryIntoChapters(ch.content, idx + 1)
    }));
  }, [chapters]);

  const currentChapterBlocks = useMemo(() => {
    const chapterNum = chapters.length > 0 ? chapters.length : 1;
    return parseStoryIntoChapters(story, chapterNum);
  }, [story, chapters]);

  const hasThinking = Boolean(thinking && thinking.trim().length > 0);

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
    <div
      ref={viewerContainerRef}
      className={`story-viewer-container ${isFocusMode ? 'focus-reader-active' : ''}`}
    >
      {/* Dynamic Reading Progress Bar */}
      <div className="reading-progress-track" title={`Reading Progress: ${readingProgress}%`}>
        <div
          className={`reading-progress-fill ${isGenerating ? 'streaming-pulse' : ''}`}
          style={{ width: `${isGenerating && readingProgress < 15 ? 15 : readingProgress}%` }}
        />
      </div>

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
          <span className="telemetry-label">Progress</span>
          <span className="telemetry-value progress-value">
            {isGenerating ? 'Live Stream' : `${readingProgress}%`}
          </span>
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

      {/* Main Story Display Panel */}
      <div className="glass-panel story-display-panel reader-glass-container">
        {/* Viewer Header */}
        <div className="viewer-header">
          {/* Tabs: Narrative Blueprint is exclusively rendered when thinking exists */}
          <div className="viewer-tabs">
            <button
              className={`viewer-tab-btn ${activeTab === 'prose' ? 'active' : ''}`}
              onClick={() => setActiveTab('prose')}
            >
              📖 Book Reader
            </button>
            {hasThinking && (
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

          {/* Reader Actions Toolbar */}
          <div className="viewer-actions">
            <button
              className={`action-btn focus-toggle-btn ${isFocusMode ? 'active' : ''}`}
              onClick={() => setIsFocusMode(!isFocusMode)}
              title={isFocusMode ? 'Exit Distraction-Free Mode' : 'Enter Distraction-Free Book Mode'}
            >
              {isFocusMode ? '👓 Normal View' : '✨ Focus Reader'}
            </button>
            <button
              className={`action-btn ${copied ? 'success' : ''}`}
              onClick={handleCopy}
              title="Copy pure story text to clipboard"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button
              className="action-btn"
              onClick={() => exportStory('markdown')}
              title="Download story as Markdown"
            >
              📥 Markdown
            </button>
            <button
              className="action-btn"
              onClick={() => exportStory('json')}
              title="Download story as JSON"
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

        {/* Tab Content Area */}
        <div className="tab-content-area">
          {activeTab === 'prose' ? (
            <div className="publication-reader-container">
              {/* Planning banner when model is still reasoning inside thinking */}
              {!story && isGenerating && (
                <div className="thinking-planning-banner glass-panel">
                  <div className="planning-spinner" />
                  <div className="planning-text">
                    <strong>Plot Architect is formulating narrative beats & characters...</strong>
                    <p>The reasoning model is drafting the plot structure before prose generation begins.</p>
                  </div>
                  {hasThinking && (
                    <button
                      className="view-blueprint-btn"
                      onClick={() => setActiveTab('thinking')}
                    >
                      View Live Blueprint →
                    </button>
                  )}
                </div>
              )}

              {/* Distraction-Free Publication Reader Column (720px width) */}
              <article className="reader-prose-column">
                {/* Archived Chapters from Continuation Sagas */}
                {structuredArchivedChapters.length > 0 && (
                  <div className="archived-chapters-section">
                    {structuredArchivedChapters.map((archived) => (
                      <div key={archived.chapterNumber} className="archived-chapter-unit">
                        {archived.blocks.map((block, bIdx) => (
                          <section key={bIdx} className="reader-chapter-block">
                            <div className="book-chapter-divider">
                              <span className="chapter-ornament">✦ ❦ ✦</span>
                              <h3 className="book-chapter-title">{block.title}</h3>
                              <div className="chapter-divider-rule" />
                            </div>
                            <div className="chapter-body-text">
                              {block.paragraphs.map((para, pIdx) => (
                                <p
                                  key={pIdx}
                                  className={`reader-paragraph ${pIdx === 0 ? 'drop-cap' : ''}`}
                                >
                                  {para}
                                </p>
                              ))}
                            </div>
                          </section>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Current Active Chapter */}
                {story && (
                  <div className="current-chapter-unit">
                    {currentChapterBlocks.map((block, bIdx) => {
                      const isLastBlock = bIdx === currentChapterBlocks.length - 1;
                      return (
                        <section key={bIdx} className="reader-chapter-block current-active-block">
                          {/* Automatic chapter divider with ornate book typography */}
                          <div className="book-chapter-divider current-divider">
                            <span className="chapter-ornament">✦ ❦ ✦</span>
                            <h3 className="book-chapter-title">{block.title}</h3>
                            <div className="chapter-divider-rule" />
                          </div>

                          <div className="chapter-body-text">
                            {block.paragraphs.map((para, pIdx) => {
                              const isOpeningPara = pIdx === 0;
                              const isLastPara = isLastBlock && pIdx === block.paragraphs.length - 1;

                              return (
                                <p
                                  key={pIdx}
                                  className={`reader-paragraph ${isOpeningPara ? 'drop-cap' : ''}`}
                                >
                                  {para}
                                  {isLastPara && isGenerating && (
                                    <span className="streaming-cursor" />
                                  )}
                                </p>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </article>

              {/* Interactive Branching Choices */}
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
