import React, { useState } from 'react';

export default function StoryOutput({ story, error }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(story);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (error) {
    return (
      <div className="error-message">
        ⚠️ {error}
      </div>
    );
  }

  if (!story) {
    return null;
  }

  return (
    <div className="story-output">
      <div className="story-header">
        <h2>Your Elaborated Story</h2>
        <button 
          className={`copy-button ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          aria-label="Copy story to clipboard"
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>
      <div className="glass-panel">
        <div className="story-content">
          {story}
        </div>
      </div>
    </div>
  );
}
