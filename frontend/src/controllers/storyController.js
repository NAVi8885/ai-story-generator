/**
 * Story API & SSE Stream Controller (Frontend MVC - Controller Layer)
 * Handles REST & Server-Sent Event streaming communication with the backend.
 */

import { buildByokHeaders } from '../models/streamModel.js';
import { buildFallbackNextChapterPrompt } from '../models/storyModel.js';

export async function enhancePremiseRequest({ prompt, byok }) {
  const res = await fetch('/api/enhance-prompt', {
    method: 'POST',
    headers: buildByokHeaders(byok, true),
    body: JSON.stringify({ prompt: prompt.trim() })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to enhance prompt');
  return data.enhanced || '';
}

export async function saveApiKeysRequest(cleanedKeys) {
  try {
    const res = await fetch('/api/settings/save-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanedKeys)
    });
    return await res.json();
  } catch (err) {
    console.warn('Server key persistence error:', err);
    return { success: false, error: err.message };
  }
}

export async function requestNextChapterPrompt({
  chapters,
  storyBible,
  genre,
  chapIndex,
  byok,
  story
}) {
  try {
    const res = await fetch('/api/generate-next-chapter-prompt', {
      method: 'POST',
      headers: buildByokHeaders(byok, true),
      body: JSON.stringify({
        previousChapters: chapters,
        storyBible,
        genre,
        lastChapterIndex: chapIndex
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.suggestedPrompt && typeof data.chapterNumber === 'number') {
        return {
          suggestedPrompt: data.suggestedPrompt,
          chapterNumber: data.chapterNumber,
          suggestedHooks: Array.isArray(data.suggestedHooks) ? data.suggestedHooks : []
        };
      }
    }
  } catch (err) {
    console.warn('[StoryController] Continuation synthesizer offline or error, utilizing client fallback:', err);
  }

  return buildFallbackNextChapterPrompt({ chapters, chapIndex, story });
}

export async function streamStoryGeneration({
  payload,
  byok,
  signal,
  onProvider,
  onChunk,
  onComplete
}) {
  const response = await fetch('/api/generate/stream', {
    method: 'POST',
    headers: buildByokHeaders(byok, true),
    body: JSON.stringify(payload),
    signal
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Generation failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const evtBlock of events) {
      const lines = evtBlock.split('\n');
      let eventType = 'chunk';
      let dataText = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.replace('event: ', '').trim();
        } else if (line.startsWith('data: ')) {
          dataText = line.replace('data: ', '').trim();
        }
      }

      if (!dataText || dataText === '[DONE]') continue;

      let parsed;
      try {
        parsed = JSON.parse(dataText);
      } catch {
        continue;
      }

      if (eventType === 'provider' || (eventType === 'chunk' && parsed.type === 'provider')) {
        onProvider?.(parsed.provider);
      } else if (eventType === 'chunk') {
        onChunk?.(parsed);
      } else if (eventType === 'complete') {
        onComplete?.(parsed);
      } else if (eventType === 'error') {
        throw new Error(parsed.error || 'Server stream error');
      }
    }
  }
}

export function triggerFileDownload({ content, mimeType, filename }) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
