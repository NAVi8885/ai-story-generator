import React, { useState } from 'react';
import { useStory } from '../context/StoryContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { byok, setByok } = useStory();
  const [localKeys, setLocalKeys] = useState(byok);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setByok(localKeys);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-area">
            <span className="modal-icon">⚙️</span>
            <h2>Inference Settings & BYOK</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="zero-cost-callout glass-panel">
          <div className="callout-icon">⚡</div>
          <div className="callout-body">
            <strong>Zero-Cost Inference is Active!</strong>
            <p>
              By default, the server rotates through free providers (Groq, Gemini Flash, Pollinations fast engine) at zero cost with no credit card required.
            </p>
          </div>
        </div>

        <p className="modal-subtitle">
          (Optional) If you have personal free-tier keys, paste them below. Keys are stored <strong>strictly in your browser's local storage</strong> and sent via private headers to bypass public quota limits.
        </p>

        <div className="settings-fields">
          <div className="setting-input-group">
            <label>
              <strong>Groq API Key</strong>
              <span className="badge-tag">Free 30 RPM / Llama 3.3 70B</span>
            </label>
            <input
              type="password"
              className="glass-input"
              placeholder="gsk_..."
              value={localKeys.groq}
              onChange={(e) => setLocalKeys({ ...localKeys, groq: e.target.value })}
            />
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="key-link">
              Get free Groq key →
            </a>
          </div>

          <div className="setting-input-group">
            <label>
              <strong>Google Gemini API Key</strong>
              <span className="badge-tag">Free 15 RPM / 1M TPM</span>
            </label>
            <input
              type="password"
              className="glass-input"
              placeholder="AIzaSy..."
              value={localKeys.gemini}
              onChange={(e) => setLocalKeys({ ...localKeys, gemini: e.target.value })}
            />
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="key-link">
              Get free Gemini key from Google AI Studio →
            </a>
          </div>

          <div className="setting-input-group">
            <label>
              <strong>OpenRouter API Key</strong>
              <span className="badge-tag">Free :free models</span>
            </label>
            <input
              type="password"
              className="glass-input"
              placeholder="sk-or-v1-..."
              value={localKeys.openrouter}
              onChange={(e) => setLocalKeys({ ...localKeys, openrouter: e.target.value })}
            />
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="key-link">
              Get OpenRouter key →
            </a>
          </div>

          <div className="setting-input-group">
            <label>
              <strong>Hugging Face API Token</strong>
              <span className="badge-tag">Serverless Router</span>
            </label>
            <input
              type="password"
              className="glass-input"
              placeholder="hf_..."
              value={localKeys.huggingface}
              onChange={(e) => setLocalKeys({ ...localKeys, huggingface: e.target.value })}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="glass-button secondary" onClick={handleSave}>
            {savedNotice ? '✓ Keys Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

