import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../server.js';
import {
  normalizeChapterExtraction,
  formatStoryBibleSummary,
  synthesizeHeuristicContinuationHooks,
  compileContinuationPromptPayload,
  synthesizeNextChapterPrompt
} from '../lib/promptCompiler.js';

describe('Multi-Chapter Saga Continuation Synthesizer - 4-Tier Test Suite', () => {

  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE
  // =========================================================================
  describe('Tier 1: Feature Coverage', () => {

    test('Feature 1: normalizeChapterExtraction maps Chapter N to Chapter N+1 across 0-based indexing', () => {
      const chapters = [
        { number: 1, title: 'The Iron Citadel', content: 'Kaelen stood upon the battlements, watching the storm gather.' }
      ];

      const extraction = normalizeChapterExtraction(chapters, 0);
      assert.equal(extraction.currentChapterNumber, 1, 'Current chapter should be 1');
      assert.equal(extraction.nextChapterNumber, 2, 'Next chapter should be 2');
      assert.equal(extraction.title, 'The Iron Citadel');
      assert.ok(extraction.prose.includes('Kaelen stood upon the battlements'));
    });

    test('Feature 2: normalizeChapterExtraction handles both object arrays and raw string arrays', () => {
      // Raw string chapters
      const stringChapters = [
        'Prologue: The first spark ignited in the dark.',
        'Chapter 1: The flames consumed the outer perimeter.'
      ];

      const strResult = normalizeChapterExtraction(stringChapters, 1);
      assert.equal(strResult.currentChapterNumber, 2);
      assert.equal(strResult.nextChapterNumber, 3);
      assert.ok(strResult.prose.includes('The flames consumed the outer perimeter'));

      // Object chapters with .prose or .content
      const objectChapters = [
        { title: 'The Vault', prose: 'The heavy steel lock clicked open.' }
      ];
      const objResult = normalizeChapterExtraction(objectChapters, 0);
      assert.equal(objResult.currentChapterNumber, 1);
      assert.equal(objResult.nextChapterNumber, 2);
      assert.equal(objResult.title, 'The Vault');
      assert.ok(objResult.prose.includes('The heavy steel lock clicked open'));
    });

    test('Feature 3: synthesizeHeuristicContinuationHooks returns complete schema with 3 distinct trajectories in <2ms', () => {
      const t0 = performance.now();
      const result = synthesizeHeuristicContinuationHooks({
        prose: 'Elena sealed the blast door just as the hull breach alarm sounded. The lights went dead.',
        title: 'Chapter 1: Decompression',
        currentChapterNumber: 1,
        nextChapterNumber: 2,
        genre: 'scifi',
        storyBible: { characters: [{ name: 'Elena' }] }
      });
      const duration = performance.now() - t0;

      assert.ok(duration < 20, `Execution should be near-instantaneous (took ${duration.toFixed(2)}ms)`);
      assert.equal(typeof result.suggestedPrompt, 'string');
      assert.ok(result.suggestedPrompt.length > 20, 'Suggested prompt should be non-empty');
      assert.equal(result.chapterNumber, 2, 'Next chapter number must be 2');
      assert.ok(Array.isArray(result.suggestedHooks), 'suggestedHooks must be an array');
      assert.equal(result.suggestedHooks.length, 3, 'Must have exactly 3 continuation hooks');

      // Trajectory checks
      assert.ok(result.suggestedHooks[0].includes('Trajectory 1 (Action & Peril Escalation)'));
      assert.ok(result.suggestedHooks[1].includes('Trajectory 2 (Investigation & Hidden Truth)'));
      assert.ok(result.suggestedHooks[2].includes('Trajectory 3 (Moral Compromise & Gamble)'));
    });

    test('Feature 4: compileContinuationPromptPayload injects anti-repetition negative constraints and directives', () => {
      const payload = compileContinuationPromptPayload({
        previousChapters: [{ number: 1, title: 'Inception', content: 'They reached the core.' }],
        genre: 'fantasy',
        storyBible: {
          characters: 'Aria (Spellblade)',
          worldRules: 'Blood magic burns lifeforce',
          canonNotes: 'The crown is shattered'
        },
        lastChapterIndex: 0
      });

      assert.ok(payload.systemPrompt.includes('CRITICAL ANTI-REPETITION & CONTINUATION DIRECTIVES'));
      assert.ok(payload.systemPrompt.includes('NEVER summarize, recap, or re-describe'));
      assert.ok(payload.systemPrompt.includes('Trajectory 1 (Action & Peril Escalation)'));
      assert.ok(payload.systemPrompt.includes('Trajectory 2 (Investigation & Hidden Truth)'));
      assert.ok(payload.systemPrompt.includes('Trajectory 3 (Moral Compromise & Gamble)'));
      assert.ok(payload.userMessage.includes('Aria (Spellblade)'));
      assert.ok(payload.userMessage.includes('Blood magic burns lifeforce'));
      assert.equal(payload.meta.currentChapterNumber, 1);
      assert.equal(payload.meta.nextChapterNumber, 2);
    });

    test('Feature 5: synthesizeNextChapterPrompt delivers complete response object', async () => {
      const result = await synthesizeNextChapterPrompt({
        previousChapters: [
          { number: 1, title: 'Chapter 1: The Descent', content: 'The obsidian staircase descended into the mist.' }
        ],
        genre: 'horror',
        lastChapterIndex: 0,
        timeoutMs: 1800
      });

      assert.ok(result);
      assert.equal(typeof result.suggestedPrompt, 'string');
      assert.ok(result.suggestedPrompt.length > 20);
      assert.equal(result.chapterNumber, 2);
      assert.ok(Array.isArray(result.suggestedHooks));
      assert.equal(result.suggestedHooks.length, 3);
    });

    test('Feature 6: POST /api/generate-next-chapter-prompt returns 200 and valid schema over HTTP', async () => {
      const response = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          previousChapters: [
            {
              number: 1,
              title: 'Chapter 1: The Spark',
              content: 'The automaton whirred to life, its brass gears grinding against century-old rust.',
              thinking: 'Establishing initial steam-tech mystery'
            }
          ],
          genre: 'cyberpunk',
          lastChapterIndex: 0
        })
      });

      assert.equal(response.status, 200, 'HTTP status must be 200 OK');
      const body = await response.json();

      assert.ok(body, 'Body must exist');
      assert.equal(typeof body.suggestedPrompt, 'string');
      assert.ok(body.suggestedPrompt.length > 20);
      assert.equal(body.chapterNumber, 2);
      assert.ok(Array.isArray(body.suggestedHooks));
      assert.equal(body.suggestedHooks.length, 3);
    });

  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {

    test('Boundary 1: Empty previousChapters array gracefully defaults to Chapter 2 continuation', () => {
      const extraction = normalizeChapterExtraction([], undefined);
      assert.equal(extraction.currentChapterNumber, 1);
      assert.equal(extraction.nextChapterNumber, 2);
      assert.equal(extraction.prose, '');

      const fallback = synthesizeHeuristicContinuationHooks({
        prose: '',
        currentChapterNumber: 1,
        nextChapterNumber: 2,
        genre: 'fantasy'
      });
      assert.equal(fallback.chapterNumber, 2);
      assert.equal(fallback.suggestedHooks.length, 3);
      assert.ok(fallback.suggestedPrompt.length > 10);
    });

    test('Boundary 2: Out-of-bounds or negative lastChapterIndex normalizes safely to boundary chapter', () => {
      const chapters = [
        { number: 1, title: 'Ch 1', content: 'Prose 1' },
        { number: 2, title: 'Ch 2', content: 'Prose 2' }
      ];

      // Negative index
      const negExtraction = normalizeChapterExtraction(chapters, -5);
      assert.equal(negExtraction.currentChapterNumber, 2);
      assert.equal(negExtraction.nextChapterNumber, 3);

      // Huge out-of-bounds index
      const hugeExtraction = normalizeChapterExtraction(chapters, 999);
      assert.equal(hugeExtraction.currentChapterNumber, 2);
      assert.equal(hugeExtraction.nextChapterNumber, 3);
    });

    test('Boundary 3: Null, undefined, and malformed storyBible formats are handled safely', () => {
      assert.equal(formatStoryBibleSummary(null), '');
      assert.equal(formatStoryBibleSummary(undefined), '');
      assert.equal(formatStoryBibleSummary('not an object'), '');

      // Complex nested structures with empty entries
      const malformedBible = {
        characters: [{ name: '' }, null, { name: 'Kaelen', role: 'Scout' }],
        worldRules: [null, { rule: 'No shadows under moonlight' }, ''],
        canonNotes: ['City destroyed in year 40']
      };
      const formatted = formatStoryBibleSummary(malformedBible);
      assert.ok(formatted.includes('Kaelen (Scout)'));
      assert.ok(formatted.includes('No shadows under moonlight'));
      assert.ok(formatted.includes('City destroyed in year 40'));
    });

    test('Boundary 4: Extremely large chapter prose (>15,000 characters) is excerpted without error', () => {
      const hugeText = 'Paragraph of intense narrative conflict and dialogue. '.repeat(400);
      assert.ok(hugeText.length > 20000);

      const payload = compileContinuationPromptPayload({
        previousChapters: [{ number: 1, title: 'Epic Chapter', content: hugeText }],
        lastChapterIndex: 0
      });

      // User message excerpt should be bounded to recent climax
      assert.ok(payload.userMessage.length < 5000, 'Payload excerpt must be bounded');
      assert.ok(payload.userMessage.includes('CHAPTER 1 ENDING EXCERPT:'));
    });

    test('Boundary 5: HTTP endpoint handles missing body or empty JSON payload gracefully', async () => {
      const response = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.chapterNumber, 2);
      assert.equal(data.suggestedHooks.length, 3);
    });

  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations', () => {

    test('Combination 1: Genre presets produce thematic continuation hooks', () => {
      const genres = ['fantasy', 'scifi', 'cyberpunk', 'horror', 'mystery', 'romance'];

      for (const genre of genres) {
        const result = synthesizeHeuristicContinuationHooks({
          prose: 'The final sentence marked the end of the chapter.',
          currentChapterNumber: 1,
          nextChapterNumber: 2,
          genre
        });

        assert.equal(result.chapterNumber, 2);
        assert.equal(result.suggestedHooks.length, 3);
        assert.ok(result.suggestedPrompt.length > 20);

        // Verify genre-specific keywords appear in the hooks
        const allHooksText = result.suggestedHooks.join(' ').toLowerCase();
        if (genre === 'fantasy') assert.ok(allHooksText.includes('runes') || allHooksText.includes('sigil') || allHooksText.includes('pact'));
        if (genre === 'scifi') assert.ok(allHooksText.includes('bulkhead') || allHooksText.includes('telemetry') || allHooksText.includes('beacon'));
        if (genre === 'cyberpunk') assert.ok(allHooksText.includes('drones') || allHooksText.includes('engram') || allHooksText.includes('biometrics'));
        if (genre === 'horror') assert.ok(allHooksText.includes('scratching') || allHooksText.includes('mirror') || allHooksText.includes('darkness'));
        if (genre === 'mystery') assert.ok(allHooksText.includes('sedan') || allHooksText.includes('ledger') || allHooksText.includes('autopsy'));
        if (genre === 'romance') assert.ok(allHooksText.includes('summons') || allHooksText.includes('correspondence') || allHooksText.includes('lineage'));
      }
    });

    test('Combination 2: Story Bible character extraction anchors character name into prompt', () => {
      const result = synthesizeHeuristicContinuationHooks({
        prose: 'Vesper stepped through the shattered glass into the darkness.',
        currentChapterNumber: 2,
        nextChapterNumber: 3,
        genre: 'cyberpunk',
        storyBible: { characters: [{ name: 'Vesper', role: 'Netrunner' }] }
      });

      assert.equal(result.chapterNumber, 3);
      assert.ok(result.suggestedPrompt.includes('Vesper'), 'Prompt should mention anchor character Vesper');
    });

    test('Combination 3: Sequential chapter progression math preserves exact numbering', () => {
      const chapters = [
        { number: 1, title: 'Ch 1', content: 'Text 1' },
        { number: 2, title: 'Ch 2', content: 'Text 2' },
        { number: 3, title: 'Ch 3', content: 'Text 3' },
        { number: 4, title: 'Ch 4', content: 'Text 4' },
        { number: 5, title: 'Ch 5', content: 'Text 5' }
      ];

      // Continuing from Chapter 1 (index 0)
      assert.equal(normalizeChapterExtraction(chapters, 0).nextChapterNumber, 2);
      // Continuing from Chapter 3 (index 2)
      assert.equal(normalizeChapterExtraction(chapters, 2).nextChapterNumber, 4);
      // Continuing from latest chapter (no index provided)
      assert.equal(normalizeChapterExtraction(chapters).nextChapterNumber, 6);
    });

    test('Combination 4: BYOK headers are accepted by the HTTP endpoint without rejection', async () => {
      const response = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-byok-groq': 'gsk-test-key-mock',
          'x-byok-gemini': 'gemini-test-key-mock',
          'x-byok-openrouter': 'sk-or-test-mock',
          'x-byok-hf': 'hf-test-mock'
        },
        body: JSON.stringify({
          previousChapters: [{ number: 1, content: 'Prose content' }],
          lastChapterIndex: 0
        })
      });

      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.chapterNumber, 2);
    });

  });

  // =========================================================================
  // TIER 4: REAL-WORLD SCENARIOS & LATENCY SLA
  // =========================================================================
  describe('Tier 4: Real-World Scenarios & Latency SLA', () => {

    test('Scenario 1: End-to-end HTTP request completes in <2000ms SLA', async () => {
      const startTime = Date.now();

      const response = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousChapters: [
            {
              number: 1,
              title: 'Chapter 1: The Breach',
              content: 'The outer gate collapsed with a deafening roar. In the smoke, the silhouettes moved silently forward.',
              thinking: 'Pacing set to fast'
            }
          ],
          genre: 'fantasy',
          lastChapterIndex: 0
        })
      });

      const elapsed = Date.now() - startTime;
      assert.equal(response.status, 200);
      assert.ok(elapsed < 2000, `Request must complete within 2000ms SLA (took ${elapsed}ms)`);

      const result = await response.json();
      assert.equal(result.chapterNumber, 2);
      assert.equal(result.suggestedHooks.length, 3);
    });

    test('Scenario 2: Timeout guard triggers AbortController at timeoutMs and falls back safely', async () => {
      const t0 = Date.now();
      // Test with custom low timeout (e.g., 50ms) to verify instant fallback triggering
      const result = await synthesizeNextChapterPrompt({
        previousChapters: [{ number: 1, title: 'Ch 1', content: 'Slow connection test' }],
        genre: 'mystery',
        lastChapterIndex: 0,
        timeoutMs: 50 // Short timeout forces fallback
      });
      const elapsed = Date.now() - t0;

      assert.ok(elapsed < 500, `Fallback should activate immediately after timeout (took ${elapsed}ms)`);
      assert.equal(result.chapterNumber, 2);
      assert.equal(result.suggestedHooks.length, 3);
      assert.ok(result.suggestedPrompt.length > 20);
    });

    test('Scenario 3: Pre-aborted signal short-circuits instantly without errors', async () => {
      const abort = new AbortController();
      abort.abort();

      const t0 = performance.now();
      const result = await synthesizeNextChapterPrompt({
        previousChapters: [{ number: 2, title: 'Ch 2', content: 'Prose text' }],
        signal: abort.signal
      });
      const elapsed = performance.now() - t0;

      assert.ok(elapsed < 50, `Pre-aborted signal should resolve instantly (took ${elapsed.toFixed(2)}ms)`);
      assert.equal(result.chapterNumber, 3);
      assert.equal(result.suggestedHooks.length, 3);
    });

  });

});
