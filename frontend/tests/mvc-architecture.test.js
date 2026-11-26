/**
 * Frontend MVC Architecture & State Integration Test Suite
 * Verifies pure Frontend Models (storyModel, stationModel, streamModel)
 * and Controllers (storyController, mediaController).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  GENRE_PRESETS,
  DEFAULT_SLIDERS,
  MASTER_STYLE_PRESETS,
  normalizeChapter,
  clampChapterIndex,
  buildFallbackNextChapterPrompt,
  normalizeRestoredHistoryEntry,
  buildStoryExportPayload
} from '../src/models/storyModel.js';
import {
  STORAGE_KEYS,
  createInitialStationState,
  stationReducer,
  exportStationSession,
  importStationSession
} from '../src/models/stationModel.js';
import {
  buildByokHeaders,
  sanitizeClientStreamBuffer,
  tokenizeSentences,
  mapCharIndexToSentence
} from '../src/models/streamModel.js';
import { extractScenePromptRequest } from '../src/controllers/mediaController.js';

describe('Frontend MVC Models & Controllers', () => {
  test('StoryModel normalizes chapters, clamps active indices, and formats Markdown/JSON exports', () => {
    assert.ok(GENRE_PRESETS.length >= 7);
    assert.ok(MASTER_STYLE_PRESETS.length >= 5);
    assert.equal(DEFAULT_SLIDERS.pov, 'third_limited');

    const ch = normalizeChapter({ number: '2', prose: 'Cold dawn.' }, 1);
    assert.equal(ch.number, 2);
    assert.equal(ch.content, 'Cold dawn.');

    assert.equal(clampChapterIndex(-5, 3, false), 0);
    assert.equal(clampChapterIndex(99, 3, false), 2);
    assert.equal(clampChapterIndex(3, 3, true), 3);

    const restored = normalizeRestoredHistoryEntry({
      story: 'Legacy text',
      thinking: 'Root blueprint',
      chapters: []
    });
    assert.equal(restored.length, 1);
    assert.equal(restored[0].content, 'Legacy text');
    assert.equal(restored[0].thinking, 'Root blueprint');

    const md = buildStoryExportPayload({
      format: 'markdown',
      prompt: 'Clockwork siege',
      genre: 'fantasy',
      telemetry: { wordCount: 120 },
      chapters: [ch],
      thinking: '',
      story: ch.content,
      branchChoices: [],
      sliders: DEFAULT_SLIDERS,
      storyBible: {},
      stationState: createInitialStationState(),
      activeChapterIndex: 0
    });
    assert.equal(md.mimeType, 'text/markdown');
    assert.ok(md.content.includes('Clockwork siege'));
    assert.ok(md.content.includes('Cold dawn.'));
  });

  test('StoryModel offline fallback synthesis generates Chapter N+1 hook cleanly', () => {
    const fallback = buildFallbackNextChapterPrompt({
      chapters: [{ number: 1, content: 'Elena stepped onto the crumbling viaduct.' }],
      chapIndex: 0,
      story: ''
    });
    assert.equal(fallback.chapterNumber, 2);
    assert.ok(fallback.suggestedPrompt.includes('Chapter 2'));
    assert.equal(fallback.suggestedHooks.length, 3);
  });

  test('StationModel manages reducers and export/import roundtrip across all 6 stations', () => {
    assert.equal(Object.keys(STORAGE_KEYS).length, 6);
    let state = createInitialStationState();
    state = stationReducer(state, {
      type: 'CAST_ADD_CHARACTER',
      payload: { id: 'c1', name: 'Kael', role: 'Protagonist', isPov: true }
    });
    state = stationReducer(state, {
      type: 'LORE_ADD_OR_TOGGLE_LOCK',
      payload: { id: 'l1', rule: 'Iron drains magic', enabled: true }
    });

    const exported = exportStationSession(state);
    const reimported = importStationSession(exported);
    assert.equal(reimported.dramatisPersonae.characters[0].name, 'Kael');
    assert.equal(reimported.locationCodex.loreMicroLocks[0].rule, 'Iron drains magic');
  });

  test('StreamModel isolates thinking/delimiters and maps sentence tokens accurately', () => {
    const headers = buildByokHeaders({ groq: 'gsk_demo', huggingface: 'hf_demo' });
    assert.equal(headers['x-byok-groq'], 'gsk_demo');
    assert.equal(headers['x-byok-hf'], 'hf_demo');

    const sanitized = sanitizeClientStreamBuffer('<thinking>Beat 1</thinking>[STORY_START]Rain fell softly.[STORY_END]');
    assert.equal(sanitized.thinking, 'Beat 1');
    assert.equal(sanitized.prose, 'Rain fell softly.');

    const tokens = tokenizeSentences('First sentence. Second sentence.');
    assert.equal(tokens.length, 2);
    assert.equal(mapCharIndexToSentence(tokens, 20), 1);
  });

  test('MediaController extractScenePromptRequest targets /api/image/extract-scene-prompt with BYOK headers', async () => {
    const originalFetch = globalThis.fetch;
    let capturedUrl = '';
    let capturedHeaders = {};

    globalThis.fetch = async (url, init) => {
      capturedUrl = url;
      capturedHeaders = init.headers;
      return {
        ok: true,
        json: async () => ({ success: true, scenePrompt: 'Lantern-lit pier under storm clouds.' })
      };
    };

    try {
      const result = await extractScenePromptRequest({
        prose: 'A lantern swayed above the flooded pier.',
        byok: { groq: 'gsk_test' }
      });
      assert.equal(capturedUrl, '/api/image/extract-scene-prompt');
      assert.equal(capturedHeaders['x-byok-groq'], 'gsk_test');
      assert.equal(result, 'Lantern-lit pier under storm clouds.');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
