/**
 * Settings & Environment Persistence Model (MVC - Model Layer)
 * Manages BYOK header extraction, environment variable sanitization,
 * and safe persistence to the workspace .env file.
 */

import fs from 'fs';
import path from 'path';

export function getEnvPath() {
  const rootEnv = path.resolve('../.env');
  if (fs.existsSync(rootEnv)) return rootEnv;
  const localEnv = path.resolve('./.env');
  if (fs.existsSync(localEnv)) return localEnv;
  return rootEnv;
}

/**
 * Strips CR/LF characters so user input cannot inject arbitrary env directives.
 */
export function sanitizeEnvValue(val) {
  if (typeof val !== 'string') return '';
  return val.replace(/[\r\n]+/g, '').trim();
}

export function updateEnvFile(updates, targetEnvPath = getEnvPath()) {
  let content = fs.existsSync(targetEnvPath) ? fs.readFileSync(targetEnvPath, 'utf8') : '';

  for (const [key, val] of Object.entries(updates)) {
    if (val === undefined) continue;
    const cleanVal = sanitizeEnvValue(val);
    const regex = new RegExp(`^#?\\s*${key}=.*$`, 'm');

    if (regex.test(content)) {
      content = content.replace(regex, cleanVal ? `${key}=${cleanVal}` : `# ${key}=`);
    } else if (cleanVal) {
      content = content.trimEnd() + `\n${key}=${cleanVal}\n`;
    }
  }

  fs.writeFileSync(targetEnvPath, content.trim() + '\n', 'utf8');
}

export function extractByokHeaders(headers = {}) {
  return {
    groq: headers['x-byok-groq'],
    gemini: headers['x-byok-gemini'],
    openrouter: headers['x-byok-openrouter'],
    huggingface: headers['x-byok-hf']
  };
}

export function buildProviderStatusSnapshot(activeProviders) {
  return {
    activeProviders,
    hasServerGroq: Boolean(process.env.GROQ_API_KEY),
    hasServerGemini: Boolean(process.env.GEMINI_API_KEY),
    hasServerOpenRouter: Boolean(process.env.OPENROUTER_API_KEY),
    hasServerHF: Boolean(process.env.HUGGINGFACE_API_KEY),
    zeroAuthEnabled: true
  };
}

const KEY_ENV_MAP = {
  groq: 'GROQ_API_KEY',
  gemini: 'GEMINI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  huggingface: 'HUGGINGFACE_API_KEY'
};

export function validateAndApplyProviderKeys(payload = {}, targetEnvPath = getEnvPath()) {
  const updates = {};

  for (const [field, envName] of Object.entries(KEY_ENV_MAP)) {
    const raw = payload[field];
    if (raw === undefined) continue;
    if (typeof raw !== 'string') {
      const err = new Error(`Invalid API key type for provider "${field}": expected string`);
      err.status = 400;
      throw err;
    }
    const clean = sanitizeEnvValue(raw);
    process.env[envName] = clean;
    updates[envName] = clean;
  }

  updateEnvFile(updates, targetEnvPath);
  return Object.keys(updates);
}
