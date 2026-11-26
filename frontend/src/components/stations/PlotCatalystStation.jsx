import React, { useState } from 'react';
import {
  Dices,
  Clock,
  Skull,
  EyeOff,
  KeyRound,
  Wrench,
  UserX,
  AlertTriangle,
  Sparkles,
  Zap,
  History,
  CheckCircle2,
  CircleDot
} from 'lucide-react';
import { useStory } from '../../context/StoryContext';
import {
  NARRATIVE_COMPLICATIONS,
  SEVERITY_LEVELS
} from '../../utils/narrativeDice';

const COMPLICATION_ICONS = {
  ticking_clock: Clock,
  betrayal: Skull,
  sensory_anomaly: EyeOff,
  forbidden_revelation: KeyRound,
  mechanical_failure: Wrench,
  unwelcome_guest: UserX
};

export default function PlotCatalystStation() {
  const {
    plotCatalyst,
    rollCatalystDice,
    setCatalystSeverity,
    toggleCatalystInjection,
    setCustomWildcard,
    isGenerating
  } = useStory();

  const isEnabled = Boolean(plotCatalyst?.enabled);
  const currentComplicationName = plotCatalyst?.selectedComplication || 'Ticking Clock';
  const severity = plotCatalyst?.severity ?? 3;
  const customWildcard = plotCatalyst?.customWildcard || '';
  const history = plotCatalyst?.history || [];

  const [isRolling, setIsRolling] = useState(false);
  const [selectedExample, setSelectedExample] = useState('');

  // Find active complication data
  const activeComplication = NARRATIVE_COMPLICATIONS.find(
    (c) => c.name.toLowerCase() === currentComplicationName.toLowerCase()
  ) || NARRATIVE_COMPLICATIONS[0];

  const ActiveIcon = COMPLICATION_ICONS[activeComplication.id] || Zap;
  const severityInfo = SEVERITY_LEVELS[severity] || SEVERITY_LEVELS[3];

  const handleRollDice = () => {
    setIsRolling(true);
    setTimeout(() => {
      const roll = rollCatalystDice({
        severity,
        customWildcard: selectedExample || customWildcard
      });
      setIsRolling(false);
      setSelectedExample('');
    }, 350);
  };

  const handleSelectComplication = (comp) => {
    rollCatalystDice({
      complications: [comp],
      severity,
      customWildcard: comp.examples[0]
    });
  };

  const handleSelectExample = (ex) => {
    setSelectedExample(ex);
    setCustomWildcard(ex);
  };

  return (
    <div className="station-container plot-catalyst-station">
      {/* Active Injection Toggle Banner */}
      <div className={`catalyst-injection-banner ${isEnabled ? 'injection-active' : 'injection-inactive'}`}>
        <div className="injection-info">
          <div className="injection-status-icon">
            {isEnabled ? <CheckCircle2 size={16} /> : <CircleDot size={16} />}
          </div>
          <div className="injection-text-wrap">
            <span className="injection-title">
              {isEnabled ? 'Catalyst Injected into Next Scene' : 'Catalyst Wildcard Inactive'}
            </span>
            <span className="injection-subtext">
              {isEnabled
                ? 'Compiled into LLM prompt directive as a mandatory plot rupture'
                : 'Enable to force this complication into the upcoming chapter generation'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`injection-toggle-btn ${isEnabled ? 'is-enabled' : ''}`}
          onClick={() => toggleCatalystInjection(!isEnabled)}
          aria-pressed={isEnabled}
        >
          {isEnabled ? 'Active' : 'Enable'}
        </button>
      </div>

      {/* Procedural Roll Button */}
      <div className="roll-action-bar">
        <button
          type="button"
          className={`station-primary-btn roll-dice-btn ${isRolling ? 'is-rolling' : ''}`}
          onClick={handleRollDice}
          disabled={isGenerating || isRolling}
        >
          <Dices size={16} className={`btn-icon ${isRolling ? 'animate-spin' : ''}`} />
          <span>{isRolling ? 'Rolling Fate D6...' : 'Roll Narrative Dice (D6)'}</span>
        </button>
      </div>

      {/* 6 Complications Selector Grid */}
      <div className="complications-grid-label">
        <span>6 Core Narrative Complications</span>
      </div>
      <div className="complications-mini-grid">
        {NARRATIVE_COMPLICATIONS.map((comp) => {
          const Icon = COMPLICATION_ICONS[comp.id] || Zap;
          const isSelected = comp.name.toLowerCase() === currentComplicationName.toLowerCase();

          return (
            <button
              key={comp.id}
              type="button"
              className={`complication-chip ${isSelected ? 'active-chip' : ''}`}
              onClick={() => handleSelectComplication(comp)}
              title={`${comp.name}: ${comp.description}`}
            >
              <Icon size={13} className="chip-icon" />
              <span className="chip-name">{comp.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Complication Hero Card */}
      <div className="catalyst-hero-card">
        <div className="hero-card-header">
          <div className="hero-type-wrap">
            <ActiveIcon size={16} className="hero-icon" />
            <div className="hero-titles">
              <span className="hero-name">{activeComplication.name}</span>
              <span className="hero-archetype">{activeComplication.archetype}</span>
            </div>
          </div>
          <span className={`severity-badge-pill sev-${severity}`}>
            Level {severity}: {severityInfo.name}
          </span>
        </div>

        <p className="hero-description">{activeComplication.description}</p>

        <div className="hero-directive-box">
          <span className="directive-tag">Directorial Mandate</span>
          <p className="directive-text">{activeComplication.directive}</p>
        </div>
      </div>

      {/* Complication Severity Slider */}
      <div className="station-control-group">
        <div className="slider-label-row">
          <label htmlFor="catalyst-severity">Complication Severity</label>
          <span className={`slider-value-readout sev-${severity}`}>
            {severity} / 5 • {severityInfo.name}
          </span>
        </div>
        <input
          id="catalyst-severity"
          type="range"
          min="1"
          max="5"
          step="1"
          className={`station-slider severity-slider sev-${severity}`}
          value={severity}
          onChange={(e) => setCatalystSeverity(parseInt(e.target.value, 10))}
        />
        <div className="severity-ticks">
          <span>1: Subtle</span>
          <span>2: Minor</span>
          <span>3: Significant</span>
          <span>4: Critical</span>
          <span>5: Catastrophic</span>
        </div>
      </div>

      {/* Manifestation / Custom Wildcard */}
      <div className="station-control-group">
        <label htmlFor="custom-wildcard">Specific Manifestation (Wildcard)</label>
        <textarea
          id="custom-wildcard"
          className="station-textarea"
          rows={2}
          value={customWildcard}
          onChange={(e) => setCustomWildcard(e.target.value)}
          placeholder={`e.g. ${activeComplication.examples[0]}`}
        />

        {/* Quick Example Manifestations */}
        <div className="example-manifestations">
          <span className="examples-header">Preset Complication Seeds:</span>
          <div className="examples-list">
            {activeComplication.examples.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                className={`example-pill-btn ${customWildcard === ex ? 'selected' : ''}`}
                onClick={() => handleSelectExample(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roll History */}
      {history.length > 0 && (
        <div className="catalyst-history-section">
          <div className="history-header">
            <History size={12} />
            <span>Recent Rolls</span>
          </div>
          <div className="history-chips-row">
            {history.slice(0, 4).map((item, idx) => (
              <span key={idx} className="history-chip" title={item.wildcard}>
                {item.name} (Lv.{item.severity})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
