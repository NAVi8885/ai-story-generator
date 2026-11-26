import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Copy,
  Check,
  Eye,
  Wand2,
  RefreshCw,
  Palette,
  AlertCircle,
  Film,
  Camera,
  Layers,
  X
} from 'lucide-react';
import { useStory } from '../../context/StoryContext';
import { IMAGE_STYLE_PRESETS, STYLE_PRESET_LIST } from '../../utils/imageStylePresets';

export default function SceneIllustratorStation() {
  const {
    sceneIllustrator,
    setImageStyle,
    setCustomImagePrompt,
    setActiveImage,
    triggerPromptExtraction,
    generateSceneArtwork,
    exportArtwork,
    story,
    prompt: storyPremise,
    isGenerating
  } = useStory();

  const currentStylePreset = sceneIllustrator?.stylePreset || 'dark_fantasy_oil';
  const customPrompt = sceneIllustrator?.customPrompt || '';
  const extractedPrompt = sceneIllustrator?.extractedPrompt || '';
  const lastGeneratedImage = sceneIllustrator?.lastGeneratedImage;
  const gallery = sceneIllustrator?.gallery || [];

  const [isExtracting, setIsExtracting] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewModalImg, setPreviewModalImg] = useState(null);

  const activeVisualPrompt = customPrompt || extractedPrompt;

  const handleExtractPrompt = async () => {
    if (!story || !story.trim()) {
      setErrorMessage('Write or generate story prose first to extract visual scenes.');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    setIsExtracting(true);
    setErrorMessage('');
    try {
      const extracted = await triggerPromptExtraction(story);
      if (extracted) {
        setCustomImagePrompt(extracted);
      } else {
        // Local heuristic fallback if backend extraction returned empty
        const firstPara = story.split(/\n\s*\n/).filter(Boolean)[0] || '';
        const fallbackPrompt = firstPara.slice(0, 180).trim();
        setCustomImagePrompt(fallbackPrompt);
      }
    } catch {
      setErrorMessage('Could not extract prompt from prose.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateImage = async () => {
    const promptToUse = activeVisualPrompt.trim() || storyPremise.trim();
    if (!promptToUse) {
      setErrorMessage('Please enter a visual prompt or click "Extract from Prose".');
      setTimeout(() => setErrorMessage(''), 3500);
      return;
    }

    setIsRendering(true);
    setErrorMessage('');
    try {
      await generateSceneArtwork(promptToUse, currentStylePreset);
    } catch (err) {
      setErrorMessage(err.message || 'Artwork generation failed. Please check network/keys.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleCopy = (img) => {
    exportArtwork(img, 'copy');
    setCopiedId(img.timestamp || 'active');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (img) => {
    exportArtwork(img, 'download');
  };

  const activePresetConfig = IMAGE_STYLE_PRESETS[currentStylePreset] || IMAGE_STYLE_PRESETS.dark_fantasy_oil;

  return (
    <div className="station-container scene-illustrator-station">
      {/* Top Action Bar: Extract Prompt */}
      <div className="station-action-bar">
        <button
          type="button"
          className="station-secondary-btn"
          onClick={handleExtractPrompt}
          disabled={isGenerating || isExtracting || !story?.trim()}
          title="Extract visual composition cues from current story prose"
        >
          <Sparkles size={13} className={`btn-icon ${isExtracting ? 'animate-spin' : ''}`} />
          <span>{isExtracting ? 'Analyzing Prose...' : 'Extract from Prose'}</span>
        </button>

        <span className="station-action-hint">
          {story?.trim() ? 'Prose Ready' : 'Awaiting Story'}
        </span>
      </div>

      {errorMessage && (
        <div className="station-notice-banner error" role="alert">
          <AlertCircle size={13} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Visual Prompt Input Area */}
      <div className="station-control-group">
        <label htmlFor="visual-prompt-input">Scene Composition Prompt</label>
        <textarea
          id="visual-prompt-input"
          className="station-textarea"
          rows={3}
          value={customPrompt}
          onChange={(e) => setCustomImagePrompt(e.target.value)}
          placeholder="Describe the visual composition: focal subject, camera angle, atmospheric lighting, architectural detail..."
        />
      </div>

      {/* 5 Art Style Presets */}
      <div className="station-control-group">
        <div className="style-preset-header">
          <label>Art Style Preset</label>
          <span className="style-active-name">{activePresetConfig.name}</span>
        </div>

        <div className="art-styles-grid">
          {STYLE_PRESET_LIST.map((preset) => {
            const isSelected = preset.id === currentStylePreset;
            return (
              <button
                key={preset.id}
                type="button"
                className={`art-style-chip ${isSelected ? 'active-style' : ''}`}
                onClick={() => setImageStyle(preset.id)}
                title={`${preset.name}: ${preset.description}`}
              >
                <Palette size={12} className="style-chip-icon" />
                <span className="style-chip-name">{preset.name}</span>
              </button>
            );
          })}
        </div>

        <p className="style-preset-desc">{activePresetConfig.description}</p>
      </div>

      {/* Generate Artwork Action Button */}
      <div className="generate-artwork-row">
        <button
          type="button"
          className={`station-primary-btn generate-btn ${isRendering ? 'is-rendering' : ''}`}
          onClick={handleGenerateImage}
          disabled={isRendering || isGenerating}
        >
          <Wand2 size={15} className={`btn-icon ${isRendering ? 'animate-spin' : ''}`} />
          <span>{isRendering ? 'Synthesizing Scene Art...' : 'Generate Scene Artwork'}</span>
        </button>
      </div>

      {/* Active Artwork Showcase */}
      {lastGeneratedImage ? (
        <div className="active-artwork-card">
          <div className="artwork-image-wrapper" onClick={() => setPreviewModalImg(lastGeneratedImage)}>
            <img
              src={lastGeneratedImage.imageUrl || lastGeneratedImage.dataUrl}
              alt={lastGeneratedImage.prompt || 'Scene Illustration'}
              className="artwork-preview-img"
              loading="lazy"
            />
            <div className="artwork-overlay-hover">
              <Eye size={20} />
              <span>Enlarge Artwork</span>
            </div>
            <span className="artwork-style-tag">
              {IMAGE_STYLE_PRESETS[lastGeneratedImage.stylePreset]?.name || 'Artwork'}
            </span>
          </div>

          <div className="artwork-details-panel">
            <p className="artwork-prompt-caption">
              "{lastGeneratedImage.prompt || activeVisualPrompt || 'Scene moment'}"
            </p>

            <div className="artwork-actions-row">
              <button
                type="button"
                className="station-secondary-btn btn-sm"
                onClick={() => handleCopy(lastGeneratedImage)}
                title="Copy Base64 Data URL to clipboard"
              >
                {copiedId ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                <span>{copiedId ? 'Copied!' : 'Copy Data'}</span>
              </button>

              <button
                type="button"
                className="station-secondary-btn btn-sm"
                onClick={() => handleDownload(lastGeneratedImage)}
                title="Download PNG image"
              >
                <Download size={12} />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="station-empty-state illustrator-empty">
          <ImageIcon size={26} className="empty-icon" />
          <p className="empty-title">No Scene Artwork Rendered</p>
          <p className="empty-subtitle">
            Extract a visual moment from your chapter and generate a cinematic illustration.
          </p>
        </div>
      )}

      {/* In-UI Gallery Strip */}
      {gallery.length > 0 && (
        <div className="illustrator-gallery-section">
          <div className="gallery-header-row">
            <span className="gallery-title">Session Gallery ({gallery.length})</span>
          </div>
          <div className="gallery-thumbnails-grid">
            {gallery.map((item, idx) => {
              const isCurrent = lastGeneratedImage?.imageUrl === item.imageUrl;
              return (
                <div
                  key={idx}
                  className={`gallery-thumbnail-card ${isCurrent ? 'active-thumb' : ''}`}
                  onClick={() => setActiveImage(item)}
                  title={item.prompt}
                >
                  <img
                    src={item.imageUrl || item.dataUrl}
                    alt={`Scene ${idx + 1}`}
                    className="thumb-img"
                    loading="lazy"
                  />
                  <span className="thumb-idx">#{gallery.length - idx}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Artwork Modal Preview */}
      {previewModalImg && (
        <div className="artwork-modal-backdrop" onClick={() => setPreviewModalImg(null)}>
          <div className="artwork-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {IMAGE_STYLE_PRESETS[previewModalImg.stylePreset]?.name || 'Scene Illustration'}
              </span>
              <button
                type="button"
                className="icon-btn-ghost"
                onClick={() => setPreviewModalImg(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-image-container">
              <img
                src={previewModalImg.imageUrl || previewModalImg.dataUrl}
                alt={previewModalImg.prompt}
                className="modal-full-img"
              />
            </div>

            <p className="modal-prompt-text">{previewModalImg.prompt}</p>

            <div className="modal-actions-row">
              <button
                type="button"
                className="station-secondary-btn"
                onClick={() => handleCopy(previewModalImg)}
              >
                <Copy size={13} />
                <span>Copy Data URL</span>
              </button>
              <button
                type="button"
                className="station-primary-btn"
                onClick={() => handleDownload(previewModalImg)}
              >
                <Download size={13} />
                <span>Download Artwork</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
