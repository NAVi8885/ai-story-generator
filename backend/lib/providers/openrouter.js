/**
 * OpenRouter Free Tier Streaming Provider
 * Accesses open-weights models ending with :free suffix.
 */

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
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'AI Story Generator'
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

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.replace(/^data:\s*/, '');
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          onChunk({ type: 'prose', text: content });
        }
      } catch {
        // Skip partial lines
      }
    }
  }

  onChunk({ type: 'done' });
}
