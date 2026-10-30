import React, { useState, useEffect } from 'react';
import { useStory } from '../context/StoryContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { byok, saveAndPersistKeys } = useStory();
  const [localKeys, setLocalKeys] = useState(byok);
  const [testStatus, setTestStatus] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Keep local fields in sync with stored keys when opened
  useEffect(() => {
    if (isOpen) {
      setLocalKeys(byok);
      setTestStatus({});
      setStatusMessage('');
    }
  }, [isOpen, byok]);

  if (!isOpen) return null;

  const handleTestKey = async (provider) => {
    const rawKey = localKeys[provider];
    if (!rawKey || !rawKey.trim()) {
      setTestStatus((prev) => ({
        ...prev,
        [provider]: { valid: false, message: 'Please paste a key first' }
      }));
      return;
    }

    setTestStatus((prev) => ({
      ...prev,
      [provider]: { loading: true, message: 'Testing connection...' }
    }));

    try {
      const res = await fetch('/api/settings/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key: rawKey.trim() })
      });
      const data = await res.json();
      setTestStatus((prev) => ({
        ...prev,
        [provider]: { loading: false, valid: data.valid, message: data.message }
      }));
    } catch (err) {
      setTestStatus((prev) => ({
        ...prev,
        [provider]: { loading: false, valid: false, message: `Error: ${err.message}` }
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage('Saving & syncing keys to server and browser...');

    const cleaned = {
      groq: (localKeys.groq || '').trim(),
      gemini: (localKeys.gemini || '').trim(),
      openrouter: (localKeys.openrouter || '').trim(),
      huggingface: (localKeys.huggingface || '').trim()
    };

    const result = await saveAndPersistKeys(cleaned);

    setIsSaving(false);
    if (result && result.success) {
      setStatusMessage('✓ Successfully saved to browser storage and .env file!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setStatusMessage(result?.error || '✓ Saved to browser storage!');
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-area">
            <span className="modal-icon">⚙️</span>
            <h2>Inference Settings & API Keys</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="zero-cost-callout glass-panel">
          <div className="callout-icon">⚡</div>
          <div className="callout-body">
            <strong>Persistent Zero-Cost Inference</strong>
            <p>
              When you paste and save a key below, it is saved <strong>both to your browser's local storage and the server's .env file</strong>, ensuring it persists across reloads and runs at top speed.
            </p>
          </div>
        </div>

        <div className="settings-fields">
          {/* Groq Key */}
          <div className="setting-input-group">
            <div className="setting-header-row">
              <label htmlFor="groq-key-input">
                <strong>Groq API Key</strong>
                <span className="badge-tag">Free 30 RPM • Llama 3.3 70B (250+ tok/s)</span>
              </label>
              <button
                type="button"
                className="test-key-btn"
                onClick={() => handleTestKey('groq')}
                disabled={!localKeys.groq?.trim() || testStatus.groq?.loading}
              >
                {testStatus.groq?.loading ? 'Testing...' : 'Test Key'}
              </button>
            </div>

            <input
              id="groq-key-input"
              type="password"
              className={`glass-input ${testStatus.groq?.valid ? 'valid-border' : testStatus.groq?.valid === false ? 'invalid-border' : ''}`}
              placeholder="gsk_..."
              value={localKeys.groq || ''}
              onChange={(e) => setLocalKeys({ ...localKeys, groq: e.target.value })}
            />

            {testStatus.groq?.message && (
              <div className={`key-status-msg ${testStatus.groq.valid ? 'success' : 'error'}`}>
                {testStatus.groq.valid ? '✓ ' : '✕ '} {testStatus.groq.message}
              </div>
            )}

            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="key-link">
              Get free Groq key at console.groq.com (Zero Card Required) →
            </a>
          </div>

          {/* Google Gemini Key */}
          <div className="setting-input-group">
            <div className="setting-header-row">
              <label htmlFor="gemini-key-input">
                <strong>Google Gemini API Key</strong>
                <span className="badge-tag">Free 15 RPM • 1M TPM (Flash)</span>
              </label>
              <button
                type="button"
                className="test-key-btn"
                onClick={() => handleTestKey('gemini')}
                disabled={!localKeys.gemini?.trim() || testStatus.gemini?.loading}
              >
                {testStatus.gemini?.loading ? 'Testing...' : 'Test Key'}
              </button>
            </div>

            <input
              id="gemini-key-input"
              type="password"
              className={`glass-input ${testStatus.gemini?.valid ? 'valid-border' : testStatus.gemini?.valid === false ? 'invalid-border' : ''}`}
              placeholder="AIzaSy..."
              value={localKeys.gemini || ''}
              onChange={(e) => setLocalKeys({ ...localKeys, gemini: e.target.value })}
            />

            {testStatus.gemini?.message && (
              <div className={`key-status-msg ${testStatus.gemini.valid ? 'success' : 'error'}`}>
                {testStatus.gemini.valid ? '✓ ' : '✕ '} {testStatus.gemini.message}
              </div>
            )}

            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="key-link">
              Get free Gemini key from Google AI Studio →
            </a>
          </div>

          {/* OpenRouter Key */}
          <div className="setting-input-group">
            <div className="setting-header-row">
              <label htmlFor="openrouter-key-input">
                <strong>OpenRouter API Key</strong>
                <span className="badge-tag">Free :free model rotation</span>
              </label>
              <button
                type="button"
                className="test-key-btn"
                onClick={() => handleTestKey('openrouter')}
                disabled={!localKeys.openrouter?.trim() || testStatus.openrouter?.loading}
              >
                {testStatus.openrouter?.loading ? 'Testing...' : 'Test Key'}
              </button>
            </div>

            <input
              id="openrouter-key-input"
              type="password"
              className="glass-input"
              placeholder="sk-or-v1-..."
              value={localKeys.openrouter || ''}
              onChange={(e) => setLocalKeys({ ...localKeys, openrouter: e.target.value })}
            />

            {testStatus.openrouter?.message && (
              <div className={`key-status-msg ${testStatus.openrouter.valid ? 'success' : 'error'}`}>
                {testStatus.openrouter.valid ? '✓ ' : '✕ '} {testStatus.openrouter.message}
              </div>
            )}

            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="key-link">
              Get OpenRouter key →
            </a>
          </div>

          {/* Hugging Face Token */}
          <div className="setting-input-group">
            <label htmlFor="hf-key-input">
              <strong>Hugging Face API Token</strong>
              <span className="badge-tag">Serverless Router</span>
            </label>
            <input
              id="hf-key-input"
              type="password"
              className="glass-input"
              placeholder="hf_..."
              value={localKeys.huggingface || ''}
              onChange={(e) => setLocalKeys({ ...localKeys, huggingface: e.target.value })}
            />
          </div>
        </div>

        {statusMessage && (
          <div className="save-status-banner">
            {statusMessage}
          </div>
        )}

        <div className="modal-footer">
          <button
            className="glass-button primary-generate-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving Keys...' : '💾 Save & Persist Keys'}
          </button>
        </div>
      </div>
    </div>
  );
}
