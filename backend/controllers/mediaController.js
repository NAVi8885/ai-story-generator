/**
 * Media Controller (MVC - Controller Layer)
 * Handles Scene Illustrator image generation and visual scene prompt extraction.
 */

import { generateArtwork, extractVisualPrompt } from '../services/imageService.js';
import { extractByokHeaders } from '../models/settingsModel.js';
import { presentJsonSuccess, presentJsonError } from '../views/streamView.js';

export async function generateImage(req, res) {
  try {
    const { prompt, stylePreset, width, height, seed, provider } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return presentJsonError(res, 400, 'Prompt must be a non-empty string');
    }

    const byok = extractByokHeaders(req.headers);
    const result = await generateArtwork({
      prompt: prompt.trim(),
      stylePreset,
      width: parseInt(width, 10) || 1024,
      height: parseInt(height, 10) || 1024,
      seed: seed !== undefined ? parseInt(seed, 10) : undefined,
      provider: provider || 'auto',
      byok
    });

    presentJsonSuccess(res, result);
  } catch (error) {
    console.error('[Image Generate Error]:', error.message);
    presentJsonError(res, 500, error.message || 'Failed to generate artwork');
  }
}

export async function extractScenePrompt(req, res) {
  try {
    const { prose } = req.body || {};
    if (!prose || typeof prose !== 'string' || !prose.trim()) {
      return presentJsonError(res, 400, 'Prose must be a non-empty string');
    }

    const byok = extractByokHeaders(req.headers);
    const scenePrompt = await extractVisualPrompt(prose, { byok });
    presentJsonSuccess(res, {
      success: true,
      scenePrompt,
      prompt: scenePrompt
    });
  } catch (error) {
    console.error('[Extract Scene Prompt Error]:', error.message);
    presentJsonError(res, 500, error.message || 'Failed to extract scene prompt');
  }
}
