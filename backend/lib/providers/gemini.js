/**
 * Google Gemini Flash Free Tier Streaming Provider
 * OpenAI-compatible endpoint for Gemini 1.5 Flash / 2.0 Flash with zero credit card.
 */

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

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;

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
    const errorMsg = `Gemini API error (${response.status}): ${errorBody.slice(0, 200)}`;
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
        // Skip unparseable lines
      }
    }
  }

  onChunk({ type: 'done' });
}
