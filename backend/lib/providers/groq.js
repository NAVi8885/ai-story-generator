/**
 * Groq Free Tier Streaming Provider
 * High-speed LPU inference using Llama 3.3 70B & 8B models.
 */

export async function streamGroq({
  apiKey,
  systemPrompt,
  userMessage,
  parameters = {},
  model = 'llama-3.3-70b-versatile',
  onChunk,
  signal
}) {
  if (!apiKey) {
    throw new Error('Groq API key is not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
      temperature: parameters.temperature ?? 0.85,
      top_p: parameters.top_p ?? 0.93,
      max_tokens: parameters.max_tokens ?? 2048,
      stream: true
    }),
    signal
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const errorMsg = `Groq API error (${response.status}): ${errorBody.slice(0, 200)}`;
    const err = new Error(errorMsg);
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
        // Ignore partial chunks
      }
    }
  }

  onChunk({ type: 'done' });
}
