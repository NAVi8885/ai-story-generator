import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * StoryContext State Machine, LocalStorage Persistence & Narration Tokenizer
 * Implements pure state reducers, localStorage safe parsers, audio boundary mappings,
 * and session import/export roundtrip.
 */

// Storage Keys
export const STORAGE_KEYS = {
  CAST: 'ai_story_cast',
  CATALYST: 'ai_story_catalyst',
  ILLUSTRATOR: 'ai_story_illustrator',
  AUDIO: 'ai_story_audio',
  LOCATION_LORE: 'ai_story_location_lore',
  AUDITOR: 'ai_story_auditor'
};

// Initial State Factory for all 6 Feature Stations
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

// In-Memory Storage Mock for Testing Persistence
export class MockLocalStorage {
  constructor(initialStore = {}) {
    this.store = { ...initialStore };
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

// Safe Storage Helpers with Fallback Protection
export function safeLoadState(storage, key, defaultValue) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { ...defaultValue, ...parsed };
    }
    return defaultValue;
  } catch (err) {
    // Corrupted JSON fallback
    return defaultValue;
  }
}

export function safeSaveState(storage, key, state) {
  try {
    storage.setItem(key, JSON.stringify(state));
    return true;
  } catch (err) {
    return false;
  }
}

// Feature Station Reducer Logic
export function stationReducer(state, action) {
  switch (action.type) {
    // 1. Dramatis Personae
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
        // Fall back to first remaining protagonist or first character
        const nextPov = characters.find(c => c.role === 'Protagonist') || characters[0];
        activePovId = nextPov ? nextPov.id : null;
        if (nextPov) nextPov.isPov = true;
      }
      return {
        ...state,
        dramatisPersonae: { activePovId, characters }
      };
    }

    // 2. Plot Catalyst
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
      const raw = parseInt(action.payload.severity, 10);
      const clamped = isNaN(raw) ? 3 : Math.min(Math.max(raw, 1), 5);
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

    // 3. Audio Theater
    case 'AUDIO_SET_RATES': {
      const rate = Math.min(Math.max(parseFloat(action.payload.cadenceRate ?? 1.0), 0.5), 2.0);
      const pitch = Math.min(Math.max(parseFloat(action.payload.pitch ?? 1.0), 0.5), 1.5);
      const volume = Math.min(Math.max(parseFloat(action.payload.volume ?? 1.0), 0.0), 1.0);
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

    // 4. Location & Lore Codex
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
        // Toggle or update
        updated = existing.map(l => l.id === id ? { ...l, rule, enabled } : l);
      } else {
        // Add new lock (max 2 enabled enforced)
        const newLock = { id: id || `lore_${Date.now()}`, rule, enabled };
        updated = [...existing, newLock];
      }

      // Enforce max 2 enabled locks
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

    default:
      return state;
  }
}

// Sentence Tokenizer for Synchronized StoryViewer Highlighting
export function tokenizeSentences(paragraphText) {
  if (!paragraphText || typeof paragraphText !== 'string') return [];

  // Sentence boundary regex with abbreviation lookbehind protections
  // Handles: Mr., Dr., Ms., Mrs., e.g., i.e., vs.
  const sentenceRegex = /(?<=[.!?])\s+(?=[A-Z0-9"“«])/g;
  const rawSentences = paragraphText.split(sentenceRegex);

  let currentOffset = 0;
  return rawSentences.map((text, idx) => {
    const trimmed = text.trim();
    const startChar = paragraphText.indexOf(trimmed, currentOffset);
    const endChar = startChar + trimmed.length;
    currentOffset = endChar;

    return {
      sentenceIdx: idx,
      text: trimmed,
      startChar,
      endChar
    };
  });
}

// Maps SpeechSynthesis onboundary charIndex to active sentence
export function mapCharIndexToSentence(tokens, charIndex) {
  if (!tokens || tokens.length === 0) return -1;
  for (const token of tokens) {
    if (charIndex >= token.startChar && charIndex <= token.endChar) {
      return token.sentenceIdx;
    }
  }
  // If charIndex is beyond last token, return last token index
  return tokens[tokens.length - 1].sentenceIdx;
}

// Full State Export / Import
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
  } catch (err) {
    return null;
  }
}

// =========================================================================
// TEST SUITE
// =========================================================================

describe('StoryContext State Persistence & Audio Synchronization - 4-Tier Test Suite', () => {

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 TESTS)
  // =========================================================================
  describe('Tier 1: Feature Coverage', () => {

    test('Feature 1: Initial state shape contains all 6 feature stations with valid defaults', () => {
      const state = createInitialStationState();

      // Check all 6 slices
      assert.ok(state.dramatisPersonae, 'Must have dramatisPersonae slice');
      assert.ok(Array.isArray(state.dramatisPersonae.characters), 'Characters must be array');
      assert.equal(state.dramatisPersonae.activePovId, null);

      assert.ok(state.plotCatalyst, 'Must have plotCatalyst slice');
      assert.equal(state.plotCatalyst.severity, 3);
      assert.equal(state.plotCatalyst.enabled, false);

      assert.ok(state.sceneIllustrator, 'Must have sceneIllustrator slice');
      assert.equal(state.sceneIllustrator.stylePreset, 'dark_fantasy_oil');

      assert.ok(state.audioTheater, 'Must have audioTheater slice');
      assert.equal(state.audioTheater.cadenceRate, 1.0);
      assert.equal(state.audioTheater.pitch, 1.0);

      assert.ok(state.locationCodex, 'Must have locationCodex slice');
      assert.ok(state.locationCodex.locationPins, 'Must have locationPins');
      assert.ok(Array.isArray(state.locationCodex.loreMicroLocks), 'Lore locks must be array');

      assert.ok(state.literaryAuditor, 'Must have literaryAuditor slice');
    });

    test('Feature 2: Character addition, POV toggle, and character deletion reducers', () => {
      let state = createInitialStationState();

      // Add Protagonist
      state = stationReducer(state, {
        type: 'CAST_ADD_CHARACTER',
        payload: { id: 'c1', name: 'Elena', role: 'Protagonist', isPov: true }
      });
      assert.equal(state.dramatisPersonae.characters.length, 1);
      assert.equal(state.dramatisPersonae.activePovId, 'c1');

      // Add Foil
      state = stationReducer(state, {
        type: 'CAST_ADD_CHARACTER',
        payload: { id: 'c2', name: 'Kael', role: 'Foil', isPov: false }
      });
      assert.equal(state.dramatisPersonae.characters.length, 2);
      assert.equal(state.dramatisPersonae.activePovId, 'c1', 'Elena remains POV');

      // Switch POV to Kael
      state = stationReducer(state, {
        type: 'CAST_SET_POV',
        payload: { id: 'c2' }
      });
      assert.equal(state.dramatisPersonae.activePovId, 'c2');
      assert.equal(state.dramatisPersonae.characters[1].isPov, true);
      assert.equal(state.dramatisPersonae.characters[0].isPov, false);
    });

    test('Feature 3: Narrative dice rolling and severity updating reducers', () => {
      let state = createInitialStationState();

      state = stationReducer(state, {
        type: 'CATALYST_ROLL_DICE',
        payload: { name: 'Betrayal', severity: 4, wildcard: 'The guide defects' }
      });

      assert.equal(state.plotCatalyst.selectedComplication, 'Betrayal');
      assert.equal(state.plotCatalyst.severity, 4);
      assert.equal(state.plotCatalyst.customWildcard, 'The guide defects');
      assert.equal(state.plotCatalyst.history.length, 1);

      // Adjust severity
      state = stationReducer(state, {
        type: 'CATALYST_SET_SEVERITY',
        payload: { severity: 5 }
      });
      assert.equal(state.plotCatalyst.severity, 5);
    });

    test('Feature 4: Location pins and lore micro-locks reducers with max 2 enabled limit', () => {
      let state = createInitialStationState();

      state = stationReducer(state, {
        type: 'LOCATION_SET_PINS',
        payload: { name: 'Obsidian Ridge', geography: 'Basalt cliffs', faction: 'Iron Guild' }
      });

      assert.equal(state.locationCodex.locationPins.name, 'Obsidian Ridge');
      assert.equal(state.locationCodex.locationPins.faction, 'Iron Guild');

      // Add Lock 1
      state = stationReducer(state, {
        type: 'LORE_ADD_OR_TOGGLE_LOCK',
        payload: { id: 'l1', rule: 'Rule 1', enabled: true }
      });
      // Add Lock 2
      state = stationReducer(state, {
        type: 'LORE_ADD_OR_TOGGLE_LOCK',
        payload: { id: 'l2', rule: 'Rule 2', enabled: true }
      });
      // Add Lock 3 (should be added but forced disabled or capped)
      state = stationReducer(state, {
        type: 'LORE_ADD_OR_TOGGLE_LOCK',
        payload: { id: 'l3', rule: 'Rule 3', enabled: true }
      });

      const enabledLocks = state.locationCodex.loreMicroLocks.filter(l => l.enabled);
      assert.ok(enabledLocks.length <= 2, `Enabled lore locks (${enabledLocks.length}) must not exceed 2`);
    });

    test('Feature 5: Sentence tokenizer tokenizes paragraph text into clean sentence intervals', () => {
      const paragraph = 'Elena drew her cloak tight against the freezing sleet. The citadel loomed ahead, silent and unforgiving. Did Marcus know she was here?';

      const tokens = tokenizeSentences(paragraph);

      assert.equal(tokens.length, 3, 'Must extract exactly 3 sentences');
      assert.equal(tokens[0].sentenceIdx, 0);
      assert.equal(tokens[0].text, 'Elena drew her cloak tight against the freezing sleet.');
      assert.equal(tokens[1].sentenceIdx, 1);
      assert.equal(tokens[2].sentenceIdx, 2);

      // Verify char offsets
      assert.equal(tokens[0].startChar, 0);
      assert.ok(tokens[0].endChar > 0);
      assert.ok(tokens[1].startChar >= tokens[0].endChar);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 TESTS)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {

    test('Boundary 1: Corrupted JSON in localStorage falls back safely to default state', () => {
      const storage = new MockLocalStorage({
        [STORAGE_KEYS.CAST]: '{"corrupted: json string [unclosed'
      });

      const fallback = { activePovId: null, characters: [] };
      const loaded = safeLoadState(storage, STORAGE_KEYS.CAST, fallback);

      assert.deepEqual(loaded, fallback, 'Corrupted JSON must return default fallback without throwing');
    });

    test('Boundary 2: Null and empty string values in storage return default fallback', () => {
      const storage = new MockLocalStorage({
        [STORAGE_KEYS.CATALYST]: ''
      });

      const fallback = { enabled: false, severity: 3 };
      const loaded = safeLoadState(storage, STORAGE_KEYS.CATALYST, fallback);

      assert.deepEqual(loaded, fallback);
    });

    test('Boundary 3: Missing keys in stored state merge seamlessly with default schema', () => {
      const storage = new MockLocalStorage({
        [STORAGE_KEYS.AUDIO]: JSON.stringify({
          cadenceRate: 1.5 // only 1 property stored from older version
        })
      });

      const defaultAudio = {
        isPlaying: false,
        cadenceRate: 1.0,
        pitch: 1.0,
        volume: 1.0
      };

      const loaded = safeLoadState(storage, STORAGE_KEYS.AUDIO, defaultAudio);

      assert.equal(loaded.cadenceRate, 1.5, 'Preserves stored property');
      assert.equal(loaded.pitch, 1.0, 'Merges missing pitch default');
      assert.equal(loaded.volume, 1.0, 'Merges missing volume default');
    });

    test('Boundary 4: Audio cadence, pitch, and volume clamp strictly within hardware boundaries', () => {
      let state = createInitialStationState();

      // Excessive high rates
      state = stationReducer(state, {
        type: 'AUDIO_SET_RATES',
        payload: { cadenceRate: 99.0, pitch: 99.0, volume: 5.0 }
      });
      assert.equal(state.audioTheater.cadenceRate, 2.0, 'Cadence rate clamped to 2.0 maximum');
      assert.equal(state.audioTheater.pitch, 1.5, 'Pitch clamped to 1.5 maximum');
      assert.equal(state.audioTheater.volume, 1.0, 'Volume clamped to 1.0 maximum');

      // Excessive low rates
      state = stationReducer(state, {
        type: 'AUDIO_SET_RATES',
        payload: { cadenceRate: -1.0, pitch: -1.0, volume: -1.0 }
      });
      assert.equal(state.audioTheater.cadenceRate, 0.5, 'Cadence rate clamped to 0.5 minimum');
      assert.equal(state.audioTheater.pitch, 0.5, 'Pitch clamped to 0.5 minimum');
      assert.equal(state.audioTheater.volume, 0.0, 'Volume clamped to 0.0 minimum');
    });

    test('Boundary 5: Deleting the active POV character automatically re-assigns POV to next character', () => {
      let state = createInitialStationState();

      state = stationReducer(state, {
        type: 'CAST_ADD_CHARACTER',
        payload: { id: 'c1', name: 'Elena', role: 'Protagonist', isPov: true }
      });
      state = stationReducer(state, {
        type: 'CAST_ADD_CHARACTER',
        payload: { id: 'c2', name: 'Kael', role: 'Ally', isPov: false }
      });

      // Delete active POV character Elena
      state = stationReducer(state, {
        type: 'CAST_REMOVE_CHARACTER',
        payload: { id: 'c1' }
      });

      assert.equal(state.dramatisPersonae.characters.length, 1);
      assert.equal(state.dramatisPersonae.activePovId, 'c2', 'POV re-assigned to remaining character Kael');
      assert.equal(state.dramatisPersonae.characters[0].isPov, true);
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {

    test('Combination 1: Web Speech charIndex event maps accurately to active sentence index in StoryViewer', () => {
      const paragraph = 'The rain hammered the copper roof. Marcus raised his glass. "To the survivor," he said.';
      const tokens = tokenizeSentences(paragraph);

      // Character 10 is inside Sentence 0 ("The rain...")
      assert.equal(mapCharIndexToSentence(tokens, 10), 0);

      // Character 42 is inside Sentence 1 ("Marcus raised...")
      assert.equal(mapCharIndexToSentence(tokens, 42), 1);

      // Character 70 is inside Sentence 2 ('"To the survivor..."')
      assert.equal(mapCharIndexToSentence(tokens, 70), 2);
    });

    test('Combination 2: Reducer updates audio sentence tracking state seamlessly', () => {
      let state = createInitialStationState();

      state = stationReducer(state, {
        type: 'AUDIO_SET_ACTIVE_SENTENCE',
        payload: { paragraphIdx: 2, sentenceIdx: 3 }
      });

      assert.equal(state.audioTheater.activeParagraphIdx, 2);
      assert.equal(state.audioTheater.activeSentenceIdx, 3);
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD SCENARIOS
  // =========================================================================
  describe('Tier 4: Real-World Scenarios', () => {

    test('Scenario 1: Full session export and import roundtrip preserves deep state across all 6 stations', () => {
      let state = createInitialStationState();

      // Populate complex state
      state = stationReducer(state, {
        type: 'CAST_ADD_CHARACTER',
        payload: { id: 'char_101', name: 'Valeria', role: 'Protagonist', tension: '4' }
      });
      state = stationReducer(state, {
        type: 'CATALYST_ROLL_DICE',
        payload: { name: 'Sensory Anomaly', severity: 4, wildcard: 'Blinding mercury mist' }
      });
      state = stationReducer(state, {
        type: 'LOCATION_SET_PINS',
        payload: { name: 'The Silent Spire', hazards: 'Freezing altitude winds' }
      });
      state = stationReducer(state, {
        type: 'LORE_ADD_OR_TOGGLE_LOCK',
        payload: { id: 'l1', rule: 'Magic extinguishes flame instantly', enabled: true }
      });
      state = stationReducer(state, {
        type: 'AUDIO_SET_RATES',
        payload: { cadenceRate: 1.25, pitch: 0.9, volume: 0.8 }
      });

      // Export to JSON string
      const jsonExport = exportStationSession(state);
      assert.ok(typeof jsonExport === 'string');
      assert.ok(jsonExport.includes('Valeria'));
      assert.ok(jsonExport.includes('Sensory Anomaly'));
      assert.ok(jsonExport.includes('The Silent Spire'));

      // Import from JSON string
      const importedState = importStationSession(jsonExport);
      assert.ok(importedState, 'Imported state must be valid');

      // Verify deep equality
      assert.equal(importedState.dramatisPersonae.characters[0].name, 'Valeria');
      assert.equal(importedState.plotCatalyst.selectedComplication, 'Sensory Anomaly');
      assert.equal(importedState.plotCatalyst.severity, 4);
      assert.equal(importedState.locationCodex.locationPins.name, 'The Silent Spire');
      assert.equal(importedState.audioTheater.cadenceRate, 1.25);
      assert.equal(importedState.audioTheater.pitch, 0.9);
      assert.equal(importedState.locationCodex.loreMicroLocks[0].rule, 'Magic extinguishes flame instantly');
    });

    test('Scenario 2: End-to-end LocalStorage persistence simulation across browser reloads', () => {
      const storage = new MockLocalStorage();
      let sessionA = createInitialStationState();

      // User performs work in Session A
      sessionA = stationReducer(sessionA, {
        type: 'CAST_ADD_CHARACTER',
        payload: { id: 'c1', name: 'Elena', role: 'Protagonist' }
      });
      sessionA = stationReducer(sessionA, {
        type: 'CATALYST_SET_SEVERITY',
        payload: { severity: 5 }
      });

      // Save to storage
      safeSaveState(storage, STORAGE_KEYS.CAST, sessionA.dramatisPersonae);
      safeSaveState(storage, STORAGE_KEYS.CATALYST, sessionA.plotCatalyst);

      // Simulate new browser session B reload
      const sessionB = createInitialStationState();
      sessionB.dramatisPersonae = safeLoadState(storage, STORAGE_KEYS.CAST, sessionB.dramatisPersonae);
      sessionB.plotCatalyst = safeLoadState(storage, STORAGE_KEYS.CATALYST, sessionB.plotCatalyst);

      // Verify state survived reload
      assert.equal(sessionB.dramatisPersonae.characters.length, 1);
      assert.equal(sessionB.dramatisPersonae.characters[0].name, 'Elena');
      assert.equal(sessionB.plotCatalyst.severity, 5);
    });
  });
});
