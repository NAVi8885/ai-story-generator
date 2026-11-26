/**
 * Literary Analysis Controller (MVC - Controller Layer)
 * Handles prose auditing and character cast extraction endpoints.
 */

import { auditProse, extractCastFromProse } from '../services/proseAuditorService.js';
import { extractByokHeaders } from '../models/settingsModel.js';
import { presentJsonSuccess, presentJsonError } from '../views/streamView.js';

export async function extractCast(req, res) {
  try {
    const { prose } = req.body || {};
    if (!prose || typeof prose !== 'string' || !prose.trim()) {
      return presentJsonError(res, 400, 'Prose must be a non-empty string');
    }

    const byok = extractByokHeaders(req.headers);
    const characters = await extractCastFromProse(prose, { byok });
    presentJsonSuccess(res, { success: true, characters });
  } catch (error) {
    console.error('[Cast Extract Error]:', error.message);
    presentJsonError(res, 500, error.message || 'Failed to extract cast');
  }
}

export function auditProseHandler(req, res) {
  try {
    const { prose } = req.body || {};
    if (typeof prose !== 'string') {
      return presentJsonError(res, 400, 'Prose must be a string');
    }

    const auditReport = auditProse(prose);
    presentJsonSuccess(res, auditReport);
  } catch (error) {
    console.error('[Prose Audit Error]:', error.message);
    presentJsonError(res, 500, error.message || 'Failed to audit prose');
  }
}
