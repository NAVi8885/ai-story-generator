/**
 * Prompt Compiler & Continuation Synthesizer Service (MVC - Service Layer)
 * Orchestrates LLM continuation synthesis under a strict <2000ms SLA
 * with instant deterministic heuristic fallback from the Story Model.
 */

import { routeStoryStream } from './inferenceRouterService.js';
import {
  normalizeChapterExtraction,
  synthesizeHeuristicContinuationHooks,
  compileContinuationPromptPayload
} from '../models/storyModel.js';

export * from '../models/storyModel.js';

export async function synthesizeNextChapterPrompt({
  previousChapters = [],
  storyBible = {},
  genre = 'custom',
  lastChapterIndex,
  byok = {},
  signal = null,
  timeoutMs = 1800
} = {}) {
  const cleanGenre = (typeof genre === 'string' && genre.trim() ? genre.trim().toLowerCase() : 'custom');
  const extraction = normalizeChapterExtraction(previousChapters, lastChapterIndex);
  const { currentChapterNumber, nextChapterNumber, title, prose } = extraction;

  if (signal?.aborted) {
    return synthesizeHeuristicContinuationHooks({
      prose,
      title,
      currentChapterNumber,
      nextChapterNumber,
      genre: cleanGenre,
      storyBible
    });
  }

  const compiled = compileContinuationPromptPayload({
    previousChapters,
    storyBible,
    genre: cleanGenre,
    lastChapterIndex
  });

  const abortController = new AbortController();
  const timer = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);

  if (signal) {
    signal.addEventListener('abort', () => abortController.abort(), { once: true });
  }

  let rawResponse = '';

  try {
    await routeStoryStream({
      systemPrompt: compiled.systemPrompt,
      userMessage: compiled.userMessage,
      parameters: compiled.parameters,
      byok,
      signal: abortController.signal,
      onChunk: (chunk) => {
        if (chunk.type === 'prose' || chunk.type === 'thinking') {
          rawResponse += chunk.text || '';
        }
      }
    });

    clearTimeout(timer);

    const cleanedResponse = rawResponse
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .replace(/```(?:json)?/gi, '')
      .trim();

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (
          parsed &&
          typeof parsed.suggestedPrompt === 'string' &&
          parsed.suggestedPrompt.trim().length > 10
        ) {
          const hooks = Array.isArray(parsed.suggestedHooks)
            ? parsed.suggestedHooks.map(h => String(h).trim()).filter(Boolean)
            : [];
          if (hooks.length >= 3) {
            return {
              suggestedPrompt: parsed.suggestedPrompt.trim(),
              chapterNumber: nextChapterNumber,
              suggestedHooks: hooks.slice(0, 3)
            };
          }
        }
      } catch {
        // Fall back to deterministic heuristic
      }
    }
  } catch (err) {
    console.log(`[ContinuationSynthesizer] LLM synthesis fallback activated: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }

  return synthesizeHeuristicContinuationHooks({
    prose,
    title,
    currentChapterNumber,
    nextChapterNumber,
    genre: cleanGenre,
    storyBible
  });
}

export async function enhancePremiseWithLlm(prompt, byok = {}) {
  const systemPrompt = `You are an expert fiction prompt architect.
Expand this brief idea into a rich, atmospheric 2-3 sentence story premise with vivid sensory anchors, a central protagonist, and an immediate dramatic question.
Do NOT write the story itself. Output ONLY the expanded premise. No introductory fluff.`;

  let expanded = '';
  const abortController = new AbortController();

  await routeStoryStream({
    systemPrompt,
    userMessage: `Initial seed: "${prompt.trim()}"`,
    parameters: { temperature: 0.85, max_tokens: 250 },
    byok,
    signal: abortController.signal,
    onChunk: (chunk) => {
      if (chunk.type === 'prose') {
        expanded += chunk.text;
      }
    }
  });

  return expanded.trim();
}
