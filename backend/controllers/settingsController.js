/**
 * Settings Controller (MVC - Controller Layer)
 * Manages provider availability telemetry, .env persistence, and live key validation.
 */

import { getActiveProviders } from '../services/inferenceRouterService.js';
import {
  buildProviderStatusSnapshot,
  validateAndApplyProviderKeys
} from '../models/settingsModel.js';
import { presentJsonSuccess, presentJsonError } from '../views/streamView.js';

export function getProvidersStatus(req, res) {
  const snapshot = buildProviderStatusSnapshot(getActiveProviders());
  presentJsonSuccess(res, snapshot);
}

export function saveKeys(req, res) {
  try {
    const savedFields = validateAndApplyProviderKeys(req.body || {});
    console.log('[Settings] Successfully saved and persisted keys:', savedFields);

    presentJsonSuccess(res, {
      success: true,
      message: 'Keys successfully saved to server environment and persistent .env file',
      ...buildProviderStatusSnapshot(getActiveProviders())
    });
  } catch (error) {
    console.error('[Save Keys Error]:', error);
    presentJsonError(res, error.status || 500, error.message || 'Failed to save keys');
  }
}

export async function validateKey(req, res) {
  const { provider, key } = req.body || {};
  if (!key || typeof key !== 'string' || !key.trim()) {
    return presentJsonSuccess(res, { valid: false, message: 'Key cannot be empty' }, 400);
  }
  const cleanKey = key.trim();
  const signal = AbortSignal.timeout(8000);

  try {
    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${cleanKey}` },
        signal
      });
      return presentJsonSuccess(res, response.ok
        ? { valid: true, message: 'Groq API Key is valid and active!' }
        : { valid: false, message: `Groq rejected key (HTTP ${response.status})` });
    }

    if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`, {
        signal
      });
      return presentJsonSuccess(res, response.ok
        ? { valid: true, message: 'Google Gemini API Key is valid!' }
        : { valid: false, message: `Gemini rejected key (HTTP ${response.status})` });
    }

    if (provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { 'Authorization': `Bearer ${cleanKey}` },
        signal
      });
      return presentJsonSuccess(res, response.ok
        ? { valid: true, message: 'OpenRouter API Key is valid!' }
        : { valid: false, message: `OpenRouter rejected key (HTTP ${response.status})` });
    }

    if (provider === 'huggingface') {
      const response = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: { 'Authorization': `Bearer ${cleanKey}` },
        signal
      });
      return presentJsonSuccess(res, response.ok
        ? { valid: true, message: 'Hugging Face token is valid!' }
        : { valid: false, message: `Hugging Face rejected token (HTTP ${response.status})` });
    }

    return presentJsonSuccess(res, { valid: false, message: `Unsupported provider "${provider}"` }, 400);
  } catch (err) {
    return presentJsonSuccess(res, { valid: false, message: `Validation error: ${err.message}` }, 500);
  }
}
