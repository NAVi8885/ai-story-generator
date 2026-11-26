/**
 * Google Gemini Flash Free Tier Streaming Provider Adapter
 */

import { consumeOpenAiSseStream } from './sseStreamParser.js';

export async function streamGemini({
  apiKey,
  systemPrompt,
  userMessage,
  parameters = {},
  model = 'gemini-1.5-flash',
  onChunk,
  signal
}) {
  if (!apiKey) {
    throw new Error('Google Gemini API key is not configured');
  }

  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: parameters.temperature ?? 0.8,
      top_p: parameters.top_p ?? 0.95,
      max_tokens: parameters.max_tokens ?? 2048,
      stream: true
    }),
    signal
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const err = new Error(`Gemini API error (${response.status}): ${errorBody.slice(0, 200)}`);
    err.status = response.status;
    throw err;
  }

  await consumeOpenAiSseStream(response, onChunk);
}
