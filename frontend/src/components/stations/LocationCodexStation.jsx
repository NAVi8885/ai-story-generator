import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Tag,
  Thermometer,
  Sun,
  ShieldAlert,
  Flame,
  Check,
  X,
  BookmarkCheck,
  Flag
} from 'lucide-react';
import { useStory } from '../../context/StoryContext';

const PRESET_LOCATIONS = [
  {
    name: 'Caldera of the Broken Astrolabe',
    geography: 'Subterranean volcanic basin submerged in sulfurous brine',
    hazards: 'Corrosive mist, rising geothermal tide, collapsing basalt arches',
    lighting: 'Bioluminescent cyan lichen casting long, sickly shadows',
    temperature: 'Oppressive humid heat, 39°C',
    faction: 'Archivists Guild'
  },
  {
    name: 'Obsidian Spire - Level 42',
    geography: 'Monolithic cyber-citadel balcony suspended over perpetual smog',
    hazards: 'Volumetric lightning discharges, high-altitude downdrafts, shattered glass flooring',
    lighting: 'Pulsing crimson warning strobes and cascading green neon telemetry',
    temperature: 'Sub-zero windchill, -8°C',
    faction: 'Ironclad Syndicate'
  },
  {
    name: 'The Sunken Scriptorium',
    geography: 'Drowned gothic cathedral library preserved beneath a frozen glacial dome',
    hazards: 'Brittle ice shelves, ancient pressure valves venting supercooled vapor',
    lighting: 'Diffused cerulean sunlight filtering through sixty feet of blue glacial ice',
    temperature: 'Frigid stillness, -2°C',
    faction: 'Order of the Silent Ink'
  }
];

export default function LocationCodexStation() {
  const {
    locationCodex,
    setLocationPins,
    updateLocationField,
    addOrToggleLoreLock,
    removeLoreLock,
    isGenerating
  } = useStory();

  const locationPins = locationCodex?.locationPins || {
    name: '',
    geography: '',
    hazards: '',
    lighting: '',
    temperature: '',
    faction: ''
  };

  const loreMicroLocks = locationCodex?.loreMicroLocks || [];
  const enabledLocksCount = loreMicroLocks.filter((l) => l.enabled).length;

  const [newRuleText, setNewRuleText] = useState('');
  const [newFactionTag, setNewFactionTag] = useState('');

  const handleApplyPreset = (preset) => {
    setLocationPins({
      name: preset.name,
      geography: preset.geography,
      hazards: preset.hazards,
      lighting: preset.lighting,
      temperature: preset.temperature,
      faction: preset.faction
    });
  };

  const handleAddLoreLock = (e) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;

    addOrToggleLoreLock({
      rule: newRuleText.trim(),
      enabled: enabledLocksCount < 2
    });
    setNewRuleText('');
  };

  const handleToggleLock = (lock) => {
    addOrToggleLoreLock({
      id: lock.id,
      rule: lock.rule,
      enabled: !lock.enabled
    });
  };

  return (
    <div className="station-container location-codex-station">
      {/* Location Presets Quick-Picks */}
      <div className="station-control-group">
        <div className="control-label-header">
          <label>Quick Setting Seeds</label>
          <span className="text-faint text-xs">Click to apply</span>
        </div>
        <div className="location-presets-list">
          {PRESET_LOCATIONS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className={`location-preset-chip ${locationPins.name === preset.name ? 'is-active' : ''}`}
              onClick={() => handleApplyPreset(preset)}
              title={`Load ${preset.name}`}
            >
              <Compass size={12} className="chip-icon" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Location Pins Form */}
      <div className="location-pins-form">
        <div className="form-group full-width">
          <label htmlFor="loc-name">Scene Location / Landmark</label>
          <div className="input-with-icon">
            <MapPin size={13} className="field-icon" />
            <input
              id="loc-name"
              type="text"
              className="station-input with-icon"
              value={locationPins.name || ''}
              onChange={(e) => updateLocationField('name', e.target.value)}
              placeholder="e.g. Caldera of the Broken Astrolabe"
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="loc-geography">Terrain & Geography</label>
          <input
            id="loc-geography"
            type="text"
            className="station-input"
            value={locationPins.geography || ''}
            onChange={(e) => updateLocationField('geography', e.target.value)}
            placeholder="e.g. Subterranean volcanic basin submerged in sulfurous brine"
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="loc-hazards">Environmental Hazards</label>
          <div className="input-with-icon">
            <ShieldAlert size={13} className="field-icon text-amber" />
            <input
              id="loc-hazards"
              type="text"
              className="station-input with-icon"
              value={locationPins.hazards || ''}
              onChange={(e) => updateLocationField('hazards', e.target.value)}
              placeholder="e.g. Corrosive mist, rising geothermal tide, collapsing basalt arches"
            />
          </div>
        </div>

        <div className="form-row-halves">
          <div className="form-group">
            <label htmlFor="loc-lighting">Lighting & Visibility</label>
            <div className="input-with-icon">
              <Sun size={13} className="field-icon text-muted" />
              <input
                id="loc-lighting"
                type="text"
                className="station-input with-icon"
                value={locationPins.lighting || ''}
                onChange={(e) => updateLocationField('lighting', e.target.value)}
                placeholder="e.g. Bioluminescent cyan lichen"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="loc-temp">Temperature / Climate</label>
            <div className="input-with-icon">
              <Thermometer size={13} className="field-icon text-muted" />
              <input
                id="loc-temp"
                type="text"
                className="station-input with-icon"
                value={locationPins.temperature || ''}
                onChange={(e) => updateLocationField('temperature', e.target.value)}
                placeholder="e.g. Oppressive heat, 39°C"
              />
            </div>
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="loc-faction">Territorial Domain / Controlling Faction</label>
          <div className="input-with-icon">
            <Flag size={13} className="field-icon text-muted" />
            <input
              id="loc-faction"
              type="text"
              className="station-input with-icon"
              value={locationPins.faction || ''}
              onChange={(e) => updateLocationField('faction', e.target.value)}
              placeholder="e.g. Archivists Guild / Ironclad Syndicate"
            />
          </div>
        </div>
      </div>

      {/* Pinned Lore Micro-Locks Section */}
      <div className="lore-locks-section">
        <div className="lore-locks-header">
          <div className="locks-title-wrap">
            <Lock size={14} className="text-amber" />
            <span className="locks-title">Pinned Lore Micro-Locks</span>
          </div>

          <span className={`locks-badge ${enabledLocksCount >= 2 ? 'badge-max' : ''}`}>
            {enabledLocksCount} / 2 Active in Prompt
          </span>
        </div>

        <p className="lore-locks-subtext">
          Micro-locks enforce immutable physical, magical, or technological rules in the immediate scene.
        </p>

        {/* Add New Rule Input */}
        <form onSubmit={handleAddLoreLock} className="add-lock-form">
          <input
            type="text"
            className="station-input"
            value={newRuleText}
            onChange={(e) => setNewRuleText(e.target.value)}
            placeholder="e.g. Black powder and combustion fail to ignite in the lower vapor strata"
          />
          <button
            type="submit"
            className="station-secondary-btn add-btn"
            disabled={!newRuleText.trim()}
          >
            <Plus size={13} />
            <span>Add Rule</span>
          </button>
        </form>

        {/* Micro-Locks List */}
        <div className="micro-locks-list">
          {loreMicroLocks.length === 0 ? (
            <div className="empty-locks-card">
              <span className="empty-locks-text">No lore micro-locks pinned.</span>
              <button
                type="button"
                className="quick-add-rule-btn"
                onClick={() =>
                  addOrToggleLoreLock({
                    rule: 'Combustion and black powder fail to ignite in the lower vapor strata',
                    enabled: true
                  })
                }
              >
                + Add Example Rule
              </button>
            </div>
          ) : (
            loreMicroLocks.map((lock) => (
              <div
                key={lock.id}
                className={`micro-lock-card ${lock.enabled ? 'is-locked-active' : 'is-unlocked'}`}
              >
                <button
                  type="button"
                  className={`lock-toggle-icon-btn ${lock.enabled ? 'active' : ''}`}
                  onClick={() => handleToggleLock(lock)}
                  title={lock.enabled ? 'Click to Unlock (Disable in Prompt)' : 'Click to Lock (Enable in Prompt)'}
                >
                  {lock.enabled ? <Lock size={13} /> : <Unlock size={13} />}
                </button>

                <p className="lock-rule-text">{lock.rule}</p>

                <button
                  type="button"
                  className="icon-btn-ghost danger"
                  onClick={() => removeLoreLock(lock.id)}
                  title="Remove Rule"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
