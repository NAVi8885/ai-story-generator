/**
 * Scene Illustrator & Media Controller (Frontend MVC - Controller Layer)
 * Coordinates scene visual prompt extraction, artwork generation, and downloads.
 */

import { buildByokHeaders } from '../models/streamModel.js';

export async function extractScenePromptRequest({ prose, byok }) {
  try {
    const res = await fetch('/api/image/extract-scene-prompt', {
      method: 'POST',
      headers: buildByokHeaders(byok, true),
      body: JSON.stringify({ prose })
    });
    const data = await res.json();
    const extracted = data?.scenePrompt || data?.prompt || '';
    return extracted;
  } catch {
    return '';
  }
}

export async function generateSceneArtworkRequest({ prompt, stylePreset, byok }) {
  const res = await fetch('/api/image/generate', {
    method: 'POST',
    headers: buildByokHeaders(byok, true),
    body: JSON.stringify({
      prompt,
      stylePreset,
      width: 1024,
      height: 1024
    })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Artwork generation failed');
  }
  return data;
}

export function exportArtworkAction(item, format = 'download') {
  if (!item) return;

  if (format === 'copy') {
    if (navigator?.clipboard && item.dataUrl) {
      navigator.clipboard.writeText(item.dataUrl);
    }
    return;
  }

  const link = document.createElement('a');
  link.href = item.dataUrl || item.imageUrl;
  link.download = `mythos-artwork-${item.stylePreset || 'scene'}-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
