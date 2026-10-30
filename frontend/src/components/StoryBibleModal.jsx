import React from 'react';
import { useStory } from '../context/StoryContext';

export default function StoryBibleModal({ isOpen, onClose }) {
  const { storyBible, updateStoryBible, isGenerating } = useStory();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-area">
            <span className="modal-icon">📖</span>
            <h2>Story Bible & Context Lock</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <p className="modal-subtitle">
          Pin immutable character sheets, world laws, and canon events into the prompt context.
          The AI will remember and strictly adhere to these facts across chapters.
        </p>

        <div className="bible-fields">
          <div className="bible-field">
            <label>
              <strong>Protagonist & Character Roster</strong>
              <span className="helper-text">Names, physical traits, emotional wounds, motivations, flaws</span>
            </label>
            <textarea
              className="glass-textarea compact"
              rows="4"
              placeholder="e.g. Mara Vance — Age 29. Disgraced cartographer. Limps on left knee from a collapsed mine. Cynical, but fiercely protective of her younger sister. Speaks with clipped sentences."
              value={storyBible.characters}
              onChange={(e) => updateStoryBible('characters', e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="bible-field">
            <label>
              <strong>World Rules & Magic / Tech Constraints</strong>
              <span className="helper-text">Laws of nature, technology limits, social hierarchy, magic costs</span>
            </label>
            <textarea
              className="glass-textarea compact"
              rows="4"
              placeholder="e.g. Magic requires equal physical blood cost; no spell can resurrect the dead. Sub-orbital shuttles require helium-3 isotopes that are strictly rationed by the Ministry."
              value={storyBible.worldRules}
              onChange={(e) => updateStoryBible('worldRules', e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="bible-field">
            <label>
              <strong>Established Canon & History Log</strong>
              <span className="helper-text">Key past events that cannot be retconned</span>
            </label>
            <textarea
              className="glass-textarea compact"
              rows="3"
              placeholder="e.g. The Citadel burned three months ago. The King was assassinated by his own guard."
              value={storyBible.canonNotes}
              onChange={(e) => updateStoryBible('canonNotes', e.target.value)}
              disabled={isGenerating}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="glass-button secondary" onClick={onClose}>
            Done & Lock Context
          </button>
        </div>
      </div>
    </div>
  );
}

