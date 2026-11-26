import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  IMAGE_STYLE_PRESETS,
  buildEnhancedPrompt,
  generateFallbackDataUrl,
  generateArtwork,
  extractVisualPrompt
} from '../lib/imageService.js';

describe('Scene Illustrator & Image Generation Service - 4-Tier Test Suite', () => {

  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 TESTS)
  // =========================================================================
  describe('Tier 1: Feature Coverage', () => {

    test('Feature 1: All 5 core art style presets are defined with required attributes', () => {
      const requiredPresets = [
        'dark_fantasy_oil',
        'cyberpunk_matte',
        'graphic_novel_ink',
        'cinematic_35mm',
        'retro_pulp_scifi'
      ];

      for (const presetKey of requiredPresets) {
        const preset = IMAGE_STYLE_PRESETS[presetKey];
        assert.ok(preset, `Preset ${presetKey} must exist in IMAGE_STYLE_PRESETS`);
        assert.equal(preset.id, presetKey, `Preset ID must match ${presetKey}`);
        assert.ok(typeof preset.name === 'string' && preset.name.length > 0, `${presetKey} must have a name`);
        assert.ok(typeof preset.promptModifier === 'string' && preset.promptModifier.length > 20,
          `${presetKey} must have a descriptive promptModifier`);
        assert.ok(typeof preset.negativePrompt === 'string' && preset.negativePrompt.length > 10,
          `${presetKey} must define negative prompt constraints`);
      }
    });

    test('Feature 2: buildEnhancedPrompt appends distinct style directives for each preset', () => {
      const basePrompt = 'A solitary knight standing before a crumbling fortress';

      // 1. Dark Fantasy Oil
      const darkFantasy = buildEnhancedPrompt(basePrompt, 'dark_fantasy_oil');
      assert.ok(darkFantasy.startsWith(basePrompt), 'Must retain base prompt');
      assert.ok(darkFantasy.includes('oil painting'), 'Must include oil painting medium');
      assert.ok(darkFantasy.includes('chiaroscuro'), 'Must include chiaroscuro lighting');

      // 2. Cyberpunk Matte
      const cyberpunk = buildEnhancedPrompt(basePrompt, 'cyberpunk_matte');
      assert.ok(cyberpunk.includes('Cyberpunk matte painting'), 'Must include cyberpunk matte');
      assert.ok(cyberpunk.includes('neon-lit'), 'Must include neon lighting');

      // 3. Graphic Novel Ink
      const graphicNovel = buildEnhancedPrompt(basePrompt, 'graphic_novel_ink');
      assert.ok(graphicNovel.includes('Graphic novel ink illustration'), 'Must include graphic novel ink');
      assert.ok(graphicNovel.includes('crosshatching'), 'Must include comic crosshatching');

      // 4. Cinematic 35mm
      const cinematic = buildEnhancedPrompt(basePrompt, 'cinematic_35mm');
      assert.ok(cinematic.includes('Cinematic 35mm film still'), 'Must include 35mm still');
      assert.ok(cinematic.includes('Kodak film grain'), 'Must include film grain');

      // 5. Retro Pulp Sci-Fi
      const retroPulp = buildEnhancedPrompt(basePrompt, 'retro_pulp_scifi');
      assert.ok(retroPulp.includes('Retro pulp sci-fi magazine cover'), 'Must include pulp magazine cover');
      assert.ok(retroPulp.includes('Astounding Stories'), 'Must include vintage aesthetic anchor');
    });

    test('Feature 3: generateFallbackDataUrl generates valid, decodable SVG data URI', () => {
      const prompt = 'Obsidian citadel beneath two moons';
      const style = 'Dark Fantasy';
      const dataUrl = generateFallbackDataUrl(prompt, style, 800, 600);

      assert.ok(dataUrl.startsWith('data:image/svg+xml;base64,'), 'Must return SVG base64 data URI');
      const base64Content = dataUrl.replace('data:image/svg+xml;base64,', '');
      const decodedSvg = Buffer.from(base64Content, 'base64').toString('utf8');

      assert.ok(decodedSvg.includes('<svg'), 'Decoded string must be valid SVG');
      assert.ok(decodedSvg.includes('width="800"'), 'Preserves custom width');
      assert.ok(decodedSvg.includes('height="600"'), 'Preserves custom height');
      assert.ok(decodedSvg.includes(style.toUpperCase()), 'Includes uppercase style name');
      assert.ok(decodedSvg.includes('MYTHOS STUDIO'), 'Includes studio watermark');
    });

    test('Feature 4: extractVisualPrompt parses story prose into a coherent visual composition', async () => {
      // Mock fetch to simulate instant SSE text generation response
      globalThis.fetch = async (url) => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('A grand gothic cathedral with shattered glass and dramatic amber shadows.'));
            controller.close();
          }
        });
        return {
          ok: true,
          status: 200,
          body: stream,
          text: async () => 'A grand gothic cathedral with shattered glass and dramatic amber shadows.',
          headers: new Headers({ 'content-type': 'text/plain' })
        };
      };

      const sampleProse = `Kael stepped into the flooded cathedral. Rain poured through the shattered stained-glass dome, illuminating the altar in cold twilight. Shadows danced across the cracked marble as he raised his lantern.`;

      const extracted = await extractVisualPrompt(sampleProse);

      assert.ok(typeof extracted === 'string', 'Extraction must return a string');
      assert.ok(extracted.length > 20, 'Extracted visual prompt must be descriptive');
      assert.ok(extracted.toLowerCase().includes('cathedral'), 'Must identify the cathedral environment');
    });

    test('Feature 5: generateArtwork returns standard response envelope with seeds and dimensions', async () => {
      // Mock fetch for instant successful Pollinations image fetch
      const mockImageBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: async () => mockImageBytes.buffer
      });

      const result = await generateArtwork({
        prompt: 'A mechanical leviathan rising from boiling seas',
        stylePreset: 'cinematic_35mm',
        width: 1024,
        height: 1024,
        seed: 42
      });

      assert.equal(result.success, true, 'Generation result must be success: true');
      assert.equal(result.provider, 'pollinations', 'Provider must be pollinations');
      assert.ok(result.imageUrl.includes('image.pollinations.ai'), 'Must supply direct imageUrl');
      assert.ok(result.dataUrl.startsWith('data:image/jpeg;base64,'), 'Must supply base64 JPEG dataUrl');
      assert.equal(result.stylePreset, 'cinematic_35mm', 'Preset must match requested');
      assert.equal(result.seed, 42, 'Seed must match requested seed');
      assert.equal(result.width, 1024, 'Width must match');
      assert.equal(result.height, 1024, 'Height must match');
      assert.ok(result.enhancedPrompt.includes('Cinematic 35mm film still'), 'Prompt must be enhanced');
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 TESTS)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {

    test('Boundary 1: Empty or whitespace prompt in buildEnhancedPrompt falls back to style modifier without syntax errors', () => {
      const emptyResult = buildEnhancedPrompt('', 'cyberpunk_matte');
      assert.ok(!emptyResult.startsWith(','), 'Must not start with an orphaned comma');
      assert.ok(emptyResult.includes('Cyberpunk matte painting'), 'Must supply style modifier');

      const whitespaceResult = buildEnhancedPrompt('   \n\t   ', 'dark_fantasy_oil');
      assert.ok(!whitespaceResult.startsWith(','), 'Must not start with comma on whitespace input');
      assert.ok(whitespaceResult.includes('Dark fantasy oil painting'), 'Must return clean modifier');
    });

    test('Boundary 2: Null/undefined inputs in extractVisualPrompt fall back to safe evocative default', async () => {
      globalThis.fetch = () => Promise.reject(new Error('Offline'));

      const fromNull = await extractVisualPrompt(null);
      assert.ok(typeof fromNull === 'string' && fromNull.length > 20, 'Null prose must return default prompt');

      const fromEmpty = await extractVisualPrompt('');
      assert.ok(typeof fromEmpty === 'string' && fromEmpty.length > 20, 'Empty prose must return default prompt');
    });

    test('Boundary 3: Unrecognized stylePreset falls back safely to dark_fantasy_oil', () => {
      const fallbackResult = buildEnhancedPrompt('A stone bridge', 'non_existent_preset_xyz');
      assert.ok(fallbackResult.includes('Dark fantasy oil painting'), 'Unknown preset must fallback to default preset');
    });

    test('Boundary 4: Seed normalization handles floats, negative numbers, and non-numeric values', async () => {
      // Mock fetch failure to trigger local fallback generator without remote latency
      globalThis.fetch = () => Promise.reject(new Error('Network failure'));

      // Float seed
      const floatRes = await generateArtwork({
        prompt: 'A solitary watchtower',
        seed: 1234.89
      });
      assert.equal(floatRes.seed, 1234, 'Float seed must be floored to integer');

      // Negative seed
      const negRes = await generateArtwork({
        prompt: 'A solitary watchtower',
        seed: -999
      });
      assert.equal(negRes.seed, 999, 'Negative seed must be normalized to absolute positive integer');

      // Non-numeric seed
      const strRes = await generateArtwork({
        prompt: 'A solitary watchtower',
        seed: 'invalid_seed'
      });
      assert.ok(typeof strRes.seed === 'number' && strRes.seed >= 0, 'Invalid seed must generate random positive number');
    });

    test('Boundary 5: Fallback SVG sanitizes XML special characters in user prompts', () => {
      const dangerousPrompt = 'Hero <script>alert("xss")</script> & "Dangerous" Tags';
      const dataUrl = generateFallbackDataUrl(dangerousPrompt, 'Artwork');
      const decodedSvg = Buffer.from(dataUrl.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf8');

      assert.ok(!decodedSvg.includes('<script>'), 'Must strip or escape <script> tag');
      assert.ok(!decodedSvg.includes('alert("xss")'), 'Must not contain unescaped quotation script');
    });

    test('Boundary 6: Upstream HTTP error triggers graceful fallback to local dataUrl generator', async () => {
      // Upstream returns 503 Service Unavailable
      globalThis.fetch = async () => ({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      });

      const result = await generateArtwork({
        prompt: 'Gothic spire in electrical storm',
        stylePreset: 'dark_fantasy_oil',
        seed: 777
      });

      assert.equal(result.success, true, 'Result must succeed via fallback');
      assert.equal(result.provider, 'fallback', 'Provider must report fallback');
      assert.ok(result.dataUrl.startsWith('data:image/svg+xml;base64,'), 'DataUrl must contain SVG fallback');
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {

    test('Combination 1: Full pipeline - extract visual prompt from prose and enhance with Cyberpunk Matte preset', async () => {
      globalThis.fetch = async () => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Detective Chen reloads his sidearm inside a hovercar in Neo-Kyoto.'));
            controller.close();
          }
        });
        return {
          ok: true,
          status: 200,
          body: stream,
          text: async () => 'Detective Chen reloads his sidearm inside a hovercar in Neo-Kyoto.',
          headers: new Headers({ 'content-type': 'text/plain' })
        };
      };

      const atmosphericProse = `The hovercar drifted through the dense smog between skyscrapers in Neo-Kyoto. Neon rain streaked across the windshield as holographic advertisements flickered through the gloom. Detective Chen reloaded his sidearm in the passenger seat.`;

      const extractedPrompt = await extractVisualPrompt(atmosphericProse);
      assert.ok(extractedPrompt.length > 0, 'Extracted prompt should not be empty');

      const enhancedPrompt = buildEnhancedPrompt(extractedPrompt, 'cyberpunk_matte');
      assert.ok(enhancedPrompt.includes('Cyberpunk matte painting'), 'Enhanced prompt must include cyberpunk modifier');
      assert.ok(enhancedPrompt.includes('neon-lit megacity'), 'Enhanced prompt must include megacity lighting');
    });

    test('Combination 2: Negative prompt directives strictly exclude contrasting genres', () => {
      // Graphic novel ink should ban photorealism
      const graphicPreset = IMAGE_STYLE_PRESETS.graphic_novel_ink;
      assert.ok(graphicPreset.negativePrompt.includes('photorealistic'), 'Graphic novel must exclude photorealism');

      // Cinematic 35mm should ban cartoons and drawings
      const cinematicPreset = IMAGE_STYLE_PRESETS.cinematic_35mm;
      assert.ok(cinematicPreset.negativePrompt.includes('drawing'), 'Cinematic must exclude drawings');
      assert.ok(cinematicPreset.negativePrompt.includes('cartoon'), 'Cinematic must exclude cartoons');

      // Dark fantasy should ban 3d render and digital gloss
      const darkFantasyPreset = IMAGE_STYLE_PRESETS.dark_fantasy_oil;
      assert.ok(darkFantasyPreset.negativePrompt.includes('3d render'), 'Dark fantasy must exclude 3d renders');
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD SCENARIOS
  // =========================================================================
  describe('Tier 4: Real-World Scenarios', () => {

    test('Scenario 1: End-to-end artwork generation simulation across all 5 styles with complete schema verification', async () => {
      // Mock fetch returning valid JPEG bytes
      const mockImageBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: async () => mockImageBytes.buffer
      });

      const styles = [
        'dark_fantasy_oil',
        'cyberpunk_matte',
        'graphic_novel_ink',
        'cinematic_35mm',
        'retro_pulp_scifi'
      ];

      for (let i = 0; i < styles.length; i++) {
        const style = styles[i];
        const result = await generateArtwork({
          prompt: `Epic battle scene ${i + 1}`,
          stylePreset: style,
          width: 512,
          height: 512,
          seed: 100 + i
        });

        assert.equal(result.success, true);
        assert.equal(result.provider, 'pollinations');
        assert.equal(result.stylePreset, style);
        assert.equal(result.seed, 100 + i);
        assert.ok(result.dataUrl.startsWith('data:image/jpeg;base64,'), 'Must provide base64 dataUrl');
        assert.ok(result.imageUrl.includes('image.pollinations.ai'), 'Must provide Pollinations link');
      }
    });

    test('Scenario 2: Fallback SVG base64 roundtrip decode and XML structure validation', () => {
      const prompt = 'The Clockwork Spire against an overcast violet sky';
      const dataUrl = generateFallbackDataUrl(prompt, 'Cinematic 35mm', 1024, 1024);

      const base64 = dataUrl.split(',')[1];
      const svgText = Buffer.from(base64, 'base64').toString('utf8');

      // Structural SVG checks
      assert.ok(svgText.startsWith('<svg'), 'Must open with <svg');
      assert.ok(svgText.endsWith('</svg>'), 'Must close with </svg>');
      assert.ok(svgText.includes('<defs>'), 'Must define gradient definitions');
      assert.ok(svgText.includes('viewBox="0 0 1024 1024"'), 'Must have correct viewBox');
    });
  });
});
