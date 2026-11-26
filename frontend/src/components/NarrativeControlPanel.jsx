import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sword,
  Rocket,
  Flame,
  Search,
  Heart,
  Zap,
  BookMarked,
  Eye,
  Activity,
  Compass,
  Fingerprint,
  Layers,
  Wand2,
  X,
  Users,
  Dices,
  Palette,
  Volume2
} from 'lucide-react';
import { useStory, GENRE_PRESETS, MASTER_STYLE_PRESETS } from '../context/StoryContext';
import { IMAGE_STYLE_PRESETS } from '../utils/imageStylePresets';

import DramatisPersonaeStation from './stations/DramatisPersonaeStation';
import PlotCatalystStation from './stations/PlotCatalystStation';
import SceneIllustratorStation from './stations/SceneIllustratorStation';
import AudioTheaterStation from './stations/AudioTheaterStation';
import LocationCodexStation from './stations/LocationCodexStation';
import LiteraryAuditorStation from './stations/LiteraryAuditorStation';

const GENRE_ICON_MAP = {
  fantasy: Sword,
  scifi: Rocket,
  horror: Flame,
  mystery: Search,
  romance: Heart,
  cyberpunk: Zap,
  custom: Sparkles
};

export default function NarrativeControlPanel({ onOpenBible, onCloseSidebar }) {
  const {
    sliders,
    updateSlider,
    resetSliders,
    resetSectionSliders,
    genre,
    applyGenrePreset,
    applyMasterPreset,
    isGenerating,
    storyBible,
    dramatisPersonae,
    plotCatalyst,
    sceneIllustrator,
    audioTheater,
    locationCodex,
    literaryAuditor
  } = useStory();

  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState('stations'); // 'stations' | 'dials'
  const [craftMode, setCraftMode] = useState('master'); // 'essential' | 'master'
  const [openSections, setOpenSections] = useState({
    foundations: true,
    voice: true,
    plot: false,
    sensory: false,
    psychology: false
  });
  const [openStations, setOpenStations] = useState({
    dramatisPersonae: true,
    plotCatalyst: false,
    sceneIllustrator: false,
    audioTheater: false,
    locationCodex: false,
    literaryAuditor: false
  });

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const toggleStation = (stationKey) => {
    setOpenStations((prev) => ({
      ...prev,
      [stationKey]: !prev[stationKey]
    }));
  };

  const hasBibleData = Boolean(
    storyBible.characters?.trim() || storyBible.worldRules?.trim() || storyBible.canonNotes?.trim()
  );

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

  const getVisceralLabel = (val) => {
    const num = parseInt(val ?? 3, 10);
    if (num <= 2) return 'Subtle / Psychological';
    if (num === 3) return 'Grounded Realism';
    if (num === 4) return 'Severe Physical Grit';
    return 'Uncompromising Trauma';
  };

  // Helper labels for header badges
  const getPovShort = (p) => {
    switch (p) {
      case 'first': return '1st ("I")';
      case 'second': return '2nd ("You")';
      case 'third_limited': return '3rd Limited';
      case 'third_omniscient': return '3rd Omniscient';
      default: return '3rd Limited';
    }
  };

  const getStylistShort = (s) => {
    switch (s) {
      case 'terse': return 'Terse';
      case 'lyrical': return 'Lyrical';
      case 'hardboiled': return 'Hardboiled';
      case 'baroque': return 'Baroque';
      case 'cinematic': return 'Cinematic';
      default: return 'Cinematic';
    }
  };

  const getConflictShort = (c) => {
    switch (c) {
      case 'person_vs_self': return 'Vs Self';
      case 'person_vs_person': return 'Vs Rival';
      case 'person_vs_society': return 'Vs System';
      case 'person_vs_nature': return 'Vs Nature';
      case 'cosmic': return 'Cosmic Fate';
      default: return 'Vs Rival';
    }
  };

  // Badges for Feature Station Accordion Headers
  const getCastBadge = () => {
    const chars = dramatisPersonae?.characters || [];
    if (chars.length === 0) return '0 Cast';
    const povCount = chars.filter((c) => c.isPov || c.id === dramatisPersonae.activePovId).length || 1;
    return `${povCount} POV • ${chars.length} Cast`;
  };

  const getCatalystBadge = () => {
    const sev = plotCatalyst?.severity ?? 3;
    const compName = (plotCatalyst?.selectedComplication || 'Clock').replace('Ticking Clock', 'Clock').split(' ')[0];
    return `Lvl ${sev} • ${compName}`;
  };

  const getIllustratorBadge = () => {
    const styleId = sceneIllustrator?.stylePreset || 'dark_fantasy_oil';
    const preset = IMAGE_STYLE_PRESETS[styleId];
    if (!preset) return 'Dark Fantasy';
    const parts = preset.name.split(' ');
    return parts.slice(0, 2).join(' ');
  };

  const getAudioBadge = () => {
    const rate = (audioTheater?.cadenceRate ?? 1.0).toFixed(1);
    if (audioTheater?.isPlaying) return `Playing • ${rate}x`;
    if (audioTheater?.isPaused) return `Paused • ${rate}x`;
    return `WebSpeech • ${rate}x`;
  };

  const getLocationBadge = () => {
    const locName = locationCodex?.locationPins?.name ? locationCodex.locationPins.name.split(' ')[0] : 'Caldera';
    const activeLocks = (locationCodex?.loreMicroLocks || []).filter((l) => l.enabled).length;
    return `${locName || 'Caldera'} • ${activeLocks} Rule${activeLocks !== 1 ? 's' : ''}`;
  };

  const getAuditorBadge = () => {
    const audit = literaryAuditor?.lastAudit;
    if (!audit?.metrics) return 'Ready to Audit';
    const grade = audit.metrics.fleschKincaidGrade || '8.8';
    const burst = Math.round((audit.metrics.burstiness || 0.74) * 100);
    return `Grade ${grade} • ${burst} Burst`;
  };

  return (
    <aside className={`narrative-controls-panel ${panelCollapsed ? 'collapsed' : ''}`} aria-label="Narrative Control Panel">
      {/* Top Panel Master Header */}
      <div
        className="panel-header"
        onClick={() => setPanelCollapsed(!panelCollapsed)}
        role="button"
        tabIndex={0}
        aria-expanded={!panelCollapsed}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setPanelCollapsed(!panelCollapsed);
          }
        }}
      >
        <div className="header-title">
          <Sliders className="panel-icon-svg" size={17} />
          <h3>Narrative Controls</h3>
          <span className="active-genre-badge">{genre.toUpperCase()}</span>
        </div>

        <div className="panel-header-actions">
          <button
            type="button"
            className="collapse-toggle-btn"
            aria-label={panelCollapsed ? 'Expand panel' : 'Collapse panel'}
            onClick={(e) => {
              e.stopPropagation();
              setPanelCollapsed(!panelCollapsed);
            }}
          >
            {panelCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          {onCloseSidebar && (
            <button
              type="button"
              className="mobile-sidebar-close-btn"
              aria-label="Close sidebar"
              title="Close sidebar"
              onClick={(e) => {
                e.stopPropagation();
                onCloseSidebar();
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {!panelCollapsed && (
        <div className="panel-body">
          {/* Ergonomic Top Segmented Switcher */}
          <div className="sidebar-tab-switcher-row">
            <div className="segmented-switcher-bar" role="tablist" aria-label="Sidebar Mode">
              <button
                type="button"
                role="tab"
                aria-selected={activeViewTab === 'stations'}
                className={`switcher-pill-btn ${activeViewTab === 'stations' ? 'is-active' : ''}`}
                onClick={() => setActiveViewTab('stations')}
              >
                <Sparkles size={13} className="switcher-icon" />
                <span>Feature Stations</span>
                <span className="switcher-count-badge">6</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeViewTab === 'dials'}
                className={`switcher-pill-btn ${activeViewTab === 'dials' ? 'is-active' : ''}`}
                onClick={() => setActiveViewTab('dials')}
              >
                <Sliders size={13} className="switcher-icon" />
                <span>Craft Dials</span>
              </button>
            </div>
          </div>

          {activeViewTab === 'stations' ? (
            <div className="feature-stations-accordion-group">
              {/* 1. Dramatis Personae */}
              <section className="craft-accordion-section station-accordion">
                <header
                  className="accordion-section-header"
                  onClick={() => toggleStation('dramatisPersonae')}
                  role="button"
                  tabIndex={0}
                  aria-expanded={openStations.dramatisPersonae}
                >
                  <div className="section-title-wrap">
                    <Users size={14} className="section-icon text-amber" />
                    <span className="section-name">Dramatis Personae</span>
                  </div>
                  <div className="section-header-meta">
                    <span className="section-summary-badge">{getCastBadge()}</span>
                    {openStations.dramatisPersonae ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </header>
                {openStations.dramatisPersonae && (
                  <div className="accordion-section-content station-content-wrap">
                    <DramatisPersonaeStation />
                  </div>
                )}
              </section>

              {/* 2. Plot Catalyst & Dice */}
              <section className="craft-accordion-section station-accordion">
                <header
                  className="accordion-section-header"
                  onClick={() => toggleStation('plotCatalyst')}
                  role="button"
                  tabIndex={0}
                  aria-expanded={openStations.plotCatalyst}
                >
                  <div className="section-title-wrap">
                    <Dices size={14} className="section-icon text-amber" />
                    <span className="section-name">Plot Catalyst & Dice</span>
                  </div>
                  <div className="section-header-meta">
                    <span className="section-summary-badge">{getCatalystBadge()}</span>
                    {openStations.plotCatalyst ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </header>
                {openStations.plotCatalyst && (
                  <div className="accordion-section-content station-content-wrap">
                    <PlotCatalystStation />
                  </div>
                )}
              </section>

              {/* 3. Scene Illustrator */}
              <section className="craft-accordion-section station-accordion">
                <header
                  className="accordion-section-header"
                  onClick={() => toggleStation('sceneIllustrator')}
                  role="button"
                  tabIndex={0}
                  aria-expanded={openStations.sceneIllustrator}
                >
                  <div className="section-title-wrap">
                    <Palette size={14} className="section-icon text-amber" />
                    <span className="section-name">Scene Illustrator</span>
                  </div>
                  <div className="section-header-meta">
                    <span className="section-summary-badge">{getIllustratorBadge()}</span>
                    {openStations.sceneIllustrator ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </header>
                {openStations.sceneIllustrator && (
                  <div className="accordion-section-content station-content-wrap">
                    <SceneIllustratorStation />
                  </div>
                )}
              </section>

              {/* 4. Audio Theater */}
              <section className="craft-accordion-section station-accordion">
                <header
                  className="accordion-section-header"
                  onClick={() => toggleStation('audioTheater')}
                  role="button"
                  tabIndex={0}
                  aria-expanded={openStations.audioTheater}
                >
                  <div className="section-title-wrap">
                    <Volume2 size={14} className="section-icon text-amber" />
                    <span className="section-name">Audio Theater</span>
                  </div>
                  <div className="section-header-meta">
                    <span className="section-summary-badge">{getAudioBadge()}</span>
                    {openStations.audioTheater ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </header>
                {openStations.audioTheater && (
                  <div className="accordion-section-content station-content-wrap">
                    <AudioTheaterStation />
                  </div>
                )}
              </section>

              {/* 5. Location & Lore Codex */}
              <section className="craft-accordion-section station-accordion">
                <header
                  className="accordion-section-header"
                  onClick={() => toggleStation('locationCodex')}
                  role="button"
                  tabIndex={0}
                  aria-expanded={openStations.locationCodex}
                >
                  <div className="section-title-wrap">
                    <Compass size={14} className="section-icon text-amber" />
                    <span className="section-name">Location & Lore Codex</span>
                  </div>
                  <div className="section-header-meta">
                    <span className="section-summary-badge">{getLocationBadge()}</span>
                    {openStations.locationCodex ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </header>
                {openStations.locationCodex && (
                  <div className="accordion-section-content station-content-wrap">
                    <LocationCodexStation />
                  </div>
                )}
              </section>

              {/* 6. Literary Auditor & Radar */}
              <section className="craft-accordion-section station-accordion">
                <header
                  className="accordion-section-header"
                  onClick={() => toggleStation('literaryAuditor')}
                  role="button"
                  tabIndex={0}
                  aria-expanded={openStations.literaryAuditor}
                >
                  <div className="section-title-wrap">
                    <Activity size={14} className="section-icon text-amber" />
                    <span className="section-name">Literary Auditor & Radar</span>
                  </div>
                  <div className="section-header-meta">
                    <span className="section-summary-badge">{getAuditorBadge()}</span>
                    {openStations.literaryAuditor ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </header>
                {openStations.literaryAuditor && (
                  <div className="accordion-section-content station-content-wrap">
                    <LiteraryAuditorStation />
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="craft-dials-tab-content">
              {/* Craft Mode Segmented Pill (Essential vs Master Craft) */}
              <div className="craft-mode-selector-bar">
            <span className="craft-mode-label">Studio Mode:</span>
            <div className="craft-mode-toggle" role="group" aria-label="Craft Mode Selection">
              <button
                type="button"
                className={`mode-toggle-btn ${craftMode === 'essential' ? 'active' : ''}`}
                onClick={() => setCraftMode('essential')}
                title="Essential mode: Core Genre, Tone, Pacing, and Length"
              >
                <span>Essential</span>
              </button>
              <button
                type="button"
                className={`mode-toggle-btn ${craftMode === 'master' ? 'active' : ''}`}
                onClick={() => setCraftMode('master')}
                title="Master Craft mode: Expand POV, Conflict, Sensory Palettes, and Psychology"
              >
                <Sparkles size={12} className="mode-icon" />
                <span>Master Craft</span>
              </button>
            </div>
          </div>

          {/* Master Style Presets Quick-Pick Bar */}
          <div className="master-presets-card">
            <div className="presets-header-row">
              <div className="presets-label-wrap">
                <Wand2 size={13} className="presets-sparkle-icon" />
                <span className="presets-title">Master Style Presets</span>
              </div>
              <button
                type="button"
                className="text-action-btn"
                onClick={resetSliders}
                disabled={isGenerating}
                title="Reset all narrative controls to default state"
              >
                <RotateCcw size={12} />
                <span>Reset All</span>
              </button>
            </div>
            <div className="master-presets-scroll-grid">
              {MASTER_STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="master-preset-chip"
                  onClick={() => applyMasterPreset(preset.id)}
                  disabled={isGenerating}
                  title={`${preset.name}: ${preset.tagline}`}
                >
                  <span className="preset-name">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Story Bible Shortcut Card */}
          {onOpenBible && (
            <div className="bible-shortcut-bar">
              <button
                type="button"
                className={`bible-shortcut-btn ${hasBibleData ? 'has-data' : ''}`}
                onClick={onOpenBible}
                title="Lock character roster, lore, and world rules"
              >
                <div className="shortcut-label">
                  <BookMarked size={15} />
                  <span>Story Bible & Canon</span>
                </div>
                <span className="shortcut-status">
                  {hasBibleData ? 'Canon Active' : 'Setup Rules'}
                </span>
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 0: FOUNDATIONS & GENRE ACCORDION                       */}
          {/* ============================================================== */}
          <section className="craft-accordion-section">
            <header
              className="accordion-section-header"
              onClick={() => toggleSection('foundations')}
              role="button"
              tabIndex={0}
              aria-expanded={openSections.foundations}
            >
              <div className="section-title-wrap">
                <Layers size={14} className="section-icon" />
                <span className="section-name">Foundations & Genre</span>
              </div>
              <div className="section-header-meta">
                <span className="section-summary-badge">
                  {genre.toUpperCase()} • {sliders.tone}
                </span>
                {openSections.foundations ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </header>

            {openSections.foundations && (
              <div className="accordion-section-content">
                {/* Genre Presets */}
                <div className="control-group">
                  <div className="control-label-header">
                    <span className="control-label-text">Genre Directives</span>
                    <button
                      type="button"
                      className="micro-reset-btn"
                      onClick={() => resetSectionSliders('foundations')}
                      disabled={isGenerating}
                      title="Reset Foundations to defaults"
                    >
                      <RotateCcw size={11} />
                      <span>Reset</span>
                    </button>
                  </div>
                  <div className="chips-grid">
                    {GENRE_PRESETS.map((p) => {
                      const IconComp = GENRE_ICON_MAP[p.id] || Sparkles;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={`chip-button ${genre === p.id ? 'active' : ''}`}
                          onClick={() => applyGenrePreset(p.id)}
                          disabled={isGenerating}
                          aria-pressed={genre === p.id}
                          title={`Apply ${p.name} preset`}
                        >
                          <IconComp size={13} className="chip-icon-svg" />
                          <span className="chip-name">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sliders-grid">
                  {/* Creativity Dial */}
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
                      className="studio-slider"
                      aria-label="Creativity slider"
                    />
                    <div className="slider-ticks">
                      <span>Direct</span>
                      <span>Balanced</span>
                      <span>Surreal</span>
                    </div>
                  </div>

                  {/* Prompt Strictness */}
                  <div className="control-item">
                    <div className="item-label-row">
                      <span className="item-title">Canon Adherence</span>
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
                      className="studio-slider"
                      aria-label="Strictness slider"
                    />
                    <div className="slider-ticks">
                      <span>Freeform</span>
                      <span>Guided</span>
                      <span>Strict</span>
                    </div>
                  </div>

                  {/* Tone & Atmosphere */}
                  <div className="control-item full-width">
                    <div className="item-label-row">
                      <span className="item-title">Tone & Mood</span>
                      <span className="item-readout capitalize">{sliders.tone}</span>
                    </div>
                    <div className="segmented-control wrap-pills" role="group" aria-label="Tone selection">
                      {[
                        { id: 'whimsical', label: 'Whimsical' },
                        { id: 'lighthearted', label: 'Light' },
                        { id: 'balanced', label: 'Balanced' },
                        { id: 'gritty', label: 'Gritty' },
                        { id: 'dark', label: 'Dark' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`segment-btn ${sliders.tone === t.id ? 'active' : ''}`}
                          onClick={() => updateSlider('tone', t.id)}
                          disabled={isGenerating}
                          aria-pressed={sliders.tone === t.id}
                        >
                          <span className="segment-label">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pacing & Rhythm */}
                  <div className="control-item full-width">
                    <div className="item-label-row">
                      <span className="item-title">Narrative Velocity</span>
                      <span className="item-readout capitalize">{sliders.pacing}</span>
                    </div>
                    <div className="segmented-control wrap-pills" role="group" aria-label="Pacing selection">
                      {[
                        { id: 'action', label: 'Action' },
                        { id: 'brisk', label: 'Brisk' },
                        { id: 'balanced', label: 'Dynamic' },
                        { id: 'atmospheric', label: 'Atmospheric' },
                        { id: 'slow-burn', label: 'Slow-Burn' }
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`segment-btn ${sliders.pacing === p.id ? 'active' : ''}`}
                          onClick={() => updateSlider('pacing', p.id)}
                          disabled={isGenerating}
                          aria-pressed={sliders.pacing === p.id}
                        >
                          <span className="segment-label">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Length */}
                  <div className="control-item">
                    <div className="item-label-row">
                      <span className="item-title">Target Length</span>
                      <span className="item-readout capitalize">{sliders.targetLength}</span>
                    </div>
                    <div className="segmented-control grid-2x2 compact" role="group" aria-label="Target length selection">
                      {[
                        { id: 'flash', label: 'Flash', count: '~350w' },
                        { id: 'short', label: 'Short', count: '~650w' },
                        { id: 'standard', label: 'Standard', count: '~1.2kw' },
                        { id: 'chapter', label: 'Chapter', count: '~2kw' }
                      ].map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          className={`segment-btn ${sliders.targetLength === l.id ? 'active' : ''}`}
                          onClick={() => updateSlider('targetLength', l.id)}
                          disabled={isGenerating}
                          aria-pressed={sliders.targetLength === l.id}
                        >
                          <span className="segment-label">{l.label}</span>
                          <span className="segment-count">{l.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plot Blueprint (Chain-of-Thought) */}
                  <div className="control-item">
                    <div className="item-label-row">
                      <span className="item-title">Plot Blueprint CoT</span>
                      <span className="item-readout capitalize">{sliders.thinkingDepth}</span>
                    </div>
                    <div className="segmented-control grid-2x2 compact" role="group" aria-label="Thinking depth selection">
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
                          aria-pressed={sliders.thinkingDepth === th.id}
                        >
                          <span className="segment-label">{th.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ============================================================== */}
          {/* SECTION 1: VOICE & PERSPECTIVE ACCORDION                       */}
          {/* ============================================================== */}
          {(craftMode === 'master' || openSections.voice) && (
            <section className="craft-accordion-section">
              <header
                className="accordion-section-header"
                onClick={() => toggleSection('voice')}
                role="button"
                tabIndex={0}
                aria-expanded={openSections.voice}
              >
                <div className="section-title-wrap">
                  <Eye size={14} className="section-icon" />
                  <span className="section-name">Voice & Perspective</span>
                </div>
                <div className="section-header-meta">
                  <span className="section-summary-badge">
                    {getPovShort(sliders.pov)} • {sliders.tense === 'past' ? 'Past' : 'Present'} • {getStylistShort(sliders.proseStylist)}
                  </span>
                  {openSections.voice ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </header>

              {openSections.voice && (
                <div className="accordion-section-content">
                  <div className="section-inline-action-bar">
                    <span className="section-desc-note">Authorial vantage and prose cadence</span>
                    <button
                      type="button"
                      className="micro-reset-btn"
                      onClick={() => resetSectionSliders('voice')}
                      disabled={isGenerating}
                      title="Reset Voice controls to default"
                    >
                      <RotateCcw size={11} />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="sliders-grid">
                    {/* POV Selection */}
                    <div className="control-item full-width">
                      <div className="item-label-row">
                        <span className="item-title">Point of View (POV)</span>
                        <span className="item-readout">{getPovShort(sliders.pov)}</span>
                      </div>
                      <div className="segmented-control grid-2x2" role="group" aria-label="POV selection">
                        {[
                          { id: 'first', label: '1st ("I / Me")', title: 'Intimate first-person interiority' },
                          { id: 'second', label: '2nd ("You")', title: 'Direct interactive second-person address' },
                          { id: 'third_limited', label: '3rd Limited', title: 'Close over-the-shoulder focal camera' },
                          { id: 'third_omniscient', label: '3rd Omniscient', title: 'Panoramic cinematic authorial view' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`segment-btn ${sliders.pov === item.id ? 'active' : ''}`}
                            onClick={() => updateSlider('pov', item.id)}
                            disabled={isGenerating}
                            title={item.title}
                          >
                            <span className="segment-label">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Narrative Tense */}
                    <div className="control-item">
                      <div className="item-label-row">
                        <span className="item-title">Narrative Tense</span>
                        <span className="item-readout capitalize">{sliders.tense}</span>
                      </div>
                      <div className="segmented-control" role="group" aria-label="Tense selection">
                        {[
                          { id: 'past', label: 'Past Tense', desc: '"walked, whispered"' },
                          { id: 'present', label: 'Present Tense', desc: '"walks, whispers"' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className={`segment-btn ${sliders.tense === t.id ? 'active' : ''}`}
                            onClick={() => updateSlider('tense', t.id)}
                            disabled={isGenerating}
                            title={t.desc}
                          >
                            <span className="segment-label">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dialogue-to-Narration Balance */}
                    <div className="control-item">
                      <div className="item-label-row">
                        <span className="item-title">Dialogue Density</span>
                        <span className="item-readout capitalize">{sliders.dialogueRatio?.replace('_', ' ')}</span>
                      </div>
                      <div className="segmented-control" role="group" aria-label="Dialogue ratio selection">
                        {[
                          { id: 'dialogue_heavy', label: 'Banter / Heavy', title: 'Sharp subtextual dialogue (~60%)' },
                          { id: 'balanced', label: 'Balanced', title: 'Organic dialogue & action' },
                          { id: 'descriptive', label: 'Scenic / Prose', title: 'Atmosphere & interiority (~15%)' }
                        ].map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            className={`segment-btn ${sliders.dialogueRatio === d.id ? 'active' : ''}`}
                            onClick={() => updateSlider('dialogueRatio', d.id)}
                            disabled={isGenerating}
                            title={d.title}
                          >
                            <span className="segment-label">{d.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Authorial Prose Stylist */}
                    <div className="control-item full-width">
                      <div className="item-label-row">
                        <span className="item-title">Prose Stylist Voice</span>
                        <span className="item-readout highlight capitalize">{sliders.proseStylist}</span>
                      </div>
                      <div className="segmented-control wrap-pills" role="group" aria-label="Prose stylist selection">
                        {[
                          { id: 'terse', label: 'Terse', title: 'Hemingway/McCarthy: spare, direct impact' },
                          { id: 'lyrical', label: 'Lyrical', title: 'Rothfuss/Le Guin: poetic, rhythmic cadence' },
                          { id: 'hardboiled', label: 'Hardboiled', title: 'Noir/Chandler: caustic, cynical observation' },
                          { id: 'baroque', label: 'Baroque', title: 'Gothic/Lovecraft: grand, ornate atmosphere' },
                          { id: 'cinematic', label: 'Cinematic', title: 'Modern: dynamic pacing and sharp cuts' }
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            className={`segment-btn ${sliders.proseStylist === st.id ? 'active' : ''}`}
                            onClick={() => updateSlider('proseStylist', st.id)}
                            disabled={isGenerating}
                            title={st.title}
                          >
                            <span className="segment-label">{st.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ============================================================== */}
          {/* SECTION 2: PLOT & CONFLICT ARCHITECTURE ACCORDION               */}
          {/* ============================================================== */}
          {(craftMode === 'master' || openSections.plot) && (
            <section className="craft-accordion-section">
              <header
                className="accordion-section-header"
                onClick={() => toggleSection('plot')}
                role="button"
                tabIndex={0}
                aria-expanded={openSections.plot}
              >
                <div className="section-title-wrap">
                  <Activity size={14} className="section-icon" />
                  <span className="section-name">Plot & Conflict Engine</span>
                </div>
                <div className="section-header-meta">
                  <span className="section-summary-badge">
                    {getConflictShort(sliders.conflictType)} • {sliders.endingTurn?.replace('_', ' ')}
                  </span>
                  {openSections.plot ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </header>

              {openSections.plot && (
                <div className="accordion-section-content">
                  <div className="section-inline-action-bar">
                    <span className="section-desc-note">Dramaturgy, stakes, and scene turning points</span>
                    <button
                      type="button"
                      className="micro-reset-btn"
                      onClick={() => resetSectionSliders('plot')}
                      disabled={isGenerating}
                      title="Reset Plot controls to default"
                    >
                      <RotateCcw size={11} />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="sliders-grid">
                    {/* Conflict Type */}
                    <div className="control-item full-width">
                      <div className="item-label-row">
                        <span className="item-title">Core Dramatic Conflict</span>
                        <span className="item-readout capitalize">{sliders.conflictType?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="segmented-control wrap-pills" role="group" aria-label="Conflict selection">
                        {[
                          { id: 'person_vs_self', label: 'Vs Self', title: 'Internal guilt, addiction, or moral crisis' },
                          { id: 'person_vs_person', label: 'Vs Rival', title: 'Direct betrayal, duel, or ideological clash' },
                          { id: 'person_vs_society', label: 'Vs System', title: 'Corrupt syndicate, empire, or dogma' },
                          { id: 'person_vs_nature', label: 'Vs Nature', title: 'Elemental survival, blizzard, or beast' },
                          { id: 'cosmic', label: 'Cosmic Fate', title: 'Eldritch forces or inevitable destiny' }
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className={`segment-btn ${sliders.conflictType === c.id ? 'active' : ''}`}
                            onClick={() => updateSlider('conflictType', c.id)}
                            disabled={isGenerating}
                            title={c.title}
                          >
                            <span className="segment-label">{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dramatic Stakes */}
                    <div className="control-item">
                      <div className="item-label-row">
                        <span className="item-title">Dramatic Stakes</span>
                        <span className="item-readout capitalize">{sliders.dramaticStakes}</span>
                      </div>
                      <div className="segmented-control" role="group" aria-label="Stakes selection">
                        {[
                          { id: 'personal', label: 'Personal', title: 'A secret, a bond, personal survival' },
                          { id: 'faction', label: 'Faction', title: 'A family, ship crew, or resistance cell' },
                          { id: 'existential', label: 'Cosmic / Realm', title: 'Civilizations or the boundary of reality' }
                        ].map((stk) => (
                          <button
                            key={stk.id}
                            type="button"
                            className={`segment-btn ${sliders.dramaticStakes === stk.id ? 'active' : ''}`}
                            onClick={() => updateSlider('dramaticStakes', stk.id)}
                            disabled={isGenerating}
                            title={stk.title}
                          >
                            <span className="segment-label">{stk.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scene Climax / Ending Turn */}
                    <div className="control-item full-width">
                      <div className="item-label-row">
                        <span className="item-title">Scene Closure / Turn</span>
                        <span className="item-readout highlight capitalize">{sliders.endingTurn?.replace('_', ' ')}</span>
                      </div>
                      <div className="segmented-control wrap-pills" role="group" aria-label="Ending turn selection">
                        {[
                          { id: 'cliffhanger', label: 'Cliffhanger', title: 'Sudden peril or shock revelation' },
                          { id: 'thematic_twist', label: 'Twist Turn', title: 'Paradigm subversion of assumptions' },
                          { id: 'bittersweet', label: 'Bittersweet', title: 'Victory won at heavy cost' },
                          { id: 'cathartic', label: 'Cathartic', title: 'Earned tactical breakthrough' },
                          { id: 'ambiguous', label: 'Ambiguous', title: 'Resonant, open psychological landing' }
                        ].map((end) => (
                          <button
                            key={end.id}
                            type="button"
                            className={`segment-btn ${sliders.endingTurn === end.id ? 'active' : ''}`}
                            onClick={() => updateSlider('endingTurn', end.id)}
                            disabled={isGenerating}
                            title={end.title}
                          >
                            <span className="segment-label">{end.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ============================================================== */}
          {/* SECTION 3: SENSORY PALETTE & ATMOSPHERE ACCORDION               */}
          {/* ============================================================== */}
          {(craftMode === 'master' || openSections.sensory) && (
            <section className="craft-accordion-section">
              <header
                className="accordion-section-header"
                onClick={() => toggleSection('sensory')}
                role="button"
                tabIndex={0}
                aria-expanded={openSections.sensory}
              >
                <div className="section-title-wrap">
                  <Compass size={14} className="section-icon" />
                  <span className="section-name">Sensory & World Palette</span>
                </div>
                <div className="section-header-meta">
                  <span className="section-summary-badge capitalize">
                    {sliders.sensoryAnchor} • Grit {sliders.visceralIntensity}/5
                  </span>
                  {openSections.sensory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </header>

              {openSections.sensory && (
                <div className="accordion-section-content">
                  <div className="section-inline-action-bar">
                    <span className="section-desc-note">Environmental lighting, acoustic mood, and tactile grit</span>
                    <button
                      type="button"
                      className="micro-reset-btn"
                      onClick={() => resetSectionSliders('sensory')}
                      disabled={isGenerating}
                      title="Reset Sensory controls to default"
                    >
                      <RotateCcw size={11} />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="sliders-grid">
                    {/* Dominant Sensory Anchor */}
                    <div className="control-item full-width">
                      <div className="item-label-row">
                        <span className="item-title">Primary Sensory Anchor</span>
                        <span className="item-readout capitalize">{sliders.sensoryAnchor}</span>
                      </div>
                      <div className="segmented-control grid-2x2" role="group" aria-label="Sensory anchor selection">
                        {[
                          { id: 'tactile', label: 'Tactile & Pain', title: 'Cold iron, gravel, bruises, heat, physical weight' },
                          { id: 'auditory', label: 'Auditory / Acoustic', title: 'Echoing steps, machine hums, heavy silence' },
                          { id: 'visual', label: 'Visual / Chiaroscuro', title: 'Shadow geometry, neon glare, lighting contrast' },
                          { id: 'olfactory', label: 'Olfactory / Scent', title: 'Ozone, damp rot, woodsmoke, coppery iron' }
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className={`segment-btn ${sliders.sensoryAnchor === s.id ? 'active' : ''}`}
                            onClick={() => updateSlider('sensoryAnchor', s.id)}
                            disabled={isGenerating}
                            title={s.title}
                          >
                            <span className="segment-label">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Environmental Mood */}
                    <div className="control-item full-width">
                      <div className="item-label-row">
                        <span className="item-title">Environmental Atmosphere</span>
                        <span className="item-readout capitalize">{sliders.environmentalMood?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="segmented-control grid-2x2" role="group" aria-label="Environmental mood selection">
                        {[
                          { id: 'chiaroscuro_fog', label: 'Fog & Chiaroscuro', title: 'Heavy shadows, gaslight, obscuring mist' },
                          { id: 'bleak_barren', label: 'Bleak & Barren', title: 'Scorched rock, frozen wasteland, isolation' },
                          { id: 'decadent_opulent', label: 'Decadent Opulence', title: 'Gilded velvet, chandeliers, rotting luxury' },
                          { id: 'claustrophobic', label: 'Claustrophobic', title: 'Bunkers, damp tunnels, low bulkheads' }
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            className={`segment-btn ${sliders.environmentalMood === m.id ? 'active' : ''}`}
                            onClick={() => updateSlider('environmentalMood', m.id)}
                            disabled={isGenerating}
                            title={m.title}
                          >
                            <span className="segment-label">{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visceral Intensity Slider */}
                    <div className="control-item full-width">
                      <div className="item-label-row">
                        <span className="item-title">Visceral Physical Intensity</span>
                        <span className="item-readout highlight">
                          Level {sliders.visceralIntensity} / 5 — {getVisceralLabel(sliders.visceralIntensity)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={sliders.visceralIntensity}
                        onChange={(e) => updateSlider('visceralIntensity', parseInt(e.target.value, 10))}
                        disabled={isGenerating}
                        className="studio-slider"
                        aria-label="Visceral intensity slider"
                      />
                      <div className="slider-ticks">
                        <span>Subtle (1)</span>
                        <span>Gritty Realism (3)</span>
                        <span>Raw Trauma (5)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ============================================================== */}
          {/* SECTION 4: CHARACTER PSYCHOLOGY & LENS ACCORDION                */}
          {/* ============================================================== */}
          {(craftMode === 'master' || openSections.psychology) && (
            <section className="craft-accordion-section">
              <header
                className="accordion-section-header"
                onClick={() => toggleSection('psychology')}
                role="button"
                tabIndex={0}
                aria-expanded={openSections.psychology}
              >
                <div className="section-title-wrap">
                  <Fingerprint size={14} className="section-icon" />
                  <span className="section-name">Character Lens & Psychology</span>
                </div>
                <div className="section-header-meta">
                  <span className="section-summary-badge capitalize">
                    {sliders.protagonistState} • {sliders.moralAlignment}
                    {sliders.unreliableNarrator !== 'off' ? ' (Biased)' : ''}
                  </span>
                  {openSections.psychology ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </header>

              {openSections.psychology && (
                <div className="accordion-section-content">
                  <div className="section-inline-action-bar">
                    <span className="section-desc-note">Protagonist cognitive lens, bias, and moral compass</span>
                    <button
                      type="button"
                      className="micro-reset-btn"
                      onClick={() => resetSectionSliders('psychology')}
                      disabled={isGenerating}
                      title="Reset Psychology controls to default"
                    >
                      <RotateCcw size={11} />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="sliders-grid">
                    {/* Protagonist Mental State */}
                    <div className="control-item full-width">
                      <div className="item-label-row">
                        <span className="item-title">Protagonist Mental State</span>
                        <span className="item-readout capitalize">{sliders.protagonistState}</span>
                      </div>
                      <div className="segmented-control wrap-pills" role="group" aria-label="Protagonist state selection">
                        {[
                          { id: 'paranoid', label: 'Paranoid', title: 'Hyper-vigilant, suspecting betrayal in every corner' },
                          { id: 'calculating', label: 'Calculating', title: 'Stoic, analytical assessment of survival probabilities' },
                          { id: 'desperate', label: 'Desperate', title: 'Driven to the brink, reactive, volatile gambles' },
                          { id: 'melancholic', label: 'Melancholic', title: 'Haunted by grief, weary, fatalistic detachment' },
                          { id: 'defiant', label: 'Defiant', title: 'Fiery resolve, refusing surrender against impossible odds' }
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            className={`segment-btn ${sliders.protagonistState === st.id ? 'active' : ''}`}
                            onClick={() => updateSlider('protagonistState', st.id)}
                            disabled={isGenerating}
                            title={st.title}
                          >
                            <span className="segment-label">{st.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Unreliable Narrator Filter */}
                    <div className="control-item full-width">
                      <div className="item-label-row">
                        <span className="item-title">Unreliable Narrator Mode</span>
                        <span className="item-readout highlight capitalize">{sliders.unreliableNarrator?.replace('_', ' ')}</span>
                      </div>
                      <div className="segmented-control" role="group" aria-label="Unreliable narrator selection">
                        {[
                          { id: 'off', label: 'Off (Objective)', title: 'Grounded factual sensory perception' },
                          { id: 'subtle_bias', label: 'Subtle Bias', title: 'Cognitive blindspots, personal defense rationalizations' },
                          { id: 'deep_distortion', label: 'Deep Distortion', title: 'Trauma, hallucinations, or active deception' }
                        ].map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            className={`segment-btn ${sliders.unreliableNarrator === u.id ? 'active' : ''}`}
                            onClick={() => updateSlider('unreliableNarrator', u.id)}
                            disabled={isGenerating}
                            title={u.title}
                          >
                            <span className="segment-label">{u.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Moral Alignment */}
                    <div className="control-item full-width">
                      <div className="item-label-row">
                        <span className="item-title">Moral Compass & Agency</span>
                        <span className="item-readout capitalize">{sliders.moralAlignment}</span>
                      </div>
                      <div className="segmented-control" role="group" aria-label="Moral alignment selection">
                        {[
                          { id: 'principled', label: 'Principled Idealist', title: 'Uncompromising ethical boundaries' },
                          { id: 'antihero', label: 'Pragmatic Anti-Hero', title: 'Willing to compromise to survive' },
                          { id: 'rogue', label: 'Unpredictable Rogue', title: 'Wildcard, driven by freedom and self-interest' }
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            className={`segment-btn ${sliders.moralAlignment === m.id ? 'active' : ''}`}
                            onClick={() => updateSlider('moralAlignment', m.id)}
                            disabled={isGenerating}
                            title={m.title}
                          >
                            <span className="segment-label">{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
