/**
 * Literary Auditor & Prose Radar
 * Pure algorithmic client-side prose diagnostic utility:
 * 1. Sensory Balance Radar (Visual, Tactile, Auditory, Olfactory/Gustatory)
 * 2. Dialogue-to-Narration Ratio
 * 3. AI Cliché & Filler Scanner with contextual replacement suggestions
 * 4. Pacing & Rhythm Diagnostics (Burstiness, Sentence Variety, Flesch Reading Level)
 */

// 1. Sensory Lexicons (50+ Visual, 50+ Tactile, 45+ Auditory, 45+ Olfactory/Gustatory)
export const SENSORY_LEXICONS = {
  visual: [
    'shadow', 'shadows', 'shadowy', 'silhouette', 'silhouettes', 'gleam', 'gleaming', 'glint', 'glinting',
    'crimson', 'obsidian', 'azure', 'incandescent', 'chiaroscuro', 'glimmer', 'glimmering', 'shimmer',
    'shimmering', 'pallid', 'radiant', 'luster', 'flare', 'flaring', 'haze', 'hazy', 'emerald', 'scarlet',
    'golden', 'violet', 'gloom', 'gloomy', 'luminous', 'luminosity', 'iridescent', 'iridescence', 'dim',
    'dimly', 'blur', 'blurry', 'sparkle', 'sparkling', 'glare', 'glaring', 'sheen', 'opaque', 'opacity',
    'translucent', 'flash', 'flashing', 'neon', 'amber', 'flicker', 'flickering', 'glow', 'glowing',
    'murky', 'twilight', 'dawn', 'dusk', 'eclipse', 'tint', 'hue', 'optic', 'gaze', 'visual',
    'glance', 'beacon', 'reflection', 'mirage', 'specular', 'blinding', 'vivid', 'matte', 'prism',
    'prismatic', 'dark', 'darkness', 'light', 'bright', 'illumination', 'glistening', 'bleak', 'dazzling', 'shimmered'
  ],
  tactile: [
    'cold', 'freezing', 'scorching', 'searing', 'rough', 'roughness', 'coarse', 'coarseness',
    'jagged', 'velvety', 'silky', 'damp', 'dampness', 'moist', 'moisture', 'clammy', 'humid',
    'humidity', 'rigid', 'rigidity', 'brittle', 'gritty', 'greasy', 'sticky', 'slick', 'sharp',
    'sharpness', 'stinging', 'numb', 'numbness', 'prickly', 'abrasive', 'smooth', 'icy', 'burning',
    'warm', 'warmth', 'feverish', 'plush', 'leathery', 'grainy', 'trembling', 'shivering', 'vibrating',
    'vibration', 'throbbing', 'pressure', 'bruised', 'stiff', 'stiffness', 'elastic', 'spongy',
    'taut', 'tautness', 'dense', 'weightless', 'chafed', 'biting', 'tingling', 'sweaty', 'sweat',
    'callous', 'splintered', 'frostbitten', 'shudder', 'prickle', 'clamminess', 'grittiness', 'scald'
  ],
  auditory: [
    'whisper', 'whispers', 'whispering', 'whispered', 'murmur', 'murmurs', 'murmuring', 'murmured',
    'echo', 'echoes', 'echoing', 'echoed', 'screech', 'screeching', 'deafening', 'silence',
    'silent', 'hush', 'hushed', 'chime', 'chimes', 'clatter', 'rustle', 'rustling', 'roar',
    'roaring', 'hum', 'humming', 'drone', 'droning', 'crackle', 'crackling', 'thump', 'thumping',
    'bang', 'banging', 'buzz', 'buzzing', 'rattle', 'rattling', 'shrill', 'hiss', 'hissing',
    'whistle', 'whistling', 'squeak', 'squeaking', 'moan', 'moaning', 'howl', 'howling', 'rumble',
    'rumbling', 'clang', 'clanging', 'click', 'clicking', 'snap', 'snapping', 'cadence', 'acoustic',
    'resonance', 'shriek', 'shrieking', 'thunderous', 'muffled', 'piercing', 'din', 'bellow',
    'bellowing', 'splash', 'toll', 'tolling', 'gasp', 'gasping', 'guttural', 'sonorous', 'cacophony'
  ],
  olfactoryGustatory: [
    'scent', 'scented', 'aroma', 'aromatic', 'stench', 'reek', 'reeking', 'pungent', 'pungency',
    'fragrant', 'fragrance', 'perfume', 'sweet', 'sweetness', 'bitter', 'bitterness', 'sour',
    'sourness', 'salty', 'saltiness', 'metallic', 'acrid', 'stale', 'staleness', 'rotting',
    'decayed', 'decay', 'savory', 'spicy', 'spiciness', 'tangy', 'citrus', 'musk', 'musky',
    'smoky', 'incense', 'sulfur', 'sulfurous', 'ozone', 'brine', 'briny', 'umami', 'rancid',
    'foul', 'floral', 'earthy', 'peppery', 'putrid', 'nauseating', 'minty', 'charred', 'buttery',
    'copper', 'coppery', 'brackish', 'vinegary', 'appetizing', 'tart', 'savor', 'savoring',
    'nectar', 'zesty', 'sickly-sweet', 'spiced', 'effervescent', 'piquant', 'musty'
  ]
};

// 2. AI Cliché & Overused Filler Dictionary (35 curated tropes with replacement suggestions)
export const CLICHE_DEFINITIONS = [
  { phrase: 'testament to', regex: /\btestament to\b/gi, suggestion: 'proof of, evidence of, marked by', category: 'Overused Metaphor' },
  { phrase: 'tapestry of', regex: /\btapestry of\b/gi, suggestion: 'network of, mosaic of, web of', category: 'Overused Metaphor' },
  { phrase: 'beacon of', regex: /\bbeacon of\b/gi, suggestion: 'guide for, source of, light in', category: 'Overused Metaphor' },
  { phrase: 'delve into', regex: /\bdelve(s|d|ing)? into\b/gi, suggestion: 'explore, examine, dig into', category: 'AI Buzzword' },
  { phrase: 'whisper of', regex: /\bwhisper of\b/gi, suggestion: 'trace of, hint of, faint murmur of', category: 'Purple Prose' },
  { phrase: 'little did they know', regex: /\blittle did (they|he|she|we) know\b/gi, suggestion: 'unbeknownst to them, unaware that', category: 'Melodramatic Trope' },
  { phrase: 'shivers down spine', regex: /\bshivers? ran down (his|her|their|my) spine\b/gi, suggestion: 'a cold dread gripped, a sudden chill struck', category: 'Sensory Cliché' },
  { phrase: 'thick as honey', regex: /\bthick as honey\b/gi, suggestion: 'dense, viscous, unyielding', category: 'Simile Cliché' },
  { phrase: 'palpable tension', regex: /\b(palpable tension|tension was palpable)\b/gi, suggestion: 'taut silence, suffocating stillness', category: 'Sensory Cliché' },
  { phrase: 'dance of shadows', regex: /\bdance of (shadows|light)\b/gi, suggestion: 'shifting darkness, flickering silhouettes', category: 'Purple Prose' },
  { phrase: 'in the blink of an eye', regex: /\bin the blink of an eye\b/gi, suggestion: 'instantly, before they could breathe, in a heartbeat', category: 'Stock Idiom' },
  { phrase: 'heart pounding', regex: /\bheart (was )?pounding (in|against) (his|her|their|my) chest\b/gi, suggestion: 'pulse hammering, breath hitching', category: 'Sensory Cliché' },
  { phrase: 'steely gaze', regex: /\bsteely (gaze|glance|stare)\b/gi, suggestion: 'unblinking stare, hardened focus, cold appraisal', category: 'Character Cliché' },
  { phrase: 'echoed through the', regex: /\bechoed through the (air|room|hall|night|silence|chamber)\b/gi, suggestion: 'rang against, reverberated through', category: 'Stock Phrasing' },
  { phrase: 'breath caught in throat', regex: /\bbreath caught in (his|her|their|my) throat\b/gi, suggestion: 'froze mid-breath, choked back a gasp', category: 'Sensory Cliché' },
  { phrase: 'chaos ensued', regex: /\bchaos ensued\b/gi, suggestion: 'the room splintered into panic, violence erupted', category: 'Telling vs Showing' },
  { phrase: 'suffice it to say', regex: /\bsuffice it to say\b/gi, suggestion: 'in short, plainly, clearly', category: 'Filler Phrase' },
  { phrase: 'chilling reminder', regex: /\bchilling reminder\b/gi, suggestion: 'grim warning, harsh omen, stark evidence', category: 'Stock Phrasing' },
  { phrase: 'silent sentinel', regex: /\bsilent sentinels?\b/gi, suggestion: 'still watcher, stony monolith, unmoving guard', category: 'Purple Prose' },
  { phrase: 'send chills down', regex: /\bsend chills down\b/gi, suggestion: 'unnerved, struck dread into, unsettled', category: 'Sensory Cliché' },
  { phrase: 'loomed large', regex: /\bloomed large\b/gi, suggestion: 'dominated the horizon, hung heavily over', category: 'Stock Idiom' },
  { phrase: 'labyrinth of', regex: /\blabyrinth of\b/gi, suggestion: 'maze of, tangled network of, dense cluster of', category: 'Stock Metaphor' },
  { phrase: 'piercing gaze', regex: /\bpiercing (gaze|eyes|stare)\b/gi, suggestion: 'sharp eyes, razor scrutiny, focused appraisal', category: 'Character Cliché' },
  { phrase: 'shadowy figure', regex: /\bshadowy figures?\b/gi, suggestion: 'veiled stranger, hooded silhouette, obscured form', category: 'Character Cliché' },
  { phrase: 'unbeknownst to', regex: /\bunbeknownst to\b/gi, suggestion: 'unseen by, without the knowledge of', category: 'Archaic Filler' },
  { phrase: 'lost in thought', regex: /\blost in thought\b/gi, suggestion: 'brooding, distracted, eyes unfocused', category: 'Telling vs Showing' },
  { phrase: 'against all odds', regex: /\bagainst all odds\b/gi, suggestion: 'despite heavy costs, through sheer desperation', category: 'Stock Idiom' },
  { phrase: 'eerie silence', regex: /\b(an )?eerie silence\b/gi, suggestion: 'unsettling quiet, dead hush, suspended silence', category: 'Sensory Cliché' },
  { phrase: 'blood ran cold', regex: /\bblood ran cold\b/gi, suggestion: 'felt a sickening freeze, stomach dropped', category: 'Sensory Cliché' },
  { phrase: 'shrouded in mystery', regex: /\bshrouded in (mystery|darkness|shadow)\b/gi, suggestion: 'unexplained, obscure, veiled in black', category: 'Purple Prose' },
  { phrase: 'matter of life and death', regex: /\bmatter of life and death\b/gi, suggestion: 'critical survival, mortal peril', category: 'Stock Idiom' },
  { phrase: 'it was not just', regex: /\bit was not (just|merely) a\b/gi, suggestion: 'more than a, far beyond a', category: 'AI Syntax Pattern' },
  { phrase: 'as if on cue', regex: /\bas if on cue\b/gi, suggestion: 'at that exact instant, right then', category: 'Convenient Timing' },
  { phrase: 'sense of foreboding', regex: /\ba sense of (foreboding|dread|unease|urgency)\b/gi, suggestion: 'a prickle of dread, sudden unease, pressing hurry', category: 'Telling vs Showing' },
  { phrase: 'needle in a haystack', regex: /\bneedle in a haystack\b/gi, suggestion: 'near-impossible quarry, lost trace', category: 'Stock Idiom' }
];

/**
 * Estimates English syllable count for reading grade metrics.
 * @param {string} word - Single English word.
 * @returns {number} Estimated syllables.
 */
export function countSyllables(word) {
  const clean = (word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 1;
  if (clean.length <= 3) return 1;
  const processed = clean.replace(/(?:[^laeiouy]|ed|es|e)$/, '').replace(/^y/, '');
  const matches = processed.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(matches.length, 1) : 1;
}

/**
 * Performs a comprehensive literary audit on prose.
 * @param {string} prose - Full story prose text.
 * @returns {object} Audit diagnostic report.
 */
export function auditProse(prose) {
  const text = typeof prose === 'string' ? prose.trim() : '';

  if (!text) {
    return {
      success: true,
      sensory: {
        visual: 0,
        tactile: 0,
        auditory: 0,
        olfactoryGustatory: 0,
        total: 0,
        distribution: { visual: 0, tactile: 0, auditory: 0, olfactoryGustatory: 0 }
      },
      dialogueRatio: {
        dialogueChars: 0,
        narrationChars: 0,
        dialogueWords: 0,
        narrationWords: 0,
        dialoguePercent: 0,
        narrationPercent: 100
      },
      cliches: [],
      clicheCount: 0,
      metrics: {
        wordCount: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        avgSentenceLength: 0,
        burstiness: 0,
        fleschKincaidGrade: 1.0,
        fleschReadingEase: 100.0,
        pacingCategory: 'Balanced / Steady Cadence (Consistent rhythmic flow)'
      }
    };
  }

  // 1. Sensory Balance Scan
  const lowerText = text.toLowerCase();
  const countTerms = (lexicon) => {
    let count = 0;
    for (const term of lexicon) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) count += matches.length;
    }
    return count;
  };

  const visualCount = countTerms(SENSORY_LEXICONS.visual);
  const tactileCount = countTerms(SENSORY_LEXICONS.tactile);
  const auditoryCount = countTerms(SENSORY_LEXICONS.auditory);
  const olfactoryGustatoryCount = countTerms(SENSORY_LEXICONS.olfactoryGustatory);
  const sensoryTotal = visualCount + tactileCount + auditoryCount + olfactoryGustatoryCount;

  const distribution = sensoryTotal > 0
    ? {
        visual: Math.round((visualCount / sensoryTotal) * 1000) / 10,
        tactile: Math.round((tactileCount / sensoryTotal) * 1000) / 10,
        auditory: Math.round((auditoryCount / sensoryTotal) * 1000) / 10,
        olfactoryGustatory: Math.round((olfactoryGustatoryCount / sensoryTotal) * 1000) / 10
      }
    : { visual: 0, tactile: 0, auditory: 0, olfactoryGustatory: 0 };

  // 2. Dialogue vs Narration
  // Matches quoted strings: "...", “...”, «...»
  const quoteRegex = /(?:["“«][^"”»]*["”»])/g;
  let dialogueChars = 0;
  let dialogueWords = 0;
  const quoteMatches = text.match(quoteRegex) || [];

  for (const quote of quoteMatches) {
    const inner = quote.slice(1, -1).trim();
    dialogueChars += inner.length;
    const wordsInQuote = inner.split(/\s+/).filter(Boolean).length;
    dialogueWords += wordsInQuote;
  }

  const cleanTotalChars = text.replace(/\s+/g, ' ').length;
  const allWords = text.split(/\s+/).filter(Boolean);
  const totalWords = allWords.length;

  const narrationChars = Math.max(0, cleanTotalChars - dialogueChars);
  const narrationWords = Math.max(0, totalWords - dialogueWords);

  const dialoguePercent = cleanTotalChars > 0
    ? Math.round((dialogueChars / cleanTotalChars) * 1000) / 10
    : 0;
  const narrationPercent = cleanTotalChars > 0
    ? Math.round((narrationChars / cleanTotalChars) * 1000) / 10
    : 100;

  // 3. AI Cliché & Filler Scanner
  const detectedCliches = [];
  for (const def of CLICHE_DEFINITIONS) {
    def.regex.lastIndex = 0;
    let match;
    while ((match = def.regex.exec(text)) !== null) {
      detectedCliches.push({
        phrase: def.phrase,
        match: match[0],
        suggestion: def.suggestion,
        category: def.category,
        index: match.index
      });
      if (def.regex.lastIndex === match.index) def.regex.lastIndex++;
    }
  }

  // 4. Pacing & Rhythm Diagnostics
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const sentenceCount = Math.max(sentences.length, 1);
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);
  const paragraphCount = Math.max(paragraphs.length, 1);

  const avgSentenceLength = Math.round((totalWords / sentenceCount) * 10) / 10;

  // Burstiness calculation: standard deviation / mean of sentence word lengths
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const meanLength = totalWords / sentenceCount;
  const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - meanLength, 2), 0) / sentenceCount;
  const stdDev = Math.sqrt(variance);
  const burstiness = meanLength > 0 ? Math.round((stdDev / meanLength) * 100) / 100 : 0;

  // Syllables count for Readability
  let totalSyllables = 0;
  for (const w of allWords) {
    totalSyllables += countSyllables(w);
  }

  // Flesch-Kincaid Grade Level: 0.39*(W/S) + 11.8*(Syllables/W) - 15.59
  const rawGrade = 0.39 * (totalWords / sentenceCount) + 11.8 * (totalSyllables / Math.max(totalWords, 1)) - 15.59;
  const fleschKincaidGrade = Math.round(Math.max(rawGrade, 1) * 10) / 10;

  // Flesch Reading Ease: 206.835 - 1.015*(W/S) - 84.6*(Syllables/W)
  const rawEase = 206.835 - 1.015 * (totalWords / sentenceCount) - 84.6 * (totalSyllables / Math.max(totalWords, 1));
  const fleschReadingEase = Math.round(Math.min(Math.max(rawEase, 0), 100) * 10) / 10;

  // Pacing Diagnosis
  let pacingCategory = 'Balanced / Steady Cadence (Consistent rhythmic flow)';
  if (avgSentenceLength < 11) {
    pacingCategory = 'Staccato / Rapid Pacing (Short, urgent kinetic bursts)';
  } else if (avgSentenceLength > 24) {
    pacingCategory = 'Lyrical / Contemplative (Complex, ornate clauses with slow pacing)';
  } else if (burstiness >= 0.65) {
    pacingCategory = 'Dynamic / Polyrhythmic (Varied cadence with punchy beats and flowing descriptions)';
  }

  return {
    success: true,
    sensory: {
      visual: visualCount,
      tactile: tactileCount,
      auditory: auditoryCount,
      olfactoryGustatory: olfactoryGustatoryCount,
      total: sensoryTotal,
      distribution
    },
    dialogueRatio: {
      dialogueChars,
      narrationChars,
      dialogueWords,
      narrationWords,
      dialoguePercent,
      narrationPercent
    },
    cliches: detectedCliches,
    clicheCount: detectedCliches.length,
    metrics: {
      wordCount: totalWords,
      sentenceCount,
      paragraphCount,
      avgSentenceLength,
      burstiness,
      fleschKincaidGrade,
      fleschReadingEase,
      pacingCategory
    }
  };
}
