import React from 'react';

export default function PromptInput({ value, onChange, onSubmit, disabled }) {
  const maxLength = 2000;
  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.9;

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="glass-input-wrapper">
      <textarea
        className="glass-textarea"
        placeholder="Enter your story prompt here... e.g., 'A lonely astronaut discovers an ancient artifact on Mars...'"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={maxLength}
        aria-label="Story prompt input"
      />
      <div className={`char-counter ${isNearLimit ? 'warning' : ''}`}>
        {charCount} / {maxLength}
      </div>
    </div>
  );
}
