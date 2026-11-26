import React, { useEffect } from 'react';
import { History, X, ArrowRight, Trash2, Clock, BookOpen } from 'lucide-react';
import { useStory } from '../context/StoryContext';

export default function HistoryDrawer({ isOpen, onClose }) {
  const { history, restoreFromHistory, deleteHistoryItem } = useStory();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer-content studio-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <History className="modal-icon-svg" size={18} />
            <h2>Chronicle & Archives</h2>
            <span className="count-pill">{history.length}</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close chronicle (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        <p className="modal-subtitle">
          Local studio archive of generated chapters and multi-part narrative sagas.
        </p>

        {history.length === 0 ? (
          <div className="drawer-empty-state">
            <BookOpen size={24} className="empty-drawer-icon" />
            <p>No saved stories yet.</p>
            <span className="empty-sub">
              Generate a chapter and click <strong>Save</strong> on the reader toolbar to archive it here.
            </span>
          </div>
        ) : (
          <div className="history-entries-list">
            {history.map((item) => (
              <div key={item.id} className="history-entry-card">
                <div className="history-entry-meta">
                  <span className="history-genre-pill">{item.genre || 'Prose'}</span>
                  <div className="history-time-wrap">
                    <Clock size={11} />
                    <span>
                      {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="history-words-count">{item.wordCount || 0} words</span>
                  {item.chapters?.length > 1 && (
                    <span className="history-chapters-badge">{item.chapters.length} Chapters</span>
                  )}
                </div>

                <h4 className="history-entry-title">{item.title}</h4>
                <p className="history-snippet">
                  {item.story ? item.story.slice(0, 140) + '...' : 'No prose content.'}
                </p>

                <div className="history-card-actions">
                  <button
                    type="button"
                    className="history-restore-btn"
                    onClick={() => {
                      restoreFromHistory(item.id);
                      onClose();
                    }}
                  >
                    <span>Restore into Studio</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="history-delete-btn"
                    onClick={() => deleteHistoryItem(item.id)}
                    title="Delete from chronicle"
                    aria-label="Delete story"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
