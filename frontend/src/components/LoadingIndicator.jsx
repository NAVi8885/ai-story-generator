import React from 'react';

export default function LoadingIndicator() {
  return (
    <div className="loading-container glass-panel">
      <div className="loading-orbs">
        <div className="orb"></div>
        <div className="orb"></div>
        <div className="orb"></div>
      </div>
      <div className="loading-wave">
        <div className="loading-wave-fill"></div>
      </div>
      <p className="loading-text">Crafting your story...</p>
    </div>
  );
}
