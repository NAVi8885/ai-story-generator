import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const StoryContext = createContext(null);

export const GENRE_PRESETS = [
  { id: 'fantasy', name: 'Fantasy', icon: '⚔️', creativity: 0.85, tone: 'balanced', pacing: 'atmospheric', strictness: 75 },
  { id: 'scifi', name: 'Sci-Fi', icon: '🚀', creativity: 0.90, tone: 'gritty', pacing: 'brisk', strictness: 80 },
  { id: 'horror', name: 'Horror', icon: '🕯️', creativity: 0.95, tone: 'dark', pacing: 'slow-burn', strictness: 70 },
  { id: 'mystery', name: 'Mystery', icon: '🔍', creativity: 0.75, tone: 'gritty', pacing: 'balanced', strictness: 85 },
  { id: 'romance', name: 'Romance', icon: '🌹', creativity: 0.80, tone: 'lighthearted', pacing: 'atmospheric', strictness: 75 },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '⚡', creativity: 0.95, tone: 'gritty', pacing: 'action', strictness: 70 },
  { id: 'custom', name: 'Custom', icon: '✨', creativity: 0.80, tone: 'balanced', pacing: 'balanced', strictness: 75 }
];

const DEFAULT_SLIDERS = {
  creativity: 0.8,
  tone: 'balanced',
  targetLength: 'short',
  pacing: 'balanced',
  strictness: 75,
  thinkingDepth: 'balanced'
};

const DEFAULT_BIBLE = {
  characters: '',
  worldRules: '',
  canonNotes: ''
};

function sanitizeClientStreamBuffer(rawBuffer) {
  if (!rawBuffer || typeof rawBuffer !== 'string') {
    return { thinking: '', prose: '' };
  }

  let working = rawBuffer;
  let thinking = '';
  let prose = '';

  // 1. If currently opening a partial <thinking> tag at the start, withhold
  const trimmed = working.trimStart();
  if (trimmed.length > 0 && trimmed.length < 10 && '<thinking>'.startsWith(trimmed)) {
    return { thinking: '', prose: '' };
  }

  // 2. Full <thinking>...</thinking> extraction
  const thinkingStart = working.indexOf('<thinking>');
  if (thinkingStart !== -1) {
    const thinkingEnd = working.indexOf('</thinking>');
    if (thinkingEnd !== -1) {
      thinking = working.slice(thinkingStart + 10, thinkingEnd).trim();
      working = working.slice(thinkingEnd + 11);
    } else {
      // Still actively streaming thinking: withhold story tokens
      thinking = working.slice(thinkingStart + 10).trim();
      return { thinking, prose: '' };
    }
  }

  // 3. Interactive branch choices isolation
  const branchIdx = working.indexOf('[BRANCH_CHOICES]');
  if (branchIdx !== -1) {
    working = working.slice(0, branchIdx);
  }

  // 4. Output boundary delimiter isolation ([STORY_START] / [STORY_END])
  const storyStartIdx = working.indexOf('[STORY_START]');
  if (storyStartIdx !== -1) {
    const preText = working.slice(0, storyStartIdx).trim();
    if (preText && !thinking) {
      thinking = preText;
    }
    let afterStart = working.slice(storyStartIdx + 13);
    const storyEndIdx = afterStart.indexOf('[STORY_END]');
    if (storyEndIdx !== -1) {
      prose = afterStart.slice(0, storyEndIdx);
    } else {
      prose = afterStart;
    }
  } else {
    // If working starts with partial [STORY_START] delimiter, withhold
    const workingTrimmed = working.trimStart();
    if (workingTrimmed.length > 0 && workingTrimmed.length < 13 && '[STORY_START]'.startsWith(workingTrimmed)) {
      return { thinking, prose: '' };
    }

    // Separate leading meta-planning paragraphs from prose during client streaming
    const metaPatterns = [
      /^\s*(?:we need|we must|we will|we'll|let's|all right|outline|theme|narrative beats|guidelines|plan|chapter breakdown|here is the story|in chapter \d+:|we can pick|sensory anchor)/i,
      /(?:words total|branching at end|guidelines: show|sensory anchor)/i
    ];

    const paragraphs = working.split(/\n\s*\n/);
    const metaParas = [];
    const proseParas = [];
    let storyBegan = false;

    for (const para of paragraphs) {
      const pTrim = para.trim();
      if (!pTrim) continue;
      if (!storyBegan) {
        const isMeta = metaPatterns.some((p) => p.test(pTrim));
        if (isMeta) {
          metaParas.push(pTrim);
          continue;
        }
        storyBegan = true;
      }
      proseParas.push(para);
    }

    if (metaParas.length > 0 && !thinking) {
      thinking = metaParas.join('\n\n');
    }
    prose = proseParas.join('\n\n');
  }

  // Strip raw delimiter tags
  prose = prose
    .replace(/\[\/?STORY_(?:START|END)\]/gi, '')
    .replace(/\[\/?BRANCH_CHOICES\]/gi, '')
    .replace(/<\/?thinking>/gi, '');

  // Strip trailing partial delimiters during live streaming
  for (const tag of ['[STORY_START]', '[STORY_END]', '[BRANCH_CHOICES]', '[/BRANCH_CHOICES]', '</thinking>']) {
    for (let len = tag.length - 1; len >= 1; len--) {
      if (prose.endsWith(tag.slice(0, len))) {
        prose = prose.slice(0, -len);
        break;
      }
    }
  }

  return {
    thinking,
    prose: prose.trimStart()
  };
}

export function StoryProvider({ children }) {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('custom');
  const [sliders, setSliders] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_story_sliders');
      return saved ? JSON.parse(saved) : DEFAULT_SLIDERS;
    } catch {
      return DEFAULT_SLIDERS;
    }
  });

  const [storyBible, setStoryBible] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_story_bible');
      return saved ? JSON.parse(saved) : DEFAULT_BIBLE;
    } catch {
      return DEFAULT_BIBLE;
    }
  });

  const [byok, setByok] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_story_byok');
      return saved ? JSON.parse(saved) : { groq: '', gemini: '', openrouter: '', huggingface: '' };
    } catch {
      return { groq: '', gemini: '', openrouter: '', huggingface: '' };
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_story_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [story, setStory] = useState('');
  const [thinking, setThinking] = useState('');
  const [branchChoices, setBranchChoices] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('prose'); // 'prose' | 'thinking'

  const [telemetry, setTelemetry] = useState({
    wordCount: 0,
    readingTimeMinutes: 0,
    tokensPerSec: 0,
    activeProvider: 'Auto-Routing'
  });

  const abortControllerRef = useRef(null);
  const streamStartTimeRef = useRef(null);
  const tokenCountRef = useRef(0);

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem('ai_story_sliders', JSON.stringify(sliders));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [sliders]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_story_bible', JSON.stringify(storyBible));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [storyBible]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_story_byok', JSON.stringify(byok));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [byok]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_story_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [history]);

  // Telemetry calculation
  useEffect(() => {
    const words = story.trim() ? story.trim().split(/\s+/).length : 0;
    const readingTime = (words / 225).toFixed(1);

    setTelemetry((prev) => ({
      ...prev,
      wordCount: words,
      readingTimeMinutes: parseFloat(readingTime)
    }));
  }, [story]);

  const updateSlider = (field, value) => {
    setSliders((prev) => ({ ...prev, [field]: value }));
  };

  const updateStoryBible = (field, value) => {
    setStoryBible((prev) => ({ ...prev, [field]: value }));
  };

  const saveAndPersistKeys = async (newKeys) => {
    const cleaned = {
      groq: (newKeys.groq || '').trim(),
      gemini: (newKeys.gemini || '').trim(),
      openrouter: (newKeys.openrouter || '').trim(),
      huggingface: (newKeys.huggingface || '').trim()
    };

    setByok(cleaned);
    try {
      localStorage.setItem('ai_story_byok', JSON.stringify(cleaned));
    } catch (e) {
      console.warn('Storage save error:', e);
    }

    try {
      const res = await fetch('/api/settings/save-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('Server key persistence error:', err);
      return { success: false, error: err.message };
    }
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

  // Enhance Premise
  const enhancePrompt = async () => {
    if (!prompt.trim()) {
      setError('Please type an initial seed word or concept to enhance');
      return;
    }

    setIsEnhancing(true);
    setError('');

    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enhance prompt');

      if (data.enhanced) {
        setPrompt(data.enhanced);
      }
    } catch (err) {
      setError(err.message || 'Could not enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Core Streaming Story Generator
  const generateStory = async (seedOverride, isContinuation = false) => {
    const activePrompt = seedOverride || prompt;

    if (!activePrompt.trim()) {
      setError('Please provide a story premise first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setBranchChoices([]);

    if (!isContinuation) {
      setStory('');
      setThinking('');
      setChapters([]);
    } else {
      setStory('');
      setThinking('');
    }

    abortControllerRef.current = new AbortController();
    streamStartTimeRef.current = Date.now();
    tokenCountRef.current = 0;

    let rawAccumulatedStream = '';
    let accumulatedThinking = '';

    const headers = {
      'Content-Type': 'application/json'
    };

    if (byok.groq) headers['x-byok-groq'] = byok.groq;
    if (byok.gemini) headers['x-byok-gemini'] = byok.gemini;
    if (byok.openrouter) headers['x-byok-openrouter'] = byok.openrouter;
    if (byok.huggingface) headers['x-byok-hf'] = byok.huggingface;

    try {
      const response = await fetch('/api/generate/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: activePrompt,
          sliders,
          genre,
          storyBible,
          previousChapters: chapters,
          includeBranchChoices: true
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evtBlock of events) {
          const lines = evtBlock.split('\n');
          let eventType = 'chunk';
          let dataText = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              dataText = line.replace('data: ', '').trim();
            }
          }

          if (!dataText || dataText === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataText);

            if (eventType === 'start') {
              // Started generation
            } else if (eventType === 'provider' || (eventType === 'chunk' && parsed.type === 'provider')) {
              setTelemetry((prev) => ({
                ...prev,
                activeProvider: parsed.provider || prev.activeProvider
              }));
            } else if (eventType === 'chunk') {
              tokenCountRef.current += 1;
              const elapsedSec = (Date.now() - streamStartTimeRef.current) / 1000;
              const tps = elapsedSec > 0 ? (tokenCountRef.current / elapsedSec).toFixed(1) : 0;

              if (parsed.type === 'provider') {
                setTelemetry((prev) => ({ ...prev, activeProvider: parsed.provider, tokensPerSec: tps }));
              } else if (parsed.type === 'thinking') {
                accumulatedThinking += parsed.text;
                setThinking(accumulatedThinking);
              } else if (parsed.type === 'prose') {
                rawAccumulatedStream += parsed.text;
                const sanitized = sanitizeClientStreamBuffer(rawAccumulatedStream);
                if (sanitized.thinking && !accumulatedThinking) {
                  setThinking(sanitized.thinking);
                }
                setStory(sanitized.prose);
                setTelemetry((prev) => ({ ...prev, tokensPerSec: tps }));
              }
            } else if (eventType === 'complete') {
              const sanitizedStream = sanitizeClientStreamBuffer(rawAccumulatedStream);
              const finalProse = (parsed.prose || sanitizedStream.prose || '').trim();

              setStory(finalProse);
              if (parsed.thinking) setThinking(parsed.thinking);
              if (parsed.branchChoices?.length) setBranchChoices(parsed.branchChoices);

              // Auto-save this completed chapter
              const newChapter = {
                number: chapters.length + 1,
                title: `Chapter ${chapters.length + 1}`,
                content: finalProse,
                timestamp: new Date().toISOString()
              };

              setChapters((prev) => [...prev, newChapter]);
            } else if (eventType === 'error') {
              throw new Error(parsed.error || 'Server stream error');
            }
          } catch {
            // Skip json parse error
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.log('Stream stopped by user.');
      } else {
        console.error('Stream failure:', err);
        setError(err.message || 'Something went wrong while generating.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Continue story with interactive branch choice
  const continueWithBranch = async (choice) => {
    const nextChapterPrompt = `Continue the story directly from Chapter ${chapters.length}. The protagonist takes this path: "${choice.title} - ${choice.description}". Introduce immediate consequences and develop the scene.`;
    await generateStory(nextChapterPrompt, true);
  };

  // Stop Generation via AbortController
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Save story to local history
  const saveCurrentToHistory = () => {
    if (!story.trim()) return;

    const entry = {
      id: `story_${Date.now()}`,
      title: prompt.slice(0, 45) + (prompt.length > 45 ? '...' : ''),
      prompt,
      genre,
      story,
      thinking,
      chapters,
      branchChoices,
      sliders,
      wordCount: telemetry.wordCount,
      timestamp: new Date().toISOString()
    };

    setHistory((prev) => [entry, ...prev.slice(0, 49)]); // Keep up to 50
  };

  // Restore history entry
  const restoreFromHistory = (id) => {
    const found = history.find((h) => h.id === id);
    if (!found) return;

    setPrompt(found.prompt || '');
    setGenre(found.genre || 'custom');
    setStory(found.story || '');
    setThinking(found.thinking || '');
    setChapters(found.chapters || []);
    setBranchChoices(found.branchChoices || []);
    if (found.sliders) setSliders(found.sliders);
    setError('');
  };

  // Delete history item
  const deleteHistoryItem = (id) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  // Export story
  const exportStory = (format) => {
    if (!story.trim()) return;

    let content = '';
    let mimeType = 'text/plain';
    let filename = `story-${Date.now()}`;

    if (format === 'markdown') {
      content = `# ${prompt.slice(0, 60)}\n\n`;
      content += `> **Genre:** ${genre.toUpperCase()} | **Words:** ${telemetry.wordCount} | **Generated:** ${new Date().toLocaleDateString()}\n\n`;

      if (thinking.trim()) {
        content += `## Narrative Blueprint (<thinking>)\n\n\`\`\`\n${thinking}\n\`\`\`\n\n---\n\n`;
      }

      if (chapters.length > 1) {
        chapters.forEach((ch, idx) => {
          content += `### Chapter ${idx + 1}\n\n${ch.content}\n\n---\n\n`;
        });
      } else {
        content += `## Story\n\n${story}\n\n`;
      }

      if (branchChoices.length > 0) {
        content += `### Next Plot Choices\n\n`;
        branchChoices.forEach((bc, idx) => {
          content += `${idx + 1}. **${bc.title}**: ${bc.description}\n`;
        });
      }

      mimeType = 'text/markdown';
      filename += '.md';
    } else if (format === 'json') {
      const data = {
        meta: {
          exportedAt: new Date().toISOString(),
          genre,
          sliders,
          wordCount: telemetry.wordCount
        },
        prompt,
        thinking,
        story,
        chapters,
        branchChoices,
        storyBible
      };
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      filename += '.json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <StoryContext.Provider
      value={{
        prompt,
        setPrompt,
        genre,
        applyGenrePreset,
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
        branchChoices,
        chapters,
        isGenerating,
        isEnhancing,
        error,
        activeTab,
        setActiveTab,
        telemetry,
        generateStory,
        continueWithBranch,
        stopGeneration,
        enhancePrompt,
        exportStory
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

