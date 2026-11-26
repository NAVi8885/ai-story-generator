/**
 * API Routes Registry (MVC - Router Layer)
 * Maps REST and SSE endpoints cleanly to dedicated MVC Controllers.
 */

import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';
import {
  getProvidersStatus,
  saveKeys,
  validateKey
} from '../controllers/settingsController.js';
import {
  generateImage,
  extractScenePrompt
} from '../controllers/mediaController.js';
import {
  extractCast,
  auditProseHandler
} from '../controllers/analysisController.js';
import {
  enhancePrompt,
  generateNextChapterPrompt,
  streamGenerateStory,
  syncGenerateStory
} from '../controllers/storyController.js';

const router = Router();

// Health & Providers
router.get('/health', getHealth);
router.get('/providers/status', getProvidersStatus);

// Settings & BYOK Management
router.post('/settings/save-keys', saveKeys);
router.post('/settings/validate-key', validateKey);

// Story Generation & Continuation
router.post('/enhance-prompt', enhancePrompt);
router.post('/generate-next-chapter-prompt', generateNextChapterPrompt);
router.post('/generate/stream', streamGenerateStory);
router.post('/generate', syncGenerateStory);

// Scene Illustrator Media
router.post('/image/generate', generateImage);
router.post('/image/extract-scene-prompt', extractScenePrompt);
router.post('/image/extract-prompt', extractScenePrompt);

// Cast & Prose Analysis
router.post('/cast/extract', extractCast);
router.post('/audit/prose', auditProseHandler);

export default router;
