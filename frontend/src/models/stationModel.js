/**
 * Feature Stations Domain Model (Frontend MVC - Model Layer)
 * Defines storage keys, initial factory state, safe localStorage persistence,
 * station reducers, and full session import/export serialization.
 */

import { clampSeverity } from '../utils/narrativeDice.js';

export const STORAGE_KEYS = {
  CAST: 'ai_story_cast',
  CATALYST: 'ai_story_catalyst',
  ILLUSTRATOR: 'ai_story_illustrator',
  AUDIO: 'ai_story_audio',
  LOCATION_LORE: 'ai_story_location_lore',
  AUDITOR: 'ai_story_auditor'
};

export function createInitialStationState() {
  return {
    dramatisPersonae: {
      activePovId: null,
      characters: []
    },
    plotCatalyst: {
      enabled: false,
      selectedComplication: 'Ticking Clock',
      severity: 3,
      customWildcard: '',
      history: []
    },
    sceneIllustrator: {
      stylePreset: 'dark_fantasy_oil',
      customPrompt: '',
      gallery: [],
      lastGeneratedImage: null
    },
    audioTheater: {
      isPlaying: false,
      isPaused: false,
      selectedVoiceURI: '',
      cadenceRate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      activeParagraphIdx: 0,
      activeSentenceIdx: -1,
      isAmbientPlaying: false,
      ambientPreset: 'fireside',
      ambientVolume: 0.3
    },
    locationCodex: {
      locationPins: {
        name: '',
        geography: '',
        hazards: '',
        lighting: '',
        temperature: '',
        faction: ''
      },
      loreMicroLocks: []
    },
    literaryAuditor: {
      lastAudit: null
    }
  };
}

export function safeLoadState(storage, key, defaultValue) {
  try {
    if (!storage) return defaultValue;
    const raw = storage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { ...defaultValue, ...parsed };
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

export function safeSaveState(storage, key, state) {
  try {
    if (!storage) return false;
    storage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function stationReducer(state, action) {
  switch (action.type) {
    case 'CAST_SET_ROSTER': {
      const characters = action.payload.characters || [];
      const activePov = characters.find(c => c.isPov) || characters[0];
      const activePovId = activePov ? activePov.id : null;
      if (activePov) {
        characters.forEach(c => { c.isPov = (c.id === activePovId); });
      }
      return {
        ...state,
        dramatisPersonae: { activePovId, characters }
      };
    }

    case 'CAST_ADD_CHARACTER': {
      const newChar = {
        id: action.payload.id || `char_${Date.now()}`,
        name: action.payload.name || 'Unnamed',
        role: action.payload.role || 'Ally',
        psychologicalState: action.payload.psychologicalState || 'Neutral',
        motivation: action.payload.motivation || 'Unknown',
        dialogueQuirks: action.payload.dialogueQuirks || '',
        tension: String(action.payload.tension || 3),
        isPov: Boolean(action.payload.isPov)
      };
      const characters = [...state.dramatisPersonae.characters, newChar];
      let activePovId = state.dramatisPersonae.activePovId;
      if (newChar.isPov || characters.length === 1) {
        activePovId = newChar.id;
        characters.forEach(c => { c.isPov = (c.id === activePovId); });
      }
      return {
        ...state,
        dramatisPersonae: { activePovId, characters }
      };
    }

    case 'CAST_UPDATE_CHARACTER': {
      const { id, updates } = action.payload;
      const characters = state.dramatisPersonae.characters.map(c =>
        c.id === id ? { ...c, ...updates } : c
      );
      return {
        ...state,
        dramatisPersonae: { ...state.dramatisPersonae, characters }
      };
    }

    case 'CAST_SET_POV': {
      const activePovId = action.payload.id;
      const characters = state.dramatisPersonae.characters.map(c => ({
        ...c,
        isPov: c.id === activePovId
      }));
      return {
        ...state,
        dramatisPersonae: { activePovId, characters }
      };
    }

    case 'CAST_REMOVE_CHARACTER': {
      const removeId = action.payload.id;
      const characters = state.dramatisPersonae.characters.filter(c => c.id !== removeId);
      let activePovId = state.dramatisPersonae.activePovId;
      if (activePovId === removeId) {
        const nextPov = characters.find(c => c.role === 'Protagonist') || characters[0];
        activePovId = nextPov ? nextPov.id : null;
        if (nextPov) nextPov.isPov = true;
      }
      return {
        ...state,
        dramatisPersonae: { activePovId, characters }
      };
    }

    case 'CATALYST_ROLL_DICE': {
      return {
        ...state,
        plotCatalyst: {
          ...state.plotCatalyst,
          selectedComplication: action.payload.name,
          severity: action.payload.severity ?? state.plotCatalyst.severity,
          customWildcard: action.payload.wildcard || state.plotCatalyst.customWildcard,
          history: [action.payload, ...state.plotCatalyst.history.slice(0, 9)]
        }
      };
    }

    case 'CATALYST_SET_SEVERITY': {
      const clamped = clampSeverity(action.payload.severity);
      return {
        ...state,
        plotCatalyst: { ...state.plotCatalyst, severity: clamped }
      };
    }

    case 'CATALYST_TOGGLE_INJECTION': {
      return {
        ...state,
        plotCatalyst: {
          ...state.plotCatalyst,
          enabled: action.payload.enabled !== undefined ? Boolean(action.payload.enabled) : !state.plotCatalyst.enabled
        }
      };
    }

    case 'CATALYST_SET_CUSTOM_WILDCARD': {
      return {
        ...state,
        plotCatalyst: {
          ...state.plotCatalyst,
          customWildcard: action.payload.wildcard || ''
        }
      };
    }

    case 'ILLUSTRATOR_SET_STYLE': {
      return {
        ...state,
        sceneIllustrator: {
          ...state.sceneIllustrator,
          stylePreset: action.payload.stylePreset
        }
      };
    }

    case 'ILLUSTRATOR_SET_PROMPTS': {
      return {
        ...state,
        sceneIllustrator: {
          ...state.sceneIllustrator,
          customPrompt: action.payload.customPrompt !== undefined ? action.payload.customPrompt : state.sceneIllustrator.customPrompt,
          extractedPrompt: action.payload.extractedPrompt !== undefined ? action.payload.extractedPrompt : state.sceneIllustrator.extractedPrompt
        }
      };
    }

    case 'ILLUSTRATOR_SET_ACTIVE_IMAGE': {
      const newImage = action.payload.image;
      const gallery = newImage
        ? [newImage, ...state.sceneIllustrator.gallery.filter(item => item.imageUrl !== newImage.imageUrl).slice(0, 19)]
        : state.sceneIllustrator.gallery;
      return {
        ...state,
        sceneIllustrator: {
          ...state.sceneIllustrator,
          lastGeneratedImage: newImage,
          gallery
        }
      };
    }

    case 'AUDIO_SET_RATES': {
      const rate = Math.min(Math.max(parseFloat(action.payload.cadenceRate ?? state.audioTheater.cadenceRate), 0.5), 2.0);
      const pitch = Math.min(Math.max(parseFloat(action.payload.pitch ?? state.audioTheater.pitch), 0.5), 1.5);
      const volume = Math.min(Math.max(parseFloat(action.payload.volume ?? state.audioTheater.volume), 0.0), 1.0);
      return {
        ...state,
        audioTheater: { ...state.audioTheater, cadenceRate: rate, pitch, volume }
      };
    }

    case 'AUDIO_SET_ACTIVE_SENTENCE': {
      return {
        ...state,
        audioTheater: {
          ...state.audioTheater,
          activeParagraphIdx: action.payload.paragraphIdx ?? state.audioTheater.activeParagraphIdx,
          activeSentenceIdx: action.payload.sentenceIdx ?? state.audioTheater.activeSentenceIdx
        }
      };
    }

    case 'AUDIO_SET_PLAYBACK_STATE': {
      return {
        ...state,
        audioTheater: {
          ...state.audioTheater,
          isPlaying: action.payload.isPlaying !== undefined ? action.payload.isPlaying : state.audioTheater.isPlaying,
          isPaused: action.payload.isPaused !== undefined ? action.payload.isPaused : state.audioTheater.isPaused
        }
      };
    }

    case 'AUDIO_SET_VOICE': {
      return {
        ...state,
        audioTheater: {
          ...state.audioTheater,
          selectedVoiceURI: action.payload.voiceURI || ''
        }
      };
    }

    case 'AUDIO_SET_AMBIENT': {
      return {
        ...state,
        audioTheater: {
          ...state.audioTheater,
          isAmbientPlaying: action.payload.isAmbientPlaying !== undefined ? action.payload.isAmbientPlaying : state.audioTheater.isAmbientPlaying,
          ambientPreset: action.payload.ambientPreset || state.audioTheater.ambientPreset,
          ambientVolume: action.payload.ambientVolume !== undefined ? action.payload.ambientVolume : state.audioTheater.ambientVolume
        }
      };
    }

    case 'LOCATION_SET_PINS': {
      return {
        ...state,
        locationCodex: {
          ...state.locationCodex,
          locationPins: { ...state.locationCodex.locationPins, ...action.payload }
        }
      };
    }

    case 'LORE_ADD_OR_TOGGLE_LOCK': {
      const { id, rule, enabled = true } = action.payload;
      const existing = state.locationCodex.loreMicroLocks;
      const index = existing.findIndex(l => l.id === id);

      let updated;
      if (index !== -1) {
        updated = existing.map(l => l.id === id ? { ...l, rule, enabled } : l);
      } else {
        const newLock = { id: id || `lore_${Date.now()}`, rule, enabled };
        updated = [...existing, newLock];
      }

      let enabledCount = 0;
      updated = updated.map(l => {
        if (l.enabled) {
          enabledCount++;
          if (enabledCount > 2) {
            return { ...l, enabled: false };
          }
        }
        return l;
      });

      return {
        ...state,
        locationCodex: {
          ...state.locationCodex,
          loreMicroLocks: updated
        }
      };
    }

    case 'LORE_REMOVE_LOCK': {
      return {
        ...state,
        locationCodex: {
          ...state.locationCodex,
          loreMicroLocks: state.locationCodex.loreMicroLocks.filter(l => l.id !== action.payload.id)
        }
      };
    }

    case 'AUDITOR_SET_REPORT': {
      return {
        ...state,
        literaryAuditor: {
          ...state.literaryAuditor,
          lastAudit: action.payload.audit
        }
      };
    }

    case 'STATION_IMPORT_STATE': {
      return action.payload;
    }

    default:
      return state;
  }
}

export function exportStationSession(state) {
  return JSON.stringify({
    version: '2.0.0',
    exportTimestamp: Date.now(),
    stations: {
      dramatisPersonae: state.dramatisPersonae,
      plotCatalyst: state.plotCatalyst,
      sceneIllustrator: state.sceneIllustrator,
      audioTheater: state.audioTheater,
      locationCodex: state.locationCodex
    }
  }, null, 2);
}

export function importStationSession(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.stations) {
      throw new Error('Invalid station session format');
    }
    const defaults = createInitialStationState();
    return {
      ...defaults,
      dramatisPersonae: { ...defaults.dramatisPersonae, ...(parsed.stations.dramatisPersonae || {}) },
      plotCatalyst: { ...defaults.plotCatalyst, ...(parsed.stations.plotCatalyst || {}) },
      sceneIllustrator: { ...defaults.sceneIllustrator, ...(parsed.stations.sceneIllustrator || {}) },
      audioTheater: { ...defaults.audioTheater, ...(parsed.stations.audioTheater || {}) },
      locationCodex: { ...defaults.locationCodex, ...(parsed.stations.locationCodex || {}) }
    };
  } catch {
    return null;
  }
}
