/**
 * Studio Workspace View (Frontend MVC - View Layer)
 * Three-pane editorial studio layout composing Narrative Controls,
 * Center Prompt + Paginated Reader, Blueprint CoT Sidebar, and Modals.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Feather,
  BookMarked,
  History,
  Settings2,
  PanelLeftClose,
  PanelLeftOpen,
  BrainCircuit,
  FileDown,
  Download,
  Cpu
} from 'lucide-react';
import { useStory } from '../context/StoryContext';
import NarrativeControlPanel from '../components/NarrativeControlPanel';
import PromptInput from '../components/PromptInput';
import StoryViewer from '../components/StoryViewer';
import NarrativeBlueprintSidebar from '../components/NarrativeBlueprintSidebar';
import StoryBibleModal from '../components/StoryBibleModal';
import HistoryDrawer from '../components/HistoryDrawer';
import SettingsModal from '../components/SettingsModal';

export default function StudioWorkspaceView() {
  const { storyBible, history, telemetry, exportStory, story, thinking, isGenerating } = useStory();
  const [isBibleOpen, setIsBibleOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 860;
    }
    return true;
  });
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const autoOpenedBlueprintRef = useRef(false);

  useEffect(() => {
    let prevWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (prevWidth > 860 && currentWidth <= 860) {
        setIsSidebarOpen(false);
      } else if (prevWidth <= 860 && currentWidth > 860) {
        setIsSidebarOpen(true);
      }
      prevWidth = currentWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasBibleData = Boolean(
    storyBible.characters?.trim() || storyBible.worldRules?.trim() || storyBible.canonNotes?.trim()
  );
  const hasThinking = Boolean(thinking && thinking.trim().length > 0);
  const isReasoningStream = isGenerating && !story && hasThinking;

  // Auto-open blueprint sidebar at most once per generation when reasoning begins
  useEffect(() => {
    if (!isGenerating) {
      autoOpenedBlueprintRef.current = false;
      return;
    }
    if (thinking && !story && !isFocusMode && !autoOpenedBlueprintRef.current) {
      autoOpenedBlueprintRef.current = true;
      setIsBlueprintOpen(true);
    }
  }, [isGenerating, thinking, story, isFocusMode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const targetTag = e.target.tagName.toLowerCase();
      const isTyping = targetTag === 'textarea' || targetTag === 'input';

      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'b') {
        if (!isTyping) {
          e.preventDefault();
          setIsSidebarOpen((prev) => !prev);
        }
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'b')
      ) {
        if (!isTyping) {
          e.preventDefault();
          setIsBlueprintOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  return (
    <div className={`studio-root ${isFocusMode ? 'focus-mode-active' : ''}`}>
      {!isFocusMode && (
        <header className="studio-top-bar" role="banner">
          <div className="bar-left-group">
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
            </button>

            <div className="studio-brand">
              <Feather size={18} className="brand-icon" />
              <span className="brand-name">Mythos Studio</span>
            </div>

            <div className="engine-status-tag" title="Active LLM Provider Engine">
              <Cpu size={12} className="engine-icon" />
              <span>Engine: {telemetry.activeProvider || 'Auto-Routing'}</span>
            </div>
          </div>

          <div className="bar-right-group">
            {story && (
              <div className="bar-export-actions">
                <button
                  type="button"
                  className="bar-icon-btn"
                  onClick={() => exportStory('markdown')}
                  title="Download current narrative as Markdown (.md)"
                >
                  <FileDown size={14} />
                  <span className="btn-label-desktop">Markdown</span>
                </button>
                <button
                  type="button"
                  className="bar-icon-btn"
                  onClick={() => exportStory('json')}
                  title="Export narrative saga & metadata as JSON"
                >
                  <Download size={14} />
                  <span className="btn-label-desktop">JSON</span>
                </button>
              </div>
            )}

            <button
              type="button"
              className={`bar-btn ${hasBibleData ? 'has-active-data' : ''}`}
              onClick={() => setIsBibleOpen(true)}
              title="Open Story Bible to lock character profiles and canon rules"
            >
              <BookMarked size={14} />
              <span className="btn-label-desktop">Story Bible</span>
              {hasBibleData && <span className="active-dot" />}
            </button>

            <button
              type="button"
              className="bar-btn"
              onClick={() => setIsHistoryOpen(true)}
              title="View saved stories chronicle"
            >
              <History size={14} />
              <span className="btn-label-desktop">Chronicle</span>
              <span className="badge-counter">{history.length}</span>
            </button>

            <button
              type="button"
              className={`bar-btn ${isBlueprintOpen ? 'active' : ''} ${hasThinking ? 'has-active-data' : ''}`}
              onClick={() => setIsBlueprintOpen(!isBlueprintOpen)}
              title={isBlueprintOpen ? 'Collapse Blueprint Scratchpad (Ctrl+J)' : 'Open Blueprint Scratchpad (Ctrl+J)'}
              aria-label="Toggle Narrative Blueprint"
            >
              <BrainCircuit size={14} />
              <span className="btn-label-desktop">Blueprint</span>
              {isReasoningStream ? (
                <span className="pulse-dot-amber" />
              ) : hasThinking ? (
                <span className="active-dot" />
              ) : null}
            </button>

            <button
              type="button"
              className="bar-btn"
              onClick={() => setIsSettingsOpen(true)}
              title="Inference Engine & BYOK Settings"
            >
              <Settings2 size={14} />
              <span className="btn-label-desktop">Settings</span>
            </button>
          </div>
        </header>
      )}

      <div className="studio-workspace-body">
        {!isFocusMode && (
          <>
            {isSidebarOpen && (
              <div
                className="sidebar-backdrop-overlay"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
              />
            )}
            <div className={`studio-sidebar-wrapper ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
              <div className="sidebar-inner-scroller">
                <NarrativeControlPanel
                  onOpenBible={() => setIsBibleOpen(true)}
                  onCloseSidebar={() => setIsSidebarOpen(false)}
                />
              </div>
            </div>
          </>
        )}

        <main className={`studio-center-stage ${isFocusMode ? 'in-focus-mode' : ''}`} role="main">
          <div className="center-stage-container">
            {!isFocusMode && (
              <section className="studio-prompt-section">
                <PromptInput />
              </section>
            )}

            <section className="studio-reader-section">
              <StoryViewer
                isFocusMode={isFocusMode}
                onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                isBlueprintOpen={isBlueprintOpen}
                onToggleBlueprint={(force) => setIsBlueprintOpen(force !== undefined ? force : !isBlueprintOpen)}
              />
            </section>
          </div>
        </main>

        {!isFocusMode && (
          <>
            {isBlueprintOpen && (
              <div
                className="blueprint-backdrop-overlay"
                onClick={() => setIsBlueprintOpen(false)}
                aria-hidden="true"
              />
            )}
            <NarrativeBlueprintSidebar
              isOpen={isBlueprintOpen}
              onClose={() => setIsBlueprintOpen(false)}
            />
          </>
        )}
      </div>

      <StoryBibleModal isOpen={isBibleOpen} onClose={() => setIsBibleOpen(false)} />
      <HistoryDrawer isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
