/**
 * Express Server for AI Story Generator
 * Features SSE real-time streaming, multi-provider inference waterfall,
 * granular narrative parameter compiler, and prompt enhancer.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { compileNarrativePayload, parseStoryStreamOutput } from './lib/promptCompiler.js';
import { routeStoryStream, getActiveProviders } from './lib/providers/router.js';

dotenv.config({ path: '../.env' });
// Fallback if running directly in root or backend
dotenv.config();

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

  // Handle client disconnection (user abort / tab close)
  req.on('close', () => {
    console.log(`[Stream Connection] Client closed connection. Aborting upstream generation.`);
    abortController.abort();
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

    let fullGeneratedText = '';

    await routeStoryStream({
      systemPrompt: payload.systemPrompt,
      userMessage: payload.userMessage,
      parameters: payload.parameters,
      byok,
      signal: abortController.signal,
      onChunk: (chunk) => {
        if (chunk.type === 'prose' || chunk.type === 'thinking') {
          fullGeneratedText += chunk.text;
        }
        sendEvent('chunk', chunk);
      }
    });

    // Parse final structured elements (thinking block, prose, branch choices)
    const parsed = parseStoryStreamOutput(fullGeneratedText);
    sendEvent('complete', {
      prose: parsed.prose,
      thinking: parsed.thinking,
      branchChoices: parsed.branchChoices,
      timestamp: new Date().toISOString()
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
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
        if (chunk.type === 'prose') text += chunk.text;
      }
    });

    const parsed = parseStoryStreamOutput(text);

    res.json({
      story: parsed.prose,
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
