import React, { useState, useEffect } from 'react';
import {
  Settings2,
  KeyRound,
  ShieldCheck,
  Save,
  Check,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useStory } from '../context/StoryContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { byok, saveAndPersistKeys } = useStory();
  const [localKeys, setLocalKeys] = useState(byok);
  const [testStatus, setTestStatus] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showKeys, setShowKeys] = useState({
    groq: false,
    gemini: false,
    openrouter: false,
    huggingface: false
  });

  // Keep local fields in sync with stored keys when opened
  useEffect(() => {
    if (isOpen) {
      setLocalKeys(byok);
      setTestStatus({});
      setStatusMessage('');
    }
  }, [isOpen, byok]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleShowKey = (provider) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleTestKey = async (provider) => {
    const rawKey = localKeys[provider];
    if (!rawKey || !rawKey.trim()) {
      setTestStatus((prev) => ({
        ...prev,
        [provider]: { valid: false, message: 'Please enter an API key first' }
      }));
      return;
    }

    setTestStatus((prev) => ({
      ...prev,
      [provider]: { loading: true, message: 'Verifying credentials...' }
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
    setStatusMessage('Syncing keys to persistent workspace and local storage...');

    const cleaned = {
      groq: (localKeys.groq || '').trim(),
      gemini: (localKeys.gemini || '').trim(),
      openrouter: (localKeys.openrouter || '').trim(),
      huggingface: (localKeys.huggingface || '').trim()
    };

    const result = await saveAndPersistKeys(cleaned);

    setIsSaving(false);
    if (result && result.success) {
      setStatusMessage('✓ Keys saved to environment and local storage.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setStatusMessage(result?.error || '✓ Keys saved to local storage.');
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content studio-panel settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Settings2 className="modal-icon-svg" size={18} />
            <h2>Inference Engine & BYOK Keys</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close settings (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        <div className="callout-banner">
          <ShieldCheck size={16} className="callout-icon" />
          <div className="callout-text">
            <strong>Workspace-Level Key Persistence</strong>
            <p>
              Custom API keys are saved directly to your local browser storage and mirrored to the local <code>.env</code> file for instant zero-latency routing.
            </p>
          </div>
        </div>

        <div className="settings-fields-list">
          {/* Groq Key */}
          <div className="setting-field-card">
            <div className="setting-header-row">
              <label htmlFor="groq-key-input" className="setting-label">
                <span className="provider-name">Groq API Key</span>
                <span className="provider-tier">Free Tier • Qwen 3.8 27B / Allam 2 7B</span>
              </label>
              <button
                type="button"
                className="test-key-btn"
                onClick={() => handleTestKey('groq')}
                disabled={!localKeys.groq?.trim() || testStatus.groq?.loading}
              >
                <RefreshCw size={12} className={testStatus.groq?.loading ? 'spin-icon' : ''} />
                <span>{testStatus.groq?.loading ? 'Testing...' : 'Test Key'}</span>
              </button>
            </div>

            <div className="input-with-reveal">
              <input
                id="groq-key-input"
                type={showKeys.groq ? 'text' : 'password'}
                className={`studio-input ${testStatus.groq?.valid ? 'valid-border' : testStatus.groq?.valid === false ? 'invalid-border' : ''}`}
                placeholder="gsk_..."
                value={localKeys.groq || ''}
                onChange={(e) => setLocalKeys({ ...localKeys, groq: e.target.value })}
              />
              <button
                type="button"
                className="reveal-btn"
                onClick={() => toggleShowKey('groq')}
                aria-label={showKeys.groq ? 'Hide key' : 'Show key'}
              >
                {showKeys.groq ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {testStatus.groq?.message && (
              <div className={`key-status-row ${testStatus.groq.valid ? 'success' : 'error'}`}>
                {testStatus.groq.valid ? <Check size={13} /> : <AlertCircle size={13} />}
                <span>{testStatus.groq.message}</span>
              </div>
            )}

            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="key-external-link">
              <span>Get free key at console.groq.com</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Google Gemini Key */}
          <div className="setting-field-card">
            <div className="setting-header-row">
              <label htmlFor="gemini-key-input" className="setting-label">
                <span className="provider-name">Google Gemini API Key</span>
                <span className="provider-tier">Free Tier • Gemini 1.5 Flash</span>
              </label>
              <button
                type="button"
                className="test-key-btn"
                onClick={() => handleTestKey('gemini')}
                disabled={!localKeys.gemini?.trim() || testStatus.gemini?.loading}
              >
                <RefreshCw size={12} className={testStatus.gemini?.loading ? 'spin-icon' : ''} />
                <span>{testStatus.gemini?.loading ? 'Testing...' : 'Test Key'}</span>
              </button>
            </div>

            <div className="input-with-reveal">
              <input
                id="gemini-key-input"
                type={showKeys.gemini ? 'text' : 'password'}
                className={`studio-input ${testStatus.gemini?.valid ? 'valid-border' : testStatus.gemini?.valid === false ? 'invalid-border' : ''}`}
                placeholder="AIzaSy..."
                value={localKeys.gemini || ''}
                onChange={(e) => setLocalKeys({ ...localKeys, gemini: e.target.value })}
              />
              <button
                type="button"
                className="reveal-btn"
                onClick={() => toggleShowKey('gemini')}
                aria-label={showKeys.gemini ? 'Hide key' : 'Show key'}
              >
                {showKeys.gemini ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {testStatus.gemini?.message && (
              <div className={`key-status-row ${testStatus.gemini.valid ? 'success' : 'error'}`}>
                {testStatus.gemini.valid ? <Check size={13} /> : <AlertCircle size={13} />}
                <span>{testStatus.gemini.message}</span>
              </div>
            )}

            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="key-external-link">
              <span>Get free key from Google AI Studio</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* OpenRouter Key */}
          <div className="setting-field-card">
            <div className="setting-header-row">
              <label htmlFor="openrouter-key-input" className="setting-label">
                <span className="provider-name">OpenRouter API Key</span>
                <span className="provider-tier">Free Tier & Fallbacks</span>
              </label>
              <button
                type="button"
                className="test-key-btn"
                onClick={() => handleTestKey('openrouter')}
                disabled={!localKeys.openrouter?.trim() || testStatus.openrouter?.loading}
              >
                <RefreshCw size={12} className={testStatus.openrouter?.loading ? 'spin-icon' : ''} />
                <span>{testStatus.openrouter?.loading ? 'Testing...' : 'Test Key'}</span>
              </button>
            </div>

            <div className="input-with-reveal">
              <input
                id="openrouter-key-input"
                type={showKeys.openrouter ? 'text' : 'password'}
                className="studio-input"
                placeholder="sk-or-v1-..."
                value={localKeys.openrouter || ''}
                onChange={(e) => setLocalKeys({ ...localKeys, openrouter: e.target.value })}
              />
              <button
                type="button"
                className="reveal-btn"
                onClick={() => toggleShowKey('openrouter')}
                aria-label={showKeys.openrouter ? 'Hide key' : 'Show key'}
              >
                {showKeys.openrouter ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {testStatus.openrouter?.message && (
              <div className={`key-status-row ${testStatus.openrouter.valid ? 'success' : 'error'}`}>
                {testStatus.openrouter.valid ? <Check size={13} /> : <AlertCircle size={13} />}
                <span>{testStatus.openrouter.message}</span>
              </div>
            )}

            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="key-external-link">
              <span>Get OpenRouter key</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Hugging Face Key */}
          <div className="setting-field-card">
            <div className="setting-header-row">
              <label htmlFor="hf-key-input" className="setting-label">
                <span className="provider-name">Hugging Face API Token</span>
                <span className="provider-tier">Serverless Inference</span>
              </label>
            </div>

            <div className="input-with-reveal">
              <input
                id="hf-key-input"
                type={showKeys.huggingface ? 'text' : 'password'}
                className="studio-input"
                placeholder="hf_..."
                value={localKeys.huggingface || ''}
                onChange={(e) => setLocalKeys({ ...localKeys, huggingface: e.target.value })}
              />
              <button
                type="button"
                className="reveal-btn"
                onClick={() => toggleShowKey('huggingface')}
                aria-label={showKeys.huggingface ? 'Hide key' : 'Show key'}
              >
                {showKeys.huggingface ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="save-status-indicator">
            {statusMessage}
          </div>
        )}

        <div className="modal-footer">
          <span className="esc-hint">Press <kbd>Esc</kbd> to close</span>
          <button
            type="button"
            className="studio-btn primary-generate-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={14} />
            <span>{isSaving ? 'Saving Keys...' : 'Save & Persist Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
