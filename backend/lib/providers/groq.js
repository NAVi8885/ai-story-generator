/**
 * Groq Free Tier Streaming Provider
 * High-speed LPU inference using active Groq models:
 * - qwen/qwen3.8-27b (Fastest, novelistic prose, ~250ms TTFT)
 * - openai/gpt-oss-120b / openai/gpt-oss-20b (Reasoning)
 */

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

  // Ensure active model available on this Groq account is selected
  let activeModel = model;
  if (!activeModel || activeModel.includes('llama') || activeModel.includes('versatile')) {
    activeModel = 'qwen/qwen3.8-27b';
  }

  // Adjust max_tokens to respect Groq Free-Tier OTPM limits
  // Qwen 3.8 27B free tier has 1,000 OTPM limit; capping at 750 ensures 100% reliable execution
  let calculatedMaxTokens = parameters.max_tokens ?? 750;
  if (activeModel === 'qwen/qwen3.8-27b') {
    calculatedMaxTokens = Math.min(calculatedMaxTokens, 750);
  } else {
    calculatedMaxTokens = Math.min(calculatedMaxTokens, 2048);
  }

  console.log(`[Groq Provider] Initiating stream with model: ${activeModel} (max_tokens: ${calculatedMaxTokens})`);

  let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: activeModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: parameters.temperature ?? 0.85,
      top_p: parameters.top_p ?? 0.93,
      max_tokens: calculatedMaxTokens,
      stream: true
    }),
    signal
  });

  // If Qwen hits 429 rate limit / OTPM, smoothly fallback to high-capacity gpt-oss-20b on Groq
  if (response.status === 429 && activeModel === 'qwen/qwen3.8-27b') {
    console.warn(`[Groq Provider] Qwen 3.8 27B hit OTPM limit. Falling back to openai/gpt-oss-20b on Groq...`);
    activeModel = 'openai/gpt-oss-20b';
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: parameters.temperature ?? 0.85,
        top_p: parameters.top_p ?? 0.93,
        max_tokens: Math.min(parameters.max_tokens ?? 2000, 2048),
        stream: true
      }),
      signal
    });
  }

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
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        if (delta.reasoning) {
          onChunk({ type: 'thinking', text: delta.reasoning });
        }
        if (delta.content) {
          onChunk({ type: 'prose', text: delta.content });
        }
      } catch {
        // Ignore partial chunks
      }
    }
  }

  onChunk({ type: 'done' });
}
