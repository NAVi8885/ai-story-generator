import React from 'react';
import { useStory } from '../context/StoryContext';

export default function BranchChoices() {
  const { branchChoices, continueWithBranch, isGenerating } = useStory();

  if (!branchChoices || branchChoices.length === 0) return null;

  return (
    <div className="branch-choices-container">
      <div className="branch-header">
        <span className="branch-icon">🔀</span>
        <h4>Steer the Narrative (Chapter Fork)</h4>
      </div>
      <p className="branch-subtext">Choose an action to generate the next chapter along this trajectory:</p>

      <div className="branch-cards-grid">
        {branchChoices.map((choice, index) => (
          <button
            key={index}
            className="branch-card glass-panel"
            onClick={() => continueWithBranch(choice)}
            disabled={isGenerating}
          >
            <div className="card-badge">Choice {index + 1}</div>
            <div className="card-title">{choice.title}</div>
            <div className="card-desc">{choice.description}</div>
            <div className="card-action">Continue this path →</div>
          </button>
        ))}
      </div>
    </div>
  );
}
