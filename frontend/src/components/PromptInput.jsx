import React from 'react';
import { useStory } from '../context/StoryContext';

const SEED_SUGGESTIONS = [
  'A deep-sea archaeologist finds an unrusted Victorian pocket watch inside a 50,000-year-old trench anomaly.',
  'An old apothecary sells bottled emotions in a dying city where feeling grief has been outlawed.',
  'A terraforming station on Mars receives a distress beacon from Earth—dated 200 years in the future.',
  'A master cartographer realizes that every island she draws into existence appears in the real sea overnight.'
];

export default function PromptInput() {
  const {
    prompt,
    setPrompt,
    generateStory,
    stopGeneration,
    enhancePrompt,
    isGenerating,
    isEnhancing
  } = useStory();

  const maxLength = 2500;
  const charCount = prompt.length;
  const isNearLimit = charCount > maxLength * 0.9;

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isGenerating && prompt.trim()) {
        generateStory();
      }
    }
  };

  const handlePickSeed = (seed) => {
    setPrompt(seed);
  };

  return (
    <div className="prompt-input-wrapper">
      <div className="input-toolbar">
        <label className="input-label" htmlFor="story-seed-textarea">
          <span>Story Premise / Narrative Seed</span>
        </label>
        <button
          type="button"
          className="enhance-btn"
          onClick={enhancePrompt}
          disabled={isGenerating || isEnhancing || !prompt.trim()}
          title="Auto-expands short or vague prompts into rich sensory narrative setups"
        >
          {isEnhancing ? '✨ Enhancing...' : '✨ Enhance Premise'}
        </button>
      </div>

      <div className="glass-input-wrapper">
        <textarea
          id="story-seed-textarea"
          className="glass-textarea"
          placeholder="Enter a premise or spark... e.g., 'A clockmaker discovers that winding an antique music box pauses the flow of time for everyone except him...'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          maxLength={maxLength}
          rows="4"
        />

        <div className="input-footer-row">
          <div className="seed-suggestions">
            <span className="seeds-label">Quick sparks:</span>
            {SEED_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                className="seed-tag-btn"
                onClick={() => handlePickSeed(s)}
                disabled={isGenerating}
              >
                Spark {idx + 1}
              </button>
            ))}
          </div>

          <div className={`char-counter ${isNearLimit ? 'warning' : ''}`}>
            {charCount} / {maxLength}
          </div>
        </div>
      </div>

      <div className="action-row">
        {isGenerating ? (
          <button
            type="button"
            className="glass-button stop-btn"
            onClick={stopGeneration}
          >
            ⏹ Stop Generating
          </button>
        ) : (
          <button
            type="button"
            className="glass-button primary-generate-btn"
            onClick={() => generateStory()}
            disabled={!prompt.trim()}
          >
            ✨ Generate Immersive Story
          </button>
        )}
      </div>
    </div>
  );
}
