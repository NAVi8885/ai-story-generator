/**
 * Groq Free Tier Streaming Provider Adapter
 * High-speed LPU inference using active Groq models with OTPM 429 fallback.
 */

import { consumeOpenAiSseStream } from './sseStreamParser.js';

export async function streamGroq({
  apiKey,
  systemPrompt,
  userMessage,
  parameters = {},
  model = 'qwen/qwen3.8-27b',
  onChunk,
  signal
}) {
  if (!apiKey) {
    throw new Error('Groq API key is not configured');
  }

  let activeModel = model;
  if (!activeModel || activeModel.includes('llama') || activeModel.includes('versatile')) {
    activeModel = 'qwen/qwen3.8-27b';
  }

  const calculatedMaxTokens = activeModel === 'qwen/qwen3.8-27b'
    ? Math.min(parameters.max_tokens ?? 1300, 1300)
    : Math.min(parameters.max_tokens ?? 1300, 2048);

  console.log(`[Groq Provider] Initiating stream with model: ${activeModel} (max_tokens: ${calculatedMaxTokens})`);

  const buildRequest = (targetModel, maxTokens) => fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: targetModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: parameters.temperature ?? 0.85,
      top_p: parameters.top_p ?? 0.93,
      max_tokens: maxTokens,
      stream: true
    }),
    signal
  });

  let response = await buildRequest(activeModel, calculatedMaxTokens);

  if (response.status === 429 && activeModel === 'qwen/qwen3.8-27b') {
    console.warn('[Groq Provider] Qwen 3.8 27B hit OTPM limit. Falling back to allam-2-7b on Groq...');
    activeModel = 'allam-2-7b';
    response = await buildRequest(activeModel, Math.min(parameters.max_tokens ?? 1500, 2048));
  }

  if (!response.ok) {
    const errorBody = await response.text();
    const err = new Error(`Groq API error (${response.status}): ${errorBody.slice(0, 200)}`);
    err.status = response.status;
    throw err;
  }

  await consumeOpenAiSseStream(response, onChunk, { supportReasoning: true });
}
