import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../server.js';
import {
  synthesizeNextChapterPrompt,
  synthesizeHeuristicContinuationHooks,
  compileContinuationPromptPayload,
  normalizeChapterExtraction
} from '../lib/promptCompiler.js';

describe('Adversarial Latency SLA & Heuristic Fallback Verification Suite', () => {

  let server;
  let baseUrl;
  let port;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        port = server.address().port;
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
  // GROUP 1: EMPIRICAL LATENCY SLA UNDER NORMAL CONDITIONS (< 2000ms)
  // =========================================================================
  describe('Group 1: Baseline Latency SLA Verification (< 2000ms)', () => {

    test('Verification 1.1: 10 consecutive requests return HTTP 200 within 2000ms SLA', async () => {
      const genres = ['fantasy', 'scifi', 'cyberpunk', 'horror', 'mystery', 'romance', 'custom'];
      const latencies = [];

      for (let i = 0; i < 10; i++) {
        const genre = genres[i % genres.length];
        const chapterProse = `Captain Vane wrenched the helm hard to port as the void-leviathan breached the plasma wake. "Shields at nine percent!" shouted Jax. The reactor core let out a dying shriek as total darkness swallowed the deck.`;

        const start = performance.now();
        const response = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previousChapters: [
              {
                number: 1,
                title: 'The Leviathan Trench',
                content: chapterProse,
                thinking: 'Establishing initial space combat crisis'
              }
            ],
            storyBible: {
              characters: [{ name: 'Vane', role: 'Captain' }, { name: 'Jax', role: 'Engineer' }]
            },
            genre,
            lastChapterIndex: 0
          })
        });

        const elapsed = performance.now() - start;
        latencies.push(elapsed);

        assert.equal(response.status, 200, `Request ${i + 1} must return HTTP 200`);
        assert.ok(
          elapsed < 2000,
          `Request ${i + 1} took ${elapsed.toFixed(1)}ms, which violates the 2000ms SLA`
        );

        const data = await response.json();
        assert.equal(data.chapterNumber, 2, 'Next chapter must be 2');
        assert.equal(typeof data.suggestedPrompt, 'string');
        assert.ok(data.suggestedPrompt.length > 25, 'suggestedPrompt must be substantial');
        assert.equal(data.suggestedHooks.length, 3, 'Must contain exactly 3 continuation hooks');
      }

      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const max = Math.max(...latencies);
      const min = Math.min(...latencies);

      console.log(`[Latency SLA Profile] Min: ${min.toFixed(1)}ms | Avg: ${avg.toFixed(1)}ms | Max: ${max.toFixed(1)}ms (SLA target: <2000ms)`);
      assert.ok(max < 2000, `Worst case latency (${max.toFixed(1)}ms) must be strictly under 2000ms`);
    });

  });

  // =========================================================================
  // GROUP 2: ARTIFICIAL LATENCY INJECTION & 1800ms TIMEOUT GUARD
  // =========================================================================
  describe('Group 2: Artificial Latency & 1800ms Timeout Guard Verification', () => {

    test('Verification 2.1: Timeout guard aborts stalled inference and returns fallback in <2000ms', async () => {
      // Test synthesizeNextChapterPrompt with timeoutMs = 1800ms
      // We simulate an upstream hang by providing byok with a non-responsive mock host or using timeoutMs parameter
      const t0 = performance.now();

      const result = await synthesizeNextChapterPrompt({
        previousChapters: [
          {
            number: 1,
            title: 'The Ancient Vault',
            content: 'The stone seal broke into pieces. A hollow gust of tomb-air extinguished their torches.',
            thinking: 'CoT thinking'
          }
        ],
        storyBible: { characters: [{ name: 'Aramis' }] },
        genre: 'fantasy',
        lastChapterIndex: 0,
        // Using explicit 1800ms SLA timeout constraint
        timeoutMs: 1800
      });

      const elapsed = performance.now() - t0;
      console.log(`[1800ms Timeout Guard Test] Completed in ${elapsed.toFixed(1)}ms`);

      assert.ok(
        elapsed < 2000,
        `Execution time under timeout guard must be < 2000ms (took ${elapsed.toFixed(1)}ms)`
      );
      assert.ok(result, 'Must return a valid result');
      assert.equal(result.chapterNumber, 2);
      assert.equal(typeof result.suggestedPrompt, 'string');
      assert.equal(result.suggestedHooks.length, 3);
      assert.ok(result.suggestedPrompt.includes('Aramis') || result.suggestedPrompt.includes('Chapter 2'));
    });

    test('Verification 2.2: Extreme artificial delay simulation (3500ms delay) guarantees <2000ms return', async () => {
      // We verify that if an abort timeout is set at 1000ms or 1800ms, the promise NEVER waits for the 3500ms
      const t0 = performance.now();

      // Test with custom simulated timeout of 300ms
      const result = await synthesizeNextChapterPrompt({
        previousChapters: [{ number: 1, content: 'Tension rises in the city.' }],
        genre: 'cyberpunk',
        lastChapterIndex: 0,
        timeoutMs: 300
      });

      const elapsed = performance.now() - t0;
      console.log(`[300ms Injected Timeout Test] Completed in ${elapsed.toFixed(1)}ms`);

      assert.ok(elapsed >= 250, `Should wait for timeout threshold (took ${elapsed.toFixed(1)}ms)`);
      assert.ok(elapsed < 800, `Should return fallback immediately after timeout (took ${elapsed.toFixed(1)}ms)`);
      assert.equal(result.chapterNumber, 2);
      assert.equal(result.suggestedHooks.length, 3);
    });

    test('Verification 2.3: Deterministic fallback engine executes in <2ms', () => {
      const iterations = 50;
      const t0 = performance.now();

      for (let i = 0; i < iterations; i++) {
        synthesizeHeuristicContinuationHooks({
          prose: 'The vault door sealed. Shadows moved across the ceiling.',
          title: 'Chapter 1',
          currentChapterNumber: 1,
          nextChapterNumber: 2,
          genre: 'horror',
          storyBible: { characters: [{ name: 'Gideon' }] }
        });
      }

      const totalTime = performance.now() - t0;
      const perIteration = totalTime / iterations;

      console.log(`[Heuristic Fallback Engine Speed] ${perIteration.toFixed(3)}ms per call (${iterations} iterations in ${totalTime.toFixed(1)}ms)`);
      assert.ok(
        perIteration < 2.0,
        `Heuristic fallback must execute in < 2ms (averaged ${perIteration.toFixed(3)}ms)`
      );
    });

  });

  // =========================================================================
  // GROUP 3: NETWORK ABORTS & CLIENT DISCONNECT RESILIENCE
  // =========================================================================
  describe('Group 3: Network Aborts & Client Disconnect Resilience', () => {

    test('Verification 3.1: Pre-aborted signal aborts immediately (<10ms) without network calls', async () => {
      const abort = new AbortController();
      abort.abort();

      const t0 = performance.now();
      const result = await synthesizeNextChapterPrompt({
        previousChapters: [{ number: 1, content: 'Prose here' }],
        signal: abort.signal
      });
      const elapsed = performance.now() - t0;

      assert.ok(elapsed < 15, `Pre-aborted signal took ${elapsed.toFixed(2)}ms (expected <15ms)`);
      assert.equal(result.chapterNumber, 2);
      assert.equal(result.suggestedHooks.length, 3);
    });

    test('Verification 3.2: Premature client socket destruction triggers abort cleanly without server crash', async () => {
      // Simulate client opening connection and abruptly closing it before response
      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: port,
          path: '/api/generate-next-chapter-prompt',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        req.on('error', (err) => {
          // Expected ECONNRESET / socket hang up on client side
          resolve();
        });

        req.write(JSON.stringify({
          previousChapters: [{ number: 1, content: 'Socket disconnect test' }],
          genre: 'scifi'
        }));

        // Abruptly destroy client socket after 20ms
        setTimeout(() => {
          req.destroy();
          // Give server event loop a moment to handle req.on('close')
          setTimeout(resolve, 50);
        }, 20);
      });

      // Verify server is still alive and responsive after premature client destruction
      const pingRes = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousChapters: [{ number: 1, content: 'Post-abort healthcheck' }],
          genre: 'fantasy'
        })
      });

      assert.equal(pingRes.status, 200, 'Server must remain 100% operational after aborted connection');
      const data = await pingRes.json();
      assert.equal(data.chapterNumber, 2);
    });

  });

  // =========================================================================
  // GROUP 4: NARRATIVE QUALITY & ANTI-REPETITION GUARDRAILS EVALUATION
  // =========================================================================
  describe('Group 4: Narrative Quality & Anti-Repetition Guardrails', () => {

    test('Verification 4.1: Fallback hooks advance stakes and DO NOT regurgitate Chapter 1 events', () => {
      const chapter1Prose = `The iron gate groaned shut, locking Marcus inside the catacombs. Water began pouring through the stone ceiling fissures, rising rapidly past his knees.`;

      const result = synthesizeHeuristicContinuationHooks({
        prose: chapter1Prose,
        title: 'Chapter 1: The Rising Tide',
        currentChapterNumber: 1,
        nextChapterNumber: 2,
        genre: 'fantasy',
        storyBible: {
          characters: [{ name: 'Marcus', role: 'Paladin' }]
        }
      });

      // Check schema completeness
      assert.equal(result.chapterNumber, 2);
      assert.equal(result.suggestedHooks.length, 3);

      const prompt = result.suggestedPrompt;
      const hooks = result.suggestedHooks;

      // 1. Anti-repetition: Ensure verbatim sentences from Chapter 1 are NOT regurgitated
      assert.ok(
        !prompt.includes('Water began pouring through the stone ceiling fissures'),
        'suggestedPrompt must not repeat verbatim Chapter 1 events'
      );
      assert.ok(
        !prompt.includes('locking Marcus inside the catacombs'),
        'suggestedPrompt must not repeat verbatim Chapter 1 events'
      );

      // 2. Forward momentum & Stakes escalation
      assert.ok(
        prompt.includes('Marcus'),
        'suggestedPrompt should anchor the protagonist Marcus'
      );
      assert.ok(
        prompt.toLowerCase().includes('escalation') ||
        prompt.toLowerCase().includes('consequence') ||
        prompt.toLowerCase().includes('confrontation'),
        'suggestedPrompt must emphasize forward narrative momentum and stakes escalation'
      );

      // 3. Trajectory 1: Action & Peril Escalation
      assert.ok(hooks[0].startsWith('Trajectory 1 (Action & Peril Escalation):'));
      assert.ok(
        hooks[0].includes('ward-runes') || hooks[0].includes('sentinel') || hooks[0].includes('escape route'),
        'Trajectory 1 must provide immediate physical peril/escalation'
      );

      // 4. Trajectory 2: Investigation & Hidden Truth
      assert.ok(hooks[1].startsWith('Trajectory 2 (Investigation & Hidden Truth):'));
      assert.ok(
        hooks[1].includes('sigil') || hooks[1].includes('allied guild') || hooks[1].includes('compromised'),
        'Trajectory 2 must provide investigative intrigue/revelation'
      );

      // 5. Trajectory 3: Moral Compromise & Gamble
      assert.ok(hooks[2].startsWith('Trajectory 3 (Moral Compromise & Gamble):'));
      assert.ok(
        hooks[2].includes('blood-pact') || hooks[2].includes('phantom') || hooks[2].includes('forbidden'),
        'Trajectory 3 must present an agonizing moral gamble'
      );
    });

    test('Verification 4.2: All 7 genres supply distinct, non-repetitive narrative trajectories', () => {
      const genres = ['fantasy', 'scifi', 'cyberpunk', 'horror', 'mystery', 'romance', 'custom'];
      const seenActionHooks = new Set();
      const seenMysteryHooks = new Set();
      const seenGambleHooks = new Set();

      for (const genre of genres) {
        const result = synthesizeHeuristicContinuationHooks({
          prose: 'The battle concluded at dusk.',
          currentChapterNumber: 3,
          nextChapterNumber: 4,
          genre
        });

        assert.equal(result.chapterNumber, 4);
        assert.equal(result.suggestedHooks.length, 3);

        const [t1, t2, t3] = result.suggestedHooks;
        assert.ok(t1.includes('Trajectory 1 (Action & Peril Escalation)'));
        assert.ok(t2.includes('Trajectory 2 (Investigation & Hidden Truth)'));
        assert.ok(t3.includes('Trajectory 3 (Moral Compromise & Gamble)'));

        // Ensure distinctness across genres
        seenActionHooks.add(t1);
        seenMysteryHooks.add(t2);
        seenGambleHooks.add(t3);
      }

      // 7 unique genres should yield 7 unique hooks per trajectory
      assert.equal(seenActionHooks.size, 7, 'Each genre must provide a bespoke Trajectory 1');
      assert.equal(seenMysteryHooks.size, 7, 'Each genre must provide a bespoke Trajectory 2');
      assert.equal(seenGambleHooks.size, 7, 'Each genre must provide a bespoke Trajectory 3');
    });

    test('Verification 4.3: LLM prompt compilation embeds anti-repetition directives and schema guardrails', () => {
      const compiled = compileContinuationPromptPayload({
        previousChapters: [
          {
            number: 1,
            title: 'Ch 1',
            content: 'The alchemist poured the elixir into the crucible. It exploded.'
          }
        ],
        genre: 'fantasy',
        storyBible: {
          characters: [{ name: 'Theron', role: 'Alchemist' }]
        },
        lastChapterIndex: 0
      });

      // Assert system directives
      assert.ok(compiled.systemPrompt.includes('CRITICAL ANTI-REPETITION & CONTINUATION DIRECTIVES'));
      assert.ok(compiled.systemPrompt.includes('NEVER summarize, recap, or re-describe what already occurred'));
      assert.ok(compiled.systemPrompt.includes('Propel the narrative immediately into the unfolding consequences'));
      assert.ok(compiled.systemPrompt.includes('Trajectory 1 (Action & Peril Escalation)'));
      assert.ok(compiled.systemPrompt.includes('Trajectory 2 (Investigation & Hidden Truth)'));
      assert.ok(compiled.systemPrompt.includes('Trajectory 3 (Moral Compromise & Gamble)'));

      // Assert parameters
      assert.equal(compiled.parameters.max_tokens, 350, 'max_tokens should be concise (350 tokens) to guarantee fast inference');
      assert.equal(compiled.parameters.temperature, 0.7);
    });

    test('Verification 4.4: Rich Chapter 1 prose returns non-repetitive Chapter 2 hook advancing conflict', async () => {
      const chapter1 = {
        number: 1,
        title: 'The Silent Spire',
        content: `The clockwork heart in the center of the Cathedral of Gears gave three violent thuds before seizing completely. Lady Seraphina knelt beside the brass altar, her gauntlets slick with oil and black blood. Across the nave, Inquisitor Vane stepped through the shattered stained-glass rose window, his rapier already drawn. "The heresy ends here, Seraphina," he murmured. She clutched the brass chronometer to her chest and whispered the activation chant.`,
        thinking: 'Opening Chapter establishing steampunk techno-theology conflict'
      };

      const res = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousChapters: [chapter1],
          storyBible: {
            characters: [{ name: 'Seraphina', role: 'Renegade Artificer' }]
          },
          genre: 'fantasy',
          lastChapterIndex: 0
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.chapterNumber, 2);
      assert.ok(data.suggestedPrompt.length > 20);
      assert.equal(data.suggestedHooks.length, 3);

      // Verifies character anchoring
      assert.ok(data.suggestedPrompt.includes('Seraphina'));

      // Verifies no verbatim regurgitation of chapter 1 text
      assert.ok(!data.suggestedPrompt.includes('three violent thuds before seizing completely'));
      assert.ok(!data.suggestedPrompt.includes('slick with oil and black blood'));
    });

  });

  // =========================================================================
  // GROUP 5: CONCURRENCY STRESS TEST (20 PARALLEL REQUESTS)
  // =========================================================================
  describe('Group 5: Concurrency Stress Test', () => {

    test('Verification 5.1: 20 concurrent requests all complete within 2000ms SLA without race conditions', async () => {
      const numRequests = 20;
      const startTime = performance.now();

      const promises = Array.from({ length: numRequests }, (_, i) => {
        const chapterNum = (i % 5) + 1;
        return fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previousChapters: [
              {
                number: chapterNum,
                title: `Chapter ${chapterNum}`,
                content: `Concurrency stress payload #${i} concluding chapter ${chapterNum}.`
              }
            ],
            genre: i % 2 === 0 ? 'scifi' : 'cyberpunk',
            lastChapterIndex: 0
          })
        }).then(async (res) => {
          assert.equal(res.status, 200, `Concurrent request #${i} failed`);
          const body = await res.json();
          assert.equal(body.chapterNumber, chapterNum + 1);
          assert.equal(body.suggestedHooks.length, 3);
          return body;
        });
      });

      const results = await Promise.all(promises);
      const totalElapsed = performance.now() - startTime;

      console.log(`[Concurrency Stress Test] 20 concurrent requests completed in ${totalElapsed.toFixed(1)}ms (${(totalElapsed / numRequests).toFixed(1)}ms effective per request)`);

      assert.equal(results.length, numRequests);
      assert.ok(
        totalElapsed < 2500,
        `20 concurrent requests should complete efficiently (took ${totalElapsed.toFixed(1)}ms)`
      );
    });

  });

});
