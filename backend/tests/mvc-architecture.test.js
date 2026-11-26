/**
 * Backend MVC Architecture & Hardening Test Suite
 * Verifies Model, View, Controller, Route, and App composition separation
 * as well as fixed routes and security hardening.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../app.js';
import { sanitizeEnvValue, updateEnvFile, extractByokHeaders } from '../models/settingsModel.js';
import { buildEnhancedPrompt, normalizeSeed } from '../models/imageModel.js';

describe('Backend MVC Architecture & Security Hardening', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('Health controller returns expected v3.0 MVC telemetry', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.ok(Array.isArray(body.providers));
  });

  test('Media controller handles both /api/image/extract-scene-prompt and /api/image/extract-prompt', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      if (String(url).startsWith(baseUrl)) {
        return originalFetch(url, init);
      }
      throw new Error('Offline simulated for heuristic check');
    };

    try {
      const prose = 'Elena stepped into the flooded cathedral bathed in moonlight.';
      const res1 = await fetch(`${baseUrl}/api/image/extract-scene-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prose })
      });
      assert.equal(res1.status, 200);
      const data1 = await res1.json();
      assert.equal(data1.success, true);
      assert.ok(data1.scenePrompt.length > 20);
      assert.equal(data1.prompt, data1.scenePrompt);

      const res2 = await fetch(`${baseUrl}/api/image/extract-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prose })
      });
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.success, true);
      assert.ok(data2.prompt.length > 20);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('Analysis controller /api/audit/prose returns deterministic sensory and cliche audit', async () => {
    const res = await fetch(`${baseUrl}/api/audit/prose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prose: 'Cold crimson shadow fell across the hall. It was a testament to fear.' })
    });
    assert.equal(res.status, 200);
    const report = await res.json();
    assert.equal(report.success, true);
    assert.ok(report.sensory.visual >= 1);
    assert.ok(report.clicheCount >= 1);
  });

  test('Settings controller rejects non-string key payloads and unsupported validation providers', async () => {
    const badSave = await fetch(`${baseUrl}/api/settings/save-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groq: { injected: true } })
    });
    assert.equal(badSave.status, 400);

    const badValidate = await fetch(`${baseUrl}/api/settings/validate-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'unknown_provider', key: 'abc' })
    });
    assert.equal(badValidate.status, 400);
  });

  test('SettingsModel sanitizes CR/LF newlines to prevent .env directive injection', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mythos-env-'));
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'PORT=3001\n# GROQ_API_KEY=\n', 'utf8');

    assert.equal(sanitizeEnvValue('gsk_abc\nPORT=9999\r\n'), 'gsk_abcPORT=9999');

    updateEnvFile({ GROQ_API_KEY: 'gsk_clean\nINJECTED=1' }, envPath);
    const written = fs.readFileSync(envPath, 'utf8');
    assert.ok(!written.includes('\nINJECTED=1'));
    assert.ok(written.includes('GROQ_API_KEY=gsk_cleanINJECTED=1'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('ImageModel and SettingsModel helpers maintain deterministic invariants', () => {
    const byok = extractByokHeaders({ 'x-byok-groq': 'g1', 'x-byok-hf': 'h1' });
    assert.equal(byok.groq, 'g1');
    assert.equal(byok.huggingface, 'h1');
    assert.equal(normalizeSeed(-42), 42);
    assert.equal(normalizeSeed(42.8), 42);
    assert.ok(buildEnhancedPrompt('Stormy cliff', 'dark_fantasy_oil').startsWith('Stormy cliff'));
  });
});
