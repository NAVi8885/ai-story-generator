/**
 * Inference Waterfall Router Service (MVC - Service Layer)
 * Manages zero-cost provider rotation, HTTP 429 failover, BYOK precedence,
 * and real-time streaming chunk delivery.
 */

import { streamGroq } from './providers/groqProvider.js';
import { streamGemini } from './providers/geminiProvider.js';
import { streamOpenRouter } from './providers/openrouterProvider.js';
import { streamHuggingFace } from './providers/huggingfaceProvider.js';
import { streamPollinations } from './providers/pollinationsProvider.js';

export async function routeStoryStream({
  systemPrompt,
  userMessage,
  parameters = {},
  onChunk,
  signal,
  byok = {}
}) {
  const providers = [];

  if (byok.groq) {
    providers.push({
      id: 'groq-byok',
      name: 'Groq (BYOK: Qwen 3.8 27B)',
      execute: (p) => streamGroq({ ...p, apiKey: byok.groq, model: 'qwen/qwen3.8-27b' })
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

  if (process.env.GROQ_API_KEY) {
    providers.push({
      id: 'groq-server',
      name: 'Groq (High-Speed Qwen 3.8 27B)',
      execute: (p) => streamGroq({ ...p, apiKey: process.env.GROQ_API_KEY, model: 'qwen/qwen3.8-27b' })
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

      console.log(`[Inference Router] Generation completed with ${provider.name}`);
      return;
    } catch (err) {
      console.warn(`[Inference Router] Provider ${provider.name} failed:`, err.message);
      errors.push({ provider: provider.name, error: err.message, status: err.status });

      if (signal?.aborted) {
        throw new Error('Generation cancelled by user');
      }

      if (hasEmittedContent) {
        console.warn('[Inference Router] Provider failed after streaming began. Concluding stream.');
        onChunk({ type: 'done' });
        return;
      }

      if (i < providers.length - 1) {
        onChunk({
          type: 'warning',
          message: `${provider.name} rate-limited or busy. Switching to ${providers[i + 1].name}...`
        });
      }
    }
  }

  throw new Error(`All inference providers failed:\n${errors.map(e => `• ${e.provider}: ${e.error}`).join('\n')}`);
}

export function getActiveProviders() {
  const active = [];
  if (process.env.GROQ_API_KEY) active.push('Groq Free Tier');
  if (process.env.GEMINI_API_KEY) active.push('Gemini Flash Free');
  if (process.env.OPENROUTER_API_KEY) active.push('OpenRouter Free');
  if (process.env.HUGGINGFACE_API_KEY) active.push('Hugging Face');
  active.push('Zero-Auth Fast Engine (Pollinations)');
  return active;
}
