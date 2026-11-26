import React, { useRef, useState } from 'react';
import {
  Sparkles,
  Wand2,
  Square,
  Play,
  CornerDownLeft,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { useStory } from '../context/StoryContext';

const SEED_SUGGESTIONS = [
  {
    label: 'Deep-Sea Trench',
    text: 'A deep-sea archaeologist finds an unrusted Victorian pocket watch inside a 50,000-year-old trench anomaly.'
  },
  {
    label: 'Bottled Grief',
    text: 'An old apothecary sells bottled emotions in a dying city where feeling grief has been outlawed.'
  },
  {
    label: 'Mars Beacon',
    text: 'A terraforming station on Mars receives a distress beacon from Earth—dated 200 years in the future.'
  },
  {
    label: 'Living Map',
    text: 'A master cartographer realizes that every island she draws into existence appears in the real sea overnight.'
  }
];

export default function PromptInput() {
  const {
    prompt,
    setPrompt,
    generateStory,
    stopGeneration,
    enhancePrompt,
    isGenerating,
    isEnhancing,
    chapters,
    activeChapterIndex,
    generateNextChapterPrompt,
    nextChapterSynthesis
  } = useStory();

  const textareaRef = useRef(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const maxLength = 2500;
  const charCount = (prompt || '').length;
  const isNearLimit = charCount > maxLength * 0.9;

  const totalChapters = Array.isArray(chapters) ? chapters.length : 0;
  const isContinuation = totalChapters >= 1;
  const nextChapterNum = totalChapters + 1;
  const lastChapter = isContinuation ? chapters[totalChapters - 1] : null;
  const lastChapterTitle = lastChapter?.title?.trim() || `Chapter ${totalChapters}`;

  const suggestedHooks = Array.isArray(nextChapterSynthesis?.suggestedHooks)
    ? nextChapterSynthesis.suggestedHooks
    : [];

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;
    if (isContinuation) {
      generateStory(undefined, true);
    } else {
      generateStory();
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handlePickSeed = (seedText) => {
    setPrompt(seedText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleInjectPrompt = (injectedText) => {
    if (!injectedText || isGenerating) return;
    setPrompt(injectedText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSynthesizePremise = async () => {
    if (isGenerating || isSynthesizing) return;
    setIsSynthesizing(true);
    try {
      if (typeof generateNextChapterPrompt === 'function') {
        const synthesis = await generateNextChapterPrompt();
        if (synthesis?.suggestedPrompt) {
          setPrompt(synthesis.suggestedPrompt);
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }
      }
    } catch (err) {
      console.error('Continuation premise synthesis failed:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="prompt-input-wrapper">
      <style>{`
        .continuation-guide-banner {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          background: linear-gradient(135deg, rgba(24, 24, 27, 0.92) 0%, rgba(18, 18, 21, 0.98) 100%);
          border: 1px solid rgba(217, 119, 6, 0.32);
          border-left: 3px solid var(--accent-amber, #d97706);
          border-radius: 6px;
          padding: 0.75rem 0.9rem;
          margin-bottom: 0.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
          transition: all 180ms ease;
        }
        .continuation-banner-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.55rem;
        }
        .continuation-target-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.55rem;
        }
        .continuation-target-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(217, 119, 6, 0.15);
          border: 1px solid rgba(217, 119, 6, 0.35);
          border-radius: 4px;
          padding: 0.2rem 0.45rem;
          font-size: 0.74rem;
          font-weight: 600;
          color: #fbbf24;
          letter-spacing: 0.02em;
        }
        .continuation-context-text {
          font-size: 0.76rem;
          color: var(--text-secondary, #a1a1aa);
          font-style: italic;
          max-width: 440px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .continuation-actions-group {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .continuation-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.28rem 0.65rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 140ms ease;
          border: 1px solid transparent;
        }
        .continuation-action-btn.primary-synthesis-btn {
          background: rgba(217, 119, 6, 0.2);
          border-color: rgba(217, 119, 6, 0.4);
          color: #fbbf24;
        }
        .continuation-action-btn.primary-synthesis-btn:hover:not(:disabled) {
          background: rgba(217, 119, 6, 0.3);
          border-color: rgba(217, 119, 6, 0.6);
          color: #fef3c7;
        }
        .continuation-action-btn.inject-premise-btn {
          background: var(--bg-surface-elevated, #18181b);
          border-color: var(--border-highlight, #52525b);
          color: var(--text-primary, #fafafa);
        }
        .continuation-action-btn.inject-premise-btn:hover:not(:disabled) {
          background: var(--bg-surface-hover, #222227);
          border-color: var(--text-primary, #fafafa);
        }
        .continuation-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .continuation-hooks-container {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding-top: 0.35rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .continuation-hooks-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted, #71717a);
          font-weight: 600;
        }
        .continuation-hooks-list {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .continuation-hook-pill {
          display: flex;
          align-items: flex-start;
          gap: 0.4rem;
          background: rgba(24, 24, 27, 0.6);
          border: 1px solid var(--border-subtle, #27272a);
          border-radius: 4px;
          padding: 0.3rem 0.55rem;
          font-size: 0.74rem;
          color: var(--text-secondary, #a1a1aa);
          text-align: left;
          cursor: pointer;
          transition: all 140ms ease;
          line-height: 1.4;
        }
        .continuation-hook-pill:hover:not(:disabled) {
          background: var(--bg-surface-elevated, #18181b);
          border-color: rgba(217, 119, 6, 0.4);
          color: var(--text-primary, #fafafa);
        }
        .continuation-hook-pill .hook-icon {
          flex-shrink: 0;
          margin-top: 0.15rem;
          color: var(--accent-amber, #d97706);
        }
      `}</style>

      {/* Continuation Guide Banner (Requirement R4) */}
      {isContinuation && (
        <section
          className="continuation-guide-banner"
          aria-label="Continuation Guide Banner"
          role="region"
        >
          <div className="continuation-banner-header">
            <div className="continuation-target-meta">
              <div className="continuation-target-badge">
                <BookOpen size={13} className="continuation-badge-icon" />
                <span className="continuation-target-label">
                  Drafting Chapter {nextChapterNum}
                </span>
              </div>
              <span
                className="continuation-context-text"
                title={`Continuing saga from Chapter ${totalChapters}: "${lastChapterTitle}"`}
              >
                Continuing saga from Chapter {totalChapters}: &ldquo;{lastChapterTitle}&rdquo;
              </span>
            </div>

            <div className="continuation-actions-group">
              {nextChapterSynthesis?.suggestedPrompt && prompt !== nextChapterSynthesis.suggestedPrompt && (
                <button
                  type="button"
                  className="continuation-action-btn inject-premise-btn"
                  onClick={() => handleInjectPrompt(nextChapterSynthesis.suggestedPrompt)}
                  disabled={isGenerating}
                  title="Inject pre-synthesized continuation hook into prompt"
                >
                  <Sparkles size={13} />
                  <span>Inject Synthesized Premise</span>
                </button>
              )}

              <button
                type="button"
                className="continuation-action-btn primary-synthesis-btn"
                onClick={handleSynthesizePremise}
                disabled={isGenerating || isSynthesizing}
                title={`Auto-synthesize narrative hook for Chapter ${nextChapterNum}`}
              >
                <Sparkles size={13} className={isSynthesizing ? 'spin-icon' : ''} />
                <span>
                  {isSynthesizing
                    ? `Synthesizing Chapter ${nextChapterNum}...`
                    : `Synthesize Chapter ${nextChapterNum} Premise`}
                </span>
              </button>
            </div>
          </div>

          {/* Suggested Trajectory Hooks */}
          {suggestedHooks.length > 0 && (
            <div className="continuation-hooks-container">
              <span className="continuation-hooks-label">Suggested Hooks:</span>
              <div className="continuation-hooks-list">
                {suggestedHooks.map((hook, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="continuation-hook-pill"
                    onClick={() => handleInjectPrompt(hook)}
                    disabled={isGenerating}
                    title={hook}
                  >
                    <ChevronRight size={12} className="hook-icon" />
                    <span className="hook-text">{hook}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="input-toolbar">
        <label className="input-label" htmlFor="story-seed-textarea">
          <span className="input-title">Premise & Narrative Spark</span>
        </label>
        <button
          type="button"
          className="enhance-btn"
          onClick={enhancePrompt}
          disabled={isGenerating || isEnhancing || !prompt.trim()}
          title="Auto-expands short prompts into rich sensory narrative setups"
        >
          <Wand2 size={14} className={isEnhancing ? 'spin-icon' : ''} />
          <span>{isEnhancing ? 'Enhancing premise...' : 'Enhance Premise'}</span>
        </button>
      </div>

      <div className="input-box-container">
        <textarea
          ref={textareaRef}
          id="story-seed-textarea"
          className="studio-textarea"
          placeholder={
            isContinuation
              ? `Craft premise for Chapter ${nextChapterNum}... e.g., 'Escalate the discovery from Chapter ${totalChapters} into open confrontation...'`
              : "Craft a premise or narrative spark... e.g., 'A clockmaker discovers that winding an antique music box pauses the flow of time for everyone except him...'"
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          maxLength={maxLength}
          rows="3"
        />

        <div className="input-footer-row">
          <div className="seed-suggestions" aria-label="Curated story sparks">
            <span className="seeds-label">Sparks:</span>
            {SEED_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                className="seed-tag-btn"
                onClick={() => handlePickSeed(s.text)}
                disabled={isGenerating}
                title={s.text}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="char-and-shortcut">
            <span className="shortcut-hint">
              <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>↵</kbd>
            </span>
            <span className={`char-counter ${isNearLimit ? 'warning' : ''}`}>
              {charCount} / {maxLength}
            </span>
          </div>
        </div>
      </div>

      <div className="action-row">
        {isGenerating ? (
          <button
            type="button"
            className="studio-btn stop-btn"
            onClick={stopGeneration}
            aria-label="Stop active generation"
          >
            <Square size={14} fill="currentColor" />
            <span>Stop Generating</span>
          </button>
        ) : (
          <button
            type="button"
            className="studio-btn primary-generate-btn"
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            aria-label={
              isContinuation
                ? `Generate Chapter ${nextChapterNum}`
                : 'Generate Chapter 1'
            }
          >
            <Play size={14} fill="currentColor" />
            <span>
              {isContinuation
                ? `Generate Chapter ${nextChapterNum}`
                : 'Generate Chapter 1'}
            </span>
            <CornerDownLeft size={13} className="enter-icon-hint" />
          </button>
        )}
      </div>
    </div>
  );
}
