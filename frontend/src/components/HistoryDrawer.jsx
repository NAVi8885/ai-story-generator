import React from 'react';
import { useStory } from '../context/StoryContext';

export default function HistoryDrawer({ isOpen, onClose }) {
  const { history, restoreFromHistory, deleteHistoryItem } = useStory();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="drawer-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-area">
            <span className="modal-icon">📚</span>
            <h2>Story Chronicle & History</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close history">✕</button>
        </div>

        <p className="modal-subtitle">
          Stories and multi-chapter sagas saved locally in your browser.
        </p>

        {history.length === 0 ? (
          <div className="drawer-empty">
            <p>No saved stories yet. Generate a narrative and click <strong>💾 Save</strong> to preserve it here.</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item glass-panel">
                <div className="item-meta">
                  <span className="history-genre-badge">{item.genre || 'Story'}</span>
                  <span className="history-date">
                    {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="history-words">{item.wordCount || 0} words</span>
                  {item.chapters?.length > 1 && (
                    <span className="history-chapters-badge">{item.chapters.length} Chapters</span>
                  )}
                </div>

                <div className="history-title">{item.title}</div>
                <p className="history-snippet">{item.story.slice(0, 140)}...</p>

                <div className="history-actions">
                  <button
                    className="history-action-btn load-btn"
                    onClick={() => {
                      restoreFromHistory(item.id);
                      onClose();
                    }}
                  >
                    Restore & Continue →
                  </button>
                  <button
                    className="history-action-btn delete-btn"
                    onClick={() => deleteHistoryItem(item.id)}
                    title="Delete story"
                  >
                    🗑️
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
