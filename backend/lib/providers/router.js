/**
 * Inference Waterfall Router
 * Manages zero-cost model rotation, rate-limit (HTTP 429) fallbacks,
 * BYOK overrides, and real-time streaming chunk delivery.
 */

import { streamGroq } from './groq.js';
import { streamGemini } from './gemini.js';
import { streamOpenRouter } from './openrouter.js';
import { streamHuggingFace } from './huggingface.js';
import { streamPollinations } from './pollinations.js';

export async function routeStoryStream({
  systemPrompt,
  userMessage,
  parameters = {},
  onChunk,
  signal,
  byok = {}
}) {
  // Build dynamic waterfall order
  const providers = [];

  // 1. Check BYOK user overrides first
  if (byok.groq) {
    providers.push({
      id: 'groq-byok',
      name: 'Groq (BYOK: Llama 3.3 70B)',
      execute: (p) => streamGroq({ ...p, apiKey: byok.groq })
    });
  }
  if (byok.gemini) {
    providers.push({
      id: 'gemini-byok',
      name: 'Google Gemini (BYOK: Flash)',
      execute: (p) => streamGemini({ ...p, apiKey: byok.gemini })
    });
  }
  if (byok.openrouter) {
    providers.push({
      id: 'openrouter-byok',
      name: 'OpenRouter (BYOK)',
      execute: (p) => streamOpenRouter({ ...p, apiKey: byok.openrouter })
    });
  }
  if (byok.huggingface) {
    providers.push({
      id: 'hf-byok',
      name: 'Hugging Face (BYOK)',
      execute: (p) => streamHuggingFace({ ...p, apiKey: byok.huggingface })
    });
  }

  // 2. Server-side configured keys
  if (process.env.GROQ_API_KEY) {
    providers.push({
      id: 'groq-server',
      name: 'Groq Llama 3.3 70B (Free Tier)',
      execute: (p) => streamGroq({ ...p, apiKey: process.env.GROQ_API_KEY })
    });
  }

  if (process.env.GEMINI_API_KEY) {
    providers.push({
      id: 'gemini-server',
      name: 'Gemini 1.5 Flash (Free Tier)',
      execute: (p) => streamGemini({ ...p, apiKey: process.env.GEMINI_API_KEY })
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      id: 'openrouter-server',
      name: 'OpenRouter :free models',
      execute: (p) => streamOpenRouter({ ...p, apiKey: process.env.OPENROUTER_API_KEY })
    });
  }

  if (process.env.HUGGINGFACE_API_KEY) {
    providers.push({
      id: 'hf-server',
      name: 'Hugging Face Router',
      execute: (p) => streamHuggingFace({ ...p, apiKey: process.env.HUGGINGFACE_API_KEY })
    });
  }

  // 3. Zero-Auth Fallback (Always active, 100% free, zero configuration needed)
  providers.push({
    id: 'pollinations-free',
    name: 'Zero-Cost Fast Engine (Pollinations)',
    execute: (p) => streamPollinations(p)
  });

  const errors = [];

  for (let i = 0; i < providers.length; i++) {
    if (signal?.aborted) {
      throw new Error('Generation aborted by user');
    }

    const provider = providers[i];
    console.log(`[Inference Router] Attempting inference provider (${i + 1}/${providers.length}): ${provider.name}`);

    // Notify client of active provider
    onChunk({
      type: 'provider',
      provider: provider.name,
      providerId: provider.id
    });

    let hasEmittedContent = false;

    try {
      await provider.execute({
        systemPrompt,
        userMessage,
        parameters,
        signal,
        onChunk: (chunk) => {
          if (chunk.type === 'prose' || chunk.type === 'thinking') {
            hasEmittedContent = true;
          }
          onChunk(chunk);
        }
      });

      // Succeeded!
      console.log(`[Inference Router] Generation completed with ${provider.name}`);
      return;
    } catch (err) {
      console.warn(`[Inference Router] Provider ${provider.name} failed:`, err.message);
      errors.push({ provider: provider.name, error: err.message, status: err.status });

      // If user aborted, do not fallback
      if (signal?.aborted) {
        throw new Error('Generation cancelled by user');
      }

      // If the provider already started streaming text to user, we shouldn't abruptly
      // re-stream a new story from scratch unless it was very short
      if (hasEmittedContent) {
        console.warn(`[Inference Router] Provider failed after streaming began. Concluding stream.`);
        onChunk({ type: 'done' });
        return;
      }

      // Otherwise continue down the waterfall
      if (i < providers.length - 1) {
        onChunk({
          type: 'warning',
          message: `${provider.name} rate-limited or busy. Switching to ${providers[i + 1].name}...`
        });
      }
    }
  }

  // All providers failed
  throw new Error(`All inference providers failed:\n${errors.map(e => `• ${e.provider}: ${e.error}`).join('\n')}`);
}

/**
 * Returns list of currently active inference providers
 */
export function getActiveProviders() {
  const active = [];
  if (process.env.GROQ_API_KEY) active.push('Groq Free Tier');
  if (process.env.GEMINI_API_KEY) active.push('Gemini Flash Free');
  if (process.env.OPENROUTER_API_KEY) active.push('OpenRouter Free');
  if (process.env.HUGGINGFACE_API_KEY) active.push('Hugging Face');
  active.push('Zero-Auth Fast Engine (Pollinations)');
  return active;
}
