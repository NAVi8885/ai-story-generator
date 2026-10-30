/**
 * Hugging Face Integration Module
 * Handles communication with Hugging Face Inference API for story generation
 */

import { HfInference } from '@huggingface/inference';
import { buildSystemPrompt } from './promptEngineering.js';

const HF_MODEL = process.env.HF_MODEL || 'mistralai/Mixtral-8x7B-Instruct-v0.1';

let hfClient;

function getHFClient() {
  if (!hfClient) {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY environment variable is not set');
    }
    // Use the new router endpoint instead of deprecated api-inference
    hfClient = new HfInference(apiKey, {
      baseUrl: 'https://router.huggingface.co'
    });
  }
  return hfClient;
}

export async function generateStory(userPrompt) {
  if (!userPrompt || typeof userPrompt !== 'string') {
    throw new Error('Invalid prompt: must be a non-empty string');
  }

  if (userPrompt.length < 10) {
    throw new Error('Prompt too short: must be at least 10 characters');
  }

  if (userPrompt.length > 2000) {
    throw new Error('Prompt too long: must be less than 2000 characters');
  }

  const client = getHFClient();
  const fullPrompt = buildSystemPrompt(userPrompt);

  try {
    const response = await client.textGeneration({
      model: HF_MODEL,
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.75,
        top_p: 0.9,
        return_full_text: false
      }
    });

    if (!response || !response.generated_text) {
      throw new Error('No story generated from model');
    }

    return response.generated_text.trim();
  } catch (error) {
    if (error.message && error.message.includes('API key')) {
      throw new Error('Invalid Hugging Face API key');
    }
    if (error.message && error.message.includes('timeout')) {
      throw new Error('Story generation timed out - please try again');
    }
    if (error.message && error.message.includes('rate limit')) {
      throw new Error('Rate limit exceeded - please try again later');
    }
    throw new Error(`Story generation failed: ${error.message}`);
  }
}
