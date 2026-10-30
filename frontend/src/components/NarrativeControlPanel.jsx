import React, { useState } from 'react';
import { useStory, GENRE_PRESETS } from '../context/StoryContext';

export default function NarrativeControlPanel() {
  const { sliders, updateSlider, resetSliders, genre, applyGenrePreset, isGenerating } = useStory();
  const [collapsed, setCollapsed] = useState(false);

  const getCreativityLabel = (val) => {
    if (val <= 0.4) return 'Literal & Direct';
    if (val <= 0.75) return 'Grounded Realism';
    if (val <= 1.0) return 'Rich & Vivid';
    return 'Wildly Figurative';
  };

  const getStrictnessLabel = (val) => {
    if (val <= 35) return 'Creative Liberty (Wild)';
    if (val <= 70) return 'Guided Interpretation';
    return 'Strict Canon Adherence';
  };

  return (
    <div className={`glass-panel narrative-controls-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="header-title">
          <span className="panel-icon">🎛️</span>
          <h3>Narrative Control Matrix</h3>
          <span className="active-badge">{genre.toUpperCase()}</span>
        </div>
        <button
          className="collapse-toggle-btn"
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? '▾ Expand' : '▴ Hide'}
        </button>
      </div>

      {!collapsed && (
        <div className="panel-body">
          {/* Genre Presets */}
          <div className="control-group">
            <label className="control-label">
              <span>Genre Presets</span>
              <button
                type="button"
                className="text-action-btn"
                onClick={resetSliders}
                disabled={isGenerating}
              >
                ↺ Reset Sliders
              </button>
            </label>
            <div className="chips-grid">
              {GENRE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`chip-button ${genre === p.id ? 'active' : ''}`}
                  onClick={() => applyGenrePreset(p.id)}
                  disabled={isGenerating}
                >
                  <span className="chip-icon">{p.icon}</span>
                  <span className="chip-name">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sliders-grid">
            {/* 1. Creativity Dial */}
            <div className="control-item">
              <div className="item-label-row">
                <span className="item-title">Creativity & Metaphor</span>
                <span className="item-readout highlight">
                  {sliders.creativity.toFixed(2)} — {getCreativityLabel(sliders.creativity)}
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.4"
                step="0.05"
                value={sliders.creativity}
                onChange={(e) => updateSlider('creativity', parseFloat(e.target.value))}
                disabled={isGenerating}
                className="glass-slider"
              />
              <div className="slider-ticks">
                <span>Direct</span>
                <span>Balanced</span>
                <span>Surreal</span>
              </div>
            </div>

            {/* 2. Prompt Strictness */}
            <div className="control-item">
              <div className="item-label-row">
                <span className="item-title">Prompt Strictness / Canon</span>
                <span className="item-readout">{sliders.strictness}% — {getStrictnessLabel(sliders.strictness)}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={sliders.strictness}
                onChange={(e) => updateSlider('strictness', parseInt(e.target.value, 10))}
                disabled={isGenerating}
                className="glass-slider"
              />
              <div className="slider-ticks">
                <span>Freeform</span>
                <span>Guided</span>
                <span>100% Strict</span>
              </div>
            </div>

            {/* 3. Tone & Atmosphere */}
            <div className="control-item full-width">
              <div className="item-label-row">
                <span className="item-title">Tone & Atmosphere</span>
                <span className="item-readout capitalize">{sliders.tone}</span>
              </div>
              <div className="segmented-control">
                {[
                  { id: 'whimsical', label: 'Whimsical' },
                  { id: 'lighthearted', label: 'Light' },
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'gritty', label: 'Gritty' },
                  { id: 'dark', label: 'Dark Grim' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`segment-btn ${sliders.tone === t.id ? 'active' : ''}`}
                    onClick={() => updateSlider('tone', t.id)}
                    disabled={isGenerating}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Pacing & Detail Density */}
            <div className="control-item full-width">
              <div className="item-label-row">
                <span className="item-title">Pacing & Detail Density</span>
                <span className="item-readout capitalize">{sliders.pacing}</span>
              </div>
              <div className="segmented-control">
                {[
                  { id: 'action', label: '⚡ Fast Action' },
                  { id: 'brisk', label: '🏃 Brisk' },
                  { id: 'balanced', label: '⚖️ Dynamic' },
                  { id: 'atmospheric', label: '🌫️ Atmospheric' },
                  { id: 'slow-burn', label: '🕯️ Slow-Burn Lore' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`segment-btn ${sliders.pacing === p.id ? 'active' : ''}`}
                    onClick={() => updateSlider('pacing', p.id)}
                    disabled={isGenerating}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Target Length */}
            <div className="control-item">
              <div className="item-label-row">
                <span className="item-title">Target Length</span>
              </div>
              <div className="segmented-control compact">
                {[
                  { id: 'flash', label: 'Flash (~350w)' },
                  { id: 'short', label: 'Short (~650w)' },
                  { id: 'standard', label: 'Standard (~1.2kw)' },
                  { id: 'chapter', label: 'Chapter (~2kw)' }
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={`segment-btn ${sliders.targetLength === l.id ? 'active' : ''}`}
                    onClick={() => updateSlider('targetLength', l.id)}
                    disabled={isGenerating}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Thinking / Reasoning Depth */}
            <div className="control-item">
              <div className="item-label-row">
                <span className="item-title">Plot Blueprint (&lt;thinking&gt;)</span>
              </div>
              <div className="segmented-control compact">
                {[
                  { id: 'off', label: 'Off' },
                  { id: 'fast', label: '3 Beats' },
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'deep', label: 'Deep CoT' }
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    className={`segment-btn ${sliders.thinkingDepth === th.id ? 'active' : ''}`}
                    onClick={() => updateSlider('thinkingDepth', th.id)}
                    disabled={isGenerating}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
