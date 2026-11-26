/**
 * Image Style Presets & Visual Utilities
 * Client-side style definitions and prompt builders for the Scene Illustrator.
 */

export const IMAGE_STYLE_PRESETS = {
  dark_fantasy_oil: {
    id: 'dark_fantasy_oil',
    name: 'Dark Fantasy Oil Painting',
    description: 'Heavy impasto brushwork, chiaroscuro lighting, gothic atmosphere',
    promptModifier: 'Dark fantasy oil painting, heavy impasto brushwork, chiaroscuro Rembrandt lighting, rich umber and deep crimson palette, gothic atmosphere, fine art masterpiece, highly detailed',
    negativePrompt: 'blurry, low quality, cartoon, 3d render, oversaturated, plastic, digital gloss, anime'
  },
  cyberpunk_matte: {
    id: 'cyberpunk_matte',
    name: 'Cyberpunk Matte Painting',
    description: 'Neon-lit megacity, volumetric smog, reflective wet asphalt',
    promptModifier: 'Cyberpunk matte painting, sprawling neon-lit megacity, volumetric smog and rain, reflective wet asphalt, holographic signage, dystopian sci-fi realism, cinematic wide shot',
    negativePrompt: 'sunny, pastoral, vintage, low resolution, blurry, rustic, drawing, watercolor'
  },
  graphic_novel_ink: {
    id: 'graphic_novel_ink',
    name: 'Graphic Novel Ink',
    description: 'Dynamic comic book crosshatching, stark chiaroscuro monochrome',
    promptModifier: 'Graphic novel ink illustration, bold dynamic ink lines, dramatic comic book crosshatching, stark chiaroscuro shadows, high-contrast monochrome with vivid selective color, gritty graphic novel cover art',
    negativePrompt: 'photorealistic, soft gradient, 3d render, blurry, messy, digital painting, washed out'
  },
  cinematic_35mm: {
    id: 'cinematic_35mm',
    name: 'Cinematic 35mm Still',
    description: 'Panavision anamorphic lens, Kodak film grain, shallow depth of field',
    promptModifier: 'Cinematic 35mm film still, shot on Panavision anamorphic lens, authentic Kodak film grain, shallow depth of field, dramatic atmospheric lighting, photorealistic cinematic composition, 8k resolution',
    negativePrompt: 'drawing, illustration, cartoon, fake, digital gloss, amateur photography, oversaturated'
  },
  retro_pulp_scifi: {
    id: 'retro_pulp_scifi',
    name: 'Retro Pulp Sci-Fi',
    description: '1950s Astounding Stories aesthetic, vintage gouache, technicolor palette',
    promptModifier: 'Retro pulp sci-fi magazine cover, 1950s Astounding Stories aesthetic, vintage gouache illustration, analog print textures, vibrant retro-futuristic space opera, technicolor palette',
    negativePrompt: 'modern cgi, photorealistic, drab, dark, minimalist, 3d render, flat digital'
  }
};

export const STYLE_PRESET_LIST = Object.values(IMAGE_STYLE_PRESETS);

/**
 * Builds an enhanced visual prompt combining the user prompt and preset modifier.
 * @param {string} prompt - Raw visual prompt.
 * @param {string} stylePresetKey - Preset identifier key.
 * @returns {string} Enhanced prompt ready for image generation.
 */
export function buildEnhancedPrompt(prompt, stylePresetKey = 'dark_fantasy_oil') {
  const preset = IMAGE_STYLE_PRESETS[stylePresetKey] || IMAGE_STYLE_PRESETS.dark_fantasy_oil;
  const cleanPrompt = (prompt || '').trim();
  if (!cleanPrompt) return preset.promptModifier;
  return `${cleanPrompt}, ${preset.promptModifier}`;
}

/**
 * Sanitizes text for safe XML / SVG embedding.
 * @param {string} text - Raw input string.
 * @param {number} maxLen - Maximum character length.
 * @returns {string} Sanitized string.
 */
export function sanitizeSvgText(text, maxLen = 80) {
  return String(text || '')
    .replace(/[<>&"]/g, '')
    .slice(0, maxLen);
}

/**
 * Generates an SVG data URL fallback when remote generation fails or is offline.
 * Works seamlessly across both Node.js (test suites) and browser runtime environments.
 * @param {string} prompt - Scene prompt.
 * @param {string} styleName - Display name of the style.
 * @param {number} width - Target width.
 * @param {number} height - Target height.
 * @returns {string} Base64 data URL.
 */
export function generateFallbackDataUrl(prompt, styleName = 'Artwork', width = 1024, height = 1024) {
  const safePrompt = sanitizeSvgText(prompt || 'Scene Illustration', 80);
  const safeStyleName = sanitizeSvgText(styleName || 'Artwork', 40);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
  <rect x="50" y="50" width="${width - 100}" height="${height - 100}" fill="none" stroke="url(#glow)" stroke-width="1.5" stroke-dasharray="6 6"/>
  <circle cx="${width / 2}" cy="${height * 0.4}" r="90" fill="none" stroke="rgba(99,102,241,0.25)" stroke-width="2"/>
  <path d="M ${width / 2 - 50} ${height * 0.4 + 40} L ${width / 2} ${height * 0.4 - 50} L ${width / 2 + 50} ${height * 0.4 + 40} Z" fill="none" stroke="url(#glow)" stroke-width="2"/>
  <text x="50%" y="${height * 0.62}" text-anchor="middle" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="700" letter-spacing="3">${safeStyleName.toUpperCase()}</text>
  <text x="50%" y="${height * 0.69}" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-style="italic">"${safePrompt}..."</text>
  <text x="50%" y="${height * 0.90}" text-anchor="middle" fill="#475569" font-family="system-ui, -apple-system, sans-serif" font-size="12" letter-spacing="2">MYTHOS STUDIO • SCENE ILLUSTRATOR</text>
</svg>`;

  let base64;
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(svg).toString('base64');
  } else if (typeof btoa !== 'undefined') {
    base64 = btoa(unescape(encodeURIComponent(svg)));
  } else {
    base64 = encodeURIComponent(svg);
    return `data:image/svg+xml;utf8,${base64}`;
  }

  return `data:image/svg+xml;base64,${base64}`;
}
