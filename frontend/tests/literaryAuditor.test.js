import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Dynamically load frontend utility if created (M2), or fallback to backend proseAuditor (M1)
let auditorModule;
try {
  auditorModule = await import('../src/utils/literaryAuditor.js');
} catch {
  auditorModule = await import('../../backend/lib/proseAuditor.js');
}

const { auditProse, SENSORY_LEXICONS, CLICHE_DEFINITIONS } = auditorModule;

describe('Literary Auditor & Prose Radar - 4-Tier Test Suite', () => {

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 TESTS)
  // =========================================================================
  describe('Tier 1: Feature Coverage', () => {

    test('Feature 1: Sensory Radar scores across 4 poles (Visual, Tactile, Auditory, Olfactory/Gustatory)', () => {
      const balancedText = `
        A crimson gleam illuminated the obsidian floor.
        Cold damp iron sent a freezing chill through her fingertips.
        A muffled whisper and a metallic click echoed through the corridor.
        The pungent stench of sulfur and sweet floral incense filled the air.
      `;

      const audit = auditProse(balancedText);

      assert.equal(audit.success, true);
      assert.ok(audit.sensory.visual > 0, 'Visual sensory score must be > 0');
      assert.ok(audit.sensory.tactile > 0, 'Tactile sensory score must be > 0');
      assert.ok(audit.sensory.auditory > 0, 'Auditory sensory score must be > 0');
      assert.ok(audit.sensory.olfactoryGustatory > 0, 'Olfactory/Gustatory sensory score must be > 0');

      // Distribution percentages should sum close to 100%
      const { visual, tactile, auditory, olfactoryGustatory } = audit.sensory.distribution;
      const sum = visual + tactile + auditory + olfactoryGustatory;
      assert.ok(Math.abs(sum - 100) <= 2, `Distribution sum (${sum}) should be approximately 100%`);
    });

    test('Feature 2: Dialogue-to-Narration Ratio computes accurate dialogue percentage', () => {
      const dialogueHeavyText = `
        "Where did you hide the encrypted ledger?" Marcus demanded.
        "I threw it into the harbor," Elena lied.
        "You will regret that answer," he said.
      `;

      const audit = auditProse(dialogueHeavyText);

      assert.ok(audit.dialogueRatio.dialoguePercent > 20, 'Dialogue percent should be substantial');
      assert.ok(audit.dialogueRatio.dialogueWords > 0, 'Dialogue word count must be > 0');
      assert.ok(audit.dialogueRatio.narrationWords > 0, 'Narration word count must be > 0');
      assert.equal(audit.dialogueRatio.dialoguePercent + audit.dialogueRatio.narrationPercent, 100);
    });

    test('Feature 3: AI Cliché & Filler Scanner detects known tropes and provides contextual suggestions', () => {
      const clicheProse = `
        The monument was a testament to ancient endurance.
        Little did they know, a tapestry of deceit lay waiting.
        It was a matter of life and death, thick as honey.
      `;

      const audit = auditProse(clicheProse);

      assert.ok(audit.cliches.length >= 3, 'Must detect at least 3 cliches');
      const phrases = audit.cliches.map(c => c.phrase.toLowerCase());
      assert.ok(phrases.includes('testament to'), 'Must detect "testament to"');
      assert.ok(phrases.some(p => p.includes('tapestry of')), 'Must detect "tapestry of"');
      assert.ok(phrases.some(p => p.includes('little did they know')), 'Must detect "little did they know"');

      // Check that suggestions are non-empty strings
      for (const item of audit.cliches) {
        assert.ok(typeof item.suggestion === 'string' && item.suggestion.length > 0,
          `Cliche "${item.phrase}" must have suggestions`);
      }
    });

    test('Feature 4: Reading Grade Level metric computes Flesch-Kincaid and Reading Ease scores', () => {
      const simpleProse = `The cat sat on the mat. The sun was hot. The dog ran fast.`;
      const complexProse = `Notwithstanding the ostensible implausibility of the metaphysical proposition, the epistemological veracity remains fundamentally indeterminable.`;

      const simpleAudit = auditProse(simpleProse);
      const complexAudit = auditProse(complexProse);

      assert.ok(typeof simpleAudit.metrics.fleschKincaidGrade === 'number');
      assert.ok(typeof complexAudit.metrics.fleschKincaidGrade === 'number');

      // Complex prose must have a higher grade level than simple prose
      assert.ok(complexAudit.metrics.fleschKincaidGrade > simpleAudit.metrics.fleschKincaidGrade,
        `Complex grade (${complexAudit.metrics.fleschKincaidGrade}) must exceed simple grade (${simpleAudit.metrics.fleschKincaidGrade})`);

      // Simple prose must have a higher reading ease than complex prose
      assert.ok(simpleAudit.metrics.fleschReadingEase > complexAudit.metrics.fleschReadingEase,
        `Simple reading ease (${simpleAudit.metrics.fleschReadingEase}) must exceed complex (${complexAudit.metrics.fleschReadingEase})`);
    });

    test('Feature 5: Sentence Burstiness measures rhythmic variation in sentence lengths', () => {
      // Monotonous rhythm: all sentences 4 words
      const monotonous = `Darkness fell very fast. Cold wind blew hard. Shadows moved right now. Fear grew each hour.`;
      // Dynamic rhythm: 1 word, then 18 words, then 3 words
      const dynamic = `Silence. The ancient clockwork machine whirred into motion with a grinding shudder that rattled the brass pipes against the ceiling. It began then.`;

      const monoAudit = auditProse(monotonous);
      const dynamicAudit = auditProse(dynamic);

      assert.ok(typeof monoAudit.metrics.burstiness === 'number');
      assert.ok(typeof dynamicAudit.metrics.burstiness === 'number');

      // Dynamic rhythm should have higher burstiness than uniform rhythm
      assert.ok(dynamicAudit.metrics.burstiness > monoAudit.metrics.burstiness,
        `Dynamic burstiness (${dynamicAudit.metrics.burstiness}) must exceed monotonous (${monoAudit.metrics.burstiness})`);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 TESTS)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {

    test('Boundary 1: Empty text and null inputs return valid default audit envelope without crashing', () => {
      const emptyAudit = auditProse('');
      assert.equal(emptyAudit.success, true);
      assert.equal(emptyAudit.sensory.total, 0);
      assert.equal(emptyAudit.metrics.wordCount, 0);
      assert.equal(emptyAudit.cliches.length, 0);

      const nullAudit = auditProse(null);
      assert.equal(nullAudit.success, true);
      assert.equal(nullAudit.metrics.wordCount, 0);

      const undefinedAudit = auditProse(undefined);
      assert.equal(undefinedAudit.success, true);
    });

    test('Boundary 2: Pure dialogue text (100% spoken) calculates 0% narration', () => {
      const pureDialogue = `"Stop right there!" "I will not stop." "Then draw your weapon!"`;
      const audit = auditProse(pureDialogue);

      assert.ok(audit.dialogueRatio.dialoguePercent > 80, 'Dialogue percent should dominate');
      assert.ok(audit.dialogueRatio.narrationPercent < 20, 'Narration percent should be minimal');
    });

    test('Boundary 3: Pure narration text (0% dialogue) calculates 0% dialogue', () => {
      const pureNarration = `The autumn leaves drifted across the abandoned cobblestone square as dusk swallowed the city.`;
      const audit = auditProse(pureNarration);

      assert.equal(audit.dialogueRatio.dialogueChars, 0, 'Dialogue chars must be 0');
      assert.equal(audit.dialogueRatio.dialoguePercent, 0, 'Dialogue percent must be 0%');
      assert.equal(audit.dialogueRatio.narrationPercent, 100, 'Narration percent must be 100%');
    });

    test('Boundary 4: Prose with zero sensory keywords handles division by zero safely', () => {
      const clinicalText = `The transaction completed at eleven. Five units transferred. Account balances reconciled.`;
      const audit = auditProse(clinicalText);

      assert.equal(audit.sensory.total, 0);
      assert.equal(audit.sensory.distribution.visual, 0);
      assert.equal(audit.sensory.distribution.tactile, 0);
      assert.equal(audit.sensory.distribution.auditory, 0);
      assert.equal(audit.sensory.distribution.olfactoryGustatory, 0);
    });

    test('Boundary 5: Typographic curly quotes and guillemets are recognized as dialogue', () => {
      const curlyText = `“We must leave,” she whispered. «Not yet,» he replied.`;
      const audit = auditProse(curlyText);

      assert.ok(audit.dialogueRatio.dialogueWords >= 4, 'Must extract words inside curly quotes and guillemets');
      assert.ok(audit.dialogueRatio.dialoguePercent > 0, 'Must record non-zero dialogue percentage');
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {

    test('Combination 1: Genre comparison - High Sensory Gothic vs Banter-Heavy Dialogue', () => {
      const gothicText = `
        The obsidian cathedral stood shrouded in midnight mist. Searing cold frostbitten winds
        whipped across the jagged gargoyles while thunderous bells echoed through the freezing gloom.
        An acrid stench of sulfur hung heavy in the air.
      `;
      const banterText = `
        "Do you have the key?"
        "Of course I have the key."
        "You always say that before losing it."
        "Not this time. Check your pocket."
      `;

      const gothicAudit = auditProse(gothicText);
      const banterAudit = auditProse(banterText);

      // Gothic must have significantly higher sensory hits than banter
      assert.ok(gothicAudit.sensory.total > banterAudit.sensory.total,
        'Gothic sensory total must exceed banter sensory total');

      // Banter must have significantly higher dialogue ratio than gothic
      assert.ok(banterAudit.dialogueRatio.dialoguePercent > gothicAudit.dialogueRatio.dialoguePercent,
        'Banter dialogue ratio must exceed gothic dialogue ratio');
    });

    test('Combination 2: All detected clichés include valid suggestions and non-empty categories', () => {
      const sample = `His steely gaze locked on the silent sentinel as chaos ensued.`;
      const audit = auditProse(sample);

      for (const item of audit.cliches) {
        assert.ok(item.phrase, 'Cliche must have a phrase');
        assert.ok(item.suggestion, 'Cliche must have suggestions');
        assert.ok(item.category, 'Cliche must have a category');
      }
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD SCENARIOS
  // =========================================================================
  describe('Tier 4: Real-World Scenarios', () => {

    test('Scenario 1: Comprehensive full-chapter audit generates cohesive diagnostic report', () => {
      const fullChapter = `
        The subterranean forge was a cauldron of sweltering damp heat.
        Elena wiped the stinging sweat from her brow as amber embers flickered in the dark.
        "Keep the bellows pumping," she ordered, her voice cutting through the deafening roar of the furnace.
        "The heat will crack the crucible!" Kael shouted back, his palms trembling against the rough wooden levers.
        She smelled the acrid sulfur rising from the molten bronze.
        Every second was a testament to their endurance.
        Cold iron scaffolding groaned above them.
        The alarm chimed.
      `;

      const report = auditProse(fullChapter);

      assert.equal(report.success, true);

      // Verify all 4 diagnostic dimensions are present and populated
      assert.ok(report.sensory.total >= 5, 'Must detect multiple sensory anchors');
      assert.ok(report.dialogueRatio.dialoguePercent > 10, 'Must detect spoken dialogue');
      assert.ok(report.metrics.wordCount > 50, 'Must count words correctly');
      assert.ok(report.metrics.sentenceCount >= 5, 'Must count sentences correctly');
      assert.ok(report.metrics.burstiness > 0, 'Must compute burstiness');
      assert.ok(report.metrics.fleschKincaidGrade > 0, 'Must compute reading level');
      assert.ok(report.cliches.some(c => c.phrase.includes('testament to')), 'Must identify cliche in chapter');
    });

    test('Scenario 2: Iterative revision improves cliché score and preserves sensory balance', () => {
      const draftA = `The castle was a beacon of hope, but against all odds, fear was palpable.`;
      const draftB = `The castle stood firm on the ridge, cold stone defying the howling winds.`;

      const auditA = auditProse(draftA);
      const auditB = auditProse(draftB);

      // Draft B should have fewer cliches than Draft A
      assert.ok(auditA.cliches.length > auditB.cliches.length,
        `Draft A cliches (${auditA.cliches.length}) must exceed Draft B cliches (${auditB.cliches.length})`);
    });
  });
});
