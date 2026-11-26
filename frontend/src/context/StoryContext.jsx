/**
 * StoryContext (Frontend MVC State Bridge)
 * Connects pure Domain Models (models/*) and API/Media/Audio Controllers (controllers/*)
 * to React presentation Views via Context.
 */

import React, { createContext, useContext, useState, useEffect, useReducer, useRef } from 'react';
import { extractCastFromProse } from '../utils/castExtractor.js';
import { rollProceduralDice } from '../utils/narrativeDice.js';
import { auditProse } from '../utils/literaryAuditor.js';
import { IMAGE_STYLE_PRESETS } from '../utils/imageStylePresets.js';

import {
  GENRE_PRESETS,
  DEFAULT_SLIDERS,
  MASTER_STYLE_PRESETS,
  DEFAULT_BIBLE,
  SECTION_DEFAULT_KEYS,
  normalizeChapter,
  clampChapterIndex,
  normalizeRestoredHistoryEntry,
  buildStoryExportPayload
} from '../models/storyModel.js';
import {
  STORAGE_KEYS,
  createInitialStationState,
  safeLoadState,
  safeSaveState,
  stationReducer,
  exportStationSession,
  importStationSession
} from '../models/stationModel.js';
import {
  tokenizeSentences,
  mapCharIndexToSentence,
  sanitizeClientStreamBuffer
} from '../models/streamModel.js';

import {
  enhancePremiseRequest,
  saveApiKeysRequest,
  requestNextChapterPrompt,
  streamStoryGeneration,
  triggerFileDownload
} from '../controllers/storyController.js';
import {
  extractScenePromptRequest,
  generateSceneArtworkRequest,
  exportArtworkAction
} from '../controllers/mediaController.js';
import {
  playSpeechNarration,
  pauseSpeechNarration,
  resumeSpeechNarration,
  stopSpeechNarration,
  toggleAmbientSoundscape,
  setAmbientSoundscapePreset,
  setAmbientSoundscapeVolume
} from '../controllers/audioController.js';

export {
  GENRE_PRESETS,
  DEFAULT_SLIDERS,
  MASTER_STYLE_PRESETS,
  STORAGE_KEYS,
  createInitialStationState,
  safeLoadState,
  safeSaveState,
  stationReducer,
  tokenizeSentences,
  mapCharIndexToSentence,
  exportStationSession,
  importStationSession,
  normalizeChapter
};

const StoryContext = createContext(null);

export function StoryProvider({ children }) {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('custom');

  const [sliders, setSliders] = useState(() =>
    safeLoadState(typeof window !== 'undefined' ? window.localStorage : null, 'ai_story_sliders', DEFAULT_SLIDERS)
  );
  const [storyBible, setStoryBible] = useState(() =>
    safeLoadState(typeof window !== 'undefined' ? window.localStorage : null, 'ai_story_bible', DEFAULT_BIBLE)
  );
  const [byok, setByok] = useState(() =>
    safeLoadState(typeof window !== 'undefined' ? window.localStorage : null, 'ai_story_byok', {
      groq: '',
      gemini: '',
      openrouter: '',
      huggingface: ''
    })
  );
  const [history, setHistory] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('ai_story_history') : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [stationState, dispatchStation] = useReducer(stationReducer, undefined, () => {
    const defaults = createInitialStationState();
    if (typeof window === 'undefined' || !window.localStorage) return defaults;
    return {
      dramatisPersonae: safeLoadState(window.localStorage, STORAGE_KEYS.CAST, defaults.dramatisPersonae),
      plotCatalyst: safeLoadState(window.localStorage, STORAGE_KEYS.CATALYST, defaults.plotCatalyst),
      sceneIllustrator: safeLoadState(window.localStorage, STORAGE_KEYS.ILLUSTRATOR, defaults.sceneIllustrator),
      audioTheater: safeLoadState(window.localStorage, STORAGE_KEYS.AUDIO, defaults.audioTheater),
      locationCodex: safeLoadState(window.localStorage, STORAGE_KEYS.LOCATION_LORE, defaults.locationCodex),
      literaryAuditor: safeLoadState(window.localStorage, STORAGE_KEYS.AUDITOR, defaults.literaryAuditor)
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      safeSaveState(window.localStorage, STORAGE_KEYS.CAST, stationState.dramatisPersonae);
      safeSaveState(window.localStorage, STORAGE_KEYS.CATALYST, stationState.plotCatalyst);
      safeSaveState(window.localStorage, STORAGE_KEYS.ILLUSTRATOR, stationState.sceneIllustrator);
      safeSaveState(window.localStorage, STORAGE_KEYS.AUDIO, stationState.audioTheater);
      safeSaveState(window.localStorage, STORAGE_KEYS.LOCATION_LORE, stationState.locationCodex);
      safeSaveState(window.localStorage, STORAGE_KEYS.AUDITOR, stationState.literaryAuditor);
    }
  }, [stationState]);

  const [story, setStory] = useState('');
  const [thinking, setThinking] = useState('');
  const [branchChoices, setBranchChoices] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [activeChapterIndex, setActiveChapterIndexState] = useState(0);
  const [nextChapterSynthesis, setNextChapterSynthesis] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('prose');

  const [telemetry, setTelemetry] = useState({
    wordCount: 0,
    readingTimeMinutes: 0,
    tokensPerSec: 0,
    activeProvider: 'Auto-Routing'
  });

  const abortControllerRef = useRef(null);
  const streamStartTimeRef = useRef(null);
  const tokenCountRef = useRef(0);
  const speechUtteranceRef = useRef(null);

  useEffect(() => { safeSaveState(typeof window !== 'undefined' ? window.localStorage : null, 'ai_story_sliders', sliders); }, [sliders]);
  useEffect(() => { safeSaveState(typeof window !== 'undefined' ? window.localStorage : null, 'ai_story_bible', storyBible); }, [storyBible]);
  useEffect(() => { safeSaveState(typeof window !== 'undefined' ? window.localStorage : null, 'ai_story_byok', byok); }, [byok]);
  useEffect(() => {
    try {
      localStorage.setItem('ai_story_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [history]);

  useEffect(() => {
    const words = story.trim() ? story.trim().split(/\s+/).length : 0;
    const readingTime = parseFloat((words / 225).toFixed(1));
    setTelemetry((prev) => ({ ...prev, wordCount: words, readingTimeMinutes: readingTime }));
  }, [story]);

  useEffect(() => {
    if (story && story.trim().length > 30) {
      const report = auditProse(story);
      dispatchStation({ type: 'AUDITOR_SET_REPORT', payload: { audit: report } });
    }
  }, [story]);

  const updateSlider = (field, value) => setSliders((prev) => ({ ...prev, [field]: value }));
  const updateStoryBible = (field, value) => setStoryBible((prev) => ({ ...prev, [field]: value }));

  const saveAndPersistKeys = async (newKeys) => {
    const cleaned = {
      groq: (newKeys.groq || '').trim(),
      gemini: (newKeys.gemini || '').trim(),
      openrouter: (newKeys.openrouter || '').trim(),
      huggingface: (newKeys.huggingface || '').trim()
    };
    setByok(cleaned);
    safeSaveState(typeof window !== 'undefined' ? window.localStorage : null, 'ai_story_byok', cleaned);
    return saveApiKeysRequest(cleaned);
  };

  const resetSliders = () => {
    setSliders(DEFAULT_SLIDERS);
    setGenre('custom');
  };

  const applyGenrePreset = (genreId) => {
    setGenre(genreId);
    const preset = GENRE_PRESETS.find((p) => p.id === genreId);
    if (preset) {
      setSliders((prev) => ({
        ...prev,
        creativity: preset.creativity,
        tone: preset.tone,
        pacing: preset.pacing,
        strictness: preset.strictness
      }));
    }
  };

  const applyMasterPreset = (presetId) => {
    const preset = MASTER_STYLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    if (preset.genre) setGenre(preset.genre);
    setSliders((prev) => ({ ...prev, ...preset.sliders }));
  };

  const resetSectionSliders = (sectionKey) => {
    const keysToReset = SECTION_DEFAULT_KEYS[sectionKey];
    if (!keysToReset) return;
    setSliders((prev) => {
      const updated = { ...prev };
      keysToReset.forEach((k) => { updated[k] = DEFAULT_SLIDERS[k]; });
      return updated;
    });
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) {
      setError('Please type an initial seed word or concept to enhance');
      return;
    }
    setIsEnhancing(true);
    setError('');
    try {
      const enhanced = await enhancePremiseRequest({ prompt, byok });
      if (enhanced) setPrompt(enhanced);
    } catch (err) {
      setError(err.message || 'Could not enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Feature Station Actions
  const addCharacter = (charData) => dispatchStation({ type: 'CAST_ADD_CHARACTER', payload: charData });
  const updateCharacter = (id, updates) => dispatchStation({ type: 'CAST_UPDATE_CHARACTER', payload: { id, updates } });
  const removeCharacter = (id) => dispatchStation({ type: 'CAST_REMOVE_CHARACTER', payload: { id } });
  const setActivePov = (id) => dispatchStation({ type: 'CAST_SET_POV', payload: { id } });

  const triggerCastExtraction = (textOverride) => {
    const targetText = textOverride || story;
    if (!targetText || !targetText.trim()) return [];
    const extracted = extractCastFromProse(targetText);
    if (extracted.length > 0) {
      dispatchStation({ type: 'CAST_SET_ROSTER', payload: { characters: extracted } });
    }
    return extracted;
  };

  const rollCatalystDice = (options = {}) => {
    const roll = rollProceduralDice({
      ...options,
      severity: options.severity ?? stationState.plotCatalyst.severity,
      customWildcard: options.customWildcard ?? stationState.plotCatalyst.customWildcard
    });
    dispatchStation({ type: 'CATALYST_ROLL_DICE', payload: roll });
    return roll;
  };
  const setCatalystSeverity = (severity) => dispatchStation({ type: 'CATALYST_SET_SEVERITY', payload: { severity } });
  const toggleCatalystInjection = (enabled) => dispatchStation({ type: 'CATALYST_TOGGLE_INJECTION', payload: { enabled } });
  const setCustomWildcard = (wildcard) => dispatchStation({ type: 'CATALYST_SET_CUSTOM_WILDCARD', payload: { wildcard } });

  const setImageStyle = (stylePreset) => dispatchStation({ type: 'ILLUSTRATOR_SET_STYLE', payload: { stylePreset } });
  const setCustomImagePrompt = (customPrompt) => dispatchStation({ type: 'ILLUSTRATOR_SET_PROMPTS', payload: { customPrompt } });
  const setActiveImage = (image) => dispatchStation({ type: 'ILLUSTRATOR_SET_ACTIVE_IMAGE', payload: { image } });

  const triggerPromptExtraction = async (textOverride) => {
    const targetText = textOverride || story;
    if (!targetText) return '';
    const extracted = await extractScenePromptRequest({ prose: targetText, byok });
    if (extracted) {
      dispatchStation({ type: 'ILLUSTRATOR_SET_PROMPTS', payload: { extractedPrompt: extracted } });
    }
    return extracted;
  };

  const generateSceneArtwork = async (promptOverride, styleOverride) => {
    const activeVisualPrompt = promptOverride || stationState.sceneIllustrator.customPrompt || stationState.sceneIllustrator.extractedPrompt || prompt;
    const activeStyle = styleOverride || stationState.sceneIllustrator.stylePreset || 'dark_fantasy_oil';
    if (!activeVisualPrompt) {
      throw new Error('Please provide an image prompt or extract one from prose first');
    }
    const data = await generateSceneArtworkRequest({ prompt: activeVisualPrompt, stylePreset: activeStyle, byok });
    dispatchStation({ type: 'ILLUSTRATOR_SET_ACTIVE_IMAGE', payload: { image: data } });
    return data;
  };

  const exportArtwork = (imageItem, format = 'download') => {
    exportArtworkAction(imageItem || stationState.sceneIllustrator.lastGeneratedImage, format);
  };

  const setAudioRates = ({ cadenceRate, pitch, volume }) =>
    dispatchStation({ type: 'AUDIO_SET_RATES', payload: { cadenceRate, pitch, volume } });
  const setActiveSentence = ({ paragraphIdx, sentenceIdx }) =>
    dispatchStation({ type: 'AUDIO_SET_ACTIVE_SENTENCE', payload: { paragraphIdx, sentenceIdx } });
  const playNarration = (textOverride) =>
    playSpeechNarration({
      text: textOverride || story,
      audioTheater: stationState.audioTheater,
      speechUtteranceRef,
      dispatchStation
    });
  const pauseNarration = () => pauseSpeechNarration(dispatchStation);
  const resumeNarration = () => resumeSpeechNarration(dispatchStation);
  const stopNarration = () => stopSpeechNarration(dispatchStation);
  const seekNarration = (sentenceIdx, paragraphIdx = 0) =>
    dispatchStation({ type: 'AUDIO_SET_ACTIVE_SENTENCE', payload: { paragraphIdx, sentenceIdx } });
  const setSelectedVoiceURI = (voiceURI) =>
    dispatchStation({ type: 'AUDIO_SET_VOICE', payload: { voiceURI } });
  const toggleAmbientAudio = (forceState) =>
    toggleAmbientSoundscape({ forceState, audioTheater: stationState.audioTheater, dispatchStation });
  const setAmbientPreset = (ambientPreset) =>
    setAmbientSoundscapePreset({ ambientPreset, dispatchStation });
  const setAmbientVolume = (ambientVolume) =>
    setAmbientSoundscapeVolume({ ambientVolume, dispatchStation });

  const setLocationPins = (pins) => dispatchStation({ type: 'LOCATION_SET_PINS', payload: pins });
  const updateLocationField = (field, value) => dispatchStation({ type: 'LOCATION_SET_PINS', payload: { [field]: value } });
  const addOrToggleLoreLock = (lockData) => dispatchStation({ type: 'LORE_ADD_OR_TOGGLE_LOCK', payload: lockData });
  const removeLoreLock = (id) => dispatchStation({ type: 'LORE_REMOVE_LOCK', payload: { id } });

  const triggerProseAudit = (textOverride) => {
    const report = auditProse(textOverride || story);
    dispatchStation({ type: 'AUDITOR_SET_REPORT', payload: { audit: report } });
    return report;
  };

  const exportFeatureStationsSession = () => exportStationSession(stationState);
  const importFeatureStationsSession = (jsonString) => {
    const imported = importStationSession(jsonString);
    if (imported) {
      dispatchStation({ type: 'STATION_IMPORT_STATE', payload: imported });
      return true;
    }
    return false;
  };

  // Multi-Chapter Saga Actions
  const setActiveChapterIndex = (idx) => {
    const clamped = clampChapterIndex(idx, chapters.length, isGenerating);
    setActiveChapterIndexState(clamped);

    const target = chapters[clamped];
    if (target) {
      setStory(target.content || '');
      setThinking(target.thinking || '');
    }
    stopNarration();
  };

  const activeChapter = chapters[activeChapterIndex] || null;

  useEffect(() => {
    if (!isGenerating && chapters.length > 0) {
      const active = chapters[activeChapterIndex];
      if (active) {
        if (story !== active.content) setStory(active.content || '');
        if (thinking !== active.thinking) setThinking(active.thinking || '');
      }
    }
  }, [activeChapterIndex, chapters, isGenerating]);

  const generateNextChapterPrompt = async (targetIndex = activeChapterIndex) => {
    const chapIndex = (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < chapters.length)
      ? targetIndex
      : Math.max(0, chapters.length - 1);

    const synthesis = await requestNextChapterPrompt({
      chapters,
      storyBible,
      genre,
      chapIndex,
      byok,
      story
    });
    setNextChapterSynthesis(synthesis);
    return synthesis;
  };

  const generateStory = async (seedOverride, isContinuation = false) => {
    const activePrompt = seedOverride || prompt;
    if (!activePrompt.trim()) {
      setError('Please provide a story premise first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setBranchChoices([]);
    stopNarration();

    const prevChapters = isContinuation ? [...chapters] : [];
    const targetIndex = isContinuation ? prevChapters.length : 0;
    const targetChapterNum = targetIndex + 1;

    setActiveChapterIndexState(targetIndex);
    setStory('');
    setThinking('');
    if (!isContinuation) setChapters([]);

    abortControllerRef.current = new AbortController();
    streamStartTimeRef.current = Date.now();
    tokenCountRef.current = 0;

    let rawAccumulatedStream = '';
    let accumulatedThinking = '';
    let streamCompleted = false;

    const activePovChar = stationState.dramatisPersonae.characters.find(
      c => c.id === stationState.dramatisPersonae.activePovId || c.isPov
    );

    const payload = {
      prompt: activePrompt,
      sliders,
      genre,
      storyBible,
      previousChapters: prevChapters,
      includeBranchChoices: true,
      dramatisPersonae: stationState.dramatisPersonae.characters.map(c => ({
        ...c,
        isPov: c.id === stationState.dramatisPersonae.activePovId
      })),
      activePovCharacter: activePovChar ? activePovChar.name : '',
      locationPins: stationState.locationCodex.locationPins,
      plotCatalyst: {
        enabled: Boolean(stationState.plotCatalyst.enabled),
        complication: stationState.plotCatalyst.selectedComplication,
        severity: stationState.plotCatalyst.severity,
        wildcard: stationState.plotCatalyst.customWildcard
      },
      loreMicroLocks: stationState.locationCodex.loreMicroLocks.filter(l => l.enabled)
    };

    try {
      await streamStoryGeneration({
        payload,
        byok,
        signal: abortControllerRef.current.signal,
        onProvider: (providerName) => {
          setTelemetry((prev) => ({ ...prev, activeProvider: providerName || prev.activeProvider }));
        },
        onChunk: (parsed) => {
          tokenCountRef.current += 1;
          const elapsedSec = (Date.now() - streamStartTimeRef.current) / 1000;
          const tps = elapsedSec > 0 ? (tokenCountRef.current / elapsedSec).toFixed(1) : 0;

          if (parsed.type === 'thinking') {
            accumulatedThinking += parsed.text;
            setThinking(accumulatedThinking);
          } else if (parsed.type === 'prose_replace') {
            rawAccumulatedStream = parsed.text;
            const sanitized = sanitizeClientStreamBuffer(rawAccumulatedStream);
            if (sanitized.thinking && !accumulatedThinking) setThinking(sanitized.thinking);
            setStory(sanitized.prose);
            setTelemetry((prev) => ({ ...prev, tokensPerSec: tps }));
          } else if (parsed.type === 'prose') {
            rawAccumulatedStream += parsed.text;
            const sanitized = sanitizeClientStreamBuffer(rawAccumulatedStream);
            if (sanitized.thinking && !accumulatedThinking) setThinking(sanitized.thinking);
            setStory(sanitized.prose);
            setTelemetry((prev) => ({ ...prev, tokensPerSec: tps }));
          }
        },
        onComplete: (parsed) => {
          streamCompleted = true;
          const sanitizedStream = sanitizeClientStreamBuffer(rawAccumulatedStream);
          const finalProse = (parsed.prose || sanitizedStream.prose || '').trim();
          const finalThinking = (parsed.thinking || accumulatedThinking || sanitizedStream.thinking || '').trim();

          setStory(finalProse);
          setThinking(finalThinking);
          if (parsed.branchChoices?.length) setBranchChoices(parsed.branchChoices);

          const completedChapter = {
            number: targetChapterNum,
            title: `Chapter ${targetChapterNum}`,
            content: finalProse,
            thinking: finalThinking,
            timestamp: new Date().toISOString()
          };

          if (!isContinuation) {
            setChapters([completedChapter]);
            setActiveChapterIndexState(0);
          } else {
            setChapters((prev) => [...prev.slice(0, targetIndex), completedChapter]);
            setActiveChapterIndexState(targetIndex);
          }
        }
      });
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.log('Stream stopped by user.');
      } else {
        console.error('Stream failure:', err);
        setError(err.message || 'Something went wrong while generating.');
      }
    } finally {
      setIsGenerating(false);
      if (!streamCompleted && !rawAccumulatedStream.trim() && isContinuation) {
        const fallbackIdx = Math.max(0, prevChapters.length - 1);
        setActiveChapterIndexState(fallbackIdx);
        if (prevChapters[fallbackIdx]) {
          setStory(prevChapters[fallbackIdx].content || '');
          setThinking(prevChapters[fallbackIdx].thinking || '');
        }
      } else if (!streamCompleted && rawAccumulatedStream.trim()) {
        const sanitizedStream = sanitizeClientStreamBuffer(rawAccumulatedStream);
        const partialProse = sanitizedStream.prose.trim();
        const partialThinking = (accumulatedThinking || sanitizedStream.thinking || '').trim();
        if (partialProse || partialThinking) {
          const partialChapter = {
            number: targetChapterNum,
            title: `Chapter ${targetChapterNum}`,
            content: partialProse,
            thinking: partialThinking,
            timestamp: new Date().toISOString()
          };
          if (!isContinuation) {
            setChapters([partialChapter]);
            setActiveChapterIndexState(0);
          } else {
            setChapters((prev) => [...prev.slice(0, targetIndex), partialChapter]);
            setActiveChapterIndexState(targetIndex);
          }
        }
      }
    }
  };

  const continueToNextChapter = async (customPrompt) => {
    const nextChapterNum = chapters.length + 1;
    const promptToUse = (typeof customPrompt === 'string' && customPrompt.trim())
      ? customPrompt.trim()
      : (prompt.trim() || `Continue the story into Chapter ${nextChapterNum}. Escalate the narrative tension, advance the central conflict, and challenge the protagonist with an unforeseen dilemma.`);
    await generateStory(promptToUse, true);
  };

  const startNewStory = () => {
    setStory('');
    setThinking('');
    setChapters([]);
    setActiveChapterIndexState(0);
    setNextChapterSynthesis(null);
    setBranchChoices([]);
    setError('');
    stopNarration();
  };

  const continueWithBranch = async (choice) => {
    const nextChapterNum = chapters.length + 1;
    const nextChapterPrompt = `Continue the story directly into Chapter ${nextChapterNum}. The protagonist takes this path: "${choice.title} - ${choice.description}". Introduce immediate consequences and develop the scene.`;
    await generateStory(nextChapterPrompt, true);
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  const saveCurrentToHistory = () => {
    if (!story.trim() && chapters.length === 0) return;

    const entry = {
      id: `story_${Date.now()}`,
      title: prompt.slice(0, 45) + (prompt.length > 45 ? '...' : '') || (chapters[0]?.title || 'Untitled Saga'),
      prompt,
      genre,
      story,
      thinking,
      chapters,
      activeChapterIndex,
      branchChoices,
      sliders,
      wordCount: telemetry.wordCount,
      timestamp: new Date().toISOString()
    };

    setHistory((prev) => [entry, ...prev.slice(0, 49)]);
  };

  const restoreFromHistory = (id) => {
    const found = history.find((h) => h.id === id);
    if (!found) return;

    setPrompt(found.prompt || '');
    setGenre(found.genre || 'custom');
    setBranchChoices(found.branchChoices || []);
    if (found.sliders) setSliders(found.sliders);

    const restoredChapters = normalizeRestoredHistoryEntry(found);
    setChapters(restoredChapters);
    setActiveChapterIndexState(0);
    setStory(restoredChapters[0]?.content || found.story || '');
    setThinking(restoredChapters[0]?.thinking || found.thinking || '');
    setError('');
    stopNarration();
  };

  const deleteHistoryItem = (id) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const exportStory = (format) => {
    if (!story.trim() && chapters.length === 0) return;
    const filePayload = buildStoryExportPayload({
      format,
      prompt,
      genre,
      telemetry,
      chapters,
      thinking,
      story,
      branchChoices,
      sliders,
      storyBible,
      stationState,
      activeChapterIndex
    });
    if (filePayload.content) {
      triggerFileDownload(filePayload);
    }
  };

  return (
    <StoryContext.Provider
      value={{
        prompt,
        setPrompt,
        genre,
        applyGenrePreset,
        applyMasterPreset,
        resetSectionSliders,
        masterStylePresets: MASTER_STYLE_PRESETS,
        sliders,
        updateSlider,
        resetSliders,
        storyBible,
        updateStoryBible,
        byok,
        setByok,
        saveAndPersistKeys,
        history,
        saveCurrentToHistory,
        restoreFromHistory,
        deleteHistoryItem,
        story,
        setStory,
        thinking,
        setThinking,
        branchChoices,
        chapters,
        setChapters,
        activeChapterIndex,
        setActiveChapterIndex,
        activeChapter,
        nextChapterSynthesis,
        setNextChapterSynthesis,
        generateNextChapterPrompt,
        continueToNextChapter,
        startNewStory,
        normalizeChapter,
        isGenerating,
        isEnhancing,
        error,
        setError,
        activeTab,
        setActiveTab,
        telemetry,
        generateStory,
        continueWithBranch,
        stopGeneration,
        enhancePrompt,
        exportStory,
        castRoster: stationState.dramatisPersonae,
        dramatisPersonae: stationState.dramatisPersonae,
        plotCatalyst: stationState.plotCatalyst,
        sceneIllustrator: stationState.sceneIllustrator,
        audioTheater: stationState.audioTheater,
        locationCodex: stationState.locationCodex,
        literaryAuditor: stationState.literaryAuditor,
        stationState,
        addCharacter,
        updateCharacter,
        removeCharacter,
        setActivePov,
        triggerCastExtraction,
        rollCatalystDice,
        setCatalystSeverity,
        toggleCatalystInjection,
        setCustomWildcard,
        imageStylePresets: IMAGE_STYLE_PRESETS,
        setImageStyle,
        setCustomImagePrompt,
        setActiveImage,
        triggerPromptExtraction,
        generateSceneArtwork,
        exportArtwork,
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
        setLocationPins,
        updateLocationField,
        addOrToggleLoreLock,
        removeLoreLock,
        triggerProseAudit,
        exportFeatureStationsSession,
        importFeatureStationsSession,
        generateStoryStream: generateStory,
        generateBranchStream: continueWithBranch,
        saveCurrentStory: saveCurrentToHistory
      }}
    >
      {children}
    </StoryContext.Provider>
  );
}

export function useStory() {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
}
