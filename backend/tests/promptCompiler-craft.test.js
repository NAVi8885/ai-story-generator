import assert from 'node:assert';
import {
  compileNarrativePayload,
  POV_DIRECTIVES,
  TENSE_DIRECTIVES,
  DIALOGUE_RATIO_DIRECTIVES,
  PROSE_STYLIST_DIRECTIVES,
  CONFLICT_DIRECTIVES,
  STAKES_DIRECTIVES,
  ENDING_TURN_DIRECTIVES,
  SENSORY_ANCHOR_DIRECTIVES,
  ATMOSPHERE_DIRECTIVES,
  PROTAGONIST_STATE_DIRECTIVES,
  UNRELIABLE_NARRATOR_DIRECTIVES,
  MORAL_ALIGNMENT_DIRECTIVES,
  MASTER_STYLE_PRESETS,
  getVisceralDirective
} from '../lib/promptCompiler.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n--- SUITE: Master Narrative Craft Compiler Verification ---');

test('Compiles default craft parameters seamlessly', () => {
  const result = compileNarrativePayload({
    prompt: 'A wanderer enters an ancient ruin.'
  });

  assert.ok(result.systemPrompt.includes('# NARRATIVE PERSPECTIVE & VOICE'));
  assert.ok(result.systemPrompt.includes('# PLOT ARCHITECTURE & DRAMATIC ENGINE'));
  assert.ok(result.systemPrompt.includes('# SENSORY PALETTE & ATMOSPHERE'));
  assert.ok(result.systemPrompt.includes('# CHARACTER PSYCHOLOGY & PERCEPTUAL FILTER'));
  assert.strictEqual(result.meta.pov, 'third_limited');
  assert.strictEqual(result.meta.tense, 'past');
  assert.strictEqual(result.meta.conflictType, 'person_vs_person');
  assert.strictEqual(result.meta.sensoryAnchor, 'tactile');
});

test('Enforces 1st person POV with negative constraints & exemplar', () => {
  const result = compileNarrativePayload({
    prompt: 'I reach the abandoned station.',
    sliders: { pov: 'first' }
  });

  assert.ok(result.systemPrompt.includes('NARRATIVE POV: First-Person ("I" / "me")'));
  assert.ok(result.systemPrompt.includes('CRITICAL NEGATIVE CONSTRAINT: NEVER switch to third-person omniscient'));
  assert.ok(result.systemPrompt.includes('Exemplar:'));
  assert.strictEqual(result.meta.pov, 'first');
});

test('Enforces immediate present tense with anti-drift negative constraint', () => {
  const result = compileNarrativePayload({
    prompt: 'The sirens howl.',
    sliders: { tense: 'present' }
  });

  assert.ok(result.systemPrompt.includes('NARRATIVE TENSE: Immediate Present Tense'));
  assert.ok(result.systemPrompt.includes('CRITICAL NEGATIVE CONSTRAINT: Zero past-tense slippage in narrative action beats'));
  assert.strictEqual(result.meta.tense, 'present');
});

test('Injects Unreliable Narrator directive when enabled', () => {
  const resultOff = compileNarrativePayload({
    prompt: 'A detective investigates.',
    sliders: { unreliableNarrator: 'off' }
  });
  assert.strictEqual(resultOff.systemPrompt.includes('UNRELIABLE NARRATOR'), false);

  const resultBias = compileNarrativePayload({
    prompt: 'A detective investigates.',
    sliders: { unreliableNarrator: 'subtle_bias' }
  });
  assert.ok(resultBias.systemPrompt.includes('UNRELIABLE NARRATOR (Subtle Cognitive Bias)'));

  const resultDistort = compileNarrativePayload({
    prompt: 'A detective investigates.',
    sliders: { unreliableNarrator: 'deep_distortion' }
  });
  assert.ok(resultDistort.systemPrompt.includes('UNRELIABLE NARRATOR (Deep Distortion)'));
});

test('Harmonizes cross-dial contradiction: Unreliable Narrator + 3rd Omniscient', () => {
  const result = compileNarrativePayload({
    prompt: 'Test prompt',
    sliders: { pov: 'third_omniscient', unreliableNarrator: 'subtle_bias' }
  });

  assert.ok(result.systemPrompt.includes('# CONSTRAINTS HARMONIZATION'));
  assert.ok(result.systemPrompt.includes('The unreliable perspective filter takes precedence'));
});

test('Harmonizes cross-dial contradiction: Dialogue Heavy + Slow-Burn Pacing', () => {
  const result = compileNarrativePayload({
    prompt: 'Test prompt',
    sliders: { dialogueRatio: 'dialogue_heavy', pacing: 'slow-burn' }
  });

  assert.ok(result.systemPrompt.includes('Alternate sharp spoken exchanges with heavy, pregnant pauses'));
});

test('Harmonizes cross-dial contradiction: High Visceral Intensity + Whimsical Tone', () => {
  const result = compileNarrativePayload({
    prompt: 'Test prompt',
    sliders: { tone: 'whimsical', visceralIntensity: 5 }
  });

  assert.ok(result.systemPrompt.includes('Channel high intensity into kinetic physical stakes'));
});

test('Injects Structured Pre-Flight Architecture Checklist into <thinking> directive', () => {
  const result = compileNarrativePayload({
    prompt: 'An alchemist prepares a distillation.',
    sliders: {
      thinkingDepth: 'deep',
      pov: 'first',
      tense: 'present',
      conflictType: 'person_vs_self',
      sensoryAnchor: 'olfactory',
      environmentalMood: 'decadent_opulent',
      visceralIntensity: 4,
      protagonistState: 'paranoid',
      unreliableNarrator: 'subtle_bias',
      proseStylist: 'baroque'
    }
  });

  assert.ok(result.systemPrompt.includes('[NARRATIVE PRE-FLIGHT ARCHITECTURE]'));
  assert.ok(result.systemPrompt.includes('• Lens: first | Tense: present | Stylist: baroque'));
  assert.ok(result.systemPrompt.includes('• Dramaturgy: person_vs_self | Stakes: personal'));
  assert.ok(result.systemPrompt.includes('• World Palette: Anchor: olfactory | Mood: decadent_opulent | Grit: 4/5'));
  assert.ok(result.systemPrompt.includes('• Psychology: State: paranoid | Unreliable: subtle_bias'));
});

test('Master Style Presets are well-formed and compile without errors', () => {
  assert.strictEqual(MASTER_STYLE_PRESETS.length >= 5, true);

  for (const preset of MASTER_STYLE_PRESETS) {
    assert.ok(preset.id);
    assert.ok(preset.name);
    assert.ok(preset.genre);
    assert.ok(preset.sliders);

    const compiled = compileNarrativePayload({
      prompt: 'A dramatic opening scene.',
      genre: preset.genre,
      sliders: preset.sliders
    });

    assert.ok(compiled.systemPrompt.length > 500);
    assert.strictEqual(compiled.meta.pov, preset.sliders.pov);
    assert.strictEqual(compiled.meta.tense, preset.sliders.tense);
  }
});

console.log(`\nTOTAL CRAFT TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}\n`);
if (failed > 0) process.exit(1);

