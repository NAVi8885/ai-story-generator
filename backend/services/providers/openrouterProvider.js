/**
 * OpenRouter Free Tier Streaming Provider Adapter
 */

import { consumeOpenAiSseStream } from './sseStreamParser.js';

export async function streamOpenRouter({
  apiKey,
  systemPrompt,
  userMessage,
  parameters = {},
  model = 'meta-llama/llama-3.3-70b-instruct:free',
  onChunk,
  signal
}) {
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      'X-Title': 'Mythos Studio'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: parameters.temperature ?? 0.85,
      top_p: parameters.top_p ?? 0.93,
      max_tokens: parameters.max_tokens ?? 2048,
      stream: true
    }),
    signal
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const err = new Error(`OpenRouter API error (${response.status}): ${errorBody.slice(0, 200)}`);
    err.status = response.status;
    throw err;
  }

  await consumeOpenAiSseStream(response, onChunk);
}
