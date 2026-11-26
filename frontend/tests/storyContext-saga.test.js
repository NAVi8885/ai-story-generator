import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Normalizes chapter payload into canonical Chapter schema:
 * { number: number, title: string, content: string, thinking: string, timestamp: string }
 */
export function normalizeChapter(raw, defaultIndex = 0) {
  if (typeof raw === 'string') {
    return {
      number: defaultIndex + 1,
      title: `Chapter ${defaultIndex + 1}`,
      content: raw.trim(),
      thinking: '',
      timestamp: new Date().toISOString()
    };
  }

  const parsedNum = typeof raw?.number === 'number'
    ? raw.number
    : parseInt(raw?.number, 10);

  const num = !isNaN(parsedNum) && parsedNum > 0
    ? parsedNum
    : defaultIndex + 1;

  return {
    number: num,
    title: raw?.title?.trim() || `Chapter ${num}`,
    content: raw?.content || raw?.prose || '',
    thinking: raw?.thinking || '',
    timestamp: raw?.timestamp || new Date().toISOString()
  };
}

describe('StoryContext Saga Engine & Per-Chapter Data Architecture Unit Tests', () => {

  describe('normalizeChapter Schema Conformance', () => {
    test('normalizes plain text string into canonical Chapter schema', () => {
      const normalized = normalizeChapter('Once upon a midnight dreary...', 0);
      assert.strictEqual(normalized.number, 1);
      assert.strictEqual(normalized.title, 'Chapter 1');
      assert.strictEqual(normalized.content, 'Once upon a midnight dreary...');
      assert.strictEqual(normalized.thinking, '');
      assert.ok(typeof normalized.timestamp === 'string');
    });

    test('normalizes object with string number and missing thinking', () => {
      const raw = {
        number: '3',
        content: 'The third gate opened slowly.',
        title: 'The Third Gate'
      };
      const normalized = normalizeChapter(raw, 2);
      assert.strictEqual(normalized.number, 3);
      assert.strictEqual(normalized.title, 'The Third Gate');
      assert.strictEqual(normalized.content, 'The third gate opened slowly.');
      assert.strictEqual(normalized.thinking, '');
      assert.ok(typeof normalized.timestamp === 'string');
    });

    test('handles prose property alias and null thinking safely', () => {
      const raw = {
        title: 'The Abyss',
        prose: 'Darkness stared back.',
        thinking: null
      };
      const normalized = normalizeChapter(raw, 4);
      assert.strictEqual(normalized.number, 5);
      assert.strictEqual(normalized.title, 'The Abyss');
      assert.strictEqual(normalized.content, 'Darkness stared back.');
      assert.strictEqual(normalized.thinking, '');
    });

    test('preserves complete chapter object verbatim', () => {
      const ts = '2026-10-30T12:00:00Z';
      const raw = {
        number: 2,
        title: 'Chapter 2: The Ascent',
        content: 'They began to climb the icy cliffs.',
        thinking: 'Establish physical strain and treacherous footing.',
        timestamp: ts
      };
      const normalized = normalizeChapter(raw, 1);
      assert.strictEqual(normalized.number, 2);
      assert.strictEqual(normalized.title, 'Chapter 2: The Ascent');
      assert.strictEqual(normalized.content, 'They began to climb the icy cliffs.');
      assert.strictEqual(normalized.thinking, 'Establish physical strain and treacherous footing.');
      assert.strictEqual(normalized.timestamp, ts);
    });

    test('safely falls back for NaN, 0, or negative numbers', () => {
      assert.strictEqual(normalizeChapter({ number: 0 }, 1).number, 2);
      assert.strictEqual(normalizeChapter({ number: -5 }, 2).number, 3);
      assert.strictEqual(normalizeChapter({ number: 'invalid' }, 3).number, 4);
    });
  });

  describe('Active Chapter Index Clamping & Bounds Protection', () => {
    function clampIndex(rawIdx, totalChapters, isGenerating = false) {
      if (totalChapters === 0) return 0;
      const maxIdx = isGenerating ? totalChapters : totalChapters - 1;
      const parsed = parseInt(rawIdx, 10);
      return Math.min(Math.max(isNaN(parsed) ? 0 : parsed, 0), Math.max(0, maxIdx));
    }

    test('clamps negative indices to 0', () => {
      assert.strictEqual(clampIndex(-1, 3), 0);
      assert.strictEqual(clampIndex(-99, 3), 0);
    });

    test('clamps excessive indices to totalChapters - 1 when idle', () => {
      assert.strictEqual(clampIndex(10, 3, false), 2);
      assert.strictEqual(clampIndex(3, 3, false), 2);
    });

    test('allows clamping up to totalChapters when isGenerating is true (drafting new chapter)', () => {
      assert.strictEqual(clampIndex(3, 3, true), 3);
      assert.strictEqual(clampIndex(10, 3, true), 3);
    });

    test('parses numeric strings and handles non-numeric strings safely', () => {
      assert.strictEqual(clampIndex('2', 4), 2);
      assert.strictEqual(clampIndex('invalid', 4), 0);
      assert.strictEqual(clampIndex(null, 4), 0);
      assert.strictEqual(clampIndex(undefined, 4), 0);
    });
  });

  describe('Legacy History Restoration Normalization', () => {
    test('normalizes legacy history entry with flat story and thinking into single chapter saga', () => {
      const legacyEntry = {
        prompt: 'A wanderer enters the tavern.',
        genre: 'fantasy',
        story: 'The hearth crackled in the cold.',
        thinking: 'Introduce the stranger with minimal dialogue.',
        chapters: []
      };

      const rawChapters = legacyEntry.chapters || [];
      let restoredChapters = [];

      if (rawChapters.length === 0 && legacyEntry.story) {
        restoredChapters = [{
          number: 1,
          title: 'Chapter 1',
          content: legacyEntry.story,
          thinking: legacyEntry.thinking || '',
          timestamp: new Date().toISOString()
        }];
      }

      assert.strictEqual(restoredChapters.length, 1);
      assert.strictEqual(restoredChapters[0].number, 1);
      assert.strictEqual(restoredChapters[0].content, 'The hearth crackled in the cold.');
      assert.strictEqual(restoredChapters[0].thinking, 'Introduce the stranger with minimal dialogue.');
    });

    test('normalizes legacy multi-chapter history where thinking was omitted', () => {
      const legacyEntry = {
        story: 'Latest chapter content',
        thinking: 'Root level thinking',
        chapters: [
          { number: 1, title: 'Chapter 1', content: 'Ch 1 prose' },
          { number: 2, title: 'Chapter 2', content: 'Ch 2 prose' }
        ]
      };

      const restoredChapters = legacyEntry.chapters.map((ch, idx) => {
        const norm = normalizeChapter(ch, idx);
        if (!norm.thinking && idx === 0 && legacyEntry.thinking) {
          norm.thinking = legacyEntry.thinking;
        }
        return norm;
      });

      assert.strictEqual(restoredChapters.length, 2);
      assert.strictEqual(restoredChapters[0].thinking, 'Root level thinking', 'First chapter inherits root thinking if missing');
      assert.strictEqual(restoredChapters[1].thinking, '', 'Second chapter has clean empty string default thinking');
    });
  });

  describe('Continuation Fallback Synthesizer', () => {
    test('synthesizes high-quality fallback hooks from chapter prose snippet', () => {
      const chapters = [
        {
          number: 1,
          title: 'Chapter 1',
          content: 'The lock yielded with a heavy metallic click. Beyond the threshold lay the obsidian sanctum.',
          thinking: 'Focus on sound and suspense.'
        }
      ];

      const targetChap = chapters[0];
      const snippet = targetChap?.content ? targetChap.content.slice(-250).trim() : '';
      const nextNum = chapters.length + 1;

      const fallback = {
        suggestedPrompt: `Continue into Chapter ${nextNum}. Directly escalate the stakes following: "${snippet.slice(0, 120)}...". Introduce an unforeseen complication and deepen character tension.`,
        chapterNumber: nextNum,
        suggestedHooks: [
          'A sudden complication disrupts the protagonist\'s plans.',
          'A revelation from a trusted ally changes everything.',
          'An unexpected confrontation raises the stakes.'
        ]
      };

      assert.strictEqual(fallback.chapterNumber, 2);
      assert.ok(fallback.suggestedPrompt.includes('Chapter 2'));
      assert.ok(fallback.suggestedPrompt.includes('obsidian sanctum'));
      assert.strictEqual(fallback.suggestedHooks.length, 3);
    });
  });

});
