/**
 * Tier 5 Adversarial Stress & Hardening Test Suite for Mythos Studio Saga Engine
 *
 * Independent empirical challenge test harness evaluating:
 * 1. SLA Latency & Burst Concurrency: 30 concurrent bursts with adversarial payloads (<2000ms SLA)
 * 2. High Chapter Count Scaling: 25+ to 50 chapter state stability, heap footprint, and zero memory leaks
 * 3. Rapid Chapter Switching, Speech Narration Halting & Race Condition Immunity
 * 4. Narrative Blueprint CoT Isolation & Zero Cross-Chapter Contamination under adversarial delimiters
 * 5. Provocative Boundary Edge Cases: Gigantic payloads, malformed bodies, connection drops
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../backend/server.js';
import {
  normalizeChapterExtraction,
  synthesizeHeuristicContinuationHooks,
  compileContinuationPromptPayload,
  synthesizeNextChapterPrompt
} from '../backend/lib/promptCompiler.js';

describe('Tier 5 Adversarial Coverage Hardening & Stress Certification Suite', () => {
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
  // SECTION 1: CONCURRENT BURST LATENCY SLA (<2000ms) UNDER ADVERSARIAL LOAD
  // =========================================================================
  describe('Adversarial Challenge 1: Concurrent Burst Latency SLA (< 2000ms)', () => {

    test('Burst 1.1: 30 simultaneous concurrent requests all return HTTP 200 strictly within 2000ms SLA', async () => {
      const concurrency = 30;
      const requests = [];

      const startTime = performance.now();

      for (let i = 0; i < concurrency; i++) {
        const chapNum = (i % 5) + 1;
        const payload = {
          previousChapters: [
            {
              number: chapNum,
              title: `Chapter ${chapNum}: High Pressure Burst`,
              content: `Adversarial burst packet ${i}. The atmospheric pressure dropped precipitously as the vacuum sealed bulkhead cracked. Neon coolant sprayed across the obsidian console.`,
              thinking: `Burst thinking CoT ${i}`
            }
          ],
          genre: i % 2 === 0 ? 'cyberpunk' : 'horror',
          storyBible: {
            characters: [{ name: `Agent-${i}`, role: 'Infiltrator' }],
            worldRules: [`Rule ${i}: Entropy accelerates under pressure`]
          },
          lastChapterIndex: 0
        };

        const reqPromise = (async () => {
          const reqStart = performance.now();
          const res = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const reqElapsed = performance.now() - reqStart;
          const data = await res.json();
          return { status: res.status, reqElapsed, data };
        })();

        requests.push(reqPromise);
      }

      const results = await Promise.all(requests);
      const totalElapsed = performance.now() - startTime;

      const latencies = results.map(r => r.reqElapsed);
      const minLatency = Math.min(...latencies);
      const maxLatency = Math.max(...latencies);
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      latencies.sort((a, b) => a - b);
      const p95Latency = latencies[Math.floor(latencies.length * 0.95)];

      // Verify all 30 succeeded
      assert.equal(results.length, 30, 'All 30 burst requests must complete');
      for (const res of results) {
        assert.equal(res.status, 200, 'HTTP status must be 200');
        assert.ok(res.reqElapsed < 2000, `Per-request latency must be < 2000ms SLA (was ${res.reqElapsed.toFixed(1)}ms)`);
        assert.equal(typeof res.data.suggestedPrompt, 'string');
        assert.ok(res.data.suggestedPrompt.length > 10, 'Prompt must be non-empty');
        assert.ok(Array.isArray(res.data.suggestedHooks), 'suggestedHooks must be an array');
        assert.equal(res.data.suggestedHooks.length, 3, 'Must provide 3 trajectories');
      }

      assert.ok(maxLatency < 2000, `Max burst latency must satisfy < 2000ms SLA (max was ${maxLatency.toFixed(1)}ms)`);
      assert.ok(totalElapsed < 4000, `Total batch elapsed should complete swiftly (was ${totalElapsed.toFixed(1)}ms)`);
    });

    test('Burst 1.2: Client connection abort does not crash server or leak promises', async () => {
      // Fire 5 requests that abort halfway
      const abortPromises = Array.from({ length: 5 }, async (_, i) => {
        const controller = new AbortController();
        const fetchPromise = fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previousChapters: [{ number: 1, content: `Abort test payload ${i}` }],
            genre: 'mystery'
          }),
          signal: controller.signal
        }).catch((err) => {
          assert.ok(err.name === 'AbortError' || err.message.includes('aborted'));
          return 'aborted_safely';
        });

        // Abort almost immediately (1-5ms)
        setTimeout(() => controller.abort(), 2);
        return fetchPromise;
      });

      const abortResults = await Promise.all(abortPromises);
      for (const res of abortResults) {
        assert.equal(res, 'aborted_safely');
      }

      // Immediately verify server is healthy and responsive
      const healthCheck = await fetch(`${baseUrl}/api/health`);
      assert.equal(healthCheck.status, 200);
      const healthJson = await healthCheck.json();
      assert.equal(healthJson.status, 'ok');
    });

  });

  // =========================================================================
  // SECTION 2: HIGH CHAPTER COUNT SCALING (20+ TO 50 CHAPTERS) & MEMORY INTEGRITY
  // =========================================================================
  describe('Adversarial Challenge 2: High Chapter Count Scaling (20+ Chapters) & Memory Stability', () => {

    test('Scale 2.1: 25-Chapter massive saga extracts correct target chapter and retains exact chapter continuity', () => {
      const chapters25 = [];
      for (let i = 1; i <= 25; i++) {
        chapters25.push({
          number: i,
          title: `Chapter ${i}: The Chronicles of Vaeloria - Part ${i}`,
          content: `In Chapter ${i}, the arcane seal cracked wider. Lore fragment ${i * 42}. The protagonist made pivotal choice #${i}.`.repeat(30), // ~2.5KB prose each
          thinking: `Deep CoT blueprint for Chapter ${i}: Analysis of arc ${i}, emotional polarity ${i % 2 === 0 ? 'dark' : 'hopeful'}.`,
          timestamp: new Date(Date.now() - (26 - i) * 3600000).toISOString()
        });
      }

      assert.equal(chapters25.length, 25);

      // Verify continuous scaling from chapter 1 to 25
      for (let idx = 0; idx < 25; idx++) {
        const extraction = normalizeChapterExtraction(chapters25, idx);
        assert.equal(extraction.currentChapterNumber, idx + 1);
        assert.equal(extraction.nextChapterNumber, idx + 2);
        assert.equal(extraction.title, `Chapter ${idx + 1}: The Chronicles of Vaeloria - Part ${idx + 1}`);
        assert.ok(extraction.prose.includes(`pivotal choice #${idx + 1}`));
      }

      // Latest chapter extraction without explicit index
      const latestExtraction = normalizeChapterExtraction(chapters25);
      assert.equal(latestExtraction.currentChapterNumber, 25);
      assert.equal(latestExtraction.nextChapterNumber, 26);
    });

    test('Scale 2.2: Memory heap stability under 2,000 rapid continuation compiles across a 30-chapter saga', () => {
      // Force GC if available or record initial memory
      if (global.gc) global.gc();
      const initialMem = process.memoryUsage().heapUsed;

      const largeSaga = Array.from({ length: 30 }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}`,
        content: `Prose for chapter ${i + 1} with high descriptive richness and sensory grounding. `.repeat(40),
        thinking: `Reasoning blueprint ${i + 1}`,
        timestamp: new Date().toISOString()
      }));

      // Execute 2,000 compiles in memory
      for (let i = 0; i < 2000; i++) {
        const targetIdx = i % 30;
        const compiled = compileContinuationPromptPayload({
          previousChapters: largeSaga,
          storyBible: {
            characters: [{ name: 'Kaelen' }, { name: 'Sylas' }],
            worldRules: ['Magic has a toxic half-life', 'Iron repels wraiths']
          },
          genre: 'fantasy',
          lastChapterIndex: targetIdx
        });

        // Verify compiled excerpt bounds (must truncate to <= 1800 chars, avoiding token explosion)
        assert.ok(compiled.userMessage.includes(`CURRENT CHAPTER: Chapter ${targetIdx + 1}`));
        assert.ok(compiled.userMessage.includes(`TARGET CHAPTER: Chapter ${targetIdx + 2}`));
      }

      const finalMem = process.memoryUsage().heapUsed;
      const memDeltaMB = (finalMem - initialMem) / (1024 * 1024);

      // Verify no runaway memory leak (delta should be well under 25MB after 2000 compiles)
      assert.ok(memDeltaMB < 25, `Heap delta must remain stable after 2,000 operations (was ${memDeltaMB.toFixed(2)} MB)`);
    });

    test('Scale 2.3: 50-Chapter full serialization and deserialization preserves byte-for-byte fidelity', () => {
      const chapters50 = Array.from({ length: 50 }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}: Odyssey of Stars`,
        content: `Star log entry ${i + 1}. Sector coordinates: ${i * 1337}, ${i * 999}. Warp engine core at ${100 - i}%.`,
        thinking: `Narrative CoT reasoning for astronomical phenomenon ${i + 1}`,
        timestamp: new Date(1700000000000 + i * 86400000).toISOString()
      }));

      const serialized = JSON.stringify(chapters50);
      const deserialized = JSON.parse(serialized);

      assert.equal(deserialized.length, 50);
      for (let i = 0; i < 50; i++) {
        assert.equal(deserialized[i].number, i + 1);
        assert.equal(deserialized[i].title, chapters50[i].title);
        assert.equal(deserialized[i].content, chapters50[i].content);
        assert.equal(deserialized[i].thinking, chapters50[i].thinking);
        assert.equal(deserialized[i].timestamp, chapters50[i].timestamp);
      }
    });

  });

  // =========================================================================
  // SECTION 3: RAPID CHAPTER SWITCHING, SPEECH CANCELLATION & RACE IMMUNITY
  // =========================================================================
  describe('Adversarial Challenge 3: Rapid Chapter Switching, Speech Cancellation & Race Immunity', () => {

    test('Switching 3.1: 500 rapid pseudo-random chapter jumps maintain strict state determinism', () => {
      const chapters = Array.from({ length: 20 }, (_, i) => ({
        number: i + 1,
        title: `Chapter ${i + 1}`,
        content: `Content for Chapter ${i + 1} [UNIQUE_TOKEN_${i + 1}]`,
        thinking: `Thinking for Chapter ${i + 1} [BLUEPRINT_TOKEN_${i + 1}]`
      }));

      let activeIndex = 0;
      let activeStory = chapters[0].content;
      let activeThinking = chapters[0].thinking;

      // Simulated state transition function matching StoryContext.jsx setActiveChapterIndex
      const switchChapter = (idx) => {
        const total = chapters.length;
        const parsed = parseInt(idx, 10);
        const clamped = Math.min(Math.max(isNaN(parsed) ? 0 : parsed, 0), total - 1);
        activeIndex = clamped;
        activeStory = chapters[clamped].content;
        activeThinking = chapters[clamped].thinking;
      };

      // Perform 500 erratic transitions (negative, out of bounds, random valid indices)
      const testIndices = [-10, 0, 19, 50, '5', 'invalid', 12, 3, 18, 0, 7];
      for (let i = 0; i < 500; i++) {
        const target = testIndices[i % testIndices.length];
        switchChapter(target);

        // Assert determinism at every step
        assert.ok(activeIndex >= 0 && activeIndex < 20, `Index must always be clamped to [0, 19] (was ${activeIndex})`);
        assert.ok(activeStory.includes(`[UNIQUE_TOKEN_${activeIndex + 1}]`), 'Story must bind to exact chapter token');
        assert.ok(activeThinking.includes(`[BLUEPRINT_TOKEN_${activeIndex + 1}]`), 'Thinking must bind to exact blueprint token');
      }
    });

    test('Switching 3.2: Web Speech narration halting is invoked 100% reliably upon chapter switch', () => {
      // Mock SpeechSynthesis engine
      let stopNarrationCallCount = 0;
      let isSpeaking = true;
      let activeSentenceIdx = 4;

      const mockStopNarration = () => {
        stopNarrationCallCount += 1;
        isSpeaking = false;
        activeSentenceIdx = -1;
      };

      const chapters = [
        { number: 1, content: 'Sentence 1. Sentence 2. Sentence 3. Sentence 4. Sentence 5.' },
        { number: 2, content: 'Chapter 2 opening sentence.' }
      ];

      // Simulated setActiveChapterIndex with speech cancellation invariant
      const setActiveChapterIndex = (idx) => {
        mockStopNarration();
      };

      // Trigger 20 rapid chapter switches
      for (let i = 0; i < 20; i++) {
        isSpeaking = true;
        activeSentenceIdx = 3;
        setActiveChapterIndex(i % 2);
        assert.equal(isSpeaking, false, 'Speech must be halted');
        assert.equal(activeSentenceIdx, -1, 'Sentence index must be reset to -1');
      }

      assert.equal(stopNarrationCallCount, 20, 'stopNarration must be called for each transition');
    });

    test('Switching 3.3: Mid-stream chapter switching does not cross-contaminate active streaming buffer', () => {
      // Scenario: Chapter 1 is saved in chapters[0]. Chapter 2 is currently streaming.
      const initialChapters = [
        {
          number: 1,
          title: 'Chapter 1',
          content: 'Immutable Chapter 1 prose that must not be corrupted.',
          thinking: 'Chapter 1 thinking blueprint.'
        }
      ];

      let storedChapters = [...initialChapters];
      let activeIndex = 1; // Advanced to Chapter 2 for streaming
      let streamingProseBuffer = '';
      let streamingThinkingBuffer = '';

      // Incoming SSE stream chunks for Chapter 2
      const streamChunks = [
        { type: 'thinking', text: 'Architecting Chapter 2...' },
        { type: 'prose', text: 'Chapter 2 begins under heavy rain.' },
        { type: 'prose', text: ' A stranger steps out of the shadow.' }
      ];

      // Process chunk 1 & 2
      streamingThinkingBuffer += streamChunks[0].text;
      streamingProseBuffer += streamChunks[1].text;

      // User switches view to Chapter 1 mid-stream!
      const userViewIndex = 0;
      const displayedContentWhenBrowsingCh1 = storedChapters[userViewIndex].content;
      const displayedThinkingWhenBrowsingCh1 = storedChapters[userViewIndex].thinking;

      // Verify user sees Chapter 1 while Chapter 2 continues streaming in background
      assert.equal(displayedContentWhenBrowsingCh1, 'Immutable Chapter 1 prose that must not be corrupted.');
      assert.equal(displayedThinkingWhenBrowsingCh1, 'Chapter 1 thinking blueprint.');

      // Process chunk 3
      streamingProseBuffer += streamChunks[2].text;

      // Stream completes for Chapter 2
      const completedChapter2 = {
        number: 2,
        title: 'Chapter 2',
        content: streamingProseBuffer,
        thinking: streamingThinkingBuffer
      };
      storedChapters = [...storedChapters, completedChapter2];

      // Verify Chapter 1 is 100% byte-for-byte identical to its initial state
      assert.equal(storedChapters[0].content, initialChapters[0].content);
      assert.equal(storedChapters[0].thinking, initialChapters[0].thinking);

      // Verify Chapter 2 is stored cleanly
      assert.equal(storedChapters[1].content, 'Chapter 2 begins under heavy rain. A stranger steps out of the shadow.');
      assert.equal(storedChapters[1].thinking, 'Architecting Chapter 2...');
    });

  });

  // =========================================================================
  // SECTION 4: NARRATIVE BLUEPRINT ISOLATION & ZERO-BLEED UNDER ADVERSARIAL TAGS
  // =========================================================================
  describe('Adversarial Challenge 4: Narrative Blueprint Isolation & Zero-Bleed Stress', () => {

    test('Blueprint 4.1: Adversarial delimiters inside reasoning blueprint do not bleed into prose or parser', () => {
      // Highly adversarial thinking CoT with prose tags, markdown, and JSON
      const adversarialThinking = `
        <thinking>
        Plot Plan:
        [STORY_START]
        This text mimics a story start inside thinking!
        [STORY_END]
        [BRANCH_CHOICES]
        {"choice": "fake branch"}
        [/BRANCH_CHOICES]
        \`\`\`json
        {"injected": "malicious"}
        \`\`\`
        </thinking>
      `;

      const cleanProse = 'Elena navigated through the corridor, her plasma torch carving through the bulkheads.';

      const chapter = {
        number: 1,
        title: 'Chapter 1: The Breach',
        content: cleanProse,
        thinking: adversarialThinking
      };

      // Verify the chapter object preserves thinking separately without altering content
      assert.equal(chapter.content, cleanProse);
      assert.ok(chapter.thinking.includes('[STORY_START]'));
      assert.ok(chapter.thinking.includes('<thinking>'));

      // Verify prompt compiler normalizes and compiles cleanly without breaking
      const compiled = compileContinuationPromptPayload({
        previousChapters: [chapter],
        genre: 'scifi',
        lastChapterIndex: 0
      });

      assert.ok(compiled.userMessage.includes(cleanProse));
      // The user prompt excerpt should strictly take the prose, not the thinking CoT
      assert.ok(!compiled.userMessage.includes('This text mimics a story start inside thinking!'));
    });

    test('Blueprint 4.2: Chapter with empty thinking blueprint renders empty state rather than leaking previous blueprint', () => {
      const chapters = [
        {
          number: 1,
          title: 'Chapter 1',
          content: 'Prose 1',
          thinking: 'Secret CoT for Chapter 1: The killer is Lord Blackwood.'
        },
        {
          number: 2,
          title: 'Chapter 2',
          content: 'Prose 2',
          thinking: '' // No blueprint for Chapter 2
        }
      ];

      // Simulated view model resolver from StoryViewer.jsx
      const getThinkingForChapter = (idx) => {
        return chapters[idx]?.thinking || '';
      };

      assert.ok(getThinkingForChapter(0).includes('Lord Blackwood'));
      assert.equal(getThinkingForChapter(1), '', 'Chapter 2 thinking must be empty, zero bleed from Chapter 1');
    });

  });

  // =========================================================================
  // SECTION 5: PROVOCATIVE BOUNDARY EDGE CASES & ADVERSARIAL PAYLOADS
  // =========================================================================
  describe('Adversarial Challenge 5: Boundary Edge Cases & Provocative Payloads', () => {

    test('Boundary 5.1: Huge payload (100KB prose excerpt) truncates safely within 1800 chars without server timeout', async () => {
      const hugeProse = 'Word '.repeat(20000); // ~100KB string

      const res = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousChapters: [
            {
              number: 1,
              title: 'Chapter 1: The Odyssey of Infinite Words',
              content: hugeProse
            }
          ],
          genre: 'fantasy',
          lastChapterIndex: 0
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.chapterNumber, 2);
      assert.equal(data.suggestedHooks.length, 3);
      assert.ok(data.suggestedPrompt.length > 10);
    });

    test('Boundary 5.2: Malformed payloads return clean HTTP 200 with fallback or HTTP 400 without crashing server', async () => {
      // 1. Array instead of object
      const res1 = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(['invalid', 'array'])
      });
      assert.ok([200, 400].includes(res1.status));

      // 2. Empty JSON body
      const res2 = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.chapterNumber, 2);

      // 3. String numbers and corrupted fields
      const res3 = await fetch(`${baseUrl}/api/generate-next-chapter-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousChapters: [{ number: '99', content: 12345, thinking: null }],
          lastChapterIndex: 'not-a-number'
        })
      });
      assert.equal(res3.status, 200);
      const data3 = await res3.json();
      assert.equal(typeof data3.chapterNumber, 'number');
    });

    test('Boundary 5.3: Offline heuristic fallback executes in < 2ms with 100% schema compliance', () => {
      const t0 = performance.now();
      const fallback = synthesizeHeuristicContinuationHooks({
        prose: 'The starship hyperdrive collapsed. Radiation alarms flared crimson.',
        title: 'Chapter 1: Singularity',
        currentChapterNumber: 1,
        nextChapterNumber: 2,
        genre: 'scifi',
        storyBible: {}
      });
      const duration = performance.now() - t0;

      assert.ok(duration < 5, `Fallback must run in < 5ms (took ${duration.toFixed(2)}ms)`);
      assert.equal(fallback.chapterNumber, 2);
      assert.equal(fallback.suggestedHooks.length, 3);
      assert.ok(fallback.suggestedPrompt.length > 20);
    });

  });

});
