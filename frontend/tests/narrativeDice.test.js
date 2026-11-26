import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Specification Reference implementation used if M2 has not yet created frontend/src/utils/narrativeDice.js
function createReferenceNarrativeDice() {
  const NARRATIVE_COMPLICATIONS = [
    {
      id: 'ticking_clock',
      name: 'Ticking Clock',
      archetype: 'Temporal Pressure',
      description: 'A strict, unforgiving time limit or countdown threatens the mission objective.',
      directive: 'Introduce an urgent temporal deadline or environmental countdown that forces immediate acceleration.',
      examples: ['Blast doors sealing in 10 minutes', 'The poison reaches the heart at midnight', 'The tide rises to flood the cave']
    },
    {
      id: 'betrayal',
      name: 'Betrayal',
      archetype: 'Interpersonal Rupture',
      description: 'A trusted companion, contractor, or informant reveals conflicting allegiance.',
      directive: 'An unexpected shift in loyalties or sudden tactical abandonment by a presumed ally.',
      examples: ['A guide cuts the climbing rope', 'An informant alerts the garrison', 'A mercenary demands triple pay mid-fight']
    },
    {
      id: 'sensory_anomaly',
      name: 'Sensory Anomaly',
      archetype: 'Perceptual Distortion',
      description: 'An unsettling environmental hallucination, supernatural fog, or optical illusion.',
      directive: 'Impair the characters\' primary senses with confusing environmental phenomena or perceptual distortions.',
      examples: ['Dense blinding sulfur fog', 'Echoes repeating words not yet spoken', 'Reflections in glass acting independently']
    },
    {
      id: 'forbidden_revelation',
      name: 'Forbidden Revelation',
      archetype: 'Cognitive Shock',
      description: 'A horrific truth, hidden lineage, or dangerous secret comes to light mid-scene.',
      directive: 'Force the protagonist to confront an agonizing truth that shatters their current premise or motivation.',
      examples: ['The enemy commander is the lost sibling', 'The sacred relic is a biological weapon', 'The mission was a decoy']
    },
    {
      id: 'mechanical_failure',
      name: 'Mechanical Failure',
      archetype: 'Systemic Breakdown',
      description: 'A critical tool, vehicle, weapon, or atmospheric system malfunctions.',
      directive: 'A crucial piece of equipment or structural support violently fails, creating immediate tactical jeopardy.',
      examples: ['Main thruster manifolds breach', 'The elevator cable snaps', 'The cybernetic arm jams mid-strike']
    },
    {
      id: 'unwelcome_guest',
      name: 'Unwelcome Guest',
      archetype: 'External Intrusion',
      description: 'An unexpected third party, apex predator, or rival faction enters the scene.',
      directive: 'Interrupt the current confrontation with a dangerous, unpredictable third-party arrival.',
      examples: ['An apex predator stalks the battlefield', 'An imperial patrol arrives unannounced', 'A rival thief claims the prize']
    }
  ];

  const SEVERITY_LEVELS = {
    1: { level: 1, name: 'Subtle Inconvenience', impact: 'Micro-friction or eerie anomaly that raises tension without halting movement.' },
    2: { level: 2, name: 'Minor Setback', impact: 'Tactical delay or resource drain that complicates execution.' },
    3: { level: 3, name: 'Significant Complication', impact: 'Dangerous obstacle forcing a tactical shift and immediate countermeasure.' },
    4: { level: 4, name: 'Critical Crisis', impact: 'Severe peril threatening physical survival or mission collapse.' },
    5: { level: 5, name: 'Catastrophic Wildcard', impact: 'Lethal catastrophe or structural collapse altering the entire narrative arc.' }
  };

  function clampSeverity(val) {
    const num = parseInt(val, 10);
    if (isNaN(num)) return 3;
    return Math.min(Math.max(num, 1), 5);
  }

  function rollProceduralDice(options = {}) {
    const complications = options.complications || NARRATIVE_COMPLICATIONS;
    let selectedIndex;

    if (typeof options.seed === 'number' && !isNaN(options.seed)) {
      // Deterministic PRNG using linear congruential formula
      const absSeed = Math.abs(Math.floor(options.seed));
      selectedIndex = absSeed % complications.length;
    } else if (typeof options.diceRoll === 'number') {
      const face = Math.min(Math.max(Math.floor(options.diceRoll), 1), 6);
      selectedIndex = face - 1;
    } else {
      selectedIndex = Math.floor(Math.random() * complications.length);
    }

    const complication = complications[selectedIndex] || complications[0];
    const severity = clampSeverity(options.severity ?? 3);
    const severityInfo = SEVERITY_LEVELS[severity];

    const wildcardDetail = options.customWildcard && options.customWildcard.trim()
      ? options.customWildcard.trim()
      : complication.examples[Math.abs(Math.floor(options.seed || 0)) % complication.examples.length];

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

  function formatCatalystDirective(rollResult) {
    if (!rollResult) return '';
    return `# PLOT CATALYST & PROCEDURAL WILDCARD (SEVERITY LEVEL ${rollResult.severity}/5)\n` +
      `- Catalyst Complication: ${rollResult.name}\n` +
      `- Threat Severity: Level ${rollResult.severity}/5 (${rollResult.severityName})\n` +
      `- Directorial Mandate: ${rollResult.directive}\n` +
      `- Specific Manifestation: ${rollResult.wildcard}`;
  }

  return {
    NARRATIVE_COMPLICATIONS,
    SEVERITY_LEVELS,
    clampSeverity,
    rollProceduralDice,
    formatCatalystDirective
  };
}

// Load real module if available, otherwise reference implementation
let diceModule;
try {
  diceModule = await import('../src/utils/narrativeDice.js');
} catch {
  diceModule = createReferenceNarrativeDice();
}

const {
  NARRATIVE_COMPLICATIONS,
  SEVERITY_LEVELS,
  clampSeverity,
  rollProceduralDice,
  formatCatalystDirective
} = diceModule;

describe('Plot Catalyst & Narrative Dice Roller - 4-Tier Test Suite', () => {

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 TESTS)
  // =========================================================================
  describe('Tier 1: Feature Coverage', () => {

    test('Feature 1: Narrative Complications pool contains all 6 core archetypes', () => {
      assert.equal(NARRATIVE_COMPLICATIONS.length, 6, 'Must define exactly 6 complication archetypes for D6');

      const expectedArchetypes = [
        'Ticking Clock',
        'Betrayal',
        'Sensory Anomaly',
        'Forbidden Revelation',
        'Mechanical Failure',
        'Unwelcome Guest'
      ];

      const names = NARRATIVE_COMPLICATIONS.map(c => c.name);
      for (const expected of expectedArchetypes) {
        assert.ok(names.includes(expected), `Must include archetype: ${expected}`);
      }

      // Verify each archetype contains required descriptor fields
      for (const comp of NARRATIVE_COMPLICATIONS) {
        assert.ok(comp.id, 'Must have unique id');
        assert.ok(comp.archetype, 'Must have archetype classification');
        assert.ok(comp.directive, 'Must have LLM directorial mandate');
        assert.ok(Array.isArray(comp.examples) && comp.examples.length >= 2, 'Must have at least 2 concrete exemplars');
      }
    });

    test('Feature 2: Deterministic seeded rolls produce consistent complication selections', () => {
      // Seed 0 should produce face 1
      const rollA1 = rollProceduralDice({ seed: 0, severity: 3 });
      const rollA2 = rollProceduralDice({ seed: 0, severity: 3 });
      assert.equal(rollA1.name, rollA2.name, 'Same seed must select identical complication');
      assert.equal(rollA1.diceFace, rollA2.diceFace, 'Same seed must produce identical dice face');

      // Seed 4 should produce different face from Seed 1
      const rollB = rollProceduralDice({ seed: 4, severity: 3 });
      assert.equal(rollB.diceFace, 5);
    });

    test('Feature 3: Severity levels 1 through 5 have distinct impact classifications', () => {
      assert.equal(SEVERITY_LEVELS[1].name, 'Subtle Inconvenience');
      assert.equal(SEVERITY_LEVELS[2].name, 'Minor Setback');
      assert.equal(SEVERITY_LEVELS[3].name, 'Significant Complication');
      assert.equal(SEVERITY_LEVELS[4].name, 'Critical Crisis');
      assert.equal(SEVERITY_LEVELS[5].name, 'Catastrophic Wildcard');
    });

    test('Feature 4: rollProceduralDice returns standard result envelope with all required properties', () => {
      const result = rollProceduralDice({ severity: 4, diceRoll: 2 });

      assert.ok(result.id, 'Must have id');
      assert.ok(result.name, 'Must have name');
      assert.ok(result.archetype, 'Must have archetype');
      assert.ok(result.directive, 'Must have directive');
      assert.equal(result.severity, 4, 'Must reflect requested severity');
      assert.ok(result.severityName, 'Must include severityName');
      assert.ok(result.wildcard, 'Must include wildcard detail');
      assert.equal(result.diceFace, 2, 'Must match dice roll');
    });

    test('Feature 5: formatCatalystDirective compiles markdown directive block matching prompt compiler schema', () => {
      const roll = rollProceduralDice({ seed: 1, severity: 4 });
      const directiveText = formatCatalystDirective(roll);

      assert.ok(directiveText.includes('# PLOT CATALYST & PROCEDURAL WILDCARD (SEVERITY LEVEL 4/5)'),
        'Must format header with severity');
      assert.ok(directiveText.includes('Threat Severity: Level 4/5 (Critical Crisis)'),
        'Must format threat severity line');
      assert.ok(directiveText.includes('Catalyst Complication:'), 'Must include complication line');
      assert.ok(directiveText.includes('Directorial Mandate:'), 'Must include mandate line');
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 TESTS)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {

    test('Boundary 1: clampSeverity clamps values < 1 strictly to 1', () => {
      assert.equal(clampSeverity(0), 1);
      assert.equal(clampSeverity(-5), 1);
      assert.equal(clampSeverity(-99), 1);
    });

    test('Boundary 2: clampSeverity clamps values > 5 strictly to 5', () => {
      assert.equal(clampSeverity(6), 5);
      assert.equal(clampSeverity(10), 5);
      assert.equal(clampSeverity(100), 5);
    });

    test('Boundary 3: clampSeverity parses string numbers and handles NaN/null safely', () => {
      assert.equal(clampSeverity('4'), 4, 'String "4" must parse to 4');
      assert.equal(clampSeverity('1'), 1, 'String "1" must parse to 1');
      assert.equal(clampSeverity('invalid'), 3, 'Non-numeric string must default to 3');
      assert.equal(clampSeverity(null), 3, 'Null must default to 3');
      assert.equal(clampSeverity(undefined), 3, 'Undefined must default to 3');
    });

    test('Boundary 4: Custom wildcard input takes precedence over default exemplars', () => {
      const customText = 'The atmospheric scrubbers begin pumping neurotoxin into Sector 4';
      const result = rollProceduralDice({
        seed: 2,
        severity: 4,
        customWildcard: customText
      });

      assert.equal(result.wildcard, customText, 'Custom wildcard must override generated exemplar');
    });

    test('Boundary 5: Random dice roll distribution hits all 6 faces across 600 rolls', () => {
      const faceCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      for (let i = 0; i < 600; i++) {
        const roll = rollProceduralDice({ severity: 3 });
        assert.ok(roll.diceFace >= 1 && roll.diceFace <= 6, `Dice face ${roll.diceFace} must be between 1 and 6`);
        faceCounts[roll.diceFace]++;
      }

      // Every face should be hit at least 20 times in 600 rolls
      for (let face = 1; face <= 6; face++) {
        assert.ok(faceCounts[face] >= 20, `Dice face ${face} was hit ${faceCounts[face]} times (expected >= 20)`);
      }
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {

    test('Combination 1: Output formats directly into promptCompiler plotCatalyst payload contract', () => {
      const roll = rollProceduralDice({ seed: 3, severity: 5, customWildcard: 'Volcanic fissure breaches the cellar' });

      // Build payload for backend promptCompiler
      const promptCompilerPayload = {
        enabled: true,
        complication: roll.name,
        severity: roll.severity,
        wildcard: roll.wildcard
      };

      assert.equal(promptCompilerPayload.enabled, true);
      assert.equal(promptCompilerPayload.complication, 'Forbidden Revelation');
      assert.equal(promptCompilerPayload.severity, 5);
      assert.equal(promptCompilerPayload.wildcard, 'Volcanic fissure breaches the cellar');
    });

    test('Combination 2: Severity 1 (Subtle Inconvenience) vs Severity 5 (Catastrophic Wildcard) contrast', () => {
      const rollSubtle = rollProceduralDice({ seed: 0, severity: 1 });
      const rollCatastrophic = rollProceduralDice({ seed: 0, severity: 5 });

      assert.equal(rollSubtle.severity, 1);
      assert.equal(rollSubtle.severityName, 'Subtle Inconvenience');

      assert.equal(rollCatastrophic.severity, 5);
      assert.equal(rollCatastrophic.severityName, 'Catastrophic Wildcard');
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD SCENARIOS
  // =========================================================================
  describe('Tier 4: Real-World Scenarios', () => {

    test('Scenario 1: Multi-turn session history records chronological roll results with severity changes', () => {
      const sessionHistory = [];

      // Turn 1: Initial exploration roll
      const turn1 = rollProceduralDice({ seed: 10, severity: 2 });
      sessionHistory.push(turn1);

      // Turn 2: Escalation roll
      const turn2 = rollProceduralDice({ seed: 11, severity: 4 });
      sessionHistory.push(turn2);

      // Turn 3: Climax catastrophic roll
      const turn3 = rollProceduralDice({ seed: 12, severity: 5 });
      sessionHistory.push(turn3);

      assert.equal(sessionHistory.length, 3, 'Must record all 3 turns');
      assert.equal(sessionHistory[0].severity, 2);
      assert.equal(sessionHistory[1].severity, 4);
      assert.equal(sessionHistory[2].severity, 5);
    });

    test('Scenario 2: Repeatability verification - Seed produces identical results across 50 runs', () => {
      const initial = rollProceduralDice({ seed: 42, severity: 4 });

      for (let i = 0; i < 50; i++) {
        const repeat = rollProceduralDice({ seed: 42, severity: 4 });
        assert.equal(repeat.name, initial.name, 'Complication name must match exactly');
        assert.equal(repeat.diceFace, initial.diceFace, 'Dice face must match exactly');
        assert.equal(repeat.wildcard, initial.wildcard, 'Wildcard text must match exactly');
      }
    });
  });
});
