/**
 * Pollinations Zero-Auth Streaming Provider Adapter
 */

import { consumeOpenAiSseStream } from './sseStreamParser.js';

export async function streamPollinations({
  systemPrompt,
  userMessage,
  parameters = {},
  onChunk,
  signal
}) {
  const response = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: 'openai',
      temperature: parameters.temperature ?? 0.8,
      stream: true
    }),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pollinations API error (${response.status}): ${errorText.slice(0, 200)}`);
  }

  await consumeOpenAiSseStream(response, onChunk, { supportReasoning: true });
}
