import React, { useState } from 'react';
import {
  BrainCircuit,
  PanelRightClose,
  Copy,
  Check,
  Info
} from 'lucide-react';
import { useStory } from '../context/StoryContext';

export default function NarrativeBlueprintSidebar({ isOpen, onClose }) {
  const { chapters, activeChapterIndex, thinking, isGenerating, story } = useStory();
  const [copied, setCopied] = useState(false);

  const totalChapters = chapters?.length || 0;
  const isDraftingNew = isGenerating && activeChapterIndex === totalChapters;
  const currentChapterData = chapters?.[activeChapterIndex] || null;

  const displayedThinking = isDraftingNew
    ? thinking
    : (currentChapterData?.thinking ?? (activeChapterIndex === 0 && totalChapters === 0 ? thinking : (thinking || '')));

  const displayedChapterNumber = isDraftingNew
    ? totalChapters + 1
    : (currentChapterData?.number || activeChapterIndex + 1);

  const handleCopy = async () => {
    if (!displayedThinking) return;
    try {
      await navigator.clipboard.writeText(displayedThinking);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy blueprint:', err);
    }
  };

  const wordCount = displayedThinking && displayedThinking.trim() ? displayedThinking.trim().split(/\s+/).length : 0;
  const isReasoningActive = isGenerating && !story && Boolean(displayedThinking);

  return (
    <aside
      className={`studio-blueprint-sidebar ${isOpen ? 'expanded' : 'collapsed'}`}
      aria-label="Narrative Blueprint Scratchpad"
    >
      <div className="blueprint-inner-container">
        {/* Sidebar Header */}
        <div className="blueprint-header">
          <div className="blueprint-title-row">
            <div className="blueprint-title-group">
              <BrainCircuit className="blueprint-icon-svg" size={16} />
              <div className="blueprint-name-wrap">
                <h3>Narrative Blueprint</h3>
                <span className="blueprint-subtitle">Chapter {displayedChapterNumber} • CoT Scratchpad</span>
              </div>
            </div>

            <div className="blueprint-actions-group">
              {displayedThinking ? (
                <button
                  type="button"
                  className={`blueprint-tool-btn ${copied ? 'success' : ''}`}
                  onClick={handleCopy}
                  title="Copy Blueprint to clipboard"
                  aria-label="Copy blueprint"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              ) : null}
              <button
                type="button"
                className="blueprint-tool-btn"
                onClick={onClose}
                title="Collapse Blueprint (Ctrl+J)"
                aria-label="Collapse Blueprint"
              >
                <PanelRightClose size={16} />
              </button>
            </div>
          </div>

          <div className="blueprint-status-bar">
            {isReasoningActive ? (
              <span className="blueprint-status-pill pulsing">
                <span className="status-dot pulsing" />
                <span>Streaming Reasoning Beats...</span>
              </span>
            ) : displayedThinking ? (
              <span className="blueprint-status-pill ready">
                <span className="status-dot ready" />
                <span>{wordCount} words • Chapter {displayedChapterNumber} Locked</span>
              </span>
            ) : (
              <span className="blueprint-status-pill idle">
                <span className="status-dot idle" />
                <span>Chapter {displayedChapterNumber} Scratchpad Inactive</span>
              </span>
            )}
          </div>
        </div>

        {/* Sidebar Content Scroller */}
        <div className="blueprint-content-scroller">
          {displayedThinking ? (
            <div className="blueprint-body">
              <div className="blueprint-guidance-card">
                <Info size={14} className="guidance-icon" />
                <p>
                  Internal plot beats, character motivations, and narrative constraints formulated before Chapter {displayedChapterNumber} prose generation.
                </p>
              </div>
              <pre className="blueprint-raw-text">{displayedThinking}</pre>
            </div>
          ) : (
            <div className="blueprint-empty-card">
              <div className="blueprint-empty-icon-wrap">
                <BrainCircuit size={28} className="blueprint-empty-icon" />
              </div>
              <h4>Chapter {displayedChapterNumber} Scratchpad Ready</h4>
              <p>
                When reasoning is enabled in Narrative Controls (Chain-of-Thought), Chapter {displayedChapterNumber}'s structural beat outline, world constraints, and internal reasoning stream live into this scratchpad before prose generation.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="blueprint-footer">
          <span className="blueprint-shortcut-tip">
            Toggle with <kbd>⌘/Ctrl</kbd> + <kbd>J</kbd>
          </span>
        </div>
      </div>
    </aside>
  );
}
