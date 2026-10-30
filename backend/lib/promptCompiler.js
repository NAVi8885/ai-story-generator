/**
 * Prompt Compiler Module
 * Compiles 7 narrative parameter sliders, genre presets, story bible,
 * and conflict normalization rules into optimized LLM system and user instructions.
 */

export const GENRE_PRESETS = {
  fantasy: {
    name: 'Fantasy',
    creativity: 0.85,
    tone: 'balanced',
    pacing: 'atmospheric',
    strictness: 75,
    systemDirective: 'Ground your descriptions in grime, weather, and sensory weight (rust, damp wool, wet slate, cold iron). Magic carries a physical, psychological, or social cost—never a cheap plot fix. Avoid sparkly clichés; let the world reveal itself through friction and cultural superstition.'
  },
  scifi: {
    name: 'Sci-Fi',
    creativity: 0.90,
    tone: 'gritty',
    pacing: 'brisk',
    strictness: 80,
    systemDirective: 'Emphasize systemic and human consequences of technology. Use grounded, plausible technical jargon sparingly. Anchor scenes in physical sensation (ozone, recycled air, cold steel bulkheads, artificial light flicker). Avoid hand-wavy techno-magic.'
  },
  horror: {
    name: 'Horror',
    creativity: 0.95,
    tone: 'dark',
    pacing: 'slow-burn',
    strictness: 70,
    systemDirective: 'Build creeping dread through uncanny, almost-right details. Restraint over gore; suggestion over revelation. What the character almost noticed in peripheral vision is more terrifying than an overt monster. Use lingering rhythmic prose that tightens into breathless claustrophobia.'
  },
  mystery: {
    name: 'Mystery / Noir',
    creativity: 0.75,
    tone: 'gritty',
    pacing: 'balanced',
    strictness: 85,
    systemDirective: 'Atmospheric noir procedural. Plant sensory clues hiding in plain sight within ordinary observations. Focus on sharp behavioral anomalies, micro-expressions, physical evidence, and psychological subtext. Every detail must stand up to logical scrutiny.'
  },
  romance: {
    name: 'Romance',
    creativity: 0.80,
    tone: 'lighthearted',
    pacing: 'atmospheric',
    strictness: 75,
    systemDirective: 'Prioritize slow-burn emotional intimacy and shifting power dynamics. Track micro-expressions (a swallowed breath, a glance averted half a beat too late, physical proximity). Dialogue crackles with unspoken subtext and delayed vulnerability.'
  },
  cyberpunk: {
    name: 'Cyberpunk',
    creativity: 0.95,
    tone: 'gritty',
    pacing: 'action',
    strictness: 70,
    systemDirective: 'High tech, low life. Neon reflections on oil-slicked puddles, glitching ocular chrome, corporate monoliths cast against choking smog. Fast, kinetic prose punctuated by the hum of cooling fans and dirty synth bass.'
  },
  custom: {
    name: 'Custom',
    creativity: 0.80,
    tone: 'balanced',
    pacing: 'balanced',
    strictness: 75,
    systemDirective: 'Maintain strong narrative voice, vivid sensory grounding, and organic character progression.'
  }
};

export const TONE_SNIPPETS = {
  whimsical: 'TONE: Write with warmth, gentle wit, and lyrical wonder. Allow cozy sensory details (warm bread, amber lamplight, soft laughter) and hopeful character arcs. Avoid grimness or nihilism.',
  lighthearted: 'TONE: Buoyant and energetic. Tension exists but characters meet obstacles with competence and resilience. Snappy dialogue, clear moral stakes, and satisfying triumphs.',
  balanced: 'TONE: Nuanced, literary, and grounded. Balance atmospheric tension with moments of humanity. Realistic emotional weight without excessive darkness.',
  gritty: 'TONE: Uncompromising, physically authentic, and psychologically sharp. Characters bear the scars of their choices. Emphasize physical reality: rust, mud, exhaustion, moral ambiguity. No sanitized heroism.',
  dark: 'TONE: Deep psychological dread, existential consequence, and haunting atmosphere. Characters face genuine loss or compromise. Shadows are thick and resolutions are earned through sacrifice.'
};

export const PACING_SNIPPETS = {
  action: 'PACING: High velocity. Short, punchy sentences. Fragmented syntax during physical conflict. High-impact verbs. Strip internal monologue when conflict erupts; focus on split-second sensory data, impact, and survival. Zero fat.',
  brisk: 'PACING: Brisk narrative momentum. Efficient scene transitions, lively character interactions, and active forward movement in every paragraph. Minimal lingering on static scenery.',
  balanced: 'PACING: Dynamic rhythm. Alternate between visceral physical action, grounded internal thought, and sharp subtext-laden dialogue. Expand narrative space proportionally to emotional stakes.',
  atmospheric: 'PACING: Linger on sensory layering (sound, scent, texture) and character psychology. Allow scenes to breathe before tension snaps. Observations reveal world lore and internal states.',
  'slow-burn': 'PACING: Deliberate, immersive worldbuilding. Pull back the lens. Linger on environmental details, history, systemic rot, and atmospheric density. Expand single moments into full sensory journeys.'
};

export const ADHERENCE_SNIPPETS = {
  high: 'ADHERENCE (High): Strict canon adherence. Follow the user’s premise, characters, and established constraints with absolute fidelity. Do not invent contradictory lore or unprompted twists.',
  moderate: 'ADHERENCE (Moderate): Guided creative interpretation. Follow the core premise and characters faithfully while introducing fresh sensory beats, natural complications, and organic dialogue.',
  low: 'ADHERENCE (Creative Liberty): Launching pad mode. Use the premise as an initial spark. Freely extrapolate, introduce unexpected twists, and take the narrative in surprising, bold directions while respecting the genre tone.'
};

export const LENGTH_PROFILES = {
  flash: { words: 350, maxTokens: 1500, label: 'Flash Fiction (~350 words)' },
  short: { words: 650, maxTokens: 2500, label: 'Short Story (~650 words)' },
  standard: { words: 1200, maxTokens: 3800, label: 'Standard Segment (~1,200 words)' },
  chapter: { words: 2000, maxTokens: 5500, label: 'Full Chapter (~2,000 words)' }
};

/**
 * Resolves contradictory slider configurations into coherent LLM instructions.
 */
function resolveConflicts(sliders) {
  const directives = [];
  const creativity = parseFloat(sliders.creativity ?? 0.8);
  const strictness = parseInt(sliders.strictness ?? 75, 10);

  if (creativity >= 1.1 && strictness >= 80) {
    directives.push('CONFLICT RESOLUTION: Apply maximum linguistic, stylistic, and metaphorical creativity in prose, but stay strictly within the factual bounds and characters established in the premise.');
  } else if (creativity <= 0.4 && strictness <= 40) {
    directives.push('CONFLICT RESOLUTION: Write in clear, grounded, and economical prose, but feel free to invent surprising plot directions and external events.');
  }

  return directives;
}

/**
 * Compiles full system instructions and prompt payload.
 */
export function compileNarrativePayload({
  prompt,
  sliders = {},
  genre = 'custom',
  storyBible = {},
  previousChapters = [],
  includeBranchChoices = true
}) {
  const genreConfig = GENRE_PRESETS[genre] || GENRE_PRESETS.custom;

  const creativity = parseFloat(sliders.creativity ?? genreConfig.creativity ?? 0.8);
  const toneKey = sliders.tone || genreConfig.tone || 'balanced';
  const pacingKey = sliders.pacing || genreConfig.pacing || 'balanced';
  const strictnessVal = parseInt(sliders.strictness ?? genreConfig.strictness ?? 75, 10);
  const lengthKey = sliders.targetLength || 'short';
  const thinkingDepth = sliders.thinkingDepth || 'balanced'; // off, fast, balanced, deep

  const lengthConfig = LENGTH_PROFILES[lengthKey] || LENGTH_PROFILES.short;

  const adherenceKey = strictnessVal >= 80 ? 'high' : strictnessVal >= 45 ? 'moderate' : 'low';
  const toneInstruction = TONE_SNIPPETS[toneKey] || TONE_SNIPPETS.balanced;
  const pacingInstruction = PACING_SNIPPETS[pacingKey] || PACING_SNIPPETS.balanced;
  const adherenceInstruction = ADHERENCE_SNIPPETS[adherenceKey];

  const conflictResolutions = resolveConflicts({ creativity, strictness: strictnessVal });

  // System Prompt Blocks
  const systemBlocks = [
    `# ROLE & IDENTITY
You are a master fiction author, literary stylist, and narrative architect.
Your mission is to expand the user's premise into an evocative, immersive, and logically coherent narrative chapter.`,

    `# OUTPUT FORMAT RULES
1. If reasoning is enabled, place it strictly inside <thinking>...</thinking>.
2. Output the story prose strictly between [STORY_START] and [STORY_END].
3. Output interactive choices strictly between [BRANCH_CHOICES] and [/BRANCH_CHOICES].
4. CRITICAL NEGATIVE CONSTRAINT: NEVER repeat, summarize, or outline the assignment. Never output phrases like "We need to write..." or "Let's plan:". Begin immediately with narrative action.`,

    `# CORE STYLISTIC DIRECTIVES
- SHOW, DO NOT TELL: Reveal character emotional states and lore through physical action beats, sensory textures, and subtext-laden dialogue rather than exposition.
- AVOID AI CLICHÉS: Strictly ban overused AI filler words like "testament to", "tapestry", "beacon", "delve", "whisper of", "little did they know", or neat moralizing summaries.
- SENSORY GROUNDING: Anchor every scene in immediate physical reality (temperature, sound, tactile texture, scent, lighting).
- DIALOGUE: Format dialogue with standard quotation marks and clean paragraph breaks per speaker.`,

    `# GENRE FOCUS (${genreConfig.name.toUpperCase()})
${genreConfig.systemDirective}`,

    `# PACING & TONE
${toneInstruction}
${pacingInstruction}`,

    `# CANON ADHERENCE
${adherenceInstruction}`
  ];

  if (conflictResolutions.length > 0) {
    systemBlocks.push(`# CONSTRAINTS HARMONIZATION\n${conflictResolutions.join('\n')}`);
  }

  // Thinking / Reasoning Depth Instructions
  if (thinkingDepth !== 'off') {
    const depthDetail = {
      fast: 'Outline 3 quick beats: Opening Hook -> Conflict -> Climax/Turn.',
      balanced: 'Outline Theme, 3 Narrative Beats, Primary Sensory Anchor, and Key Dialogue Subtext.',
      deep: 'Provide deep psychological character motivation, structural beat breakdown, thematic tension, and planned landing closure.'
    }[thinkingDepth] || 'Outline narrative beats and sensory anchors.';

    systemBlocks.push(`# THINKING / BLUEPRINT DIRECTIVE
Before outputting the prose story, you MUST first formulate your narrative strategy inside a <thinking>...</thinking> XML block.
${depthDetail}
Keep the thinking concise and focused. Close the </thinking> tag, then immediately begin the story prose with [STORY_START].`);
  }

  // Target Length & Closure Protocol
  systemBlocks.push(`# LENGTH & CLOSURE PROTOCOL
- TARGET LENGTH: Approximately ${lengthConfig.words} words (maximum ceiling: ${Math.ceil(lengthConfig.words * 1.15)} words).
- BUDGETING: Allocate roughly 20% to the hook/setup, 60% to core tension/conflict, and 20% to a natural scene closure or cliffhanger.
- NATURAL CLOSURE: Plan the scene ending before writing. Ensure the final sentence delivers complete syntactic and dramatic closure. Never cut off mid-thought or mid-sentence.
- DELIMITER CLOSURE: Close the story prose with [STORY_END] immediately after the final sentence.`);

  // Story Bible injection
  const bibleParts = [];
  if (storyBible.characters && storyBible.characters.trim()) {
    bibleParts.push(`- CHARACTERS / ROSTER:\n${storyBible.characters.trim()}`);
  }
  if (storyBible.worldRules && storyBible.worldRules.trim()) {
    bibleParts.push(`- WORLD RULES / LAWS:\n${storyBible.worldRules.trim()}`);
  }
  if (storyBible.canonNotes && storyBible.canonNotes.trim()) {
    bibleParts.push(`- ESTABLISHED CANON & PAST EVENTS:\n${storyBible.canonNotes.trim()}`);
  }

  if (bibleParts.length > 0) {
    systemBlocks.push(`# STORY BIBLE (PERSISTENT CONTEXT LOCK)
You MUST respect the following immutable facts and character traits:
${bibleParts.join('\n\n')}`);
  }

  // Branch Choices Protocol
  if (includeBranchChoices) {
    systemBlocks.push(`# INTERACTIVE BRANCHING PROTOCOL
At the very conclusion of your generation (after [STORY_END] and two blank lines), append an interactive plot fork formatted EXACTLY as follows:

[BRANCH_CHOICES]
1. [Choice A Title]: A compelling, proactive action that pivots the narrative in a distinctive direction.
2. [Choice B Title]: A cautious, investigative, or diplomatic alternative carrying different risks.
3. [Choice C Title]: An unconventional wildcard or risky gamble with high stakes.
[/BRANCH_CHOICES]

RULES FOR CHOICES:
- Each option must imply a genuinely divergent trajectory (no cosmetic red door vs. blue door choices).
- Do not repeat choices already taken.`);
  }

  // User Message Construction
  const userMessageParts = [];

  if (previousChapters && previousChapters.length > 0) {
    userMessageParts.push(`=== PREVIOUS CHAPTERS SUMMARY ===`);
    previousChapters.forEach((ch, idx) => {
      userMessageParts.push(`[Chapter ${idx + 1}: ${ch.title || 'Untitled'}]\n${ch.content.slice(0, 600)}...`);
    });
    userMessageParts.push(`=== CONTINUATION DIRECTIVE ===\nNow write Chapter ${previousChapters.length + 1} continuing directly from the previous events.`);
  }

  userMessageParts.push(`USER STORY PREMISE / SEED:\n${prompt}`);

  // Model Hyperparameters
  const temperature = Math.min(Math.max(creativity, 0.2), 1.3);
  const top_p = Math.min(0.85 + (creativity * 0.08), 0.98);

  return {
    systemPrompt: systemBlocks.join('\n\n'),
    userMessage: userMessageParts.join('\n\n'),
    parameters: {
      temperature,
      top_p,
      max_tokens: lengthConfig.maxTokens,
      frequency_penalty: 0.15,
      presence_penalty: 0.05
    },
    meta: {
      genre: genreConfig.name,
      targetWords: lengthConfig.words,
      thinkingDepth
    }
  };
}

/**
 * Intelligent parser for separating <thinking> block, story prose, and [BRANCH_CHOICES].
 * Enforces hard output boundary delimiters ([STORY_START] / [STORY_END]) and sanitizes
 * residual meta preambles ("We need to write...", "Outline:...", "Let's plan...", etc.).
 */
export function parseStoryStreamOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      thinking: '',
      prose: '',
      branchChoices: []
    };
  }

  let thinking = '';
  let prose = rawText;
  let branchChoices = [];

  // Helper to parse choice lines
  function parseChoiceLines(choiceBlock) {
    if (!choiceBlock || typeof choiceBlock !== 'string') return [];
    const lines = choiceBlock.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = [];
    for (const line of lines) {
      if (/^(?:\d+[\.\)]|[-*•]|choice\s*\d+:?)/i.test(line)) {
        const cleaned = line
          .replace(/^(?:\d+[\.\)]|[-*•]|choice\s*\d+:?)\s*/i, '')
          .replace(/^\*\*(.*?)\*\*/, '$1')
          .trim();
        const parts = cleaned.split(/:\s*(.+)| - \s*(.+)/);
        const titlePart = parts[0] ? parts[0].replace(/[\[\]*]/g, '').trim() : '';
        const descPart = (parts[1] || parts[2] || '').trim();
        if (titlePart && descPart) {
          parsed.push({ title: titlePart, description: descPart });
        } else if (cleaned.length > 5) {
          parsed.push({ title: cleaned.slice(0, 45).replace(/[\[\]*]/g, '').trim(), description: cleaned });
        }
      }
    }
    return parsed;
  }

  // 1. Extract <thinking>...</thinking> (must NOT consume [STORY_START] if closing tag was omitted)
  const thinkingMatch = prose.match(/<thinking>([\s\S]*?)(?:<\/thinking>|(?=\[STORY_START\])|$)/i);
  if (thinkingMatch) {
    thinking = thinkingMatch[1].trim();
    prose = prose.replace(/<thinking>[\s\S]*?(?:<\/thinking>|(?=\[STORY_START\])|$)/i, '').trim();
  }

  // 2. Extract [BRANCH_CHOICES]...[/BRANCH_CHOICES]
  const branchMatch = prose.match(/\[BRANCH_CHOICES\]([\s\S]*?)(?:\[\/BRANCH_CHOICES\]|$)/i);
  if (branchMatch) {
    const rawChoices = branchMatch[1].trim();
    prose = prose.replace(/\[BRANCH_CHOICES\][\s\S]*?(?:\[\/BRANCH_CHOICES\]|$)/i, '').trim();
    branchChoices = parseChoiceLines(rawChoices);
  }

  // Fallback: If [BRANCH_CHOICES] tags omitted, check content after [STORY_END]
  if (branchChoices.length === 0 && /\[STORY_END\]/i.test(rawText)) {
    const afterEnd = rawText.split(/\[STORY_END\]/i)[1];
    if (afterEnd && afterEnd.trim()) {
      branchChoices = parseChoiceLines(afterEnd);
    }
  }

  // 3. Extract prose using hard output boundary delimiters [STORY_START] and [STORY_END]
  if (/\[STORY_START\]/i.test(prose)) {
    const parts = prose.split(/\[STORY_START\]/i);
    const preStory = parts[0].trim();
    if (preStory && !thinking) {
      thinking = preStory;
    }
    const afterStart = parts.slice(1).join('[STORY_START]');
    if (/\[STORY_END\]/i.test(afterStart)) {
      prose = afterStart.split(/\[STORY_END\]/i)[0].trim();
    } else {
      prose = afterStart.trim();
    }
  } else if (/\[STORY_END\]/i.test(prose)) {
    prose = prose.split(/\[STORY_END\]/i)[0].trim();
  } else {
    // Delimiters were omitted by model: separate meta-planning paragraphs from actual story prose
    const metaPatterns = [
      /^\s*(?:we need|we must|we will|we'll|let's|all right|outline|theme|narrative beats|guidelines|plan|chapter breakdown|here is the story|in chapter \d+:|we can pick|sensory anchor)/i,
      /(?:words total|branching at end|guidelines: show|sensory anchor)/i
    ];

    const paragraphs = prose.split(/\n\s*\n/);
    const metaParas = [];
    const proseParas = [];
    let storyBegan = false;

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      if (!storyBegan) {
        const isMeta = metaPatterns.some((p) => p.test(trimmed));
        if (isMeta) {
          metaParas.push(trimmed);
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

  // Fallback: If branch choices were trailing numbered list at the end of prose without tags
  if (branchChoices.length === 0) {
    const trailingChoicesMatch = prose.match(/(?:\n\s*\n|\n)(?:(?:1[\.\)]|[-*•]|Choice 1:?)\s+[^\n]+(?:\n\s*(?:[2345][\.\)]|[-*•]|Choice [2345]:?)\s+[^\n]+)+)\s*$/i);
    if (trailingChoicesMatch) {
      branchChoices = parseChoiceLines(trailingChoicesMatch[0]);
      prose = prose.slice(0, trailingChoicesMatch.index).trim();
    }
  }

  // 4. Strip any residual raw delimiters or tags from the prose
  prose = prose
    .replace(/\[\/?STORY_(?:START|END)\]/gi, '')
    .replace(/\[\/?BRANCH_CHOICES\]/gi, '')
    .replace(/<\/?thinking>/gi, '')
    .trim();

  return {
    thinking: thinking.replace(/<\/?thinking>/gi, '').trim(),
    prose,
    branchChoices
  };
}

/**
 * Real-time streaming sanitizer to prevent delimiter leaks and meta-talk during token streaming.
 */
export function sanitizeStreamBuffer(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { thinking: '', prose: '' };
  }

  let working = rawText;
  let thinking = '';
  let prose = '';

  // 1. If currently opening a partial <thinking> tag at the start, withhold
  const trimmed = working.trimStart();
  if (trimmed.length > 0 && trimmed.length < 10 && '<thinking>'.startsWith(trimmed)) {
    return { thinking: '', prose: '' };
  }

  // 2. Extract full <thinking>...</thinking>
  const thinkingStart = working.indexOf('<thinking>');
  if (thinkingStart !== -1) {
    const thinkingEnd = working.indexOf('</thinking>');
    if (thinkingEnd !== -1) {
      thinking = working.slice(thinkingStart + 10, thinkingEnd).trim();
      working = working.slice(thinkingEnd + 11);
    } else {
      const storyStartIdx = working.indexOf('[STORY_START]');
      if (storyStartIdx !== -1 && storyStartIdx > thinkingStart) {
        thinking = working.slice(thinkingStart + 10, storyStartIdx).trim();
        working = working.slice(storyStartIdx);
      } else {
        // Still actively inside <thinking> block - withhold prose
        thinking = working.slice(thinkingStart + 10).trim();
        return { thinking, prose: '' };
      }
    }
  }

  // 3. Cut off interactive choices from live prose display
  const branchIdx = working.indexOf('[BRANCH_CHOICES]');
  if (branchIdx !== -1) {
    working = working.slice(0, branchIdx);
  }

  // 4. Check for [STORY_START]
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

    // Separate leading meta-planning paragraphs from prose during streaming
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

  // Strip trailing partial delimiters while streaming (e.g. "[", "[STORY", "[STORY_", "</think")
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
