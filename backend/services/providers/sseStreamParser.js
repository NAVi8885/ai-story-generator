/**
 * Shared OpenAI-Compatible SSE Stream Consumer
 * Eliminates duplicated ReadableStream/TextDecoder chunk parsing across providers.
 */

export async function consumeOpenAiSseStream(response, onChunk, { supportReasoning = false } = {}) {
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

        if (supportReasoning && delta.reasoning) {
          onChunk({ type: 'thinking', text: delta.reasoning });
        }
        if (delta.content) {
          onChunk({ type: 'prose', text: delta.content });
        }
      } catch {
        // Ignore partial or malformed SSE JSON fragments
      }
    }
  }

  onChunk({ type: 'done' });
}
