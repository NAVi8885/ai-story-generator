import { compileNarrativePayload, parseStoryStreamOutput, sanitizeStreamBuffer } from '../lib/promptCompiler.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n--- SUITE 1: Edge Cases - Empty & Malformed Inputs ---');
{
  const emptyRes = parseStoryStreamOutput('');
  assert(emptyRes.prose === '' && emptyRes.thinking === '' && emptyRes.branchChoices.length === 0, 'Handles empty string gracefully');

  const nullRes = parseStoryStreamOutput(null);
  assert(nullRes.prose === '' && nullRes.thinking === '' && nullRes.branchChoices.length === 0, 'Handles null input gracefully');

  const bufEmpty = sanitizeStreamBuffer('');
  assert(bufEmpty.prose === '' && bufEmpty.thinking === '', 'sanitizeStreamBuffer handles empty string');
}

console.log('\n--- SUITE 2: Edge Cases - Delimiter Variations & Unclosed Tags ---');
{
  // Unclosed <thinking> directly before [STORY_START]
  const unclosedThinking = `<thinking>
Planning narrative beats for Evan...
[STORY_START]
The cold Roman stone bit into his palms.
[STORY_END]`;
  const parsedUnclosed = parseStoryStreamOutput(unclosedThinking);
  assert(parsedUnclosed.thinking.includes('Planning narrative beats'), 'Captures unclosed thinking before [STORY_START]');
  assert(parsedUnclosed.prose === 'The cold Roman stone bit into his palms.', 'Prose extracted cleanly without being swallowed by unclosed thinking');

  // Stream buffer during unclosed thinking transitioning to [STORY_START]
  const streamBuf = sanitizeStreamBuffer(unclosedThinking);
  assert(streamBuf.prose.startsWith('The cold Roman stone bit into his palms.'), 'Streaming sanitizer releases prose when [STORY_START] arrives');

  // Delimiters with lowercase or mixed casing
  const mixedCase = `[story_start]He pulled the lever.[story_end]`;
  const parsedMixed = parseStoryStreamOutput(mixedCase);
  assert(parsedMixed.prose === 'He pulled the lever.', 'Handles case-insensitive story delimiters');

  // Multiple story start tags or noisy preamble
  const noisy = `We need to write a story about Evan. Outline: chapter 1. Let's plan:
[STORY_START]
He opened his eyes under neon rain.
[STORY_END]`;
  const parsedNoisy = parseStoryStreamOutput(noisy);
  assert(parsedNoisy.prose === 'He opened his eyes under neon rain.', 'Strips noisy preamble before [STORY_START]');
  assert(parsedNoisy.thinking.includes('We need to write'), 'Routes noisy preamble to thinking blueprint');
}

console.log('\n--- SUITE 3: Edge Cases - Fallback Branch Choices Parsing ---');
{
  // Choices without [BRANCH_CHOICES] wrapper after [STORY_END]
  const unwrappedAfterEnd = `[STORY_START]
The storm cleared.
[STORY_END]
1. Venture into the dark ruins: Search the collapsed hall.
2. Retreat to the shoreline: Wait for dawn.`;
  const parsedUnwrapped = parseStoryStreamOutput(unwrappedAfterEnd);
  assert(parsedUnwrapped.prose === 'The storm cleared.', 'Prose stops cleanly at [STORY_END]');
  assert(parsedUnwrapped.branchChoices.length === 2, 'Parses unwrapped choices after [STORY_END]');
  assert(parsedUnwrapped.branchChoices[0].title === 'Venture into the dark ruins', 'First choice title parsed correctly');

  // Trailing choices when model completely omitted [STORY_START] and [STORY_END]
  const completelyUntagged = `The storm cleared over the ancient forum. Evan took a deep breath.

1. Venture into the dark ruins: Search the collapsed hall.
2. Retreat to the shoreline: Wait for dawn.`;
  const parsedUntagged = parseStoryStreamOutput(completelyUntagged);
  assert(parsedUntagged.prose.includes('The storm cleared over the ancient forum.'), 'Untagged prose captured');
  assert(!parsedUntagged.prose.includes('1. Venture into'), 'Trailing choices cleanly sliced out of prose');
  assert(parsedUntagged.branchChoices.length === 2, 'Trailing choices captured in branchChoices array');
}

console.log('\n--- SUITE 4: Stream Buffer Delimiter Withholding ---');
{
  // Partial opening tags: should withhold while ambiguous
  assert(sanitizeStreamBuffer('<think').prose === '', 'Withholds partial <think tag');
  assert(sanitizeStreamBuffer('[STORY').prose === '', 'Withholds partial [STORY tag');
  assert(sanitizeStreamBuffer('   <thinking').prose === '', 'Withholds whitespace padded partial tag');

  // Partial trailing delimiter at stream boundary: should not leak partial token like "[STOR"
  const trailingTest = sanitizeStreamBuffer('[STORY_START]The blade was red-hot.[STOR');
  assert(!trailingTest.prose.endsWith('['), 'Withholds partial trailing delimiter');
  assert(trailingTest.prose === 'The blade was red-hot.', 'Trailing partial [STOR is withheld');
}

console.log(`\n========================================`);
console.log(`TOTAL UNIT TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
