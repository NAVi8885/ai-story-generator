import React from 'react';
import { GitFork, ArrowRight } from 'lucide-react';
import { useStory } from '../context/StoryContext';

export default function BranchChoices() {
  const { branchChoices, continueWithBranch, isGenerating } = useStory();

  if (!branchChoices || branchChoices.length === 0) return null;

  return (
    <div className="branch-choices-section" aria-label="Narrative Trajectory Choices">
      <div className="branch-header-row">
        <div className="branch-title-group">
          <GitFork className="branch-icon-svg" size={16} />
          <h4>Branch Narrative Trajectory</h4>
        </div>
        <span className="branch-subtitle">Select a continuation path for Chapter Next:</span>
      </div>

      <div className="branch-cards-grid">
        {branchChoices.map((choice, index) => (
          <button
            key={index}
            type="button"
            className="branch-choice-card"
            onClick={() => continueWithBranch(choice)}
            disabled={isGenerating}
          >
            <div className="branch-card-top">
              <span className="branch-pill-index">Path {index + 1}</span>
              <span className="branch-card-cta">
                <span>Continue</span>
                <ArrowRight size={13} />
              </span>
            </div>
            <h5 className="branch-card-title">{choice.title}</h5>
            <p className="branch-card-desc">{choice.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
