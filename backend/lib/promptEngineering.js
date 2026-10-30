/**
 * Prompt Engineering Module
 * Re-exports modern narrative compilation while retaining legacy buildSystemPrompt.
 */

import { compileNarrativePayload, GENRE_PRESETS } from './promptCompiler.js';

export function buildSystemPrompt(userPrompt, options = {}) {
  const payload = compileNarrativePayload({
    prompt: userPrompt,
    sliders: options.sliders || {},
    genre: options.genre || 'custom',
    storyBible: options.storyBible || {},
    previousChapters: options.previousChapters || [],
    includeBranchChoices: options.includeBranchChoices ?? true
  });

  return payload.systemPrompt;
}

export { compileNarrativePayload, GENRE_PRESETS };
