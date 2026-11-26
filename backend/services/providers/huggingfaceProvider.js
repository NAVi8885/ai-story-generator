/**
 * Hugging Face Router Provider Adapter
 */

import { HfInference } from '@huggingface/inference';

const HF_MODEL = process.env.HF_MODEL || 'Qwen/Qwen2.5-72B-Instruct';

function getHFClient(customKey) {
  const key = customKey || process.env.HUGGINGFACE_API_KEY;
  if (!key) {
    throw new Error('HUGGINGFACE_API_KEY environment variable is not set');
  }
  return new HfInference(key, {
    baseUrl: 'https://router.huggingface.co'
  });
}

export async function streamHuggingFace({
  apiKey,
  systemPrompt,
  userMessage,
  parameters = {},
  model = HF_MODEL,
  onChunk,
  signal
}) {
  const client = getHFClient(apiKey);

  const hfTimeoutController = new AbortController();
  const timeoutId = setTimeout(() => hfTimeoutController.abort(), 6000);

  const combinedSignal = signal
    ? AbortSignal.any([signal, hfTimeoutController.signal])
    : hfTimeoutController.signal;

  try {
    const stream = client.chatCompletionStream({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: parameters.max_tokens ?? 2048,
      temperature: parameters.temperature ?? 0.8,
      top_p: parameters.top_p ?? 0.9
    });

    for await (const chunk of stream) {
      clearTimeout(timeoutId);
      if (combinedSignal?.aborted) break;
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        onChunk({ type: 'prose', text: content });
      }
    }

    clearTimeout(timeoutId);
    onChunk({ type: 'done' });
  } catch (error) {
    clearTimeout(timeoutId);
    const err = new Error(`Hugging Face inference error: ${error.message}`);
    err.status = error.status || 500;
    throw err;
  }
}

export async function generateStory(userPrompt, options = {}) {
  const client = getHFClient(options.apiKey);
  const model = options.model || HF_MODEL;

  const response = await client.chatCompletion({
    model,
    messages: [
      { role: 'system', content: options.systemPrompt || 'You are an expert fiction author.' },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: options.max_tokens ?? 2048,
    temperature: options.temperature ?? 0.75
  });

  return response.choices?.[0]?.message?.content || '';
}
