import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Mic,
  Radio,
  Sliders,
  Flame,
  CloudRain,
  Sparkles,
  Waves,
  Music,
  AlertCircle
} from 'lucide-react';
import { useStory } from '../../context/StoryContext';
import { AMBIENT_PRESETS } from '../../utils/ambientAudio';

export default function AudioTheaterStation() {
  const {
    audioTheater,
    setAudioRates,
    setActiveSentence,
    playNarration,
    pauseNarration,
    resumeNarration,
    stopNarration,
    seekNarration,
    setSelectedVoiceURI,
    toggleAmbientAudio,
    setAmbientPreset,
    setAmbientVolume,
    story,
    isGenerating
  } = useStory();

  const isPlaying = Boolean(audioTheater?.isPlaying);
  const isPaused = Boolean(audioTheater?.isPaused);
  const selectedVoiceURI = audioTheater?.selectedVoiceURI || '';
  const cadenceRate = audioTheater?.cadenceRate ?? 1.0;
  const pitch = audioTheater?.pitch ?? 1.0;
  const volume = audioTheater?.volume ?? 1.0;
  const activeParagraphIdx = audioTheater?.activeParagraphIdx ?? 0;
  const activeSentenceIdx = audioTheater?.activeSentenceIdx ?? -1;

  const isAmbientPlaying = Boolean(audioTheater?.isAmbientPlaying);
  const ambientPreset = audioTheater?.ambientPreset || 'fireside';
  const ambientVolume = audioTheater?.ambientVolume ?? 0.3;

  const [availableVoices, setAvailableVoices] = useState([]);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [notice, setNotice] = useState('');

  const selectedVoiceRef = useRef(selectedVoiceURI);
  selectedVoiceRef.current = selectedVoiceURI;

  // Load voices via Web Speech API with onvoiceschanged event listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSpeechSupported(false);
      return;
    }

    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
          if (!selectedVoiceRef.current) {
            const englishVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium')))
              || voices.find((v) => v.lang.startsWith('en'))
              || voices[0];
            if (englishVoice) {
              setSelectedVoiceURI(englishVoice.voiceURI);
            }
          }
        }
      } catch {
        // Safe catch
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handlePlayToggle = () => {
    if (!story || !story.trim()) {
      setNotice('Write or generate story prose first to listen to narration.');
      setTimeout(() => setNotice(''), 3500);
      return;
    }

    if (isPlaying) {
      pauseNarration();
    } else if (isPaused) {
      resumeNarration();
    } else {
      playNarration(story);
    }
  };

  const handleStop = () => {
    stopNarration();
  };

  const handleSeek = (direction) => {
    const nextSentence = Math.max(0, activeSentenceIdx + direction);
    seekNarration(nextSentence, activeParagraphIdx);
  };

  const handleCadenceChange = (newRate) => {
    setAudioRates({ cadenceRate: parseFloat(newRate) });
  };

  const handlePitchChange = (newPitch) => {
    setAudioRates({ pitch: parseFloat(newPitch) });
  };

  const handleAmbientToggle = () => {
    toggleAmbientAudio();
  };

  const getAmbientIcon = (presetId) => {
    switch (presetId) {
      case 'rain': return CloudRain;
      case 'drone': return Sparkles;
      default: return Flame;
    }
  };

  return (
    <div className="station-container audio-theater-station">
      {notice && (
        <div className="station-notice-banner" role="status">
          <AlertCircle size={13} />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Playback Transport Deck */}
      <div className="audio-transport-deck">
        <div className="transport-status-row">
          <div className="status-indicator-wrap">
            <span className={`audio-pulse-indicator ${isPlaying ? 'is-active' : isPaused ? 'is-paused' : ''}`} />
            <span className="transport-status-label">
              {isPlaying ? 'Speaking Scene Prose...' : isPaused ? 'Narration Paused' : 'Ready to Narrate'}
            </span>
          </div>

          <span className="sentence-counter-badge">
            {activeSentenceIdx >= 0
              ? `P${activeParagraphIdx + 1} : S${activeSentenceIdx + 1}`
              : 'Paragraph 1'}
          </span>
        </div>

        {/* Big Control Buttons */}
        <div className="transport-controls-row">
          <button
            type="button"
            className="transport-btn secondary"
            onClick={() => handleSeek(-1)}
            disabled={!isPlaying && !isPaused}
            title="Previous Sentence"
          >
            <SkipBack size={15} />
          </button>

          <button
            type="button"
            className={`transport-btn primary play-pulse ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayToggle}
            disabled={isGenerating || !story?.trim()}
            title={isPlaying ? 'Pause Narration' : isPaused ? 'Resume Narration' : 'Start Narration'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="play-icon-offset" />}
          </button>

          <button
            type="button"
            className="transport-btn secondary"
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            title="Stop & Reset Narration"
          >
            <Square size={14} />
          </button>

          <button
            type="button"
            className="transport-btn secondary"
            onClick={() => handleSeek(1)}
            disabled={!isPlaying && !isPaused}
            title="Next Sentence"
          >
            <SkipForward size={15} />
          </button>
        </div>
      </div>

      {/* Voice Selector Dropdown */}
      <div className="station-control-group">
        <div className="control-label-header">
          <label htmlFor="voice-selector">Narrator Voice (Web Speech)</label>
          <Mic size={13} className="text-muted" />
        </div>

        <select
          id="voice-selector"
          className="station-select"
          value={selectedVoiceURI}
          onChange={(e) => setSelectedVoiceURI(e.target.value)}
          disabled={availableVoices.length === 0}
        >
          {availableVoices.length === 0 ? (
            <option value="">Default System Voice</option>
          ) : (
            availableVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Cadence (Playback Rate) Slider */}
      <div className="station-control-group">
        <div className="slider-label-row">
          <label htmlFor="cadence-slider">Narration Cadence</label>
          <span className="slider-value-readout">{cadenceRate.toFixed(2)}x</span>
        </div>
        <input
          id="cadence-slider"
          type="range"
          min="0.75"
          max="1.75"
          step="0.05"
          className="station-slider"
          value={cadenceRate}
          onChange={(e) => handleCadenceChange(e.target.value)}
        />
        <div className="slider-markers">
          <span>0.75x (Deliberate)</span>
          <span>1.0x (Standard)</span>
          <span>1.75x (Brisk)</span>
        </div>
      </div>

      {/* Pitch Slider */}
      <div className="station-control-group">
        <div className="slider-label-row">
          <label htmlFor="pitch-slider">Vocal Pitch</label>
          <span className="slider-value-readout">{pitch.toFixed(2)}</span>
        </div>
        <input
          id="pitch-slider"
          type="range"
          min="0.8"
          max="1.2"
          step="0.02"
          className="station-slider"
          value={pitch}
          onChange={(e) => handlePitchChange(e.target.value)}
        />
        <div className="slider-markers">
          <span>0.8 (Deep)</span>
          <span>1.0 (Natural)</span>
          <span>1.2 (Bright)</span>
        </div>
      </div>

      {/* Ambient Audio Synthesizer (Web Audio API) */}
      <div className="ambient-audio-card">
        <div className="ambient-header-row">
          <div className="ambient-title-wrap">
            <Waves size={14} className="ambient-icon" />
            <span className="ambient-title">Atmospheric Soundscape</span>
          </div>

          <button
            type="button"
            className={`ambient-toggle-btn ${isAmbientPlaying ? 'is-active' : ''}`}
            onClick={handleAmbientToggle}
            aria-pressed={isAmbientPlaying}
          >
            {isAmbientPlaying ? 'Playing' : 'Muted'}
          </button>
        </div>

        {/* Ambient Presets Grid */}
        <div className="ambient-presets-grid">
          {AMBIENT_PRESETS.map((p) => {
            const Icon = getAmbientIcon(p.id);
            const isSelected = ambientPreset === p.id;

            return (
              <button
                key={p.id}
                type="button"
                className={`ambient-preset-chip ${isSelected ? 'active-preset' : ''}`}
                onClick={() => setAmbientPreset(p.id)}
                title={p.description}
              >
                <Icon size={12} className="preset-icon" />
                <span className="preset-name">{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Ambient Volume Slider */}
        <div className="ambient-volume-row">
          <div className="slider-label-row">
            <span className="volume-label">Ambient Volume</span>
            <span className="slider-value-readout">{Math.round(ambientVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            className="station-slider"
            value={ambientVolume}
            onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
