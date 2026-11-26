/**
 * Plot Catalyst & Procedural Narrative Dice
 * Features 6 core archetypes x 5 severity levels (30 procedural complication descriptors).
 * Provides deterministic and random dice rolling, severity clamping, and prompt compiler formatting.
 */

export const NARRATIVE_COMPLICATIONS = [
  {
    id: 'ticking_clock',
    name: 'Ticking Clock',
    archetype: 'Temporal Pressure',
    description: 'A strict, unforgiving time limit or environmental countdown threatens the mission objective.',
    directive: 'Introduce an urgent temporal deadline or environmental countdown that forces immediate acceleration.',
    examples: [
      'Blast doors sealing irrevocably in ten minutes',
      'The neurotoxin spreads past the blood-brain barrier at midnight',
      'The rising subterranean tide threatens to flood the lower tunnels',
      'The structural containment field collapses in three power cycles',
      'An orbital intercept window closes in less than five minutes'
    ]
  },
  {
    id: 'betrayal',
    name: 'Betrayal',
    archetype: 'Interpersonal Rupture',
    description: 'A trusted companion, contractor, or informant reveals conflicting allegiance.',
    directive: 'An unexpected shift in loyalties or sudden tactical abandonment by a presumed ally.',
    examples: [
      'A trusted guide cuts the ascending safety line',
      'An encrypted informant alerts the city garrison to the safehouse',
      'A hired mercenary company demands triple payment mid-confrontation',
      'The quartermaster admits to poisoning the team emergency rations',
      'A longtime partner locks the blast gate from the outside'
    ]
  },
  {
    id: 'sensory_anomaly',
    name: 'Sensory Anomaly',
    archetype: 'Perceptual Distortion',
    description: 'An unsettling environmental hallucination, supernatural fog, or optical illusion.',
    directive: 'Impair the characters\' primary senses with confusing environmental phenomena or perceptual distortions.',
    examples: [
      'Dense blinding sulfur fog rolls across the floor, obscuring footing',
      'Acoustic echoes repeat spoken whispers seconds before they are uttered',
      'Reflections in shattered mirrors begin moving with independent agency',
      'A high-pitched harmonic resonance induces severe vertigo and disorientation',
      'Atmospheric color shifts abruptly into eerie inverted monochrome'
    ]
  },
  {
    id: 'forbidden_revelation',
    name: 'Forbidden Revelation',
    archetype: 'Cognitive Shock',
    description: 'A horrific truth, hidden lineage, or dangerous secret comes to light mid-scene.',
    directive: 'Force the protagonist to confront an agonizing truth that shatters their current premise or motivation.',
    examples: [
      'The opposing commander is revealed to be the lost sibling presumed dead',
      'The sacred ancestral relic is revealed to be a bioweapon canister',
      'The entire infiltration mission was orchestrated as an expendable decoy',
      'The decrypt cipher proves the governing council sanctioned the purge',
      'The cure being retrieved has already been weaponized and distributed'
    ]
  },
  {
    id: 'mechanical_failure',
    name: 'Mechanical Failure',
    archetype: 'Systemic Breakdown',
    description: 'A critical tool, vehicle, weapon, or atmospheric system violently malfunctions.',
    directive: 'A crucial piece of equipment or structural support violently fails, creating immediate tactical jeopardy.',
    examples: [
      'Main atmospheric thruster manifolds rupture under thermal stress',
      'The primary elevator hoist cable snaps, dropping toward the shaft base',
      'The cybernetic targeting servo jams solid mid-strike',
      'The oxygen filtration unit begins venting toxic coolant gas',
      'The mag-lock power cell drains completely, dropping defensive shields'
    ]
  },
  {
    id: 'unwelcome_guest',
    name: 'Unwelcome Guest',
    archetype: 'External Intrusion',
    description: 'An unexpected third party, apex predator, or rival faction enters the scene.',
    directive: 'Interrupt the current confrontation with a dangerous, unpredictable third-party arrival.',
    examples: [
      'An apex subterranean predator stalks into the confrontation chamber',
      'An elite imperial patrol arrives ahead of schedule, sealing exits',
      'A rival syndicate infiltration squad breaches the skylight above',
      'A frantic civilian carrying volatile explosives bursts into the room',
      'An ancient automated sentinel reactivates and targets all combatants'
    ]
  }
];

export const SEVERITY_LEVELS = {
  1: {
    level: 1,
    name: 'Subtle Inconvenience',
    impact: 'Micro-friction or eerie anomaly that raises tension without halting movement.'
  },
  2: {
    level: 2,
    name: 'Minor Setback',
    impact: 'Tactical delay or resource drain that complicates execution.'
  },
  3: {
    level: 3,
    name: 'Significant Complication',
    impact: 'Dangerous obstacle forcing a tactical shift and immediate countermeasure.'
  },
  4: {
    level: 4,
    name: 'Critical Crisis',
    impact: 'Severe peril threatening physical survival or mission collapse.'
  },
  5: {
    level: 5,
    name: 'Catastrophic Wildcard',
    impact: 'Lethal catastrophe or structural collapse altering the entire narrative arc.'
  }
};

/**
 * Clamps and sanitizes severity values between 1 and 5.
 * @param {number|string} val - Input severity level.
 * @returns {number} Clamped integer between 1 and 5.
 */
export function clampSeverity(val) {
  const num = parseInt(val, 10);
  if (isNaN(num)) return 3;
  return Math.min(Math.max(num, 1), 5);
}

/**
 * Rolls procedural narrative dice across core archetypes and severity matrix.
 * Supports options object or positional arguments (severityOverride, seed).
 * @param {object|number} options - Options object or severityOverride.
 * @param {number} [seedArg] - Seed when called with positional arguments.
 * @returns {object} Standard narrative dice roll result envelope.
 */
export function rollProceduralDice(options = {}, seedArg) {
  let opts = {};
  if (typeof options === 'number' || typeof options === 'string') {
    opts = { severity: options, seed: seedArg };
  } else if (options && typeof options === 'object') {
    opts = options;
  }

  const complications = opts.complications || NARRATIVE_COMPLICATIONS;
  let selectedIndex;

  if (typeof opts.seed === 'number' && !isNaN(opts.seed)) {
    const absSeed = Math.abs(Math.floor(opts.seed));
    selectedIndex = absSeed % complications.length;
  } else if (typeof opts.diceRoll === 'number') {
    const face = Math.min(Math.max(Math.floor(opts.diceRoll), 1), complications.length);
    selectedIndex = face - 1;
  } else {
    selectedIndex = Math.floor(Math.random() * complications.length);
  }

  const complication = complications[selectedIndex] || complications[0];
  const severity = clampSeverity(opts.severity ?? 3);
  const severityInfo = SEVERITY_LEVELS[severity] || SEVERITY_LEVELS[3];

  const seedVal = typeof opts.seed === 'number' && !isNaN(opts.seed) ? opts.seed : 0;
  const exampleIdx = Math.abs(Math.floor(seedVal)) % complication.examples.length;

  const wildcardDetail = opts.customWildcard && opts.customWildcard.trim()
    ? opts.customWildcard.trim()
    : complication.examples[exampleIdx];

  return {
    id: complication.id,
    name: complication.name,
    archetype: complication.archetype,
    description: complication.description,
    directive: complication.directive,
    severity,
    severityName: severityInfo.name,
    severityImpact: severityInfo.impact,
    wildcard: wildcardDetail,
    diceFace: selectedIndex + 1,
    timestamp: Date.now()
  };
}

/**
 * Formats a narrative dice roll result into a Markdown prompt compiler block.
 * @param {object} rollResult - The object returned by rollProceduralDice.
 * @returns {string} Formatted markdown directive for prompt compilation.
 */
export function formatCatalystDirective(rollResult) {
  if (!rollResult) return '';
  return `# PLOT CATALYST & PROCEDURAL WILDCARD (SEVERITY LEVEL ${rollResult.severity}/5)\n` +
    `- Catalyst Complication: ${rollResult.name}\n` +
    `- Threat Severity: Level ${rollResult.severity}/5 (${rollResult.severityName})\n` +
    `- Directorial Mandate: ${rollResult.directive}\n` +
    `- Specific Manifestation: ${rollResult.wildcard}`;
}
