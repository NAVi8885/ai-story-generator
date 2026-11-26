/**
 * Ambient Audio Generator
 * Procedural Web Audio API soundscape synthesizer with zero external audio dependencies.
 * Synthesizes:
 * - Rain & Storm (pink noise + modulated resonant filter gusts)
 * - Cosmic Drone (dual detuned low-frequency oscillators + sub-bass drone)
 * - Hearth Fire (crackling bandpass noise + randomized ember pop impulses)
 */

export const AMBIENT_PRESETS = [
  { id: 'fireside', name: 'Hearth Fire', icon: 'flame', description: 'Cozy crackling hearth fire with gentle ember pops' },
  { id: 'rain', name: 'Rain & Storm', icon: 'cloud-rain', description: 'Continuous rain shower with atmospheric wind gusts' },
  { id: 'drone', name: 'Cosmic Drone', icon: 'sparkles', description: 'Deep resonant cosmic hum with slow harmonic phasing' }
];

export class AmbientAudioController {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.activeNodes = [];
    this.crackleInterval = null;
    this.currentPreset = 'fireside';
    this.isPlayingState = false;
    this.volume = 0.3;
  }

  _getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    return this.audioCtx;
  }

  _createPinkNoiseBuffer(ctx, duration = 4) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  _startRain(ctx) {
    const noiseBuffer = this._createPinkNoiseBuffer(ctx, 4);

    // Continuous rain noise source
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Lowpass filter for general rain frequency
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    // Wind gust LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(250, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(this.masterGain);

    noiseSource.start();
    lfo.start();

    this.activeNodes.push(noiseSource, filter, lfo, lfoGain);
  }

  _startDrone(ctx) {
    // Primary fundamental oscillator (55Hz - A1)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, ctx.currentTime);

    // Slightly detuned oscillator for slow phasing (55.45Hz)
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(55.45, ctx.currentTime);

    // Deep sub-bass drone (27.5Hz - A0)
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(27.5, ctx.currentTime);

    // Resonant low-pass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, ctx.currentTime);
    filter.Q.setValueAtTime(3.0, ctx.currentTime);

    // Slow filter cutoff modulation
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(60, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const droneMix = ctx.createGain();
    droneMix.gain.setValueAtTime(0.35, ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    sub.connect(filter);
    filter.connect(droneMix);
    droneMix.connect(this.masterGain);

    osc1.start();
    osc2.start();
    sub.start();
    lfo.start();

    this.activeNodes.push(osc1, osc2, sub, filter, lfo, lfoGain, droneMix);
  }

  _startHearth(ctx) {
    // Background gentle hiss
    const noiseBuffer = this._createPinkNoiseBuffer(ctx, 4);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(650, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

    const hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(0.2, ctx.currentTime);

    noiseSource.connect(bandpass);
    bandpass.connect(hissGain);
    hissGain.connect(this.masterGain);
    noiseSource.start();

    this.activeNodes.push(noiseSource, bandpass, hissGain);

    // Procedural crackle & pop impulses
    const triggerCrackle = () => {
      if (!this.isPlayingState || !this.audioCtx) return;
      try {
        const popSource = this.audioCtx.createBufferSource();
        const popBuffer = this.audioCtx.createBuffer(1, Math.floor(this.audioCtx.sampleRate * 0.04), this.audioCtx.sampleRate);
        const data = popBuffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15));
        }

        popSource.buffer = popBuffer;

        const popFilter = this.audioCtx.createBiquadFilter();
        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(1200 + Math.random() * 2800, this.audioCtx.currentTime);
        popFilter.Q.setValueAtTime(4 + Math.random() * 6, this.audioCtx.currentTime);

        const popGain = this.audioCtx.createGain();
        popGain.gain.setValueAtTime(0.25 + Math.random() * 0.45, this.audioCtx.currentTime);

        popSource.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(this.masterGain);

        popSource.start();
        popSource.onended = () => {
          popSource.disconnect();
          popFilter.disconnect();
          popGain.disconnect();
        };
      } catch (e) {
        // Safe pop catch
      }
    };

    const scheduleNextCrackle = () => {
      if (!this.isPlayingState) return;
      triggerCrackle();
      const nextDelay = 80 + Math.random() * 450;
      this.crackleInterval = setTimeout(scheduleNextCrackle, nextDelay);
    };

    scheduleNextCrackle();
  }

  start(presetName = this.currentPreset) {
    const ctx = this._getAudioContext();
    if (!ctx) {
      this.isPlayingState = true;
      this.currentPreset = presetName;
      return;
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    this.stop();

    this.currentPreset = presetName;
    this.isPlayingState = true;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    if (presetName === 'rain') {
      this._startRain(ctx);
    } else if (presetName === 'drone') {
      this._startDrone(ctx);
    } else {
      this._startHearth(ctx);
    }
  }

  stop() {
    this.isPlayingState = false;

    if (this.crackleInterval) {
      clearTimeout(this.crackleInterval);
      this.crackleInterval = null;
    }

    if (this.activeNodes.length > 0) {
      for (const node of this.activeNodes) {
        try {
          if (typeof node.stop === 'function') node.stop();
          node.disconnect();
        } catch (e) {
          // Safe disconnect
        }
      }
      this.activeNodes = [];
    }

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch (e) {
        // Safe disconnect
      }
      this.masterGain = null;
    }
  }

  setPreset(presetName) {
    this.currentPreset = presetName;
    if (this.isPlayingState) {
      this.start(presetName);
    }
  }

  setVolume(newVolume) {
    const clamped = Math.min(Math.max(parseFloat(newVolume) || 0, 0), 1);
    this.volume = clamped;
    if (this.masterGain && this.audioCtx) {
      try {
        this.masterGain.gain.setValueAtTime(clamped, this.audioCtx.currentTime);
      } catch (e) {
        // Safe volume set
      }
    }
  }

  isPlaying() {
    return this.isPlayingState;
  }

  getCurrentPreset() {
    return this.currentPreset;
  }

  getVolume() {
    return this.volume;
  }
}

// Global Singleton Instance
export const ambientAudioController = new AmbientAudioController();
