/**
 * Express Server for AI Story Generator
 * Features SSE real-time streaming, multi-provider inference waterfall,
 * granular narrative parameter compiler, and prompt enhancer.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { compileNarrativePayload, parseStoryStreamOutput, sanitizeStreamBuffer } from './lib/promptCompiler.js';
import { routeStoryStream, getActiveProviders } from './lib/providers/router.js';

dotenv.config({ path: '../.env' });
// Fallback if running directly in root or backend
dotenv.config();

function getEnvPath() {
  const rootEnv = path.resolve('../.env');
  if (fs.existsSync(rootEnv)) return rootEnv;
  const localEnv = path.resolve('./.env');
  if (fs.existsSync(localEnv)) return localEnv;
  return rootEnv;
}

function updateEnvFile(updates) {
  const envPath = getEnvPath();
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  for (const [key, val] of Object.entries(updates)) {
    if (val === undefined) continue;
    const cleanVal = (val || '').trim();
    const regex = new RegExp(`^#?\\s*${key}=.*$`, 'm');

    if (regex.test(content)) {
      content = content.replace(regex, cleanVal ? `${key}=${cleanVal}` : `# ${key}=`);
    } else if (cleanVal) {
      content = content.trimEnd() + `\n${key}=${cleanVal}\n`;
    }
  }

  fs.writeFileSync(envPath, content.trim() + '\n', 'utf8');
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration supporting Vite dev ports and local hosts
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Story Generator API v2.0',
    providers: getActiveProviders()
  });
});

// Available Providers Status
app.get('/api/providers/status', (req, res) => {
  res.json({
    activeProviders: getActiveProviders(),
    hasServerGroq: Boolean(process.env.GROQ_API_KEY),
    hasServerGemini: Boolean(process.env.GEMINI_API_KEY),
    hasServerOpenRouter: Boolean(process.env.OPENROUTER_API_KEY),
    hasServerHF: Boolean(process.env.HUGGINGFACE_API_KEY),
    zeroAuthEnabled: true
  });
});

// Save API Keys to Persistent .env and Server Environment
app.post('/api/settings/save-keys', (req, res) => {
  try {
    const { groq, gemini, openrouter, huggingface } = req.body;
    const updates = {};

    if (groq !== undefined) {
      const clean = groq.trim();
      process.env.GROQ_API_KEY = clean;
      updates.GROQ_API_KEY = clean;
    }
    if (gemini !== undefined) {
      const clean = gemini.trim();
      process.env.GEMINI_API_KEY = clean;
      updates.GEMINI_API_KEY = clean;
    }
    if (openrouter !== undefined) {
      const clean = openrouter.trim();
      process.env.OPENROUTER_API_KEY = clean;
      updates.OPENROUTER_API_KEY = clean;
    }
    if (huggingface !== undefined) {
      const clean = huggingface.trim();
      process.env.HUGGINGFACE_API_KEY = clean;
      updates.HUGGINGFACE_API_KEY = clean;
    }

    updateEnvFile(updates);

    console.log('[Settings] Successfully saved and persisted keys:', Object.keys(updates));
    res.json({
      success: true,
      message: 'Keys successfully saved to server environment and persistent .env file',
      activeProviders: getActiveProviders(),
      hasServerGroq: Boolean(process.env.GROQ_API_KEY),
      hasServerGemini: Boolean(process.env.GEMINI_API_KEY),
      hasServerOpenRouter: Boolean(process.env.OPENROUTER_API_KEY),
      hasServerHF: Boolean(process.env.HUGGINGFACE_API_KEY)
    });
  } catch (error) {
    console.error('[Save Keys Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to save keys' });
  }
});

// Test / Validate an API Key against provider API
app.post('/api/settings/validate-key', async (req, res) => {
  const { provider, key } = req.body;
  if (!key || typeof key !== 'string' || !key.trim()) {
    return res.status(400).json({ valid: false, message: 'Key cannot be empty' });
  }
  const cleanKey = key.trim();

  try {
    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${cleanKey}` }
      });
      if (response.ok) {
        return res.json({ valid: true, message: 'Groq API Key is valid and active!' });
      }
      return res.json({ valid: false, message: `Groq rejected key (HTTP ${response.status})` });
    }

    if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
      if (response.ok) {
        return res.json({ valid: true, message: 'Google Gemini API Key is valid!' });
      }
      return res.json({ valid: false, message: `Gemini rejected key (HTTP ${response.status})` });
    }

    if (provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { 'Authorization': `Bearer ${cleanKey}` }
      });
      if (response.ok) {
        return res.json({ valid: true, message: 'OpenRouter API Key is valid!' });
      }
      return res.json({ valid: false, message: `OpenRouter rejected key (HTTP ${response.status})` });
    }

    res.json({ valid: true, message: 'Key saved' });
  } catch (err) {
    res.status(500).json({ valid: false, message: `Validation error: ${err.message}` });
  }
});

// Fast Premise Enhancer
app.post('/api/enhance-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt cannot be empty' });
    }

    const systemPrompt = `You are an expert fiction prompt architect.
Expand this brief idea into a rich, atmospheric 2-3 sentence story premise with vivid sensory anchors, a central protagonist, and an immediate dramatic question.
Do NOT write the story itself. Output ONLY the expanded premise. No introductory fluff.`;

    let expanded = '';
    const abortController = new AbortController();

    await routeStoryStream({
      systemPrompt,
      userMessage: `Initial seed: "${prompt.trim()}"`,
      parameters: { temperature: 0.85, max_tokens: 250 },
      signal: abortController.signal,
      onChunk: (chunk) => {
        if (chunk.type === 'prose') {
          expanded += chunk.text;
        }
      }
    });

    res.json({
      original: prompt,
      enhanced: expanded.trim()
    });
  } catch (error) {
    console.error('[Enhance Prompt Error]:', error.message);
    res.status(500).json({ error: error.message || 'Failed to enhance premise' });
  }
});

// Real-Time SSE Streaming Endpoint
app.post('/api/generate/stream', async (req, res) => {
  const {
    prompt,
    sliders = {},
    genre = 'custom',
    storyBible = {},
    previousChapters = [],
    includeBranchChoices = true
  } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt must be a non-empty string' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const abortController = new AbortController();

  // Send periodic SSE keep-alive comments every 12s to prevent client body timeout
  const keepAliveTimer = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': keep-alive\n\n');
    }
  }, 12000);

  // Handle client disconnection (user abort / tab close)
  res.on('close', () => {
    clearInterval(keepAliveTimer);
    if (!res.writableEnded) {
      console.log(`[Stream Connection] Client disconnected prematurely. Aborting upstream generation.`);
      abortController.abort();
    }
  });

  const sendEvent = (event, data) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Extract BYOK headers if provided by client
    const byok = {
      groq: req.headers['x-byok-groq'],
      gemini: req.headers['x-byok-gemini'],
      openrouter: req.headers['x-byok-openrouter'],
      huggingface: req.headers['x-byok-hf']
    };

    // Compile prompt and parameters
    const payload = compileNarrativePayload({
      prompt: prompt.trim(),
      sliders,
      genre,
      storyBible,
      previousChapters,
      includeBranchChoices
    });

    console.log(`[${new Date().toISOString()}] Streaming narrative generation for: "${prompt.slice(0, 50)}..."`);
    sendEvent('start', { meta: payload.meta, parameters: payload.parameters });

    let fullGeneratedProse = '';
    let fullGeneratedThinking = '';
    let lastSentProse = '';
    let lastSentThinking = '';

    await routeStoryStream({
      systemPrompt: payload.systemPrompt,
      userMessage: payload.userMessage,
      parameters: payload.parameters,
      byok,
      signal: abortController.signal,
      onChunk: (chunk) => {
        if (chunk.type === 'provider' || chunk.type === 'warning' || chunk.type === 'done') {
          sendEvent(chunk.type, chunk);
          return;
        }

        const rawText = chunk.text || '';

        // Provider explicitly marked chunk as thinking (e.g. delta.reasoning)
        if (chunk.type === 'thinking') {
          fullGeneratedThinking += rawText;
          lastSentThinking += rawText;
          sendEvent('chunk', { type: 'thinking', text: rawText });
          return;
        }

        if (chunk.type === 'prose') {
          fullGeneratedProse += rawText;

          // Process full generated prose through real-time sanitizer
          const sanitized = sanitizeStreamBuffer(fullGeneratedProse);

          // Emit thinking delta if extracted from <thinking> tag within prose stream
          if (sanitized.thinking && sanitized.thinking.length > lastSentThinking.length) {
            const thinkingDelta = sanitized.thinking.slice(lastSentThinking.length);
            lastSentThinking = sanitized.thinking;
            sendEvent('chunk', { type: 'thinking', text: thinkingDelta });
          }

          // Emit prose delta strictly when story has started and between delimiters
          if (sanitized.prose && sanitized.prose.length > lastSentProse.length) {
            if (sanitized.prose.startsWith(lastSentProse)) {
              const proseDelta = sanitized.prose.slice(lastSentProse.length);
              lastSentProse = sanitized.prose;
              sendEvent('chunk', { type: 'prose', text: proseDelta });
            } else {
              lastSentProse = sanitized.prose;
              sendEvent('chunk', { type: 'prose', text: sanitized.prose });
            }
          }
        }
      }
    });

    // Parse final structured elements (thinking block, prose, branch choices)
    const combinedForParse = (fullGeneratedThinking ? `<thinking>${fullGeneratedThinking}</thinking>\n` : '') + fullGeneratedProse;
    const parsed = parseStoryStreamOutput(combinedForParse);
    sendEvent('complete', {
      prose: parsed.prose,
      thinking: parsed.thinking,
      branchChoices: parsed.branchChoices,
      timestamp: new Date().toISOString()
    });

    res.write('data: [DONE]\n\n');
    clearInterval(keepAliveTimer);
    res.end();
  } catch (error) {
    clearInterval(keepAliveTimer);
    if (abortController.signal.aborted) {
      console.log('[Stream Connection] Request successfully halted by client.');
      return;
    }

    console.error('[Stream Error]:', error.message);
    sendEvent('error', { error: error.message || 'Stream generation failed' });
    res.end();
  }
});

// Non-streaming Fallback Endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, sliders = {}, genre = 'custom' } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt must be a string' });
    }

    const payload = compileNarrativePayload({ prompt, sliders, genre });
    let text = '';

    await routeStoryStream({
      systemPrompt: payload.systemPrompt,
      userMessage: payload.userMessage,
      parameters: payload.parameters,
      onChunk: (chunk) => {
        if (chunk.type === 'prose' || chunk.type === 'thinking') text += chunk.text;
      }
    });

    const parsed = parseStoryStreamOutput(text);

    res.json({
      story: parsed.prose,
      prose: parsed.prose,
      thinking: parsed.thinking,
      branchChoices: parsed.branchChoices,
      prompt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Generate Error]:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate story' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error Handler]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`════════════════════════════════════════════════`);
  console.log(`🚀 AI Story Generator Server v2.0`);
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Zero-Cost Multi-Provider Router Active`);
  console.log(`════════════════════════════════════════════════`);
});
