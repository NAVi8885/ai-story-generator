/**
 * Prose Auditor & Cast Extraction Service (MVC - Service Layer)
 * Combines pure lexical/heuristic models with optional LLM cast analysis.
 */

import { routeStoryStream } from './inferenceRouterService.js';
import {
  SENSORY_LEXICONS,
  CLICHE_DEFINITIONS,
  auditProse,
  extractCastHeuristically
} from '../models/proseAuditModel.js';

export { SENSORY_LEXICONS, CLICHE_DEFINITIONS, auditProse, extractCastHeuristically };

export async function extractCastFromProse(prose, options = {}) {
  const cleanProse = (prose || '').trim();
  if (!cleanProse) return [];

  try {
    const systemPrompt = `You are a fiction analyst. Analyze this story prose and extract the key characters present or speaking into a JSON array.
Format:
[
  {
    "id": "char_1",
    "name": "Character Name",
    "role": "Protagonist" | "Foil" | "Antagonist" | "Ally",
    "psychologicalState": "Current psychological or emotional state",
    "motivation": "Immediate scene motivation",
    "dialogueQuirks": "Speech cadence or quirk",
    "tension": 3
  }
]
Output ONLY valid JSON inside code fences or as a raw array. No commentary.`;

    let rawResponse = '';
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 8000);

    await routeStoryStream({
      systemPrompt,
      userMessage: `Story Prose:\n"""\n${cleanProse.slice(0, 2500)}\n"""`,
      parameters: { temperature: 0.3, max_tokens: 450 },
      byok: options.byok || {},
      signal: abort.signal,
      onChunk: (chunk) => {
        if (chunk.type === 'prose' || chunk.type === 'thinking') {
          rawResponse += chunk.text || '';
        }
      }
    });

    clearTimeout(timer);

    const jsonMatch = rawResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c, i) => ({
          id: c.id || `char_${i + 1}`,
          name: c.name || `Character ${i + 1}`,
          role: ['Protagonist', 'Foil', 'Antagonist', 'Ally'].includes(c.role) ? c.role : (i === 0 ? 'Protagonist' : 'Ally'),
          psychologicalState: c.psychologicalState || 'Guarded and observant',
          motivation: c.motivation || 'Navigating the scene',
          dialogueQuirks: c.dialogueQuirks || 'Crisp, measured speech',
          tension: typeof c.tension === 'number' ? Math.min(Math.max(c.tension, 1), 5) : 3
        }));
      }
    }
  } catch (err) {
    console.log(`[ProseAuditor] LLM cast extraction bypassed (${err.message}), using heuristic.`);
  }

  return extractCastHeuristically(cleanProse);
}
