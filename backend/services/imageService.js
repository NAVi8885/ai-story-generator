/**
 * Image Generation & Scene Visualization Service (MVC - Service Layer)
 * Orchestrates Hugging Face BYOK, Pollinations zero-auth, SVG data URL fallback,
 * and LLM/heuristic visual scene prompt extraction.
 */

import { HfInference } from '@huggingface/inference';
import { routeStoryStream } from './inferenceRouterService.js';
import {
  IMAGE_STYLE_PRESETS,
  buildEnhancedPrompt,
  sanitizeSvgText,
  generateFallbackDataUrl,
  normalizeSeed,
  synthesizeHeuristicVisualPrompt
} from '../models/imageModel.js';

export { IMAGE_STYLE_PRESETS, buildEnhancedPrompt, sanitizeSvgText, generateFallbackDataUrl };

async function generateHuggingFace({ prompt, negativePrompt, apiKey, width = 1024, height = 1024, seed }) {
  const hf = new HfInference(apiKey);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const blob = await hf.textToImage({
      model: 'stabilityai/stable-diffusion-xl-base-1.0',
      inputs: prompt,
      parameters: {
        negative_prompt: negativePrompt,
        width: Math.min(width, 1024),
        height: Math.min(height, 1024),
        seed
      }
    }, { signal: controller.signal });

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mime = blob.type || 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } finally {
    clearTimeout(timer);
  }
}

async function generatePollinations({ finalPrompt, width = 1024, height = 1024, seed }) {
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(pollinationsUrl, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Pollinations HTTP error: ${res.status} ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Invalid content-type from Pollinations: ${contentType}`);
    }
    const dataUrl = `data:${contentType};base64,${base64}`;
    return { imageUrl: pollinationsUrl, dataUrl };
  } finally {
    clearTimeout(timer);
  }
}

export async function generateArtwork({
  prompt,
  stylePreset = 'dark_fantasy_oil',
  width = 1024,
  height = 1024,
  seed,
  provider = 'auto',
  byok = {}
}) {
  const cleanPrompt = (prompt || '').trim();
  const presetKey = IMAGE_STYLE_PRESETS[stylePreset] ? stylePreset : 'dark_fantasy_oil';
  const preset = IMAGE_STYLE_PRESETS[presetKey];
  const finalSeed = normalizeSeed(seed);

  const enhancedPrompt = buildEnhancedPrompt(cleanPrompt, presetKey);
  const pollinationsDirectUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&seed=${finalSeed}&nologo=true`;

  const hfKey = byok?.huggingface || process.env.HUGGINGFACE_API_KEY;
  if ((provider === 'huggingface' || provider === 'auto') && hfKey) {
    try {
      console.log(`[ImageService] Attempting generation via Hugging Face (seed: ${finalSeed})...`);
      const hfDataUrl = await generateHuggingFace({
        prompt: enhancedPrompt,
        negativePrompt: preset.negativePrompt,
        apiKey: hfKey,
        width,
        height,
        seed: finalSeed
      });

      return {
        success: true,
        provider: 'huggingface',
        imageUrl: pollinationsDirectUrl,
        dataUrl: hfDataUrl,
        prompt: cleanPrompt,
        enhancedPrompt,
        stylePreset: presetKey,
        seed: finalSeed,
        width,
        height
      };
    } catch (err) {
      console.warn(`[ImageService] Hugging Face generation failed (${err.message}). Falling back to Pollinations.`);
    }
  }

  try {
    console.log(`[ImageService] Generating artwork via Pollinations.ai (seed: ${finalSeed})...`);
    const { imageUrl, dataUrl } = await generatePollinations({
      finalPrompt: enhancedPrompt,
      width,
      height,
      seed: finalSeed
    });

    return {
      success: true,
      provider: 'pollinations',
      imageUrl,
      dataUrl,
      prompt: cleanPrompt,
      enhancedPrompt,
      stylePreset: presetKey,
      seed: finalSeed,
      width,
      height
    };
  } catch (err) {
    console.warn(`[ImageService] Pollinations generation failed (${err.message}). Falling back to local dataUrl generator.`);
  }

  const fallbackDataUrl = generateFallbackDataUrl(cleanPrompt, preset.name, width, height);
  return {
    success: true,
    provider: 'fallback',
    imageUrl: pollinationsDirectUrl,
    dataUrl: fallbackDataUrl,
    prompt: cleanPrompt,
    enhancedPrompt,
    stylePreset: presetKey,
    seed: finalSeed,
    width,
    height
  };
}

export async function extractVisualPrompt(prose, options = {}) {
  const cleanProse = (prose || '').trim();
  if (!cleanProse) {
    return 'An evocative scene unfolding in dramatic cinematic lighting, rich atmospheric detail.';
  }

  try {
    const promptInstructions = 'You are a cinematic concept artist. Read this story excerpt and extract a concise, highly visual 1-2 sentence prompt describing the opening scene setting, focal subject, dramatic lighting, and mood for an image generator. Return ONLY the visual description, with no preamble, quotes, or markdown.';

    let extractedText = '';
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 8000);

    await routeStoryStream({
      systemPrompt: promptInstructions,
      userMessage: `Story Prose:\n"""\n${cleanProse.slice(0, 1500)}\n"""`,
      parameters: { temperature: 0.5, max_tokens: 120 },
      byok: options.byok || {},
      signal: abort.signal,
      onChunk: (chunk) => {
        if (chunk.type === 'prose' || chunk.type === 'thinking') {
          extractedText += chunk.text || '';
        }
      }
    });

    clearTimeout(timer);
    const cleaned = extractedText
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^"(.*)"$/s, '$1')
      .trim();

    if (cleaned.length > 20) {
      return cleaned;
    }
  } catch (err) {
    console.log(`[ImageService] LLM visual prompt extraction bypassed (${err.message}), using rule-based heuristic.`);
  }

  return synthesizeHeuristicVisualPrompt(cleanProse);
}
