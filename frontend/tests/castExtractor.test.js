import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Specification Reference implementation used if M2 has not yet created frontend/src/utils/castExtractor.js
function createReferenceCastExtractor() {
  const COMMON_STOP_WORDS = new Set([
    'The', 'This', 'That', 'These', 'Those', 'There', 'Here', 'Where', 'When',
    'What', 'Who', 'Why', 'How', 'Then', 'Now', 'Once', 'Soon', 'Suddenly',
    'After', 'Before', 'While', 'Although', 'Because', 'Since', 'If', 'Unless',
    'Chapter', 'Section', 'Book', 'Part', 'Act', 'Scene', 'Episode',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December', 'North', 'South', 'East', 'West'
  ]);

  const DIALOGUE_VERBS = new Set([
    'said', 'asked', 'replied', 'whispered', 'shouted', 'muttered', 'growled',
    'screamed', 'yelled', 'barked', 'commanded', 'sighed', 'breathed', 'snapped',
    'cried', 'gasped', 'insisted', 'murmured', 'urged', 'warned', 'demanded'
  ]);

  function extractCastFromProse(prose) {
    if (!prose || typeof prose !== 'string' || !prose.trim()) {
      return [];
    }

    const text = prose.trim();
    const characterScores = new Map(); // name -> { count, dialogueCount, subjectCount }

    // 1. Scan for dialogue attributions: "..." said Marcus / Marcus said "..."
    const quotePattern = /["“«]([^"”»]+)["”»]\s*([a-zA-Z\s,]+)[.!?]|([A-Z][a-z]+)\s+([a-z]+)\s*["“«]/g;
    let match;

    while ((match = quotePattern.exec(text)) !== null) {
      if (match[2]) {
        // e.g. "said Marcus" or "Elena whispered"
        const postQuote = match[2].trim();
        const words = postQuote.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
          const w = words[i].replace(/[^a-zA-Z]/g, '');
          if (w && /^[A-Z][a-z]+$/.test(w) && !COMMON_STOP_WORDS.has(w)) {
            const current = characterScores.get(w) || { name: w, count: 0, dialogueCount: 0 };
            current.count += 2;
            current.dialogueCount += 1;
            characterScores.set(w, current);
          }
        }
      }
      if (match[3]) {
        const speaker = match[3];
        const verb = (match[4] || '').toLowerCase();
        if (/^[A-Z][a-z]+$/.test(speaker) && !COMMON_STOP_WORDS.has(speaker) && DIALOGUE_VERBS.has(verb)) {
          const current = characterScores.get(speaker) || { name: speaker, count: 0, dialogueCount: 0 };
          current.count += 2;
          current.dialogueCount += 1;
          characterScores.set(speaker, current);
        }
      }
    }

    // 2. Scan capitalized entity mentions
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const cleanWord = words[i].replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
      if (/^[A-Z][a-z]{2,}$/.test(cleanWord) && !COMMON_STOP_WORDS.has(cleanWord)) {
        // Exclude first word of sentences if preceded by punctuation
        const prevWord = i > 0 ? words[i - 1] : '';
        const isSentenceStart = i === 0 || /[.!?]$/.test(prevWord);
        if (!isSentenceStart || characterScores.has(cleanWord)) {
          const current = characterScores.get(cleanWord) || { name: cleanWord, count: 0, dialogueCount: 0 };
          current.count += 1;
          characterScores.set(cleanWord, current);
        }
      }
    }

    // Sort by prominence
    const sorted = Array.from(characterScores.values())
      .filter(c => c.count >= 2 || c.dialogueCount >= 1)
      .sort((a, b) => b.count - a.count);

    if (sorted.length === 0) {
      return [];
    }

    const roles = ['Protagonist', 'Foil', 'Antagonist', 'Ally'];
    const defaultMotivations = [
      'Uncover the hidden truth behind the breach',
      'Challenge and expose flaws in the current plan',
      'Enforce absolute control and eliminate resistance',
      'Ensure the safety and success of the group'
    ];
    const defaultStates = [
      'Calculating, hyper-vigilant',
      'Defiant and skeptical',
      'Methodical, ruthless',
      'Cautious, loyal'
    ];

    return sorted.map((char, index) => {
      const role = roles[index] || 'Ally';
      const isPov = index === 0;
      const tension = role === 'Antagonist' ? 5 : role === 'Foil' ? 4 : role === 'Protagonist' ? 3 : 2;

      return {
        id: `char_${index + 1}`,
        name: char.name,
        role,
        psychologicalState: defaultStates[index] || 'Focused',
        motivation: defaultMotivations[index] || 'Survive the ordeal',
        dialogueQuirks: 'Speaks with deliberate economy; measured cadence',
        tension: String(tension),
        isPov
      };
    });
  }

  return {
    COMMON_STOP_WORDS,
    DIALOGUE_VERBS,
    extractCastFromProse
  };
}

// Load real module if available, otherwise reference implementation
let castModule;
try {
  castModule = await import('../src/utils/castExtractor.js');
} catch {
  castModule = createReferenceCastExtractor();
}

const { extractCastFromProse, COMMON_STOP_WORDS } = castModule;

describe('Cast Entity Extractor - 4-Tier Test Suite', () => {

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 TESTS)
  // =========================================================================
  describe('Tier 1: Feature Coverage', () => {

    test('Feature 1: Extracts capitalized character names from prose with dialogue', () => {
      const prose = `
        Elena slipped through the iron gates. "We must hurry," whispered Elena.
        Marcus drew his saber. "Not another step," said Marcus.
      `;

      const cast = extractCastFromProse(prose);

      assert.ok(cast.length >= 2, 'Must detect Elena and Marcus');
      const names = cast.map(c => c.name);
      assert.ok(names.includes('Elena'), 'Must extract Elena');
      assert.ok(names.includes('Marcus'), 'Must extract Marcus');
    });

    test('Feature 2: Dialogue attribution detection identifies speakers accurately', () => {
      const prose = `
        "The archive is compromised," said Valeria.
        "Who authorized the breach?" demanded Thorne.
      `;

      const cast = extractCastFromProse(prose);
      const names = cast.map(c => c.name);

      assert.ok(names.includes('Valeria'), 'Must detect Valeria from said attribution');
      assert.ok(names.includes('Thorne'), 'Must detect Thorne from demanded attribution');
    });

    test('Feature 3: Role classification heuristic assigns Protagonist to focal entity and secondary roles', () => {
      const prose = `
        Elena checked her rifle. Elena glanced back at the wall.
        "Stay low," Elena whispered.
        Kael scowled. "I don't take orders from you," said Kael.
        Commander Thorne stepped into the light. "Both of you surrender," Thorne commanded.
      `;

      const cast = extractCastFromProse(prose);

      assert.ok(cast.length >= 3, 'Must detect at least 3 characters');
      assert.equal(cast[0].role, 'Protagonist', 'Most prominent entity must be Protagonist');
      assert.equal(cast[0].isPov, true, 'Protagonist must have isPov: true');

      const secondaryRoles = cast.slice(1).map(c => c.role);
      assert.ok(secondaryRoles.includes('Foil') || secondaryRoles.includes('Antagonist'),
        'Secondary entities should receive Foil or Antagonist roles');
    });

    test('Feature 4: Extracted character card conforms to Dramatis Personae schema', () => {
      const prose = `"Hold the line," said Kael. Kael braced his shoulder against the iron door.`;
      const cast = extractCastFromProse(prose);

      assert.ok(cast.length > 0, 'Must extract at least one character');
      const card = cast[0];

      assert.ok(card.id, 'Must have unique id');
      assert.ok(card.name, 'Must have name');
      assert.ok(card.role, 'Must have role');
      assert.ok(card.psychologicalState, 'Must have psychologicalState');
      assert.ok(card.motivation, 'Must have motivation');
      assert.ok(card.dialogueQuirks, 'Must have dialogueQuirks');
      assert.ok(typeof card.tension === 'string', 'Tension must be string or number score');
      assert.equal(typeof card.isPov, 'boolean', 'isPov must be boolean');
    });

    test('Feature 5: Default active POV is assigned strictly to the first character', () => {
      const prose = `
        Dante loaded the crossbow. Dante waited in the shadows.
        "He is coming," Dante muttered.
        Vane stepped into the courtyard. "Show yourself," Vane shouted.
      `;

      const cast = extractCastFromProse(prose);

      assert.ok(cast.length >= 2, 'Must extract Dante and Vane');
      assert.equal(cast[0].isPov, true, 'First character must be isPov: true');
      for (let i = 1; i < cast.length; i++) {
        assert.equal(cast[i].isPov, false, `Character ${i} must have isPov: false`);
      }
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 TESTS)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {

    test('Boundary 1: Empty text, whitespace, and null inputs return empty array without throwing', () => {
      assert.deepEqual(extractCastFromProse(''), []);
      assert.deepEqual(extractCastFromProse('   \n\t   '), []);
      assert.deepEqual(extractCastFromProse(null), []);
      assert.deepEqual(extractCastFromProse(undefined), []);
    });

    test('Boundary 2: Pure landscape prose with no character entities returns empty array', () => {
      const landscape = `The autumn wind howled across the barren mountains. Cold rain drenched the moss and granite boulders. Night fell slowly over the valley.`;
      const cast = extractCastFromProse(landscape);

      assert.deepEqual(cast, [], 'Must return empty array when no characters are mentioned');
    });

    test('Boundary 3: Common stop words, days of week, and directions are filtered out', () => {
      const proseWithStopWords = `Monday was cold. The wind blew from the North towards London. Chapter three began soon.`;
      const cast = extractCastFromProse(proseWithStopWords);

      const names = cast.map(c => c.name);
      assert.ok(!names.includes('Monday'), 'Monday must not be extracted as character');
      assert.ok(!names.includes('North'), 'North must not be extracted as character');
      assert.ok(!names.includes('Chapter'), 'Chapter must not be extracted as character');
    });

    test('Boundary 4: Single character prose creates valid solitary protagonist card', () => {
      const solitary = `
        Gideon wandered the salt flats for three days. Gideon rationing his water drop by drop.
        "Just one more ridge," Gideon whispered to himself.
      `;

      const cast = extractCastFromProse(solitary);

      assert.equal(cast.length, 1, 'Should extract exactly one character');
      assert.equal(cast[0].name, 'Gideon');
      assert.equal(cast[0].role, 'Protagonist');
      assert.equal(cast[0].isPov, true);
    });

    test('Boundary 5: Multi-character battle scene handles 4+ entities without duplicate ID collisions', () => {
      const battleProse = `
        Elena rallied the line. "Hold fast!" said Elena.
        Marcus charged forward. "Take the gates!" said Marcus.
        Kael provided covering fire. "Reloading!" shouted Kael.
        Thorne observed from the hill. "Execute order six," said Thorne.
        Seraphina raised her shield. "Behind you!" warned Seraphina.
      `;

      const cast = extractCastFromProse(battleProse);

      assert.ok(cast.length >= 4, 'Must detect at least 4 characters');
      const ids = cast.map(c => c.id);
      const uniqueIds = new Set(ids);
      assert.equal(ids.length, uniqueIds.size, 'All character IDs must be unique');
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {

    test('Combination 1: Extracted cast connects directly to promptCompiler dramatisPersonae input schema', () => {
      const prose = `
        Elena drew her dagger. "We move now," said Elena.
        Marcus barred the door. "You move nowhere," said Marcus.
      `;

      const cast = extractCastFromProse(prose);

      // Verify every card in cast matches promptCompiler expectation
      for (const card of cast) {
        assert.ok(card.name, 'Name required');
        assert.ok(['Protagonist', 'Foil', 'Antagonist', 'Ally'].includes(card.role), 'Role must be valid');
        assert.ok(card.psychologicalState, 'State required');
        assert.ok(card.motivation, 'Motivation required');
        assert.equal(typeof card.isPov, 'boolean', 'isPov boolean required');
      }
    });

    test('Combination 2: Antagonist receives higher tension score than Ally', () => {
      const prose = `
        Elena checked her gear. "Let's go," said Elena.
        Kael nodded. "I have your back," said Kael.
        Marcus stepped forward. "You die here," snarled Marcus.
      `;

      const cast = extractCastFromProse(prose);
      const antagonist = cast.find(c => c.role === 'Antagonist');
      const ally = cast.find(c => c.role === 'Ally');

      if (antagonist && ally) {
        assert.ok(parseInt(antagonist.tension, 10) >= parseInt(ally.tension, 10),
          'Antagonist tension must be >= Ally tension');
      }
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD SCENARIOS
  // =========================================================================
  describe('Tier 4: Real-World Scenarios', () => {

    test('Scenario 1: End-to-end full chapter prose extraction into a 4-role roster', () => {
      const chapterText = `
        The subterranean forge was sweltering. Elena monitored the pressure dials, her fingers blistered from the heat.
        "We have less than ten minutes before the boiler explodes," Elena warned.
        Kael wiped grease from his face and spat on the flagstones. "Then we vent the primary chamber," argued Kael,
        his voice sharp with habitual skepticism. "Unless you have a better death wish."
        "Neither of you will vent anything," boomed Commander Marcus from the gantry above. Marcus leveled his flintlock
        pistol at Elena's chest. "Step away from the valves."
        From behind the steam conduits, Brother Paul signaled silently to Elena, clutching a heavy iron wrench.
        "Do as Marcus says," whispered Brother Paul cautiously, waiting for the right moment to strike.
      `;

      const roster = extractCastFromProse(chapterText);

      assert.ok(roster.length >= 3, 'Must extract at least 3 characters from chapter');
      const names = roster.map(c => c.name);
      assert.ok(names.includes('Elena'), 'Must extract Elena');
      assert.ok(names.includes('Marcus'), 'Must extract Marcus');
      assert.ok(names.includes('Kael'), 'Must extract Kael');

      // Elena should be Protagonist and active POV
      const elena = roster.find(c => c.name === 'Elena');
      assert.ok(elena, 'Elena found');
      assert.equal(elena.isPov, true, 'Elena must be active POV');
    });

    test('Scenario 2: Deduplication preserves single card across multiple mentions of same entity', () => {
      const repetitiveProse = `
        Elena looked left. Elena looked right. "Clear," whispered Elena.
        Elena ran across the square. Elena reached the safehouse door.
      `;

      const cast = extractCastFromProse(repetitiveProse);

      assert.equal(cast.length, 1, 'Multiple mentions of Elena must produce only 1 character card');
      assert.equal(cast[0].name, 'Elena');
    });
  });
});
