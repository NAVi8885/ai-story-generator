import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  BrainCircuit,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Bookmark,
  FileDown,
  Download,
  AlertTriangle,
  Feather,
  Sun,
  Moon,
  Coffee,
  Type,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Plus,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { useStory, tokenizeSentences } from '../context/StoryContext';
import { IMAGE_STYLE_PRESETS } from '../utils/imageStylePresets';
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

  // Regex matching explicit chapter headings e.g. "Chapter 1: The Dark Forest", "**CHAPTER 2 - Rebirth**", "### Chapter 3", "Prologue: Dawn"
  const chapterRegex = /(?:^|\n\n+)(?:[#*]{1,3}\s*)?((?:(?:Chapter|CHAPTER|Act|ACT)\s+(?:\d+|[IVXLCDM]+)|Prologue|PROLOGUE|Epilogue|EPILOGUE)[\s:–—.-]*[^\n*]*)(?:\*{1,3})?/gi;

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
    const rawTitle = currentMatch[1].trim().replace(/^[#*]{1,3}\s*/, '').replace(/[*#]+$/, '').trim();
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

export default function StoryViewer({
  isFocusMode: externalFocusMode,
  onToggleFocusMode: externalToggleFocusMode,
  isBlueprintOpen,
  onToggleBlueprint
}) {
  const {
    story,
    thinking,
    chapters,
    activeChapterIndex,
    setActiveChapterIndex,
    activeChapter,
    generateNextChapterPrompt,
    continueToNextChapter,
    prompt,
    setPrompt,
    isGenerating,
    error,
    telemetry,
    activeTab,
    setActiveTab,
    exportStory,
    saveCurrentToHistory,
    audioTheater,
    sceneIllustrator,
    exportArtwork
  } = useStory();

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isDraftingHook, setIsDraftingHook] = useState(false);
  const [localFocusMode, setLocalFocusMode] = useState(false);
  const isFocusMode = externalFocusMode !== undefined ? externalFocusMode : localFocusMode;
  const toggleFocusMode = externalToggleFocusMode || (() => setLocalFocusMode((prev) => !prev));

  // Resolved chapter data strictly for the active chapter (Anti-Slop Book Pagination)
  const totalChapters = chapters?.length || 0;
  const isDraftingNew = isGenerating && activeChapterIndex === totalChapters;
  const currentChapterData = chapters?.[activeChapterIndex] || null;

  const displayedContent = isDraftingNew
    ? story
    : (currentChapterData?.content ?? (totalChapters === 0 ? story : ''));

  const displayedThinking = isDraftingNew
    ? thinking
    : (currentChapterData?.thinking ?? (activeChapterIndex === 0 && totalChapters === 0 ? thinking : (thinking || '')));

  const displayedChapterNumber = isDraftingNew
    ? totalChapters + 1
    : (currentChapterData?.number || activeChapterIndex + 1);

  const displayedTitle = currentChapterData?.title || `Chapter ${displayedChapterNumber}`;

  // Reading customization settings with persistence
  const [readingTheme, setReadingTheme] = useState(() => {
    return localStorage.getItem('mythos_reader_theme') || 'obsidian'; // 'obsidian' | 'sepia' | 'light'
  });
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('mythos_reader_font') || 'serif'; // 'serif' | 'sans' | 'mono'
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('mythos_reader_fontsize');
    return saved ? parseInt(saved, 10) : 18; // 15 to 22 px
  });
  const [readerWidth, setReaderWidth] = useState(() => {
    return localStorage.getItem('mythos_reader_width') || 'editorial'; // 'compact' (600px) | 'editorial' (720px) | 'wide' (860px)
  });

  const [showTypographyControls, setShowTypographyControls] = useState(false);

  const viewerContainerRef = useRef(null);
  const typographyPopoverRef = useRef(null);

  // Close appearance menu on outside click
  useEffect(() => {
    if (!showTypographyControls) return;

    const handleClickOutside = (e) => {
      if (typographyPopoverRef.current && !typographyPopoverRef.current.contains(e.target)) {
        setShowTypographyControls(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTypographyControls]);

  // Esc key handling for Focus Mode and Appearance Popover
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showTypographyControls) {
          setShowTypographyControls(false);
        } else if (isFocusMode) {
          toggleFocusMode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTypographyControls, isFocusMode, toggleFocusMode]);

  useEffect(() => {
    localStorage.setItem('mythos_reader_theme', readingTheme);
  }, [readingTheme]);

  useEffect(() => {
    localStorage.setItem('mythos_reader_font', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    localStorage.setItem('mythos_reader_fontsize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('mythos_reader_width', readerWidth);
  }, [readerWidth]);

  // Tab isolation: If activeTab is 'thinking' but thinking is empty, auto-fallback to 'prose'
  useEffect(() => {
    if (activeTab === 'thinking' && (!displayedThinking || !displayedThinking.trim())) {
      setActiveTab('prose');
    }
  }, [displayedThinking, activeTab, setActiveTab]);

  // Dynamic reading progress tracking
  useEffect(() => {
    const container = viewerContainerRef.current;
    const scrollParent = container?.closest('.studio-center-stage') || window;

    const handleScroll = () => {
      if (!viewerContainerRef.current) return;
      const el = viewerContainerRef.current;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // If bottom of reader is reached or in view, mark 100% complete
      if (rect.bottom <= windowHeight + 80) {
        setReadingProgress(100);
        return;
      }

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

    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      scrollParent.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [displayedContent, activeChapterIndex, activeTab]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedContent);
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

  // Auto-draft next chapter premise and smoothly scroll to prompt input
  const handleAutoDraftNextChapter = async (targetIdx = activeChapterIndex) => {
    setIsDraftingHook(true);
    try {
      const synthesis = await generateNextChapterPrompt(targetIdx);
      const suggested = synthesis?.suggestedPrompt || '';
      if (suggested) {
        if (typeof setPrompt === 'function') {
          setPrompt(suggested);
        }
        const textarea = document.getElementById('story-seed-textarea') || document.querySelector('.studio-textarea');
        if (textarea) {
          textarea.value = suggested;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new CustomEvent('mythos:prompt-injected', { detail: { prompt: suggested }, bubbles: true }));
          textarea.focus();
        }
        const promptSection = document.querySelector('.studio-prompt-section') || document.querySelector('.prompt-input-wrapper') || textarea;
        if (promptSection) {
          promptSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } catch (err) {
      console.error('Failed to auto-draft next chapter prompt:', err);
    } finally {
      setIsDraftingHook(false);
    }
  };

  const handleContinueToNextChapter = async () => {
    if (activeChapterIndex < totalChapters - 1) {
      setActiveChapterIndex(activeChapterIndex + 1);
      return;
    }

    if (prompt && prompt.trim()) {
      if (typeof continueToNextChapter === 'function') {
        await continueToNextChapter(prompt);
      }
    } else {
      await handleAutoDraftNextChapter();
    }
  };

  // Parse strictly the active chapter prose into structured blocks (Anti-Slop: single active chapter)
  const currentChapterBlocks = useMemo(() => {
    return parseStoryIntoChapters(displayedContent, displayedChapterNumber);
  }, [displayedContent, displayedChapterNumber]);

  const hasThinking = Boolean(displayedThinking && displayedThinking.trim().length > 0);
  const canShowCta = !isGenerating && totalChapters > 0 && activeChapterIndex === totalChapters - 1 && displayedContent && displayedContent.length > 50;

  if (error) {
    return (
      <div className="error-card studio-panel" role="alert">
        <div className="error-header">
          <AlertTriangle className="error-icon-svg" size={18} />
          <h4>Narrative Generation Notice</h4>
        </div>
        <p className="error-message-text">{error}</p>
        <p className="error-hint">
          Check if your prompt is clear, or open <strong>Settings</strong> in the navigation bar to configure an optional API key (Groq, Gemini, OpenRouter).
        </p>
      </div>
    );
  }

  if (!displayedContent && !isGenerating && !displayedThinking) {
    return (
      <div className="empty-state studio-panel">
        <div className="empty-icon-wrap">
          <Feather size={28} className="empty-icon" />
        </div>
        <h3>Studio Canvas Ready</h3>
        <p>
          Configure the narrative dials in the left panel, formulate a premise above, and begin composing your story.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={viewerContainerRef}
      className={`story-viewer-container reader-theme-${readingTheme} reader-font-${fontFamily} reader-width-${readerWidth} ${isFocusMode ? 'focus-reader-active' : ''}`}
    >
      {/* Floating Focus Mode Exit Pill */}
      {isFocusMode && (
        <div className="focus-exit-floating-bar">
          <button
            type="button"
            className="exit-focus-pill-btn"
            onClick={toggleFocusMode}
            title="Exit Distraction-Free Mode (Esc)"
          >
            <Minimize2 size={13} />
            <span>Exit Focus Mode</span>
            <kbd>Esc</kbd>
          </button>
        </div>
      )}

      {/* Dynamic Reading Progress Bar */}
      <div className="reading-progress-track" title={`Reading Progress: ${readingProgress}%`}>
        <div
          className={`reading-progress-fill ${isGenerating ? 'streaming-pulse' : ''}`}
          style={{ width: `${isGenerating && readingProgress < 15 ? 15 : readingProgress}%` }}
        />
      </div>

      {/* Sleek Minimalist Telemetry HUD */}
      <div className="telemetry-hud-bar">
        <div className="telemetry-pill">
          <div className="telemetry-stat">
            <span className="telemetry-stat-value">{telemetry.wordCount}</span>
            <span className="telemetry-stat-label">words</span>
          </div>
          <span className="telemetry-sep">•</span>
          <div className="telemetry-stat">
            <span className="telemetry-stat-value">~{telemetry.readingTimeMinutes}</span>
            <span className="telemetry-stat-label">min read</span>
          </div>
          <span className="telemetry-sep">•</span>
          <div className="telemetry-stat">
            <span className="telemetry-stat-value">
              {isGenerating ? `${telemetry.tokensPerSec || '0.0'} tok/s` : `${readingProgress}% complete`}
            </span>
          </div>
          <span className="telemetry-sep">•</span>
          <div className="telemetry-stat engine-badge">
            <span className="engine-dot" />
            <span className="engine-name">Engine: {telemetry.activeProvider}</span>
          </div>
        </div>
      </div>

      {/* Editorial Reader Canvas Container */}
      <div className="reader-canvas-card studio-panel">
        {/* Editorial Action & Customization Toolbar */}
        <header className="viewer-editorial-toolbar">
          {/* Main Views / Tabs */}
          <div className="reader-tabs-row" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'prose'}
              className={`reader-tab-btn ${activeTab === 'prose' ? 'active' : ''}`}
              onClick={() => setActiveTab('prose')}
            >
              <BookOpen size={14} />
              <span>Book Reader</span>
            </button>
            {hasThinking && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'thinking'}
                className={`reader-tab-btn ${activeTab === 'thinking' ? 'active' : ''}`}
                onClick={() => setActiveTab('thinking')}
              >
                <BrainCircuit size={14} />
                <span>Narrative Blueprint</span>
                <span className={`tab-tag ${isGenerating && !displayedContent ? 'pulsing' : ''}`}>
                  {isGenerating && !displayedContent ? 'Reasoning...' : 'CoT'}
                </span>
              </button>
            )}
          </div>

          {/* Reading Customization & Utility Actions */}
          <div className="viewer-tools-row">
            {/* Narrative Blueprint scratchpad toggle */}
            {onToggleBlueprint && (
              <button
                type="button"
                className={`tool-action-btn ${isBlueprintOpen ? 'active' : ''}`}
                onClick={() => onToggleBlueprint()}
                title={isBlueprintOpen ? 'Collapse Blueprint Scratchpad (Ctrl+J)' : 'Open Blueprint Scratchpad (Ctrl+J)'}
                aria-label="Toggle Blueprint Scratchpad"
              >
                <BrainCircuit size={14} />
                <span className="tool-btn-text">Blueprint</span>
                {isGenerating && !story && thinking ? (
                  <span className="pulse-dot-amber" />
                ) : thinking ? (
                  <span className="active-dot" />
                ) : null}
              </button>
            )}

            {/* Typography Controls Popover Trigger */}
            <div className="typography-popover-anchor" ref={typographyPopoverRef}>
              <button
                type="button"
                className={`tool-action-btn ${showTypographyControls ? 'active' : ''}`}
                onClick={() => setShowTypographyControls(!showTypographyControls)}
                title="Reading Typography & Theme Customization"
                aria-label="Reading appearance settings"
              >
                <Type size={14} />
                <span className="tool-btn-text">Appearance</span>
              </button>

              {showTypographyControls && (
                <div className="typography-dropdown-menu">
                  <div className="menu-section">
                    <span className="menu-heading">Reading Theme</span>
                    <div className="theme-toggle-row">
                      <button
                        type="button"
                        className={`theme-option-btn ${readingTheme === 'obsidian' ? 'active' : ''}`}
                        onClick={() => setReadingTheme('obsidian')}
                        title="Dark Obsidian"
                      >
                        <Moon size={13} />
                        <span>Obsidian</span>
                      </button>
                      <button
                        type="button"
                        className={`theme-option-btn ${readingTheme === 'sepia' ? 'active' : ''}`}
                        onClick={() => setReadingTheme('sepia')}
                        title="Warm Sepia Paper"
                      >
                        <Coffee size={13} />
                        <span>Sepia</span>
                      </button>
                      <button
                        type="button"
                        className={`theme-option-btn ${readingTheme === 'light' ? 'active' : ''}`}
                        onClick={() => setReadingTheme('light')}
                        title="Crisp Editorial White"
                      >
                        <Sun size={13} />
                        <span>Light</span>
                      </button>
                    </div>
                  </div>

                  <div className="menu-section">
                    <span className="menu-heading">Font Family</span>
                    <div className="theme-toggle-row">
                      <button
                        type="button"
                        className={`font-option-btn serif ${fontFamily === 'serif' ? 'active' : ''}`}
                        onClick={() => setFontFamily('serif')}
                      >
                        Newsreader
                      </button>
                      <button
                        type="button"
                        className={`font-option-btn sans ${fontFamily === 'sans' ? 'active' : ''}`}
                        onClick={() => setFontFamily('sans')}
                      >
                        Inter
                      </button>
                      <button
                        type="button"
                        className={`font-option-btn mono ${fontFamily === 'mono' ? 'active' : ''}`}
                        onClick={() => setFontFamily('mono')}
                      >
                        Mono
                      </button>
                    </div>
                  </div>

                  <div className="menu-section">
                    <div className="menu-row-label">
                      <span className="menu-heading">Font Size</span>
                      <span className="menu-val-indicator">{fontSize}px</span>
                    </div>
                    <div className="font-size-slider-row">
                      <span className="font-size-label-small">A</span>
                      <input
                        type="range"
                        min="15"
                        max="22"
                        step="1"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                        className="studio-slider compact"
                        aria-label="Font size slider"
                      />
                      <span className="font-size-label-large">A</span>
                    </div>
                  </div>

                  <div className="menu-section">
                    <span className="menu-heading">Measure Width</span>
                    <div className="theme-toggle-row">
                      <button
                        type="button"
                        className={`measure-btn ${readerWidth === 'compact' ? 'active' : ''}`}
                        onClick={() => setReaderWidth('compact')}
                      >
                        Compact
                      </button>
                      <button
                        type="button"
                        className={`measure-btn ${readerWidth === 'editorial' ? 'active' : ''}`}
                        onClick={() => setReaderWidth('editorial')}
                      >
                        Optimal (720px)
                      </button>
                      <button
                        type="button"
                        className={`measure-btn ${readerWidth === 'wide' ? 'active' : ''}`}
                        onClick={() => setReaderWidth('wide')}
                      >
                        Wide
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Focus Mode Toggle */}
            <button
              type="button"
              className={`tool-action-btn ${isFocusMode ? 'active' : ''}`}
              onClick={toggleFocusMode}
              title={isFocusMode ? 'Exit Distraction-Free Mode (Esc)' : 'Distraction-Free Editorial Mode'}
              aria-label="Toggle focus mode"
            >
              {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span className="tool-btn-text">{isFocusMode ? 'Exit Focus' : 'Focus'}</span>
            </button>

            {/* Quick Copy */}
            <button
              type="button"
              className={`tool-action-btn ${copied ? 'success' : ''}`}
              onClick={handleCopy}
              title="Copy pure story text"
              aria-label="Copy story"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span className="tool-btn-text">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Markdown Export */}
            <button
              type="button"
              className="tool-action-btn"
              onClick={() => exportStory('markdown')}
              title="Download story as Markdown"
              aria-label="Export Markdown"
            >
              <FileDown size={14} />
              <span className="tool-btn-text">Markdown</span>
            </button>

            {/* JSON Export */}
            <button
              type="button"
              className="tool-action-btn"
              onClick={() => exportStory('json')}
              title="Download story as JSON"
              aria-label="Export JSON"
            >
              <Download size={14} />
              <span className="tool-btn-text">JSON</span>
            </button>

            {/* Save to Chronicle */}
            <button
              type="button"
              className={`tool-action-btn ${saved ? 'success' : ''}`}
              onClick={handleSave}
              title="Save to local browser chronicle"
              aria-label="Save to history"
            >
              {saved ? <Check size={14} /> : <Bookmark size={14} />}
              <span className="tool-btn-text">{saved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </header>

        {/* Top Chapter Navigation Strip */}
        {(totalChapters > 0 || isDraftingNew || (displayedContent && displayedContent.length > 0)) && (
          <nav className="saga-chapter-nav-strip" aria-label="Chapter selector navigation">
            <div className="chapter-nav-pills-row">
              {totalChapters > 0 ? (
                chapters.map((ch, idx) => {
                  const isActive = idx === activeChapterIndex && !isDraftingNew;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`chapter-selector-pill ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveChapterIndex(idx)}
                      title={ch.title || `Chapter ${ch.number || idx + 1}`}
                      aria-label={`Switch to Chapter ${ch.number || idx + 1}`}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <BookOpen size={13} className="chapter-pill-icon" />
                      <span>Chapter {ch.number || idx + 1}</span>
                    </button>
                  );
                })
              ) : (
                <button
                  type="button"
                  className="chapter-selector-pill active"
                  aria-current="true"
                >
                  <BookOpen size={13} className="chapter-pill-icon" />
                  <span>Chapter 1</span>
                </button>
              )}

              {isDraftingNew && (
                <button
                  type="button"
                  className="chapter-selector-pill active drafting"
                  disabled
                  aria-label={`Chapter ${totalChapters + 1} Drafting`}
                >
                  <span className="chapter-drafting-dot" />
                  <span>Chapter {totalChapters + 1} (Drafting...)</span>
                </button>
              )}

              {/* [+ New Chapter] Action Button */}
              <button
                type="button"
                className="chapter-selector-pill new-chapter-pill"
                onClick={() => handleAutoDraftNextChapter(activeChapterIndex)}
                disabled={isGenerating || isDraftingHook}
                title="Draft next chapter premise"
                aria-label="Add new chapter"
              >
                <Plus size={13} />
                <span>New Chapter</span>
              </button>
            </div>
          </nav>
        )}

        {/* Tab Content Area */}
        <div className="tab-content-area">
          {activeTab === 'prose' ? (
            <div className="publication-reader-container">
              {/* Planning banner when model is actively reasoning inside thinking */}
              {!displayedContent && isGenerating && (
                <div className="thinking-planning-banner" role="status">
                  <div className="planning-spinner" />
                  <div className="planning-text">
                    <strong>Architecting narrative arc & characters...</strong>
                    <p>The reasoning model is formulating the plot beats before prose stream begins.</p>
                  </div>
                  {hasThinking && (
                    <button
                      type="button"
                      className="view-blueprint-btn"
                      onClick={() => {
                        if (onToggleBlueprint) {
                          onToggleBlueprint(true);
                        } else {
                          setActiveTab('thinking');
                        }
                      }}
                    >
                      <span>View Live Blueprint</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* Distraction-Free Publication Reader Column (Anti-Slop: Strictly active chapter prose) */}
              <article
                className="reader-prose-column"
                style={{ fontSize: `${fontSize}px` }}
              >
                {/* Current Active Chapter */}
                {displayedContent && (
                  <div className="current-chapter-unit">
                    {/* Active Scene Illustration Banner */}
                    {sceneIllustrator?.lastGeneratedImage && (
                      <div className="chapter-scene-illustration-banner">
                        <div className="banner-image-container">
                          <img
                            src={sceneIllustrator.lastGeneratedImage.imageUrl || sceneIllustrator.lastGeneratedImage.dataUrl}
                            alt={sceneIllustrator.lastGeneratedImage.prompt || 'Scene Illustration'}
                            className="banner-artwork-img"
                          />
                          <div className="banner-vignette-overlay" />
                          <div className="banner-content-overlay">
                            <span className="banner-style-badge">
                              {IMAGE_STYLE_PRESETS[sceneIllustrator.lastGeneratedImage.stylePreset]?.name || 'Scene Illustration'}
                            </span>
                            <p className="banner-prompt-text">
                              "{sceneIllustrator.lastGeneratedImage.prompt}"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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
                              const isAudioActive = Boolean(audioTheater?.isPlaying || audioTheater?.isPaused);
                              const sentenceTokens = tokenizeSentences(para);

                              return (
                                <p
                                  key={pIdx}
                                  className={`reader-paragraph ${isOpeningPara ? 'drop-cap' : ''}`}
                                >
                                  {sentenceTokens.length > 0 ? (
                                    sentenceTokens.map((sent) => {
                                      const isHighlighted =
                                        isAudioActive &&
                                        audioTheater?.activeParagraphIdx === pIdx &&
                                        audioTheater?.activeSentenceIdx === sent.sentenceIdx;

                                      return (
                                        <span
                                          key={sent.sentenceIdx}
                                          className={`prose-sentence ${isHighlighted ? 'audio-highlight-active' : ''}`}
                                        >
                                          {sent.text}{' '}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    para
                                  )}
                                  {isLastPara && isGenerating && (
                                    <span className="streaming-cursor" aria-hidden="true" />
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

              {/* Bottom Guided CTA Card ("The Next Chapter Hook") */}
              {canShowCta && (
                <section className="guided-next-chapter-cta" aria-label="Next Chapter Guided Hook">
                  <div className="guided-cta-header">
                    <div className="guided-cta-title-row">
                      <BookOpen size={16} className="guided-cta-icon" />
                      <h4 className="guided-cta-title">Chapter {displayedChapterNumber} Concluded</h4>
                    </div>
                    <p className="guided-cta-desc">
                      Synthesize open plot threads, character tensions, and dramatic stakes into Chapter {displayedChapterNumber + 1}.
                    </p>
                  </div>
                  <div className="guided-cta-actions">
                    <button
                      type="button"
                      className="cta-btn cta-btn-primary"
                      onClick={() => handleAutoDraftNextChapter(activeChapterIndex)}
                      disabled={isGenerating || isDraftingHook}
                      aria-label={`Auto-Draft Chapter ${displayedChapterNumber + 1} Premise`}
                    >
                      <Sparkles size={14} className={isDraftingHook ? 'spin-icon' : ''} />
                      <span>{isDraftingHook ? 'Synthesizing...' : `Auto-Draft Chapter ${displayedChapterNumber + 1} Premise`}</span>
                    </button>
                    <button
                      type="button"
                      className="cta-btn cta-btn-secondary"
                      onClick={handleContinueToNextChapter}
                      disabled={isGenerating}
                      aria-label={`Continue to Chapter ${displayedChapterNumber + 1}`}
                    >
                      <span>Continue to Chapter {displayedChapterNumber + 1}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </section>
              )}

              {/* Bottom Book Pagination Stepper Controls */}
              {(totalChapters > 0 || isDraftingNew) && (
                <nav className="book-pagination-stepper" aria-label="Book Pagination Controls">
                  <button
                    type="button"
                    className="stepper-btn prev-btn"
                    onClick={() => setActiveChapterIndex(activeChapterIndex - 1)}
                    disabled={activeChapterIndex <= 0 || isDraftingNew}
                    aria-label="Previous Chapter"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous Chapter</span>
                  </button>

                  <div className="stepper-indicator-wrap">
                    <span className="stepper-indicator">
                      Chapter {displayedChapterNumber} of {Math.max(totalChapters, 1)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="stepper-btn next-btn"
                    onClick={() => setActiveChapterIndex(activeChapterIndex + 1)}
                    disabled={activeChapterIndex >= totalChapters - 1 || isDraftingNew}
                    aria-label="Next Chapter"
                  >
                    <span>Next Chapter</span>
                    <ChevronRight size={14} />
                  </button>
                </nav>
              )}

              {/* Interactive Branching Choices */}
              {!isGenerating && <BranchChoices />}
            </div>
          ) : (
            <div className="thinking-container" role="tabpanel">
              <div className="thinking-info-banner">
                <BrainCircuit size={16} />
                <span>
                  <strong>Chapter {displayedChapterNumber} Reasoning Blueprint:</strong> Formulated during the Chain-of-Thought planning phase before prose generation.
                </span>
              </div>
              {displayedThinking && displayedThinking.trim() ? (
                <pre className="thinking-raw">{displayedThinking}</pre>
              ) : (
                <div className="blueprint-empty-tab-notice">
                  <BrainCircuit size={28} className="blueprint-empty-tab-icon" />
                  <h4>No Reasoning Blueprint Recorded</h4>
                  <p>
                    No reasoning blueprint recorded for Chapter {displayedChapterNumber}. CoT planning was either disabled or uncaptured for this chapter.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scoped CSS for Multi-Chapter Saga UI & Book Pagination */}
      <style>{`
        .saga-chapter-nav-strip {
          display: flex;
          align-items: center;
          padding: 0.6rem 1.25rem;
          background: var(--bg-surface-elevated, #18181b);
          border-bottom: 1px solid var(--border-subtle, #27272a);
          overflow-x: auto;
          scrollbar-width: thin;
        }

        .chapter-nav-pills-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: nowrap;
        }

        .chapter-selector-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.32rem 0.75rem;
          background: var(--bg-surface, #09090b);
          border: 1px solid var(--border-subtle, #27272a);
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary, #a1a1aa);
          cursor: pointer;
          white-space: nowrap;
          transition: all 140ms ease;
          user-select: none;
        }

        .chapter-selector-pill:hover:not(:disabled) {
          background: var(--bg-surface-hover, #27272a);
          color: var(--text-primary, #fafafa);
          border-color: var(--border-highlight, #3f3f46);
        }

        .chapter-selector-pill.active {
          background: #fafafa;
          color: #09090b;
          border-color: #fafafa;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .chapter-selector-pill.active .chapter-pill-icon {
          color: #09090b;
        }

        .chapter-selector-pill.drafting {
          background: var(--accent-amber-subtle, rgba(217, 119, 6, 0.15));
          border-color: rgba(217, 119, 6, 0.4);
          color: var(--accent-amber, #d97706);
        }

        .chapter-drafting-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--accent-amber, #d97706);
          animation: pulse-dot-anim 1.2s infinite;
          flex-shrink: 0;
        }

        .chapter-selector-pill.new-chapter-pill {
          background: transparent;
          border: 1px dashed rgba(217, 119, 6, 0.5);
          color: var(--accent-amber, #d97706);
        }

        .chapter-selector-pill.new-chapter-pill:hover:not(:disabled) {
          background: var(--accent-amber-subtle, rgba(217, 119, 6, 0.12));
          border-style: solid;
          border-color: var(--accent-amber, #d97706);
          color: #fbbf24;
        }

        .chapter-selector-pill:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .guided-next-chapter-cta {
          margin: 2.25rem 0 1rem;
          padding: 1.25rem 1.4rem;
          background: linear-gradient(135deg, var(--bg-surface-elevated, #18181b) 0%, var(--bg-surface, #09090b) 100%);
          border: 1px solid rgba(217, 119, 6, 0.35);
          border-radius: 8px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .guided-cta-header {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .guided-cta-title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .guided-cta-icon {
          color: var(--accent-amber, #d97706);
          flex-shrink: 0;
        }

        .guided-cta-title {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary, #fafafa);
          letter-spacing: -0.01em;
        }

        .guided-cta-desc {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.5;
          color: var(--text-muted, #71717a);
        }

        .guided-cta-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.65rem;
          margin-top: 0.25rem;
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 0.95rem;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 140ms ease;
          user-select: none;
        }

        .cta-btn-primary {
          background: var(--accent-amber, #d97706);
          color: #ffffff;
          border: 1px solid var(--accent-amber, #d97706);
          box-shadow: 0 1px 3px rgba(217, 119, 6, 0.3);
        }

        .cta-btn-primary:hover:not(:disabled) {
          background: #b45309;
          border-color: #b45309;
        }

        .cta-btn-secondary {
          background: var(--bg-surface-elevated, #18181b);
          color: var(--text-primary, #fafafa);
          border: 1px solid var(--border-subtle, #27272a);
        }

        .cta-btn-secondary:hover:not(:disabled) {
          background: var(--bg-surface-hover, #27272a);
          border-color: var(--border-highlight, #3f3f46);
        }

        .cta-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .book-pagination-stepper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.15rem 0.5rem;
          margin-top: 1.75rem;
          border-top: 1px solid var(--border-subtle, #27272a);
        }

        .stepper-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.42rem 0.85rem;
          background: var(--bg-surface-elevated, #18181b);
          border: 1px solid var(--border-subtle, #27272a);
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary, #a1a1aa);
          cursor: pointer;
          transition: all 140ms ease;
          user-select: none;
        }

        .stepper-btn:hover:not(:disabled) {
          background: var(--bg-surface-hover, #27272a);
          color: var(--text-primary, #fafafa);
          border-color: var(--border-highlight, #3f3f46);
        }

        .stepper-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .stepper-indicator-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stepper-indicator {
          font-family: var(--font-mono, monospace);
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-muted, #71717a);
          letter-spacing: 0.02em;
        }

        .blueprint-empty-tab-notice {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3.5rem 1.5rem;
          text-align: center;
          gap: 0.6rem;
        }

        .blueprint-empty-tab-icon {
          color: var(--text-faint, #52525b);
          margin-bottom: 0.25rem;
        }

        .blueprint-empty-tab-notice h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-secondary, #a1a1aa);
          margin: 0;
        }

        .blueprint-empty-tab-notice p {
          font-size: 0.8rem;
          color: var(--text-muted, #71717a);
          max-width: 380px;
          margin: 0;
          line-height: 1.5;
        }

        .reader-theme-sepia .saga-chapter-nav-strip {
          background: #f5eedf;
          border-bottom-color: #ded6c8;
        }
        .reader-theme-sepia .chapter-selector-pill {
          background: #fbf7ee;
          border-color: #ded6c8;
          color: #4a443d;
        }
        .reader-theme-sepia .chapter-selector-pill.active {
          background: #2d2926;
          color: #fbf7ee;
          border-color: #2d2926;
        }
        .reader-theme-sepia .guided-next-chapter-cta {
          background: #f5eedf;
          border-color: #cfc4b2;
        }
        .reader-theme-sepia .stepper-btn {
          background: #f5eedf;
          border-color: #ded6c8;
          color: #4a443d;
        }

        .reader-theme-light .saga-chapter-nav-strip {
          background: #f8fafc;
          border-bottom-color: #e2e8f0;
        }
        .reader-theme-light .chapter-selector-pill {
          background: #ffffff;
          border-color: #e2e8f0;
          color: #334155;
        }
        .reader-theme-light .chapter-selector-pill.active {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }
        .reader-theme-light .guided-next-chapter-cta {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .reader-theme-light .stepper-btn {
          background: #f8fafc;
          border-color: #e2e8f0;
          color: #334155;
        }
      `}</style>
    </div>
  );
}
