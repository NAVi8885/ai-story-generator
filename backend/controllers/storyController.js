/**
 * Story Controller (MVC - Controller Layer)
 * Orchestrates story streaming, synchronous fallback generation,
 * premise enhancement, and multi-chapter continuation synthesis.
 */

import {
  compileNarrativePayload,
  parseStoryStreamOutput,
  sanitizeStreamBuffer,
  synthesizeHeuristicContinuationHooks
} from '../models/storyModel.js';
import { extractByokHeaders } from '../models/settingsModel.js';
import { routeStoryStream } from '../services/inferenceRouterService.js';
import {
  synthesizeNextChapterPrompt,
  enhancePremiseWithLlm
} from '../services/promptCompilerService.js';
import {
  initSseStream,
  presentJsonSuccess,
  presentJsonError
} from '../views/streamView.js';

export async function enhancePrompt(req, res) {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return presentJsonError(res, 400, 'Prompt cannot be empty');
    }

    const byok = extractByokHeaders(req.headers);
    const enhanced = await enhancePremiseWithLlm(prompt, byok);

    presentJsonSuccess(res, {
      original: prompt,
      enhanced
    });
  } catch (error) {
    console.error('[Enhance Prompt Error]:', error.message);
    presentJsonError(res, 500, error.message || 'Failed to enhance premise');
  }
}

export async function generateNextChapterPrompt(req, res) {
  try {
    const {
      previousChapters = [],
      storyBible = {},
      genre = 'custom',
      lastChapterIndex
    } = req.body || {};

    const cleanGenre = (typeof genre === 'string' && genre.trim()) ? genre.trim().toLowerCase() : 'custom';
    const byok = extractByokHeaders(req.headers);

    const abortController = new AbortController();
    req.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    const result = await synthesizeNextChapterPrompt({
      previousChapters,
      storyBible,
      genre: cleanGenre,
      lastChapterIndex,
      byok,
      signal: abortController.signal,
      timeoutMs: 1800
    });

    presentJsonSuccess(res, result);
  } catch (error) {
    console.error('[Continuation Prompt Error]:', error.message);
    if (res.headersSent || res.writableEnded) {
      return;
    }
    try {
      const fallbackResult = synthesizeHeuristicContinuationHooks({ genre: 'custom' });
      presentJsonSuccess(res, fallbackResult);
    } catch {
      presentJsonError(res, 400, error.message || 'Failed to synthesize next chapter prompt');
    }
  }
}

export async function streamGenerateStory(req, res) {
  const {
    prompt,
    sliders = {},
    genre = 'custom',
    storyBible = {},
    previousChapters = [],
    includeBranchChoices = true,
    dramatisPersonae = [],
    activePovCharacter = null,
    locationPins = null,
    plotCatalyst = null,
    loreMicroLocks = [],
    featureStations = {}
  } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return presentJsonError(res, 400, 'Prompt must be a non-empty string');
  }

  const abortController = new AbortController();
  const { sendEvent, endStream, endWithError } = initSseStream(res, abortController);

  try {
    const byok = extractByokHeaders(req.headers);
    const payload = compileNarrativePayload({
      prompt: prompt.trim(),
      sliders,
      genre,
      storyBible,
      previousChapters,
      includeBranchChoices,
      dramatisPersonae,
      activePovCharacter,
      locationPins,
      plotCatalyst,
      loreMicroLocks,
      featureStations
    });

    console.log(`[${new Date().toISOString()}] Streaming narrative generation for: "${prompt.slice(0, 50)}..."`);
    sendEvent('start', { meta: payload.meta, parameters: payload.parameters });

    let fullGeneratedProse = '';
    let fullGeneratedThinking = '';
    let lastSentProse = '';
    let lastSentThinking = '';

    await routeStoryStream({
      systemPrompt: payload.systemPrompt,
      userMessage: payload.userMessage,
      parameters: payload.parameters,
      byok,
      signal: abortController.signal,
      onChunk: (chunk) => {
        if (chunk.type === 'provider' || chunk.type === 'warning' || chunk.type === 'done') {
          sendEvent(chunk.type, chunk);
          return;
        }

        const rawText = chunk.text || '';

        if (chunk.type === 'thinking') {
          fullGeneratedThinking += rawText;
          lastSentThinking += rawText;
          sendEvent('chunk', { type: 'thinking', text: rawText });
          return;
        }

        if (chunk.type === 'prose') {
          fullGeneratedProse += rawText;
          const sanitized = sanitizeStreamBuffer(fullGeneratedProse);

          if (sanitized.thinking && sanitized.thinking.length > lastSentThinking.length) {
            const thinkingDelta = sanitized.thinking.slice(lastSentThinking.length);
            lastSentThinking = sanitized.thinking;
            sendEvent('chunk', { type: 'thinking', text: thinkingDelta });
          }

          if (sanitized.prose && sanitized.prose.length > lastSentProse.length) {
            if (sanitized.prose.startsWith(lastSentProse)) {
              const proseDelta = sanitized.prose.slice(lastSentProse.length);
              lastSentProse = sanitized.prose;
              sendEvent('chunk', { type: 'prose', text: proseDelta });
            } else {
              lastSentProse = sanitized.prose;
              sendEvent('chunk', { type: 'prose', text: sanitized.prose });
            }
          }
        }
      }
    });

    const combinedForParse = (fullGeneratedThinking ? `<thinking>${fullGeneratedThinking}</thinking>\n` : '') + fullGeneratedProse;
    const parsed = parseStoryStreamOutput(combinedForParse);
    sendEvent('complete', {
      prose: parsed.prose,
      thinking: parsed.thinking,
      branchChoices: parsed.branchChoices,
      timestamp: new Date().toISOString()
    });

    endStream();
  } catch (error) {
    if (abortController.signal.aborted) {
      endStream();
      console.log('[Stream Connection] Request successfully halted by client.');
      return;
    }

    console.error('[Stream Error]:', error.message);
    endWithError(error.message || 'Stream generation failed');
  }
}

export async function syncGenerateStory(req, res) {
  try {
    const {
      prompt,
      sliders = {},
      genre = 'custom',
      storyBible = {},
      previousChapters = [],
      includeBranchChoices = true,
      dramatisPersonae = [],
      activePovCharacter = null,
      locationPins = null,
      plotCatalyst = null,
      loreMicroLocks = [],
      featureStations = {}
    } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return presentJsonError(res, 400, 'Prompt must be a string');
    }

    const byok = extractByokHeaders(req.headers);
    const payload = compileNarrativePayload({
      prompt: prompt.trim(),
      sliders,
      genre,
      storyBible,
      previousChapters,
      includeBranchChoices,
      dramatisPersonae,
      activePovCharacter,
      locationPins,
      plotCatalyst,
      loreMicroLocks,
      featureStations
    });
    let text = '';

    await routeStoryStream({
      systemPrompt: payload.systemPrompt,
      userMessage: payload.userMessage,
      parameters: payload.parameters,
      byok,
      onChunk: (chunk) => {
        if (chunk.type === 'prose' || chunk.type === 'thinking') text += chunk.text;
      }
    });

    const parsed = parseStoryStreamOutput(text);

    presentJsonSuccess(res, {
      story: parsed.prose,
      prose: parsed.prose,
      thinking: parsed.thinking,
      branchChoices: parsed.branchChoices,
      prompt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Generate Error]:', error.message);
    presentJsonError(res, 500, error.message || 'Failed to generate story');
  }
}
