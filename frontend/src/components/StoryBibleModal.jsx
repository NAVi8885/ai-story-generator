import React, { useEffect } from 'react';
import { BookMarked, X, Check } from 'lucide-react';
import { useStory } from '../context/StoryContext';

export default function StoryBibleModal({ isOpen, onClose }) {
  const { storyBible, updateStoryBible, isGenerating } = useStory();

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
      <div className="modal-content studio-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <BookMarked className="modal-icon-svg" size={18} />
            <h2>Story Bible & Canon Memory</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        <p className="modal-subtitle">
          Define immutable character profiles, world laws, and canon constraints. The model will adhere strictly to these canon facts across multi-chapter sagas.
        </p>

        <div className="bible-fields-grid">
          <div className="bible-field-card">
            <label className="field-label" htmlFor="bible-characters">
              <span className="field-name">Characters & Dramatis Personae</span>
              <span className="field-helper">Names, physical traits, internal motives, speech cadence</span>
            </label>
            <textarea
              id="bible-characters"
              className="studio-textarea compact"
              rows="4"
              placeholder="e.g., Mara Vance — Age 29. Disgraced cartographer with a limp. Cynical, guarded, fiercely protective of her younger sister. Speaks in brief, clipped sentences."
              value={storyBible.characters}
              onChange={(e) => updateStoryBible('characters', e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="bible-field-card">
            <label className="field-label" htmlFor="bible-rules">
              <span className="field-name">World Rules & Constraints</span>
              <span className="field-helper">Physics, magic taxes, societal hierarchy, tech boundaries</span>
            </label>
            <textarea
              id="bible-rules"
              className="studio-textarea compact"
              rows="4"
              placeholder="e.g., Alchemy requires an equivalent physical blood sacrifice; the dead cannot be revived under any circumstances. Orbital shuttles run on scarce helium-3 isotopes."
              value={storyBible.worldRules}
              onChange={(e) => updateStoryBible('worldRules', e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="bible-field-card">
            <label className="field-label" htmlFor="bible-canon">
              <span className="field-name">Established Canon & Continuity</span>
              <span className="field-helper">Past events and irreversible choices that cannot be retconned</span>
            </label>
            <textarea
              id="bible-canon"
              className="studio-textarea compact"
              rows="3"
              placeholder="e.g., The Archive fell three weeks ago. General Kael was assassinated by his own lieutenant."
              value={storyBible.canonNotes}
              onChange={(e) => updateStoryBible('canonNotes', e.target.value)}
              disabled={isGenerating}
            />
          </div>
        </div>

        <div className="modal-footer">
          <span className="esc-hint">Press <kbd>Esc</kbd> to close</span>
          <button
            type="button"
            className="studio-btn primary-generate-btn"
            onClick={onClose}
          >
            <Check size={14} />
            <span>Lock & Return to Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
