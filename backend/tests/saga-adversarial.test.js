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

describe('Adversarial Stress Test Suite: Continuation Synthesizer (Milestone 1)', () => {

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

  // ---------------------------------------------------------------------------
  // 1. Programmatic Unit Tests (Adversarial Direct Calls)
  // ---------------------------------------------------------------------------
  describe('Unit: Pathological Arguments & Edge Cases', () => {

    test('Empty and undefined arguments never throw and return valid fallback', async () => {
      const res1 = await synthesizeNextChapterPrompt();
      assert.ok(res1);
      assert.equal(typeof res1.suggestedPrompt, 'string');
      assert.equal(res1.chapterNumber, 2);
      assert.equal(res1.suggestedHooks.length, 3);

      const res2 = await synthesizeNextChapterPrompt({});
      assert.ok(res2);
      assert.equal(res2.chapterNumber, 2);
      assert.equal(res2.suggestedHooks.length, 3);
    });

    test('100,000 character strings in prose do not hang or crash', async () => {
      const hugeString = 'A'.repeat(100000);
      const t0 = performance.now();
      const res = await synthesizeNextChapterPrompt({
        previousChapters: [{ number: 1, title: 'Huge', content: hugeString }],
        timeoutMs: 1800
      });
      const duration = performance.now() - t0;
      assert.ok(duration < 2500, `Took ${duration}ms, expected under 2500ms`);
      assert.ok(res);
      assert.equal(res.chapterNumber, 2);
      assert.equal(res.suggestedHooks.length, 3);
    });

    test('Special Unicode, binary, null bytes, and Zalgo do not crash synthesis', async () => {
      const pathologicalText = 'Null \0 bytes \u0000 Zalgo: T̷h̶e̸ ̵e̴n̴d̷ RTL: \u202Ereversed\u202C Emoji: ' + '🔥💀'.repeat(500);
      const res = await synthesizeNextChapterPrompt({
        previousChapters: [{ number: 1, title: 'Pathological', content: pathologicalText }],
        timeoutMs: 500
      });
      assert.ok(res);
      assert.equal(res.chapterNumber, 2);
      assert.equal(res.suggestedHooks.length, 3);
    });

    test('Circular object references in previousChapters do not cause infinite recursion', async () => {
      const circularChapter = { number: 1, title: 'Circular' };
      circularChapter.content = circularChapter;
      circularChapter.self = circularChapter;

      const res = await synthesizeNextChapterPrompt({
        previousChapters: [circularChapter],
        timeoutMs: 500
      });
      assert.ok(res);
      assert.equal(res.chapterNumber, 2);
      assert.equal(res.suggestedHooks.length, 3);
    });

    test('Invalid chapter indices (-99, 9999, NaN, Infinity, -Infinity) resolve safely', () => {
      const chapters = [
        { number: 1, title: 'Ch 1', content: 'Prose 1' },
        { number: 2, title: 'Ch 2', content: 'Prose 2' }
      ];

      for (const idx of [-99, 9999, NaN, Infinity, -Infinity, 1.5, 'not-a-number', null, undefined]) {
        const ext = normalizeChapterExtraction(chapters, idx);
        assert.ok(Number.isFinite(ext.currentChapterNumber), `currentChapterNumber must be finite for idx ${idx}`);
        assert.ok(Number.isFinite(ext.nextChapterNumber), `nextChapterNumber must be finite for idx ${idx}`);
        assert.ok(ext.nextChapterNumber > 0, `nextChapterNumber must be positive for idx ${idx}`);
      }
    });

    test('Pathological chapter numbers (Infinity, -99, NaN) in chapter objects do not produce invalid nextChapterNumber', () => {
      const chaptersWithInf = [{ number: Infinity, content: 'Prose' }];
      const extInf = normalizeChapterExtraction(chaptersWithInf, 0);
      assert.ok(Number.isFinite(extInf.currentChapterNumber), 'Infinity should be sanitized to finite number');
      assert.ok(Number.isFinite(extInf.nextChapterNumber), 'nextChapterNumber must be finite');

      const chaptersWithNeg = [{ number: -99, content: 'Prose' }];
      const extNeg = normalizeChapterExtraction(chaptersWithNeg, 0);
      assert.ok(extNeg.currentChapterNumber > 0);
      assert.equal(extNeg.nextChapterNumber, extNeg.currentChapterNumber + 1);

      const chaptersWithNaN = [{ number: NaN, content: 'Prose' }];
      const extNaN = normalizeChapterExtraction(chaptersWithNaN, 0);
      assert.equal(extNaN.currentChapterNumber, 1);
      assert.equal(extNaN.nextChapterNumber, 2);

      const chaptersWithNegInf = [{ number: -Infinity, content: 'Prose' }];
      const extNegInf = normalizeChapterExtraction(chaptersWithNegInf, 0);
      assert.equal(extNegInf.currentChapterNumber, 1);
      assert.equal(extNegInf.nextChapterNumber, 2);

      const chaptersWithZero = [{ number: 0, content: 'Prose' }];
      const extZero = normalizeChapterExtraction(chaptersWithZero, 0);
      assert.equal(extZero.currentChapterNumber, 1);
      assert.equal(extZero.nextChapterNumber, 2);
    });

    test('Non-string genre types (number, boolean, object, array) handling in unit functions', async () => {
      const nonStringGenres = [123, true, false, {}, ['fantasy'], null, undefined, '', '   '];
      for (const g of nonStringGenres) {
        // Direct heuristic continuation hook test
        const heuristicRes = synthesizeHeuristicContinuationHooks({
          prose: 'Chapter ending.',
          genre: g
        });
        assert.ok(heuristicRes && Array.isArray(heuristicRes.suggestedHooks));
        assert.equal(heuristicRes.suggestedHooks.length, 3);

        // Direct compile payload test
        const payloadRes = compileContinuationPromptPayload({
          previousChapters: [{ number: 1, content: 'Prose' }],
          genre: g
        });
        assert.ok(payloadRes && payloadRes.meta.genre === 'custom');

        try {
          const res = await synthesizeNextChapterPrompt({
            previousChapters: [{ number: 1, content: 'Story ends here.' }],
            genre: g,
            timeoutMs: 100
          });
          assert.ok(res, `Failed for genre type: ${typeof g}`);
          assert.equal(res.chapterNumber, 2);
        } catch (err) {
          assert.fail(`synthesizeNextChapterPrompt threw exception on genre=${JSON.stringify(g)}: ${err.message}`);
        }
      }
    });

  });

  // ---------------------------------------------------------------------------
  // 2. HTTP Endpoint Adversarial Stress Tests (POST /api/generate-next-chapter-prompt)
  // ---------------------------------------------------------------------------
  describe('HTTP: Pathological Endpoint Invocations', () => {

    test('Empty JSON object {} returns 200 OK and valid JSON envelope', async () => {
      const response = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(typeof data.suggestedPrompt, 'string');
      assert.equal(data.chapterNumber, 2);
      assert.equal(data.suggestedHooks.length, 3);
    });

    test('Payload with 100,000 character strings returns 200 OK without hanging', async () => {
      const hugeString = 'Elena reached for the control console. '.repeat(2500);
      assert.ok(hugeString.length >= 95000);

      const t0 = Date.now();
      const response = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousChapters: [
            { number: 1, title: 'Chapter 1: The Breach', content: hugeString }
          ],
          storyBible: {
            characters: [{ name: 'Elena', role: 'Engineer' }],
            worldRules: ['No oxygen outside', 'Reactor unstable']
          },
          genre: 'scifi',
          lastChapterIndex: 0
        })
      });
      const elapsed = Date.now() - t0;

      assert.equal(response.status, 200);
      assert.ok(elapsed < 2500, `Request took ${elapsed}ms, expected under 2500ms SLA`);
      const data = await response.json();
      assert.equal(data.chapterNumber, 2);
      assert.equal(data.suggestedHooks.length, 3);
    });

    test('Extreme Unicode, binary null bytes, emoji bombardment returns 200 OK', async () => {
      const nastyProse = 'Special \u0000\u0001\u0002 Zalgo: T̷e̵s̸t̷ \u202Egniklat\u202C ' + '💥🚀🎯'.repeat(500);
      const response = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousChapters: [{ number: 1, content: nastyProse }],
          storyBible: { characters: 'Zalgo \u0000\u0001 Entity' },
          genre: 'horror',
          lastChapterIndex: 0
        })
      });

      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.chapterNumber, 2);
      assert.equal(data.suggestedHooks.length, 3);
    });

    test('Extreme chapter indices (-99, 9999, floats) return 200 OK and valid chapterNumber', async () => {
      for (const idx of [-99, 9999, 0, 1, 3.14]) {
        const response = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previousChapters: [
              { number: 1, content: 'Prose 1' },
              { number: 2, content: 'Prose 2' }
            ],
            lastChapterIndex: idx
          })
        });

        assert.equal(response.status, 200, `Expected 200 for lastChapterIndex=${idx}`);
        const data = await response.json();
        assert.ok(data.chapterNumber > 0, `chapterNumber must be > 0 for lastChapterIndex=${idx}`);
        assert.equal(data.suggestedHooks.length, 3);
      }
    });

    test('Non-standard genre types over HTTP (number, boolean, null, object)', async () => {
      const genresToTest = [123, true, false, {}, ['fantasy'], null];
      for (const g of genresToTest) {
        const response = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previousChapters: [{ number: 1, content: 'Prose' }],
            genre: g
          })
        });

        assert.ok([200, 400].includes(response.status), `Status must be 200 or 400, got ${response.status} for genre=${JSON.stringify(g)}`);
        const data = await response.json();
        assert.ok(data);
      }
    });

    test('Non-array previousChapters over HTTP (number, boolean, string, object)', async () => {
      const badPrevious = [123, true, 'just a raw string', { number: 1, content: 'single object' }, null];
      for (const bp of badPrevious) {
        const response = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previousChapters: bp
          })
        });

        assert.ok([200, 400].includes(response.status), `Status must be 200 or 400, got ${response.status} for previousChapters=${JSON.stringify(bp)}`);
        const data = await response.json();
        assert.ok(data);
      }
    });

    test('Malformed JSON syntax in HTTP body returns 400 or valid error JSON, never crashes server', async () => {
      const response = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"previousChapters": [ broken json'
      });

      // Must never crash server and must return valid JSON with error status (400 or 500)
      assert.ok([400, 500].includes(response.status), `Got status ${response.status}`);
      const data = await response.json();
      assert.ok(data);
      assert.ok(data.error);

      // Verify server is STILL alive
      const aliveCheck = await fetch(`${baseUrl}/api/health`);
      assert.equal(aliveCheck.status, 200);
    });

    test('Concurrent stress burst: 20 simultaneous pathological requests complete without crashing or hanging', async () => {
      const t0 = Date.now();
      const promises = Array.from({ length: 20 }, (_, i) => {
        return fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previousChapters: [
              { number: i + 1, content: `Burst request ${i} concluding chapter.` }
            ],
            genre: i % 2 === 0 ? 'fantasy' : 'cyberpunk',
            lastChapterIndex: i
          })
        }).then(async r => {
          assert.equal(r.status, 200);
          return r.json();
        });
      });

      const results = await Promise.all(promises);
      const elapsed = Date.now() - t0;

      assert.equal(results.length, 20);
      for (const res of results) {
        assert.ok(res.chapterNumber > 0);
        assert.equal(res.suggestedHooks.length, 3);
        assert.equal(typeof res.suggestedPrompt, 'string');
      }

      // Verify server is STILL healthy
      const aliveCheck = await fetch(`${baseUrl}/api/health`);
      assert.equal(aliveCheck.status, 200);
    });

  });

});
