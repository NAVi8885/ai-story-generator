/**
 * Story Domain Model (Frontend MVC - Model Layer)
 * Pure narrative craft presets, chapter normalization, bounds clamping,
 * offline fallback continuation synthesis, and export format builders.
 */

export const GENRE_PRESETS = [
  { id: 'fantasy', name: 'Fantasy', icon: 'fantasy', creativity: 0.85, tone: 'balanced', pacing: 'atmospheric', strictness: 75 },
  { id: 'scifi', name: 'Sci-Fi', icon: 'scifi', creativity: 0.90, tone: 'gritty', pacing: 'brisk', strictness: 80 },
  { id: 'horror', name: 'Horror', icon: 'horror', creativity: 0.95, tone: 'dark', pacing: 'slow-burn', strictness: 70 },
  { id: 'mystery', name: 'Mystery', icon: 'mystery', creativity: 0.75, tone: 'gritty', pacing: 'balanced', strictness: 85 },
  { id: 'romance', name: 'Romance', icon: 'romance', creativity: 0.80, tone: 'lighthearted', pacing: 'atmospheric', strictness: 75 },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: 'cyberpunk', creativity: 0.95, tone: 'gritty', pacing: 'action', strictness: 70 },
  { id: 'custom', name: 'Custom', icon: 'custom', creativity: 0.80, tone: 'balanced', pacing: 'balanced', strictness: 75 }
];

export const DEFAULT_SLIDERS = {
  creativity: 0.8,
  tone: 'balanced',
  targetLength: 'short',
  pacing: 'balanced',
  strictness: 75,
  thinkingDepth: 'balanced',
  pov: 'third_limited',
  tense: 'past',
  dialogueRatio: 'balanced',
  proseStylist: 'cinematic',
  conflictType: 'person_vs_person',
  dramaticStakes: 'personal',
  endingTurn: 'cliffhanger',
  sensoryAnchor: 'tactile',
  environmentalMood: 'chiaroscuro_fog',
  visceralIntensity: 3,
  protagonistState: 'calculating',
  unreliableNarrator: 'off',
  moralAlignment: 'antihero'
};

export const MASTER_STYLE_PRESETS = [
  {
    id: 'noir_thriller',
    name: 'Hardboiled Noir',
    genre: 'mystery',
    tagline: '1st Person • Past • Gritty Cynical Noir',
    sliders: {
      pov: 'first',
      tense: 'past',
      dialogueRatio: 'dialogue_heavy',
      proseStylist: 'hardboiled',
      conflictType: 'person_vs_person',
      dramaticStakes: 'personal',
      endingTurn: 'cliffhanger',
      sensoryAnchor: 'auditory',
      environmentalMood: 'chiaroscuro_fog',
      visceralIntensity: 4,
      protagonistState: 'paranoid',
      unreliableNarrator: 'subtle_bias',
      moralAlignment: 'antihero',
      tone: 'gritty',
      pacing: 'brisk',
      creativity: 0.85
    }
  },
  {
    id: 'cosmic_horror',
    name: 'Cosmic Gothic',
    genre: 'horror',
    tagline: '1st Person • Present • Creeping Antiquarian Dread',
    sliders: {
      pov: 'first',
      tense: 'present',
      dialogueRatio: 'descriptive',
      proseStylist: 'baroque',
      conflictType: 'cosmic',
      dramaticStakes: 'existential',
      endingTurn: 'ambiguous',
      sensoryAnchor: 'olfactory',
      environmentalMood: 'claustrophobic',
      visceralIntensity: 4,
      protagonistState: 'melancholic',
      unreliableNarrator: 'deep_distortion',
      moralAlignment: 'antihero',
      tone: 'dark',
      pacing: 'slow-burn',
      creativity: 1.05
    }
  },
  {
    id: 'mythic_epic',
    name: 'High Mythic Epic',
    genre: 'fantasy',
    tagline: '3rd Limited • Past • Lyrical Heroic Wonder',
    sliders: {
      pov: 'third_limited',
      tense: 'past',
      dialogueRatio: 'balanced',
      proseStylist: 'lyrical',
      conflictType: 'person_vs_society',
      dramaticStakes: 'faction',
      endingTurn: 'bittersweet',
      sensoryAnchor: 'visual',
      environmentalMood: 'decadent_opulent',
      visceralIntensity: 3,
      protagonistState: 'defiant',
      unreliableNarrator: 'off',
      moralAlignment: 'principled',
      tone: 'balanced',
      pacing: 'atmospheric',
      creativity: 0.90
    }
  },
  {
    id: 'cyber_heist',
    name: 'Cyber-Heist Thriller',
    genre: 'cyberpunk',
    tagline: '3rd Limited • Present • Kinetic Neon Velocity',
    sliders: {
      pov: 'third_limited',
      tense: 'present',
      dialogueRatio: 'dialogue_heavy',
      proseStylist: 'cinematic',
      conflictType: 'person_vs_society',
      dramaticStakes: 'faction',
      endingTurn: 'cliffhanger',
      sensoryAnchor: 'tactile',
      environmentalMood: 'chiaroscuro_fog',
      visceralIntensity: 4,
      protagonistState: 'calculating',
      unreliableNarrator: 'off',
      moralAlignment: 'rogue',
      tone: 'gritty',
      pacing: 'action',
      creativity: 0.95
    }
  },
  {
    id: 'psychological_realism',
    name: 'Psychological Study',
    genre: 'custom',
    tagline: '1st Person • Present • Spare Terse Realism',
    sliders: {
      pov: 'first',
      tense: 'present',
      dialogueRatio: 'balanced',
      proseStylist: 'terse',
      conflictType: 'person_vs_self',
      dramaticStakes: 'personal',
      endingTurn: 'thematic_twist',
      sensoryAnchor: 'tactile',
      environmentalMood: 'bleak_barren',
      visceralIntensity: 3,
      protagonistState: 'melancholic',
      unreliableNarrator: 'subtle_bias',
      moralAlignment: 'antihero',
      tone: 'balanced',
      pacing: 'balanced',
      creativity: 0.80
    }
  }
];

export const DEFAULT_BIBLE = {
  characters: '',
  worldRules: '',
  canonNotes: ''
};

export const SECTION_DEFAULT_KEYS = {
  foundations: ['creativity', 'tone', 'targetLength', 'pacing', 'strictness', 'thinkingDepth'],
  voice: ['pov', 'tense', 'dialogueRatio', 'proseStylist'],
  plot: ['conflictType', 'dramaticStakes', 'endingTurn'],
  sensory: ['sensoryAnchor', 'environmentalMood', 'visceralIntensity'],
  psychology: ['protagonistState', 'unreliableNarrator', 'moralAlignment']
};

export function normalizeChapter(raw, defaultIndex = 0) {
  if (typeof raw === 'string') {
    return {
      number: defaultIndex + 1,
      title: `Chapter ${defaultIndex + 1}`,
      content: raw.trim(),
      thinking: '',
      timestamp: new Date().toISOString()
    };
  }

  const parsedNum = typeof raw?.number === 'number'
    ? raw.number
    : parseInt(raw?.number, 10);

  const num = !isNaN(parsedNum) && parsedNum > 0
    ? parsedNum
    : defaultIndex + 1;

  return {
    number: num,
    title: raw?.title?.trim() || `Chapter ${num}`,
    content: raw?.content || raw?.prose || '',
    thinking: raw?.thinking || '',
    timestamp: raw?.timestamp || new Date().toISOString()
  };
}

export function clampChapterIndex(idx, totalChapters, isGenerating = false) {
  if (totalChapters === 0) return 0;
  const maxIdx = isGenerating ? totalChapters : totalChapters - 1;
  const parsed = parseInt(idx, 10);
  return Math.min(Math.max(isNaN(parsed) ? 0 : parsed, 0), Math.max(0, maxIdx));
}

export function buildFallbackNextChapterPrompt({ chapters = [], chapIndex = 0, story = '' }) {
  const nextNum = (chapters.length || 0) + 1;
  const targetChap = chapters[chapIndex] || chapters[chapters.length - 1];
  const snippet = targetChap?.content
    ? targetChap.content.slice(-250).trim().replace(/\n+/g, ' ')
    : (story ? story.slice(-250).trim().replace(/\n+/g, ' ') : '');

  return {
    suggestedPrompt: snippet
      ? `Continue into Chapter ${nextNum}. Directly escalate the stakes following: "${snippet.slice(0, 120)}...". Introduce an unforeseen complication and deepen character tension.`
      : `Continue the story into Chapter ${nextNum}. Escalate the narrative tension, advance the central conflict, and challenge the protagonist with an unforeseen dilemma.`,
    chapterNumber: nextNum,
    suggestedHooks: [
      'A sudden complication disrupts the protagonist\'s plans.',
      'A revelation from a trusted ally changes everything.',
      'An unexpected confrontation raises the stakes.'
    ]
  };
}

export function normalizeRestoredHistoryEntry(found) {
  const rawChapters = found.chapters || [];
  if (rawChapters.length === 0 && found.story) {
    return [{
      number: 1,
      title: 'Chapter 1',
      content: found.story,
      thinking: found.thinking || '',
      timestamp: found.timestamp || new Date().toISOString()
    }];
  }

  return rawChapters.map((ch, idx) => {
    const norm = normalizeChapter(ch, idx);
    if (!norm.thinking && idx === 0 && found.thinking) {
      norm.thinking = found.thinking;
    }
    return norm;
  });
}

export function buildStoryExportPayload({
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
}) {
  let content = '';
  let mimeType = 'text/plain';
  let filename = `story-${Date.now()}`;

  if (format === 'markdown') {
    content = `# ${prompt.slice(0, 60) || 'Mythos Saga'}\n\n`;
    content += `> **Genre:** ${genre.toUpperCase()} | **Words:** ${telemetry.wordCount} | **Generated:** ${new Date().toLocaleDateString()}\n\n`;

    if (chapters.length > 0) {
      chapters.forEach((ch, idx) => {
        content += `### ${ch.title || `Chapter ${idx + 1}`}\n\n`;
        if (ch.thinking && ch.thinking.trim()) {
          content += `#### Narrative Blueprint (<thinking>)\n\n\`\`\`\n${ch.thinking.trim()}\n\`\`\`\n\n`;
        }
        content += `${ch.content}\n\n---\n\n`;
      });
    } else {
      if (thinking.trim()) {
        content += `## Narrative Blueprint (<thinking>)\n\n\`\`\`\n${thinking}\n\`\`\`\n\n---\n\n`;
      }
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
      activeChapterIndex,
      branchChoices,
      storyBible,
      featureStations: stationState
    };
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
    filename += '.json';
  }

  return { content, mimeType, filename };
}
