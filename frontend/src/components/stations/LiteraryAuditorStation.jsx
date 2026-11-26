import React, { useState } from 'react';
import {
  Activity,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  BarChart3,
  Gauge,
  Feather,
  Eye,
  Hand,
  Volume2,
  Wind,
  BookOpen,
  RefreshCw,
  Info
} from 'lucide-react';
import { useStory } from '../../context/StoryContext';

export default function LiteraryAuditorStation() {
  const {
    literaryAuditor,
    triggerProseAudit,
    story,
    isGenerating
  } = useStory();

  const auditReport = literaryAuditor?.lastAudit;
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  const handleAuditClick = () => {
    if (!story || !story.trim()) return;
    setIsAuditing(true);
    setTimeout(() => {
      triggerProseAudit(story);
      setIsAuditing(false);
    }, 250);
  };

  // Safe destructuring of audit data
  const sensory = auditReport?.sensory || {
    visual: 0,
    tactile: 0,
    auditory: 0,
    olfactoryGustatory: 0,
    total: 0,
    distribution: { visual: 25, tactile: 25, auditory: 25, olfactoryGustatory: 25 }
  };

  const dialogueRatio = auditReport?.dialogueRatio || {
    dialoguePercent: 0,
    narrationPercent: 100
  };

  const cliches = auditReport?.cliches || [];
  const metrics = auditReport?.metrics || {
    wordCount: 0,
    sentenceCount: 0,
    avgSentenceLength: 0,
    burstiness: 0,
    fleschKincaidGrade: 0,
    fleschReadingEase: 0,
    pacingCategory: 'Awaiting Prose Audit'
  };

  // Compute SVG Radar Polygon Coordinates
  const getRadarPolygon = (dist) => {
    // 4 axes: Top (Visual), Right (Tactile), Bottom (Auditory), Left (Olfactory/Gustatory)
    // Center: (60, 60), Max Radius: 45
    const cx = 60;
    const cy = 60;
    const maxR = 45;

    const rTop = ((dist.visual || 25) / 100) * maxR * 1.5;
    const rRight = ((dist.tactile || 25) / 100) * maxR * 1.5;
    const rBottom = ((dist.auditory || 25) / 100) * maxR * 1.5;
    const rLeft = ((dist.olfactoryGustatory || 25) / 100) * maxR * 1.5;

    const clamp = (val) => Math.min(Math.max(val, 8), maxR);

    const pTop = `${cx},${cy - clamp(rTop)}`;
    const pRight = `${cx + clamp(rRight)},${cy}`;
    const pBottom = `${cx},${cy + clamp(rBottom)}`;
    const pLeft = `${cx - clamp(rLeft)},${cy}`;

    return `${pTop} ${pRight} ${pBottom} ${pLeft}`;
  };

  const getReadingLevelBadge = (grade) => {
    if (grade <= 6) return 'Middle School / Direct';
    if (grade <= 9) return 'High School / Commercial';
    if (grade <= 12) return 'Literary Fiction / Nuanced';
    return 'Scholarly / Academic Prose';
  };

  return (
    <div className="station-container literary-auditor-station">
      {/* Top Action Bar */}
      <div className="station-action-bar">
        <button
          type="button"
          className={`station-primary-btn audit-trigger-btn ${isAuditing ? 'is-auditing' : ''}`}
          onClick={handleAuditClick}
          disabled={isGenerating || isAuditing || !story?.trim()}
        >
          <Activity size={14} className={`btn-icon ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Auditing Prose...' : 'Audit Active Prose'}</span>
        </button>

        <span className="station-action-hint">
          {story?.trim() ? `${metrics.wordCount || story.split(/\s+/).filter(Boolean).length} Words` : 'No Prose'}
        </span>
      </div>

      {!auditReport && !story?.trim() ? (
        <div className="station-empty-state auditor-empty">
          <Activity size={26} className="empty-icon" />
          <p className="empty-title">Prose Diagnostics Idle</p>
          <p className="empty-subtitle">
            Generate or type chapter prose, then run the Literary Auditor to analyze sensory radar, pacing rhythm, and clichés.
          </p>
        </div>
      ) : (
        <>
          {/* Diagnostic Key Numbers Row */}
          <div className="metrics-summary-grid">
            <div className="metric-cell">
              <span className="metric-label">Reading Grade</span>
              <span className="metric-value">{metrics.fleschKincaidGrade || '—'}</span>
              <span className="metric-sublabel">{getReadingLevelBadge(metrics.fleschKincaidGrade)}</span>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Burstiness</span>
              <span className="metric-value highlight">{Math.round((metrics.burstiness || 0) * 100)}</span>
              <span className="metric-sublabel">Sentence Dynamism</span>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Avg Sentence</span>
              <span className="metric-value">{metrics.avgSentenceLength || '—'}</span>
              <span className="metric-sublabel">Words / Sentence</span>
            </div>
          </div>

          {/* Sensory Balance Radar Section */}
          <div className="auditor-section-card">
            <div className="section-card-header">
              <div className="card-title-wrap">
                <BarChart3 size={14} className="text-amber" />
                <span className="card-title">Sensory Balance Radar</span>
              </div>
              <span className="sensory-total-badge">{sensory.total} sensory cues</span>
            </div>

            <div className="sensory-radar-layout">
              {/* SVG 4-Axis Radar Chart */}
              <div className="radar-chart-container">
                <svg width="120" height="120" viewBox="0 0 120 120" className="radar-svg">
                  {/* Background grid concentric diamonds */}
                  <polygon points="60,15 105,60 60,105 15,60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  <polygon points="60,30 90,60 60,90 30,60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <polygon points="60,45 75,60 60,75 45,60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

                  {/* Axis lines */}
                  <line x1="60" y1="15" x2="60" y2="105" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="15" y1="60" x2="105" y2="60" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Active Radar Shape */}
                  <polygon
                    points={getRadarPolygon(sensory.distribution)}
                    className="radar-active-polygon"
                  />

                  {/* Axis Labels */}
                  <text x="60" y="10" textAnchor="middle" className="radar-label">VIS</text>
                  <text x="115" y="64" textAnchor="end" className="radar-label">TAC</text>
                  <text x="60" y="118" textAnchor="middle" className="radar-label">AUD</text>
                  <text x="5" y="64" textAnchor="start" className="radar-label">OLF</text>
                </svg>
              </div>

              {/* Sensory Channel Meters */}
              <div className="sensory-meters-list">
                <div className="sensory-meter-row">
                  <div className="meter-label-wrap">
                    <Eye size={12} className="text-cyan" />
                    <span>Visual</span>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill fill-cyan"
                      style={{ width: `${sensory.distribution.visual || 0}%` }}
                    />
                  </div>
                  <span className="meter-pct">{sensory.distribution.visual || 0}%</span>
                </div>

                <div className="sensory-meter-row">
                  <div className="meter-label-wrap">
                    <Hand size={12} className="text-amber" />
                    <span>Tactile</span>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill fill-amber"
                      style={{ width: `${sensory.distribution.tactile || 0}%` }}
                    />
                  </div>
                  <span className="meter-pct">{sensory.distribution.tactile || 0}%</span>
                </div>

                <div className="sensory-meter-row">
                  <div className="meter-label-wrap">
                    <Volume2 size={12} className="text-violet" />
                    <span>Auditory</span>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill fill-violet"
                      style={{ width: `${sensory.distribution.auditory || 0}%` }}
                    />
                  </div>
                  <span className="meter-pct">{sensory.distribution.auditory || 0}%</span>
                </div>

                <div className="sensory-meter-row">
                  <div className="meter-label-wrap">
                    <Wind size={12} className="text-emerald" />
                    <span>Scent / Taste</span>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill fill-emerald"
                      style={{ width: `${sensory.distribution.olfactoryGustatory || 0}%` }}
                    />
                  </div>
                  <span className="meter-pct">{sensory.distribution.olfactoryGustatory || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dialogue vs Narration Ratio */}
          <div className="auditor-section-card">
            <div className="section-card-header">
              <div className="card-title-wrap">
                <Feather size={14} className="text-amber" />
                <span className="card-title">Dialogue-to-Narration Ratio</span>
              </div>
              <span className="ratio-status-badge">
                {dialogueRatio.dialoguePercent > 50
                  ? 'Dialogue Heavy'
                  : dialogueRatio.dialoguePercent < 20
                  ? 'Descriptive Exposition'
                  : 'Balanced Dramatic'}
              </span>
            </div>

            <div className="dialogue-ratio-bar">
              <div
                className="ratio-segment dialogue-segment"
                style={{ width: `${dialogueRatio.dialoguePercent}%` }}
                title={`Dialogue: ${dialogueRatio.dialoguePercent}%`}
              />
              <div
                className="ratio-segment narration-segment"
                style={{ width: `${dialogueRatio.narrationPercent}%` }}
                title={`Narration: ${dialogueRatio.narrationPercent}%`}
              />
            </div>

            <div className="ratio-legend-row">
              <span className="legend-item dialogue">
                <span className="legend-dot" />
                Dialogue: {dialogueRatio.dialoguePercent}%
              </span>
              <span className="legend-item narration">
                <span className="legend-dot" />
                Narration: {dialogueRatio.narrationPercent}%
              </span>
            </div>
          </div>

          {/* Pacing & Rhythm Diagnosis */}
          <div className="pacing-diagnosis-box">
            <span className="diagnosis-tag">Pacing Rhythm Diagnosis</span>
            <p className="diagnosis-text">{metrics.pacingCategory}</p>
          </div>

          {/* AI Cliché & Filler Scanner */}
          <div className="auditor-section-card">
            <div className="section-card-header">
              <div className="card-title-wrap">
                <AlertTriangle size={14} className={cliches.length > 0 ? 'text-amber' : 'text-emerald'} />
                <span className="card-title">AI Cliché & Filler Scanner</span>
              </div>
              <span className={`cliches-badge ${cliches.length === 0 ? 'is-clean' : ''}`}>
                {cliches.length === 0 ? 'Clean Prose (0 Cliches)' : `${cliches.length} Tropes Detected`}
              </span>
            </div>

            {cliches.length === 0 ? (
              <div className="clean-prose-banner">
                <CheckCircle size={15} className="text-emerald" />
                <span>Zero overused stock idioms, AI metaphors, or cliché phrases detected.</span>
              </div>
            ) : (
              <div className="cliches-list">
                {cliches.map((item, idx) => (
                  <div key={idx} className="cliche-item-card">
                    <div className="cliche-header-row">
                      <span className="cliche-phrase">"{item.phrase}"</span>
                      <span className="cliche-category-pill">{item.category}</span>
                    </div>

                    <div className="cliche-suggestion-row">
                      <span className="suggestion-label">Try instead:</span>
                      <span className="suggestion-value">{item.suggestion}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
