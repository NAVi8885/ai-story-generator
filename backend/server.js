/**
 * Express Server for AI Story Generator
 * Handles API requests and proxies to Hugging Face
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateStory } from './lib/huggingface.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Story Generator API' });
});

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Missing prompt in request body'
      });
    }

    if (typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt must be a string'
      });
    }

    if (prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt cannot be empty'
      });
    }

    console.log(`[${new Date().toISOString()}] Generating story for prompt: "${prompt.substring(0, 50)}..."`);

    const story = await generateStory(prompt);

    console.log(`[${new Date().toISOString()}] Story generated successfully (${story.length} chars)`);

    res.json({
      story,
      prompt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error generating story:`, error.message);

    if (error.message.includes('too short') || error.message.includes('too long')) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes('API key')) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    res.status(500).json({
      error: error.message || 'Failed to generate story'
    });
  }
});

app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`════════════════════════════════════════════════`);
  console.log(`🚀 AI Story Generator API Server`);
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 HF Model: ${process.env.HF_MODEL || 'mistralai/Mixtral-8x7B-Instruct-v0.1'}`);
  console.log(`════════════════════════════════════════════════`);
});
