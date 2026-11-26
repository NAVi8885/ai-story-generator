/**
 * Story Domain Model (MVC - Model Layer)
 * Pure narrative craft directives, genre/master presets, conflict harmonization,
 * stream output parsing/sanitization, and saga chapter extraction/heuristic hooks.
 * Zero network or HTTP side effects.
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

export const POV_DIRECTIVES = {
  first: 'NARRATIVE POV: First-Person ("I" / "me"). Filter all sensory observations and scene beats strictly through the protagonist\'s personal cognitive horizon. CRITICAL NEGATIVE CONSTRAINT: NEVER switch to third-person omniscient. Never describe events, facial expressions, or private thoughts that the narrator cannot directly witness or deduce. (Exemplar: "I felt the deck pitch beneath my boots before I heard the siren.")',
  second: 'NARRATIVE POV: Second-Person ("You"). Address the reader directly as the protagonist. Imbue every action with urgent second-person immediacy. CRITICAL NEGATIVE CONSTRAINT: Never lapse into third-person passive commentary. (Exemplar: "You grip the rusted handrail, knowing one false step drops you into the dark.")',
  third_limited: 'NARRATIVE POV: Third-Person Limited ("He" / "She" / "They"). Anchor the camera tightly over the focal character\'s shoulder. Reveal only their internal thoughts, emotional states, and direct sensory impressions. CRITICAL NEGATIVE CONSTRAINT: Never head-hop or reveal the private inner thoughts of other characters. (Exemplar: "Kael wiped the rain from his sights, his pulse thudding against his ribs.")',
  third_omniscient: 'NARRATIVE POV: Third-Person Omniscient. A panoramic, authorial vantage with cinematic omniscience. Weave between character perspectives, dramatic irony, historical context, and systemic landscapes while maintaining narrative discipline.'
};

export const TENSE_DIRECTIVES = {
  past: 'NARRATIVE TENSE: Literary Past Tense ("walked", "whispered", "turned"). Maintain consistent past-tense action beats. CRITICAL NEGATIVE CONSTRAINT: Strictly avoid accidental slippage into present-tense narration.',
  present: 'NARRATIVE TENSE: Immediate Present Tense ("walks", "whispers", "turns"). Write with continuous present-tense cinematic urgency. CRITICAL NEGATIVE CONSTRAINT: Zero past-tense slippage in narrative action beats. (Exemplar: "The rusted latch gives way. I slip inside before the patrol sweeps the alley.")'
};

export const DIALOGUE_RATIO_DIRECTIVES = {
  dialogue_heavy: 'DIALOGUE DENSITY: Theatrical & Banter-Driven (~60% spoken dialogue). Drive conflict, power dynamics, and character revelation through sharp, subtextual spoken exchanges. Keep action tags economical.',
  balanced: 'DIALOGUE DENSITY: Organic Rhythm. Balance natural spoken dialogue with visceral sensory beats, tactical movement, and internal character reactions.',
  descriptive: 'DIALOGUE DENSITY: Scenic & Atmospheric (~15% dialogue). Prioritize immersive world textures, environmental mechanics, psychological interiority, and silence over conversation.'
};

export const PROSE_STYLIST_DIRECTIVES = {
  terse: 'AUTHORIAL VOICE: Spare, Terse & Economical (Hemingway/McCarthy aesthetic). Short, declarative sentences. High-impact Anglo-Saxon verbs. Strip unnecessary adverbs and ornamental adjectives. Let brutal physical reality speak.',
  lyrical: 'AUTHORIAL VOICE: Lyrical, Poetic & Rhythmic (Rothfuss/Le Guin aesthetic). Rich cadence, evocative metaphor, sensory layering, and haunting syntactic rhythm that elevates prose into myth.',
  hardboiled: 'AUTHORIAL VOICE: Hardboiled & Cynical (Chandler/Hammett noir). Caustic, weary wit. Sharp similes drawn from asphalt, smoke, and human frailty. World-weary psychological observation.',
  baroque: 'AUTHORIAL VOICE: Baroque & Antiquarian (Gothic/Lovecraftian/Vance). Grand architectural syntax, archaic vocabulary, labyrinthine atmosphere, and towering existential gravity.',
  cinematic: 'AUTHORIAL VOICE: Kinetic Modern Cinematic (Blake Crouch/Gillian Flynn). High immediacy, dynamic sentence pacing, visceral sensory cutaways, and relentless narrative velocity.'
};

export const CONFLICT_DIRECTIVES = {
  person_vs_self: 'CORE CONFLICT: Person vs. Self. The primary obstacle is an internal war: guilt, suppressed trauma, cognitive dissonance, addiction, or an agonizing moral compromise.',
  person_vs_person: 'CORE CONFLICT: Person vs. Person. High-friction interpersonal rivalry, betrayal, ideological clash, or deadly cat-and-mouse duel.',
  person_vs_society: 'CORE CONFLICT: Person vs. Society / System. Friction against an entrenched hierarchy, draconian syndicate, corrupt bureaucracy, or institutional dogma.',
  person_vs_nature: 'CORE CONFLICT: Person vs. Nature / The Elements. Brutal struggle against an unforgiving environment, dying vessel, blizzard, infection, or apex predator.',
  cosmic: 'CORE CONFLICT: Cosmic / Fate. Confrontation with incomprehensible scale: ancient eldritch forces, temporal paradoxes, or inevitable existential destiny.'
};

export const STAKES_DIRECTIVES = {
  personal: 'DRAMATIC STAKES: Intimate & Personal. Stakes involve personal identity, a sacred promise, sanity, or the survival of a single beloved bond.',
  faction: 'DRAMATIC STAKES: Faction & Community. Stakes threaten an entire crew, family, covert cell, or sanctuary enclave.',
  existential: 'DRAMATIC STAKES: Existential Realm. Consequences reverberate across civilizations, sovereign nations, or the boundary of reality itself.'
};

export const ENDING_TURN_DIRECTIVES = {
  cliffhanger: 'SCENE CLOSURE / TURN: Hard Cliffhanger. Terminate the scene on a sudden revelation, unexpected threat emergence, or an unresolved split-second peril.',
  thematic_twist: 'SCENE CLOSURE / TURN: Paradigm Subversion / Twist. Invert a foundational assumption held by the protagonist in the final beat, altering the meaning of preceding events.',
  bittersweet: 'SCENE CLOSURE / TURN: Bittersweet Cost. The immediate objective is achieved, but at a permanent, emotionally costly sacrifice.',
  cathartic: 'SCENE CLOSURE / TURN: Cathartic Breakthrough. Deliver a satisfying, earned triumph or tactical breakthrough through character ingenuity.',
  ambiguous: 'SCENE CLOSURE / TURN: Haunting Psychological Landing. Conclude on an open, resonant question or symbolic image that lingers in the reader\'s imagination.'
};

export const SENSORY_ANCHOR_DIRECTIVES = {
  tactile: 'DOMINANT SENSORY ANCHOR: Visceral & Tactile. Ground key beats in physical weight, temperature, bruising, texture (cold damp iron, abrasive gravel, feverish heat, stinging sweat).',
  auditory: 'DOMINANT SENSORY ANCHOR: Auditory & Acoustic. Foreground ambient soundscapes (rhythmic dripping, echoing footsteps, metallic groans, suffocating silence, strained breath).',
  visual: 'DOMINANT SENSORY ANCHOR: Visual & Chiaroscuro. Emphasize lighting geometry, sharp shadow contrast, neon reflections in dark water, peripheral motion, and color temperature.',
  olfactory: 'DOMINANT SENSORY ANCHOR: Olfactory & Atmospheric. Saturate the environment with scents (ionized ozone, woodsmoke, coppery blood, brine, damp rot, bitter coffee).'
};

export const ATMOSPHERE_DIRECTIVES = {
  chiaroscuro_fog: 'ENVIRONMENTAL MOOD: Chiaroscuro & Obscurity. Thick fog, gaslight halos, heavy shadows, and veiled horizons where danger lurks unseen.',
  bleak_barren: 'ENVIRONMENTAL MOOD: Bleak & Barren. Scorched stone, howling winds, sterile corridors, and an oppressive sense of isolation.',
  decadent_opulent: 'ENVIRONMENTAL MOOD: Decadent Opulence. Gilded surfaces masking systemic rot, flickering chandeliers, heavy velvet, and intoxicating excess.',
  claustrophobic: 'ENVIRONMENTAL MOOD: Claustrophobic Subterranean. Low ceilings, pressurized bulkheads, damp stone tunnels, and inescapable physical confinement.'
};

export function getVisceralDirective(level) {
  const num = parseInt(level ?? 3, 10);
  if (num <= 2) {
    return 'VISCERAL REALISM (Subtle/Literary): Restraint over graphic physical detail. Focus on psychological resonance and tension without graphic gore.';
  }
  if (num >= 4) {
    return 'VISCERAL REALISM (Uncompromising Trauma): Raw, unflinching bodily impact, authentic anatomical trauma, searing agony, and visceral sensory consequence.';
  }
  return 'VISCERAL REALISM (Grounded Gritty): Realistic physical consequences, authentic fatigue, scrapes, bruising, and tactile grit without sensationalist gore.';
}

export const PROTAGONIST_STATE_DIRECTIVES = {
  paranoid: 'PROTAGONIST PSYCHOLOGY: Hyper-Vigilant & Paranoid. Constantly scanning exits, second-guessing motives, interpreting casual gestures as veiled threats.',
  calculating: 'PROTAGONIST PSYCHOLOGY: Analytical & Stoic. Suppresses visceral emotional outbursts; assesses people and environments as probability matrices and tactical assets.',
  desperate: 'PROTAGONIST PSYCHOLOGY: Volatile & Cornered. Driven by urgent desperation; impulsive, high-stakes gambles, adrenaline-fueled reactions.',
  melancholic: 'PROTAGONIST PSYCHOLOGY: Haunted & Melancholic. Weighed down by lingering grief or cynicism; observant of beauty but fatalistic about outcomes.',
  defiant: 'PROTAGONIST PSYCHOLOGY: Unyielding & Defiant. Fiery willpower, refusing to submit to superior force or demoralizing odds.'
};

export const UNRELIABLE_NARRATOR_DIRECTIVES = {
  subtle_bias: 'UNRELIABLE NARRATOR (Subtle Cognitive Bias): Narrator rationalizes their own flaws, harbors unacknowledged blind spots, or misjudges others\' true loyalties.',
  deep_distortion: 'UNRELIABLE NARRATOR (Deep Distortion): Active perceptual distortion. Subtly blur memory, hallucination, or deliberate omissions so the reader must decipher reality between the lines.'
};

export const MORAL_ALIGNMENT_DIRECTIVES = {
  principled: 'MORAL COMPASS: Principled Idealist. Possesses an unshakeable ethical code and refuses to cross moral redlines even under lethal pressure.',
  antihero: 'MORAL COMPASS: Pragmatic Anti-Hero. Operates in moral shades of grey; willing to make ruthless choices for survival or the greater good.',
  rogue: 'MORAL COMPASS: Unpredictable Rogue. Self-interested, unpredictable, skeptical of authorities, motivated by personal freedom and instinct.'
};

export const MASTER_STYLE_PRESETS = [
  {
    id: 'noir_thriller',
    name: 'Hardboiled Noir',
    genre: 'mystery',
    description: '1st person past, caustic cynical wit, high dialogue, dark chiaroscuro shadows',
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
    description: '1st person present, antiquarian prose, creeping dread, olfactory & acoustic terror',
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
    description: '3rd limited past, lyrical poetic cadence, ideological clash, visual wonder',
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
    description: '3rd limited present, kinetic cinematic prose, tactile neon grit, corporate stakes',
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
    description: '1st person present, spare terse realism, internal moral war, tactile grounding',
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

export const CATALYST_SEVERITY_LEVELS = {
  1: 'Subtle Inconvenience (Micro-friction or eerie anomaly)',
  2: 'Minor Setback (Tactical disruption or brief delay)',
  3: 'Significant Complication (Dangerous complication forcing tactical change)',
  4: 'Critical Crisis (Direct peril threatening life or objective)',
  5: 'Catastrophic Wildcard (Lethal jeopardy, structural collapse, or irreversible catastrophe)'
};

export const CATALYST_COMPLICATIONS = [
  'Ticking Clock',
  'Betrayal',
  'Sensory Anomaly',
  'Forbidden Revelation',
  'Mechanical Failure',
  'Unwelcome Guest'
];

function resolveConflicts(sliders) {
  const directives = [];
  const creativity = parseFloat(sliders.creativity ?? 0.8);
  const strictness = parseInt(sliders.strictness ?? 75, 10);

  if (creativity >= 1.1 && strictness >= 80) {
    directives.push('CONFLICT RESOLUTION: Apply maximum linguistic, stylistic, and metaphorical creativity in prose, but stay strictly within the factual bounds and characters established in the premise.');
  } else if (creativity <= 0.4 && strictness <= 40) {
    directives.push('CONFLICT RESOLUTION: Write in clear, grounded, and economical prose, but feel free to invent surprising plot directions and external events.');
  }

  if (sliders.unreliableNarrator && sliders.unreliableNarrator !== 'off' && sliders.pov === 'third_omniscient') {
    directives.push('CONFLICT RESOLUTION (POV vs Unreliability): The unreliable perspective filter takes precedence. Constrain omniscience to an editorializing, biased narrator lens rather than objective omniscient truth.');
  }

  if (sliders.dialogueRatio === 'dialogue_heavy' && sliders.pacing === 'slow-burn') {
    directives.push('CONFLICT RESOLUTION (Dialogue vs Slow-Burn Pacing): Alternate sharp spoken exchanges with heavy, pregnant pauses, meaningful silences, and lingering micro-expressions.');
  }

  if (sliders.dialogueRatio === 'dialogue_heavy' && sliders.pacing === 'action') {
    directives.push('CONFLICT RESOLUTION (Dialogue vs Action): Keep dialogue urgent, shouted, and fractured amid physical motion. Avoid philosophical monologues during combat or flight.');
  }

  const visceralNum = parseInt(sliders.visceralIntensity ?? 3, 10);
  if (visceralNum >= 4 && (sliders.tone === 'whimsical' || sliders.tone === 'lighthearted')) {
    directives.push('CONFLICT RESOLUTION (Visceral Intensity vs Light Tone): Channel high intensity into kinetic physical stakes, narrow escapes, and sensory tactility rather than grim mortal trauma.');
  }

  return directives;
}

export function sanitizeStationField(val, allowNewlines = false) {
  if (typeof val !== 'string') return '';
  let str = val;
  if (!allowNewlines) {
    str = str.replace(/[\r\n]+/g, ' ');
  }
  str = str
    .replace(/<\/?thinking>\[\/?(?:STORY_START|STORY_END|BRANCH_CHOICES)\]/gi, '')
    .replace(/(?<=\S)<\/?thinking>|<\/?thinking>(?=\S)/gi, '')
    .replace(/(?<=\S)\[\/?(?:STORY_START|STORY_END|BRANCH_CHOICES)\]|\[\/?(?:STORY_START|STORY_END|BRANCH_CHOICES)\](?=\S)/gi, '');
  return str.trim();
}

export function sanitizeChecklistField(val) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<\/?thinking>/gi, '')
    .replace(/\[\/?(?:STORY_START|STORY_END|BRANCH_CHOICES)\]/gi, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

export function compileNarrativePayload({
  prompt,
  sliders = {},
  genre = 'custom',
  storyBible = {},
  previousChapters = [],
  includeBranchChoices = true,
  dramatisPersonae = [],
  activePovCharacter = null,
  locationPins = null,
  plotCatalyst = null,
  loreMicroLocks = [],
  featureStations = {}
}) {
  const genreConfig = GENRE_PRESETS[genre] || GENRE_PRESETS.custom;

  const creativity = parseFloat(sliders.creativity ?? genreConfig.creativity ?? 0.8);
  const toneKey = sliders.tone || genreConfig.tone || 'balanced';
  const pacingKey = sliders.pacing || genreConfig.pacing || 'balanced';
  const strictnessVal = parseInt(sliders.strictness ?? genreConfig.strictness ?? 75, 10);
  const lengthKey = sliders.targetLength || 'short';
  const thinkingDepth = sliders.thinkingDepth || 'balanced';

  const lengthConfig = LENGTH_PROFILES[lengthKey] || LENGTH_PROFILES.short;

  const adherenceKey = strictnessVal >= 80 ? 'high' : strictnessVal >= 45 ? 'moderate' : 'low';
  const toneInstruction = TONE_SNIPPETS[toneKey] || TONE_SNIPPETS.balanced;
  const pacingInstruction = PACING_SNIPPETS[pacingKey] || PACING_SNIPPETS.balanced;
  const adherenceInstruction = ADHERENCE_SNIPPETS[adherenceKey];

  const conflictResolutions = resolveConflicts({
    ...sliders,
    creativity,
    strictness: strictnessVal
  });

  const rawCast = (Array.isArray(dramatisPersonae) && dramatisPersonae.length > 0)
    ? dramatisPersonae
    : (Array.isArray(featureStations?.dramatisPersonae) ? featureStations.dramatisPersonae : []);
  const activeCast = (Array.isArray(rawCast) ? rawCast : []).filter(c => c && typeof c === 'object');

  const rawPovChar = (activePovCharacter !== null && activePovCharacter !== undefined)
    ? activePovCharacter
    : (featureStations?.activePovCharacter || null);

  const rawLocation = locationPins || featureStations?.locationPins || null;
  const rawCatalyst = plotCatalyst || featureStations?.plotCatalyst || null;
  const rawLoreLocks = (Array.isArray(loreMicroLocks) && loreMicroLocks.length > 0)
    ? loreMicroLocks
    : (Array.isArray(featureStations?.loreMicroLocks) ? featureStations.loreMicroLocks : []);

  let focalCharacter = null;
  if (rawPovChar) {
    if (typeof rawPovChar === 'object') {
      const match = activeCast.find(c => (rawPovChar.id && c.id === rawPovChar.id) || (rawPovChar.name && c.name === rawPovChar.name));
      focalCharacter = match || rawPovChar;
    } else if (typeof rawPovChar === 'string' && rawPovChar.trim()) {
      const trimmed = rawPovChar.trim();
      const match = activeCast.find(c => c.id === trimmed || c.name === trimmed);
      focalCharacter = match || { name: trimmed, role: 'Protagonist' };
    }
  }
  if (!focalCharacter && activeCast.length > 0) {
    focalCharacter = activeCast.find(c => c.isPov || c.isPOV) || null;
  }

  const systemBlocks = [
    `# ROLE & IDENTITY
You are a master fiction author, literary stylist, and narrative architect.
Your mission is to expand the user's premise into an evocative, immersive, and logically coherent narrative chapter.`,

    `[OUTPUT FORMAT RULES]
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

  const povDirective = POV_DIRECTIVES[sliders.pov] || POV_DIRECTIVES.third_limited;
  const tenseDirective = TENSE_DIRECTIVES[sliders.tense] || TENSE_DIRECTIVES.past;
  const dialogueDirective = DIALOGUE_RATIO_DIRECTIVES[sliders.dialogueRatio] || DIALOGUE_RATIO_DIRECTIVES.balanced;
  const stylistDirective = PROSE_STYLIST_DIRECTIVES[sliders.proseStylist] || PROSE_STYLIST_DIRECTIVES.cinematic;

  systemBlocks.push(`# NARRATIVE PERSPECTIVE & VOICE
${povDirective}
${tenseDirective}
${dialogueDirective}
${stylistDirective}`);

  const conflictDirective = CONFLICT_DIRECTIVES[sliders.conflictType] || CONFLICT_DIRECTIVES.person_vs_person;
  const stakesDirective = STAKES_DIRECTIVES[sliders.dramaticStakes] || STAKES_DIRECTIVES.personal;
  const endingDirective = ENDING_TURN_DIRECTIVES[sliders.endingTurn] || ENDING_TURN_DIRECTIVES.cliffhanger;

  systemBlocks.push(`# PLOT ARCHITECTURE & DRAMATIC ENGINE
${conflictDirective}
${stakesDirective}
${endingDirective}`);

  const sensoryDirective = SENSORY_ANCHOR_DIRECTIVES[sliders.sensoryAnchor] || SENSORY_ANCHOR_DIRECTIVES.tactile;
  const atmosphereDirective = ATMOSPHERE_DIRECTIVES[sliders.environmentalMood] || ATMOSPHERE_DIRECTIVES.chiaroscuro_fog;
  const visceralIntensityVal = parseInt(sliders.visceralIntensity ?? 3, 10);
  const visceralDirective = getVisceralDirective(visceralIntensityVal);

  systemBlocks.push(`# SENSORY PALETTE & ATMOSPHERE
${sensoryDirective}
${atmosphereDirective}
${visceralDirective}`);

  const psychologyDirective = PROTAGONIST_STATE_DIRECTIVES[sliders.protagonistState] || PROTAGONIST_STATE_DIRECTIVES.calculating;
  const alignmentDirective = MORAL_ALIGNMENT_DIRECTIVES[sliders.moralAlignment] || MORAL_ALIGNMENT_DIRECTIVES.antihero;
  const unreliableDirective = sliders.unreliableNarrator && sliders.unreliableNarrator !== 'off'
    ? UNRELIABLE_NARRATOR_DIRECTIVES[sliders.unreliableNarrator]
    : null;

  const psychBlocks = [psychologyDirective, alignmentDirective];
  if (unreliableDirective) psychBlocks.push(unreliableDirective);

  systemBlocks.push(`# CHARACTER PSYCHOLOGY & PERCEPTUAL FILTER
${psychBlocks.join('\n')}`);

  if (conflictResolutions.length > 0) {
    systemBlocks.push(`# CONSTRAINTS HARMONIZATION\n${conflictResolutions.join('\n')}`);
  }

  if (activeCast.length > 0 || focalCharacter) {
    const castLines = [
      `# ACTIVE CAST & DRAMATIS PERSONAE`,
      `CRITICAL CHARACTER PROTOCOL: The following characters are actively present in this scene. You must portray their distinct voices, scene motivations, and interpersonal dynamics:`
    ];

    if (focalCharacter && focalCharacter.name) {
      const focalName = sanitizeStationField(focalCharacter.name);
      const focalRole = sanitizeStationField(focalCharacter.role || 'Protagonist');
      castLines.push(`\n[FOCAL POV CHARACTER: ${focalName.toUpperCase()} (${focalRole.toUpperCase()})]`);
      castLines.push(`• Lens Mandate: Anchor all immediate sensory observations, internal cognitive reactions, and perceptual limitations strictly through ${focalName}'s vantage.`);
      if (focalCharacter.psychologicalState) {
        castLines.push(`• POV Psychology: ${sanitizeStationField(focalCharacter.psychologicalState)}`);
      }
      if (focalCharacter.motivation) {
        castLines.push(`• POV Immediate Motivation: ${sanitizeStationField(focalCharacter.motivation)}`);
      }
    }

    if (activeCast.length > 0) {
      castLines.push(`\n[ACTIVE CHARACTER ROSTER & DYNAMICS]`);
      activeCast.forEach(char => {
        const isFocal = focalCharacter && (char.id === focalCharacter.id || char.name === focalCharacter.name || char.isPov || char.isPOV);
        const roleLabel = sanitizeStationField(char.role || 'Character');
        const povSuffix = isFocal ? ' [ACTIVE POV]' : '';
        castLines.push(`• ${sanitizeStationField(char.name)} (${roleLabel})${povSuffix}`);
        if (char.psychologicalState) {
          castLines.push(`  - State: ${sanitizeStationField(char.psychologicalState)}`);
        }
        if (char.motivation) {
          castLines.push(`  - Motivation: ${sanitizeStationField(char.motivation)}`);
        }
        if (char.dialogueQuirks) {
          castLines.push(`  - Dialogue Quirks: ${sanitizeStationField(char.dialogueQuirks)}`);
        }
        if (char.tension !== undefined && char.tension !== null && char.tension !== '') {
          castLines.push(`  - Dynamic / Tension: ${typeof char.tension === 'number' ? `Level ${char.tension}/5` : sanitizeStationField(String(char.tension))}`);
        }
      });
    }

    systemBlocks.push(castLines.join('\n'));
  }

  if (rawLocation && typeof rawLocation === 'object') {
    const locLines = [
      `# IMMEDIATE SCENE LOCATION & TERRITORIAL CONTEXT`,
      `CRITICAL ENVIRONMENTAL ANCHOR: The scene takes place within this specific pinned environment. Physical movements, environmental hazards, and sensory textures must reflect these parameters:`
    ];
    if (rawLocation.name) locLines.push(`- Setting: ${sanitizeStationField(rawLocation.name)}`);
    if (rawLocation.geography) locLines.push(`- Geography & Terrain: ${sanitizeStationField(rawLocation.geography)}`);
    if (rawLocation.hazards) locLines.push(`- Environmental Hazards: ${sanitizeStationField(rawLocation.hazards)}`);
    if (rawLocation.lighting) locLines.push(`- Lighting Conditions: ${sanitizeStationField(rawLocation.lighting)}`);
    if (rawLocation.temperature) locLines.push(`- Temperature & Atmosphere: ${sanitizeStationField(rawLocation.temperature)}`);
    if (rawLocation.faction) locLines.push(`- Faction / Territorial Control: ${sanitizeStationField(rawLocation.faction)}`);

    if (locLines.length > 2) {
      systemBlocks.push(locLines.join('\n'));
    }
  }

  const isCatalystActive = rawCatalyst &&
    (rawCatalyst.enabled === undefined || Boolean(rawCatalyst.enabled)) &&
    (Boolean(rawCatalyst.complication) || Boolean(rawCatalyst.wildcard));

  if (isCatalystActive) {
    const parsedSev = parseInt(rawCatalyst.severity, 10);
    const sev = Math.min(Math.max(!isNaN(parsedSev) ? parsedSev : 3, 1), 5);
    const complicationName = sanitizeStationField(rawCatalyst.complication || rawCatalyst.wildcard || 'Unexpected Complication');
    const severityLabel = CATALYST_SEVERITY_LEVELS[sev] || `Severity ${sev}`;

    const catalystLines = [
      `# PLOT CATALYST & PROCEDURAL WILDCARD (SEVERITY LEVEL ${sev}/5)`,
      `NARRATIVE DISRUPTION DIRECTIVE: The procedural narrative dice have rolled a mandatory scene complication that MUST manifest during scene escalation:`,
      `- Catalyst Complication: ${complicationName}`,
      `- Threat Severity: Level ${sev}/5 (${severityLabel})`,
      `- Manifestation Mandate: Characters must encounter this complication mid-scene and actively alter their immediate strategy to survive or resolve it.`
    ];

    if (rawCatalyst.wildcard && rawCatalyst.wildcard !== complicationName) {
      catalystLines.push(`- Wildcard Detail: ${sanitizeStationField(rawCatalyst.wildcard)}`);
    }

    systemBlocks.push(catalystLines.join('\n'));
  }

  const activeLoreRules = rawLoreLocks
    .map(lock => {
      if (typeof lock === 'string') return lock.trim();
      if (lock && typeof lock === 'object') {
        if (lock.enabled === false) return null;
        return (lock.rule || lock.text || lock.content || '').trim();
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 2)
    .map(r => sanitizeStationField(r));

  if (activeLoreRules.length > 0) {
    const loreLines = [
      `# PINNED LORE MICRO-LOCKS (MANDATORY WORLD RULES)`,
      `CRITICAL INVIOLABLE CONSTRAINTS: The following ${activeLoreRules.length} world rule(s) are hard-locked for this scene. You must actively demonstrate their physical/societal reality and NEVER violate or contradict them:`
    ];
    activeLoreRules.forEach((rule, idx) => {
      loreLines.push(`${idx + 1}. ${rule}`);
    });

    systemBlocks.push(loreLines.join('\n'));
  }

  if (thinkingDepth !== 'off') {
    const depthDetail = {
      fast: 'Outline 3 quick beats: Opening Hook -> Conflict Escalation -> Scene Turn.',
      balanced: 'Formulate Theme, 3 Narrative Beats, Primary Sensory Anchor implementation, and Key Dialogue Subtext.',
      deep: 'Formulate deep psychological character motivation, structural beat breakdown, thematic tension, and planned landing closure.'
    }[thinkingDepth] || 'Outline narrative beats and sensory anchors.';

    const rawFocalName = focalCharacter ? focalCharacter.name : null;
    const focalName = rawFocalName ? sanitizeChecklistField(rawFocalName) : null;
    const lensLine = focalName
      ? `• Lens: ${sliders.pov || 'third_limited'} (Focal: ${focalName}) | Tense: ${sliders.tense || 'past'} | Stylist: ${sliders.proseStylist || 'cinematic'}`
      : `• Lens: ${sliders.pov || 'third_limited'} | Tense: ${sliders.tense || 'past'} | Stylist: ${sliders.proseStylist || 'cinematic'}`;

    const checklistItems = [
      lensLine,
      `• Dramaturgy: ${sliders.conflictType || 'person_vs_person'} | Stakes: ${sliders.dramaticStakes || 'personal'} | Scene Turn: ${sliders.endingTurn || 'cliffhanger'}`,
      `• World Palette: Anchor: ${sliders.sensoryAnchor || 'tactile'} | Mood: ${sliders.environmentalMood || 'chiaroscuro_fog'} | Grit: ${visceralIntensityVal}/5`,
      `• Psychology: State: ${sliders.protagonistState || 'calculating'} | Unreliable: ${sliders.unreliableNarrator || 'off'}`
    ];

    if (rawLocation && (rawLocation.name || rawLocation.geography)) {
      const locLabel = sanitizeChecklistField(rawLocation.name || rawLocation.geography);
      const hazardSuffix = rawLocation.hazards ? ` [Hazards: ${sanitizeChecklistField(rawLocation.hazards)}]` : '';
      checklistItems.push(`• Scene Pin: ${locLabel}${hazardSuffix}`);
    }

    if (isCatalystActive) {
      const parsedSev = parseInt(rawCatalyst.severity, 10);
      const sev = Math.min(Math.max(!isNaN(parsedSev) ? parsedSev : 3, 1), 5);
      const complicationName = sanitizeChecklistField(rawCatalyst.complication || rawCatalyst.wildcard || 'Complication');
      checklistItems.push(`• Catalyst Wildcard: ${complicationName} (Severity: ${sev}/5)`);
    }

    if (activeLoreRules.length > 0) {
      checklistItems.push(`• Lore Micro-Locks: Enforcing ${activeLoreRules.length} immutable rule(s)`);
    }

    systemBlocks.push(`# THINKING / BLUEPRINT DIRECTIVE
Before outputting the prose story, you MUST first formulate your narrative strategy inside a <thinking>...</thinking> XML block.
You MUST begin your thinking block with the following verified architectural pre-flight checklist:
[NARRATIVE PRE-FLIGHT ARCHITECTURE]
${checklistItems.join('\n')}

${depthDetail}
Keep the thinking concise and focused. Close the </thinking> tag, then immediately begin the story prose with [STORY_START].`);
  }

  systemBlocks.push(`# LENGTH & CLOSURE PROTOCOL
- TARGET LENGTH: Approximately ${lengthConfig.words} words (maximum ceiling: ${Math.ceil(lengthConfig.words * 1.15)} words).
- BUDGETING: Allocate roughly 20% to the hook/setup, 60% to core tension/conflict, and 20% to a natural scene closure or cliffhanger.
- NATURAL CLOSURE: Plan the scene ending before writing. Ensure the final sentence delivers complete syntactic and dramatic closure. Never cut off mid-thought or mid-sentence.
- DELIMITER CLOSURE: Close the story prose with [STORY_END] immediately after the final sentence.`);

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

  const userMessageParts = [];

  if (previousChapters && previousChapters.length > 0) {
    userMessageParts.push(`=== PREVIOUS CHAPTERS SUMMARY ===`);
    previousChapters.forEach((ch, idx) => {
      userMessageParts.push(`[Chapter ${idx + 1}: ${ch.title || 'Untitled'}]\n${ch.content.slice(0, 600)}...`);
    });
    userMessageParts.push(`=== CONTINUATION DIRECTIVE ===\nNow write Chapter ${previousChapters.length + 1} continuing directly from the previous events.`);
  }

  userMessageParts.push(`USER STORY PREMISE / SEED:\n${prompt}`);

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
      thinkingDepth,
      pov: sliders.pov || 'third_limited',
      tense: sliders.tense || 'past',
      conflictType: sliders.conflictType || 'person_vs_person',
      sensoryAnchor: sliders.sensoryAnchor || 'tactile',
      proseStylist: sliders.proseStylist || 'cinematic',
      visceralIntensity: visceralIntensityVal,
      dramatisPersonaeCount: activeCast.length,
      activePovCharacter: focalCharacter ? focalCharacter.name : null,
      hasLocationPins: Boolean(rawLocation && (rawLocation.name || rawLocation.geography)),
      hasPlotCatalyst: Boolean(isCatalystActive),
      loreMicroLocksCount: activeLoreRules.length
    }
  };
}

export function stripLeadingPreamble(text) {
  if (!text || typeof text !== 'string') return { cleaned: '', preamble: '' };
  let cleaned = text;
  let capturedPreamble = '';

  const blockRegex = /^\s*(?:we need to write|outline:|let's plan|here is the story)[\s\S]*?\n\s*\n/i;
  let match;
  while ((match = cleaned.match(blockRegex))) {
    capturedPreamble += (capturedPreamble ? '\n\n' : '') + match[0].trim();
    cleaned = cleaned.slice(match[0].length);
  }

  const labelRegex = /^\s*(?:here is (?:the|your) story|here's the story|here is chapter \d+)[:\s]*\n*/i;
  const labelMatch = cleaned.match(labelRegex);
  if (labelMatch) {
    capturedPreamble += (capturedPreamble ? '\n\n' : '') + labelMatch[0].trim();
    cleaned = cleaned.slice(labelMatch[0].length);
  }

  return { cleaned: cleaned.trimStart(), preamble: capturedPreamble };
}

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

  const thinkingMatch = prose.match(/<thinking>([\s\S]*?)(?:<\/thinking>|(?=\[STORY_START\])|$)/i);
  if (thinkingMatch) {
    thinking = thinkingMatch[1].trim();
    prose = prose.replace(/<thinking>[\s\S]*?(?:<\/thinking>|(?=\[STORY_START\])|$)/i, '').trim();
  }

  const branchMatch = prose.match(/\[BRANCH_CHOICES\]([\s\S]*?)(?:\[\/BRANCH_CHOICES\]|$)/i);
  if (branchMatch) {
    const rawChoices = branchMatch[1].trim();
    prose = prose.replace(/\[BRANCH_CHOICES\][\s\S]*?(?:\[\/BRANCH_CHOICES\]|$)/i, '').trim();
    branchChoices = parseChoiceLines(rawChoices);
  }

  if (branchChoices.length === 0 && /\[STORY_END\]/i.test(rawText)) {
    const afterEnd = rawText.split(/\[STORY_END\]/i)[1];
    if (afterEnd && afterEnd.trim()) {
      branchChoices = parseChoiceLines(afterEnd);
    }
  }

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
  }

  const sanitized = stripLeadingPreamble(prose);
  if (sanitized.preamble && !thinking) {
    thinking = sanitized.preamble;
  }
  prose = sanitized.cleaned;

  if (branchChoices.length === 0) {
    const trailingChoicesMatch = prose.match(/(?:\n\s*\n|\n)(?:(?:1[\.\)]|[-*•]|Choice 1:?)\s+[^\n]+(?:\n\s*(?:[2345][\.\)]|[-*•]|Choice [2345]:?)\s+[^\n]+)+)\s*$/i);
    if (trailingChoicesMatch) {
      branchChoices = parseChoiceLines(trailingChoicesMatch[0]);
      prose = prose.slice(0, trailingChoicesMatch.index).trim();
    }
  }

  prose = prose
    .replace(/\[\/?STORY_(?:START|END)\]/gi, '')
    .replace(/\[\/?BRANCH_CHOICES\]/gi, '')
    .replace(/<\/?thinking>/gi, '')
    .trim();

  if (branchChoices.length === 0 && prose.length > 50) {
    branchChoices = [
      { title: 'Press Forward', description: 'Confront the immediate danger directly and push into the unknown.' },
      { title: 'Investigate Cautiously', description: 'Hang back to search for clues, alternative routes, or hidden mechanisms.' },
      { title: 'Take an Unconventional Gamble', description: 'Execute a risky, unexpected maneuver with high stakes.' }
    ];
  }

  return {
    thinking: thinking.replace(/<\/?thinking>/gi, '').trim(),
    prose,
    branchChoices
  };
}

export function sanitizeStreamBuffer(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { thinking: '', prose: '' };
  }

  let working = rawText;
  let thinking = '';
  let prose = '';

  const trimmed = working.trimStart();
  if (trimmed.length > 0 && trimmed.length < 10 && '<thinking>'.startsWith(trimmed)) {
    return { thinking: '', prose: '' };
  }

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
        thinking = working.slice(thinkingStart + 10).trim();
        return { thinking, prose: '' };
      }
    }
  }

  const branchIdx = working.indexOf('[BRANCH_CHOICES]');
  if (branchIdx !== -1) {
    working = working.slice(0, branchIdx);
  }

  const storyStartIdx = working.indexOf('[STORY_START]');
  if (storyStartIdx !== -1) {
    const preText = working.slice(0, storyStartIdx).trim();
    if (preText && !thinking) {
      thinking = preText;
    }
    const afterStart = working.slice(storyStartIdx + 13);
    const storyEndIdx = afterStart.indexOf('[STORY_END]');
    prose = storyEndIdx !== -1 ? afterStart.slice(0, storyEndIdx) : afterStart;
  } else {
    const workingTrimmed = working.trimStart();
    if (workingTrimmed.length > 0 && workingTrimmed.length < 13 && '[STORY_START]'.startsWith(workingTrimmed)) {
      return { thinking, prose: '' };
    }

    const preamblePrefixRegex = /^\s*(?:we need to write|outline:|let's plan|here is the story)/i;
    if (preamblePrefixRegex.test(working)) {
      const blockMatch = working.match(/^\s*(?:we need to write|outline:|let's plan|here is the story)[\s\S]*?\n\s*\n/i);
      if (blockMatch) {
        if (!thinking) {
          thinking = blockMatch[0].trim();
        }
        working = working.slice(blockMatch[0].length);
        const nextStartIdx = working.indexOf('[STORY_START]');
        if (nextStartIdx !== -1) {
          const after = working.slice(nextStartIdx + 13);
          const endIdx = after.indexOf('[STORY_END]');
          prose = endIdx !== -1 ? after.slice(0, endIdx) : after;
        } else {
          const postTrim = working.trimStart();
          if (postTrim.length > 0 && postTrim.length < 13 && '[STORY_START]'.startsWith(postTrim)) {
            return { thinking, prose: '' };
          }
          prose = working;
        }
      } else {
        thinking = working.trim();
        return { thinking, prose: '' };
      }
    } else {
      const storyEndIdx = working.indexOf('[STORY_END]');
      prose = storyEndIdx !== -1 ? working.slice(0, storyEndIdx) : working;
    }
  }

  const sanitizedProse = stripLeadingPreamble(prose);
  if (sanitizedProse.preamble && !thinking) {
    thinking = sanitizedProse.preamble;
  }
  prose = sanitizedProse.cleaned;

  prose = prose
    .replace(/\[\/?STORY_(?:START|END)\]/gi, '')
    .replace(/\[\/?BRANCH_CHOICES\]/gi, '')
    .replace(/<\/?thinking>/gi, '');

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

export function normalizeChapterExtraction(previousChapters = [], lastChapterIndex = undefined) {
  let chaptersList = [];
  if (Array.isArray(previousChapters)) {
    chaptersList = previousChapters;
  } else if (typeof previousChapters === 'string' && previousChapters.trim()) {
    chaptersList = [previousChapters.trim()];
  } else if (previousChapters && typeof previousChapters === 'object') {
    chaptersList = [previousChapters];
  }

  const totalChapters = chaptersList.length;
  let selectedIdx = -1;

  if (totalChapters > 0) {
    if (typeof lastChapterIndex === 'number' && Number.isFinite(lastChapterIndex)) {
      const safeLastIdx = Math.floor(lastChapterIndex);
      if (safeLastIdx >= 0 && safeLastIdx < totalChapters) {
        selectedIdx = safeLastIdx;
      } else if (safeLastIdx > 0 && (safeLastIdx - 1) < totalChapters) {
        selectedIdx = safeLastIdx - 1;
      } else {
        selectedIdx = totalChapters - 1;
      }
    } else {
      selectedIdx = totalChapters - 1;
    }
  }

  let currentChapterNumber = 1;
  let prose = '';
  let title = '';

  if (selectedIdx >= 0 && selectedIdx < totalChapters) {
    const ch = chaptersList[selectedIdx];
    if (typeof ch === 'string') {
      prose = ch;
      currentChapterNumber = selectedIdx + 1;
      title = `Chapter ${currentChapterNumber}`;
    } else if (ch && typeof ch === 'object') {
      prose = ch.content || ch.prose || ch.text || '';
      currentChapterNumber = (typeof ch.number === 'number' && Number.isFinite(ch.number) && ch.number > 0)
        ? Math.floor(ch.number)
        : selectedIdx + 1;
      title = ch.title || `Chapter ${currentChapterNumber}`;
    } else {
      currentChapterNumber = selectedIdx + 1;
      title = `Chapter ${currentChapterNumber}`;
      prose = String(ch || '');
    }
  } else {
    if (typeof lastChapterIndex === 'number' && Number.isFinite(lastChapterIndex) && lastChapterIndex >= 0) {
      const safeLastIdx = Math.floor(lastChapterIndex);
      currentChapterNumber = safeLastIdx === 0 ? 1 : safeLastIdx;
    } else {
      currentChapterNumber = 1;
    }
    title = `Chapter ${currentChapterNumber}`;
  }

  if (!Number.isFinite(currentChapterNumber) || currentChapterNumber < 1) {
    currentChapterNumber = 1;
  }

  const nextChapterNumber = currentChapterNumber + 1;

  return {
    currentChapterNumber,
    nextChapterNumber,
    title,
    prose: String(prose || '').trim()
  };
}

export function formatStoryBibleSummary(storyBible = {}) {
  if (!storyBible || typeof storyBible !== 'object') return '';
  const parts = [];

  if (storyBible.characters) {
    if (typeof storyBible.characters === 'string' && storyBible.characters.trim()) {
      parts.push(`Characters: ${storyBible.characters.trim()}`);
    } else if (Array.isArray(storyBible.characters) && storyBible.characters.length > 0) {
      const chars = storyBible.characters
        .map(c => {
          if (typeof c === 'string') return c.trim();
          if (c && typeof c === 'object') {
            const role = c.role ? ` (${c.role})` : '';
            return `${c.name || 'Unknown'}${role}`;
          }
          return '';
        })
        .filter(Boolean)
        .join(', ');
      if (chars) parts.push(`Characters: ${chars}`);
    }
  }

  if (storyBible.worldRules) {
    if (typeof storyBible.worldRules === 'string' && storyBible.worldRules.trim()) {
      parts.push(`World Rules: ${storyBible.worldRules.trim()}`);
    } else if (Array.isArray(storyBible.worldRules) && storyBible.worldRules.length > 0) {
      const rules = storyBible.worldRules
        .map(r => {
          if (typeof r === 'string') return r.trim();
          if (r && typeof r === 'object') return (r.rule || r.title || r.text || '').trim();
          return '';
        })
        .filter(Boolean)
        .join('; ');
      if (rules) parts.push(`World Rules: ${rules}`);
    }
  }

  if (storyBible.canonNotes) {
    if (typeof storyBible.canonNotes === 'string' && storyBible.canonNotes.trim()) {
      parts.push(`Canon Notes: ${storyBible.canonNotes.trim()}`);
    } else if (Array.isArray(storyBible.canonNotes) && storyBible.canonNotes.length > 0) {
      const notes = storyBible.canonNotes
        .map(n => {
          if (typeof n === 'string') return n.trim();
          if (n && typeof n === 'object') return (n.note || n.text || '').trim();
          return '';
        })
        .filter(Boolean)
        .join('; ');
      if (notes) parts.push(`Canon Notes: ${notes}`);
    }
  }

  return parts.join('\n');
}

export function synthesizeHeuristicContinuationHooks({
  prose = '',
  title = '',
  currentChapterNumber = 1,
  nextChapterNumber = 2,
  genre = 'custom',
  storyBible = {}
} = {}) {
  const cleanGenre = (typeof genre === 'string' && genre.trim() ? genre.trim().toLowerCase() : 'custom');

  const cleanProse = String(prose || '').replace(/\s+/g, ' ').trim();
  const sentences = cleanProse
    ? cleanProse.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 15)
    : [];

  const closingContext = sentences.slice(-3).join(' ');

  let anchor = '';
  if (storyBible?.characters) {
    if (Array.isArray(storyBible.characters) && storyBible.characters.length > 0) {
      const first = storyBible.characters[0];
      anchor = typeof first === 'string' ? first.trim() : (first?.name || '').trim();
    } else if (typeof storyBible.characters === 'string' && storyBible.characters.trim()) {
      const match = storyBible.characters.match(/\b([A-Z][a-z]{2,15})\b/);
      if (match) anchor = match[1];
    }
  }

  if (!anchor && closingContext) {
    const matches = closingContext.match(/\b([A-Z][a-z]{2,15})\b/g);
    if (matches) {
      const nonNames = new Set([
        'The', 'Then', 'When', 'With', 'After', 'Before', 'Into', 'From',
        'There', 'Their', 'This', 'That', 'Suddenly', 'Now', 'Here', 'What', 'Where', 'Chapter'
      ]);
      const candidate = matches.find(m => !nonNames.has(m));
      if (candidate) anchor = candidate;
    }
  }

  const genreComplications = {
    fantasy: {
      action: "The immediate calm shatters as ancient ward-runes flare violently across the threshold, sealing the only escape route and rousing an armored sentinel from the subterranean catacombs.",
      mystery: "Among the scattered debris, an unbroken wax seal bears the sigil of an allied guild, proving their confidential movements were compromised from the very beginning.",
      gamble: "To survive the dawn, a forbidden blood-pact must be struck with the chained phantom whispering secrets beneath the sanctum's flagstones."
    },
    scifi: {
      action: "Decompression sirens scream across the bulkhead as incoming interceptors lock target telemetry, giving the crew mere moments to reroute emergency thrusters before hull breach.",
      mystery: "A fragmented telemetry log surfaces from the black-box archive, revealing that the distress beacon was broadcast using their own ship's transponder signature six hours before arrival.",
      gamble: "Disabling the station's atmospheric shielding will quarantine the spreading bio-anomaly, but permanently strands the outer ring survivors in deep vacuum."
    },
    cyberpunk: {
      action: "Heavy corporate assault drones breach the skyway windows in an explosion of tempered glass and flash-charges as perimeter sweeps pin down the extraction zone.",
      mystery: "Decryption of the stolen memory core unveils an encrypted neural engram belonging to the mega-corporation's supposedly assassinated chief architect.",
      gamble: "Uploading the raw biometrics to an underground data broker buys safe passage off the grid, but burns every contact who aided the operation."
    },
    horror: {
      action: "The frantic scratching behind the plaster abruptly halts, replaced by heavy, wet dragging sounds ascending the staircase in absolute, suffocating darkness.",
      mystery: "A sudden lightning strike illuminates the cracked mirror, revealing reflections that move independently and spell out desperate warnings in reverse.",
      gamble: "Barricading the iron door halts whatever is pacing the outer hallway, but seals the survivors inside with the entity already waiting in the rafters."
    },
    mystery: {
      action: "Blinding headlights abruptly sweep the dead-end alley as an unmarked sedan accelerates toward them, trapping the investigators under lethal suppression fire.",
      mystery: "The missing ledger recovered from the floorboards contains meticulous handwritten entries penned by the precinct captain's closest confidant.",
      gamble: "Concealing the decisive autopsy report protects a key informant from immediate execution, but all but guarantees a wrongful murder conviction by morning."
    },
    romance: {
      action: "An urgent summons from the high council arrives on the doorstep, threatening to violently sever the fragile bond forged in secret.",
      mystery: "A hidden bundle of unsent correspondence uncovers the agonizing truth behind the five-year silence and the sacrifice that was never spoken aloud.",
      gamble: "Revealing their true lineage could save the ancestral estate from foreclosure, but risks destroying any chance of genuine trust forever."
    },
    custom: {
      action: "The immediate aftermath leaves no room to recover as secondary alarms detonate and incoming hostiles converge directly on the compromised position.",
      mystery: "An undeniable piece of physical evidence comes to light, overturning the core assumption that brought the mission together in the first place.",
      gamble: "Securing escape requires abandoning their primary asset behind enemy lines, forcing an immediate reckoning between loyalty and survival."
    }
  };

  const pool = genreComplications[cleanGenre] || genreComplications.custom;

  const hook1 = `Trajectory 1 (Action & Peril Escalation): ${pool.action}`;
  const hook2 = `Trajectory 2 (Investigation & Hidden Truth): ${pool.mystery}`;
  const hook3 = `Trajectory 3 (Moral Compromise & Gamble): ${pool.gamble}`;

  const suggestedPrompt = anchor
    ? `Following the climax of Chapter ${currentChapterNumber}, Chapter ${nextChapterNumber} thrusts ${anchor} into an immediate escalation. ${pool.action} Propel the confrontation forward without summarizing past events.`
    : `Following the events of Chapter ${currentChapterNumber}, Chapter ${nextChapterNumber} opens with an immediate escalation of stakes. ${pool.action} Drive the action forward into the immediate consequence without recap.`;

  return {
    suggestedPrompt,
    chapterNumber: nextChapterNumber,
    suggestedHooks: [hook1, hook2, hook3]
  };
}

export function compileContinuationPromptPayload({
  previousChapters = [],
  storyBible = {},
  genre = 'custom',
  lastChapterIndex
} = {}) {
  const extraction = normalizeChapterExtraction(previousChapters, lastChapterIndex);
  const { currentChapterNumber, nextChapterNumber, title, prose } = extraction;

  const genreKey = (typeof genre === 'string' && genre.trim() ? genre.trim().toLowerCase() : 'custom');
  const genrePreset = GENRE_PRESETS[genreKey] || GENRE_PRESETS.custom;
  const bibleSummary = formatStoryBibleSummary(storyBible);

  const endingExcerpt = prose.length > 1800 ? `...${prose.slice(-1800)}` : prose;

  const systemPrompt = `You are a publication-grade story architect and narrative strategist.
Your task is to analyze the climax and open dilemmas of Chapter ${currentChapterNumber} and synthesize 3 compelling, distinct continuation trajectories for Chapter ${nextChapterNumber}.

CRITICAL ANTI-REPETITION & CONTINUATION DIRECTIVES:
1. NEVER summarize, recap, or re-describe what already occurred in Chapter ${currentChapterNumber}.
2. Propel the narrative immediately into the unfolding consequences, escalating danger, or immediate next action.
3. Every hook MUST introduce a new complication, raised stakes, or unexpected shift in momentum.
4. Provide exactly 3 contrasting trajectories:
   - Trajectory 1 (Action & Peril Escalation): An immediate physical threat, ticking clock, or aggressive confrontation directly resulting from the previous scene.
   - Trajectory 2 (Investigation & Hidden Truth): A shocking discovery, uncovered secret, or revelation of betrayal that reframes previous assumptions.
   - Trajectory 3 (Moral Compromise & Gamble): A high-stakes dilemma forcing an agonizing choice, risky alliance, or desperate gambit with irreversible costs.
5. Provide a primary "suggestedPrompt" (2-3 punchy sentences) that seamlessly sets up Chapter ${nextChapterNumber}'s opening beat.

OUTPUT FORMAT:
Respond with ONLY a valid JSON object matching this exact schema:
{
  "suggestedPrompt": "Direct 2-3 sentence premise ready to guide Chapter ${nextChapterNumber}...",
  "suggestedHooks": [
    "Trajectory 1 (Action & Peril Escalation): Hook description...",
    "Trajectory 2 (Investigation & Hidden Truth): Hook description...",
    "Trajectory 3 (Moral Compromise & Gamble): Hook description..."
  ]
}
Do NOT include markdown formatting outside the JSON, commentary, or prose preamble.`;

  const userMessageParts = [
    `GENRE: ${genrePreset.name || genre}`,
    `CURRENT CHAPTER: Chapter ${currentChapterNumber}${title ? ` ("${title}")` : ''}`,
    `TARGET CHAPTER: Chapter ${nextChapterNumber}`
  ];

  if (genrePreset.systemDirective) {
    userMessageParts.push(`GENRE DIRECTIVE: ${genrePreset.systemDirective}`);
  }

  if (bibleSummary) {
    userMessageParts.push(`STORY BIBLE CONTEXT:\n${bibleSummary}`);
  }

  if (endingExcerpt) {
    userMessageParts.push(`CHAPTER ${currentChapterNumber} ENDING EXCERPT:\n"""\n${endingExcerpt}\n"""`);
  } else {
    userMessageParts.push(`NOTE: No prior prose supplied. Synthesize an opening continuation hook for Chapter ${nextChapterNumber}.`);
  }

  userMessageParts.push(`Synthesize the Chapter ${nextChapterNumber} continuation prompt and 3 hooks now. Return JSON only.`);

  return {
    systemPrompt,
    userMessage: userMessageParts.join('\n\n'),
    parameters: {
      temperature: 0.7,
      max_tokens: 350
    },
    meta: {
      currentChapterNumber,
      nextChapterNumber,
      title,
      genre: genreKey
    }
  };
}
