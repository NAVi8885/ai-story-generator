/**
 * Pollinations Zero-Auth Streaming Provider
 * 100% Free, zero-setup, zero-card streaming inference using OpenAI-compatible models.
 */

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
      model: 'openai-fast',
      temperature: parameters.temperature ?? 0.8,
      stream: true
    }),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pollinations API error (${response.status}): ${errorText.slice(0, 200)}`);
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
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        // Model thinking / reasoning chunk
        if (delta.reasoning) {
          onChunk({ type: 'thinking', text: delta.reasoning });
        }
        // Story prose chunk
        if (delta.content) {
          onChunk({ type: 'prose', text: delta.content });
        }
      } catch {
        // Skip unparseable chunks
      }
    }
  }

  onChunk({ type: 'done' });
}
