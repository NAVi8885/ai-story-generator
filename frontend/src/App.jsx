import React, { useState } from 'react';
import './App.css';
import PromptInput from './components/PromptInput';
import LoadingIndicator from './components/LoadingIndicator';
import StoryOutput from './components/StoryOutput';

function App() {
  const [prompt, setPrompt] = useState('');
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt first');
      return;
    }

    if (prompt.length < 10) {
      setError('Prompt must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError('');
    setStory('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate story');
      }

      setStory(data.story);
    } catch (err) {
      console.error('Error generating story:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>AI Story Generator</h1>
        <p>Transform your ideas into immersive narratives</p>
      </header>

      <div className="content-wrapper">
        <div className="glass-panel">
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleGenerate}
            disabled={loading}
          />

          <button
            className="glass-button"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Generating...' : '✨ Elaborate Story'}
          </button>
        </div>

        {loading && <LoadingIndicator />}

        <StoryOutput story={story} error={error} />
      </div>
    </div>
  );
}

export default App;
