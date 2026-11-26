import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Sparkles,
  Star,
  Trash2,
  Edit2,
  Check,
  X,
  Shield,
  Skull,
  UserCheck,
  Eye,
  HeartHandshake
} from 'lucide-react';
import { useStory } from '../../context/StoryContext';

const ROLE_OPTIONS = [
  { value: 'Protagonist', label: 'Protagonist', icon: Star, colorClass: 'role-protagonist' },
  { value: 'Antagonist', label: 'Antagonist', icon: Skull, colorClass: 'role-antagonist' },
  { value: 'Foil', label: 'Foil', icon: Shield, colorClass: 'role-foil' },
  { value: 'Ally', label: 'Ally', icon: HeartHandshake, colorClass: 'role-ally' }
];

export default function DramatisPersonaeStation() {
  const {
    dramatisPersonae,
    addCharacter,
    updateCharacter,
    removeCharacter,
    setActivePov,
    triggerCastExtraction,
    story,
    isGenerating
  } = useStory();

  const characters = dramatisPersonae?.characters || [];
  const activePovId = dramatisPersonae?.activePovId;

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [extractNotice, setExtractNotice] = useState('');

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    name: '',
    role: 'Protagonist',
    psychologicalState: '',
    motivation: '',
    dialogueQuirks: '',
    tension: 3,
    isPov: false
  });

  const handleStartAdd = () => {
    setFormData({
      name: '',
      role: characters.length === 0 ? 'Protagonist' : 'Ally',
      psychologicalState: 'Vigilant, calculating stakes',
      motivation: 'Survive the immediate confrontation',
      dialogueQuirks: 'Speaks in terse, measured cadences',
      tension: 3,
      isPov: characters.length === 0
    });
    setEditingId(null);
    setIsAdding(true);
  };

  const handleStartEdit = (char) => {
    setFormData({
      name: char.name || '',
      role: char.role || 'Ally',
      psychologicalState: char.psychologicalState || '',
      motivation: char.motivation || '',
      dialogueQuirks: char.dialogueQuirks || '',
      tension: parseInt(char.tension, 10) || 3,
      isPov: Boolean(char.isPov)
    });
    setIsAdding(false);
    setEditingId(char.id);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (isAdding) {
      addCharacter({
        name: formData.name.trim(),
        role: formData.role,
        psychologicalState: formData.psychologicalState.trim(),
        motivation: formData.motivation.trim(),
        dialogueQuirks: formData.dialogueQuirks.trim(),
        tension: formData.tension,
        isPov: formData.isPov || characters.length === 0
      });
      setIsAdding(false);
    } else if (editingId) {
      updateCharacter(editingId, {
        name: formData.name.trim(),
        role: formData.role,
        psychologicalState: formData.psychologicalState.trim(),
        motivation: formData.motivation.trim(),
        dialogueQuirks: formData.dialogueQuirks.trim(),
        tension: formData.tension
      });
      if (formData.isPov && editingId !== activePovId) {
        setActivePov(editingId);
      }
      setEditingId(null);
    }
  };

  const handleExtract = () => {
    if (!story || !story.trim()) {
      setExtractNotice('Generate or type prose first to extract characters.');
      setTimeout(() => setExtractNotice(''), 3000);
      return;
    }

    const extracted = triggerCastExtraction(story);
    if (extracted.length > 0) {
      setExtractNotice(`Extracted ${extracted.length} character${extracted.length > 1 ? 's' : ''} from prose!`);
    } else {
      setExtractNotice('No named character entities detected in active prose.');
    }
    setTimeout(() => setExtractNotice(''), 3500);
  };

  const getTensionLabel = (level) => {
    switch (parseInt(level, 10)) {
      case 1: return '1 - Allied / Calm';
      case 2: return '2 - Wary';
      case 3: return '3 - Strained';
      case 4: return '4 - Hostile';
      case 5: return '5 - Lethal Friction';
      default: return `${level} - Moderate`;
    }
  };

  return (
    <div className="station-container dramatis-personae-station">
      {/* Top Action Bar */}
      <div className="station-action-bar">
        <button
          type="button"
          className="station-secondary-btn"
          onClick={handleExtract}
          disabled={isGenerating || !story?.trim()}
          title="Extract characters automatically from current story prose"
        >
          <Sparkles size={13} className="btn-icon" />
          <span>Extract from Prose</span>
        </button>

        <button
          type="button"
          className="station-primary-btn"
          onClick={handleStartAdd}
          disabled={isAdding || editingId !== null}
        >
          <UserPlus size={13} className="btn-icon" />
          <span>Add Character</span>
        </button>
      </div>

      {extractNotice && (
        <div className="station-notice-banner" role="status">
          <Sparkles size={12} />
          <span>{extractNotice}</span>
        </div>
      )}

      {/* Add / Edit Inline Form */}
      {(isAdding || editingId !== null) && (
        <form onSubmit={handleSaveForm} className="character-edit-form">
          <div className="form-header-row">
            <span className="form-title">
              {isAdding ? 'New Character' : `Edit ${formData.name || 'Character'}`}
            </span>
            <button
              type="button"
              className="icon-btn-ghost"
              onClick={handleCancelForm}
              title="Cancel"
            >
              <X size={14} />
            </button>
          </div>

          <div className="form-fields-grid">
            <div className="form-group">
              <label htmlFor="char-name">Character Name</label>
              <input
                id="char-name"
                type="text"
                className="station-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Elena Vance"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="char-role">Narrative Role</label>
              <select
                id="char-role"
                className="station-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="char-psych">Psychological State</label>
              <input
                id="char-psych"
                type="text"
                className="station-input"
                value={formData.psychologicalState}
                onChange={(e) => setFormData({ ...formData, psychologicalState: e.target.value })}
                placeholder="e.g. Hyper-vigilant, carrying repressed survivor guilt"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="char-motivation">Scene Motivation</label>
              <input
                id="char-motivation"
                type="text"
                className="station-input"
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                placeholder="e.g. Recover the astral chronometer before the Iron Syndicate secures it"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="char-quirks">Dialogue Quirks</label>
              <input
                id="char-quirks"
                type="text"
                className="station-input"
                value={formData.dialogueQuirks}
                onChange={(e) => setFormData({ ...formData, dialogueQuirks: e.target.value })}
                placeholder="e.g. Never uses contractions; mutters nautical curses under breath"
              />
            </div>

            <div className="form-group full-width">
              <div className="slider-label-row">
                <label htmlFor="char-tension">Tension Gauge</label>
                <span className="slider-value-readout">{getTensionLabel(formData.tension)}</span>
              </div>
              <input
                id="char-tension"
                type="range"
                min="1"
                max="5"
                step="1"
                className="station-slider"
                value={formData.tension}
                onChange={(e) => setFormData({ ...formData, tension: parseInt(e.target.value, 10) })}
              />
            </div>

            {isAdding && (
              <div className="form-group full-width pov-checkbox-wrap">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isPov}
                    onChange={(e) => setFormData({ ...formData, isPov: e.target.checked })}
                  />
                  <span>Designate as Active POV Camera</span>
                </label>
              </div>
            )}
          </div>

          <div className="form-action-row">
            <button type="button" className="station-secondary-btn" onClick={handleCancelForm}>
              Cancel
            </button>
            <button type="submit" className="station-primary-btn">
              <Check size={13} className="btn-icon" />
              <span>{isAdding ? 'Create Character' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Character Cards List */}
      <div className="characters-roster-list">
        {characters.length === 0 ? (
          <div className="station-empty-state">
            <Users size={28} className="empty-icon" />
            <p className="empty-title">No Characters in Scene Roster</p>
            <p className="empty-subtitle">
              Add key characters manually or click "Extract from Prose" to scan generated fiction.
            </p>
            <button
              type="button"
              className="station-primary-btn"
              onClick={handleStartAdd}
            >
              <UserPlus size={13} className="btn-icon" />
              <span>Add First Character</span>
            </button>
          </div>
        ) : (
          characters.map((char) => {
            const isPov = char.id === activePovId || Boolean(char.isPov);
            const roleConfig = ROLE_OPTIONS.find((r) => r.value === char.role) || ROLE_OPTIONS[0];
            const RoleIcon = roleConfig.icon;
            const tensionNum = parseInt(char.tension, 10) || 3;

            return (
              <div
                key={char.id}
                className={`character-roster-card ${roleConfig.colorClass} ${isPov ? 'active-pov-card' : ''}`}
              >
                {/* Card Header */}
                <div className="char-card-header">
                  <div className="char-identification">
                    <span className="char-name">{char.name}</span>
                    <span className={`role-pill ${roleConfig.colorClass}`}>
                      <RoleIcon size={11} className="role-icon" />
                      <span>{char.role}</span>
                    </span>
                  </div>

                  <div className="char-card-controls">
                    {/* POV Camera Toggle */}
                    <button
                      type="button"
                      className={`pov-toggle-btn ${isPov ? 'is-active' : ''}`}
                      onClick={() => setActivePov(char.id)}
                      title={isPov ? 'Active POV Camera' : 'Set as Active POV Camera'}
                      aria-label={`Set ${char.name} as active POV`}
                    >
                      <Eye size={12} className="pov-icon" />
                      <span>{isPov ? 'Active POV' : 'Set POV'}</span>
                    </button>

                    <button
                      type="button"
                      className="icon-btn-ghost"
                      onClick={() => handleStartEdit(char)}
                      title="Edit Character"
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      type="button"
                      className="icon-btn-ghost danger"
                      onClick={() => removeCharacter(char.id)}
                      title="Delete Character"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Card Body Details */}
                <div className="char-card-body">
                  {char.psychologicalState && (
                    <div className="char-detail-row">
                      <span className="detail-label">Mind:</span>
                      <span className="detail-value">{char.psychologicalState}</span>
                    </div>
                  )}

                  {char.motivation && (
                    <div className="char-detail-row">
                      <span className="detail-label">Goal:</span>
                      <span className="detail-value">{char.motivation}</span>
                    </div>
                  )}

                  {char.dialogueQuirks && (
                    <div className="char-detail-row">
                      <span className="detail-label">Voice:</span>
                      <span className="detail-value quirks">{char.dialogueQuirks}</span>
                    </div>
                  )}

                  {/* Tension Gauge */}
                  <div className="char-tension-row">
                    <span className="detail-label">Tension:</span>
                    <div className="tension-dots-bar" title={getTensionLabel(tensionNum)}>
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <span
                          key={lvl}
                          className={`tension-dot lvl-${lvl} ${lvl <= tensionNum ? 'filled' : ''}`}
                        />
                      ))}
                      <span className="tension-numeric">Lv.{tensionNum}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
