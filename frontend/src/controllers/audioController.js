/**
 * Audio Theater Controller (Frontend MVC - Controller Layer)
 * Bridges Web Speech API playback & Web Audio API ambient soundscape controls.
 */

import { tokenizeSentences, mapCharIndexToSentence } from '../models/streamModel.js';
import { ambientAudioController } from '../utils/ambientAudio.js';

export function playSpeechNarration({ text, audioTheater, speechUtteranceRef, dispatchStation }) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (!text || !text.trim()) return;

  window.speechSynthesis.cancel();

  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  let currentParaIdx = 0;

  const playNextParagraph = () => {
    if (currentParaIdx >= paragraphs.length) {
      dispatchStation({ type: 'AUDIO_SET_PLAYBACK_STATE', payload: { isPlaying: false, isPaused: false } });
      dispatchStation({ type: 'AUDIO_SET_ACTIVE_SENTENCE', payload: { paragraphIdx: 0, sentenceIdx: -1 } });
      return;
    }

    const para = paragraphs[currentParaIdx];
    const tokens = tokenizeSentences(para);
    const utter = new SpeechSynthesisUtterance(para);
    speechUtteranceRef.current = utter;

    utter.rate = audioTheater.cadenceRate;
    utter.pitch = audioTheater.pitch;
    utter.volume = audioTheater.volume;

    if (audioTheater.selectedVoiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.voiceURI === audioTheater.selectedVoiceURI);
      if (voice) utter.voice = voice;
    }

    utter.onboundary = (evt) => {
      if (evt.name === 'sentence' || evt.name === 'word') {
        const sentIdx = mapCharIndexToSentence(tokens, evt.charIndex);
        dispatchStation({
          type: 'AUDIO_SET_ACTIVE_SENTENCE',
          payload: { paragraphIdx: currentParaIdx, sentenceIdx: sentIdx }
        });
      }
    };

    utter.onend = () => {
      currentParaIdx++;
      playNextParagraph();
    };

    utter.onerror = () => {
      dispatchStation({ type: 'AUDIO_SET_PLAYBACK_STATE', payload: { isPlaying: false, isPaused: false } });
    };

    dispatchStation({ type: 'AUDIO_SET_PLAYBACK_STATE', payload: { isPlaying: true, isPaused: false } });
    dispatchStation({
      type: 'AUDIO_SET_ACTIVE_SENTENCE',
      payload: { paragraphIdx: currentParaIdx, sentenceIdx: 0 }
    });
    window.speechSynthesis.speak(utter);
  };

  playNextParagraph();
}

export function pauseSpeechNarration(dispatchStation) {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
    dispatchStation({ type: 'AUDIO_SET_PLAYBACK_STATE', payload: { isPlaying: false, isPaused: true } });
  }
}

export function resumeSpeechNarration(dispatchStation) {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.resume();
    dispatchStation({ type: 'AUDIO_SET_PLAYBACK_STATE', payload: { isPlaying: true, isPaused: false } });
  }
}

export function stopSpeechNarration(dispatchStation) {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Safe cancel
    }
  }
  dispatchStation({ type: 'AUDIO_SET_PLAYBACK_STATE', payload: { isPlaying: false, isPaused: false } });
  dispatchStation({ type: 'AUDIO_SET_ACTIVE_SENTENCE', payload: { paragraphIdx: 0, sentenceIdx: -1 } });
}

export function toggleAmbientSoundscape({ forceState, audioTheater, dispatchStation }) {
  const nextState = forceState !== undefined ? Boolean(forceState) : !audioTheater.isAmbientPlaying;
  if (nextState) {
    ambientAudioController.setVolume(audioTheater.ambientVolume);
    ambientAudioController.start(audioTheater.ambientPreset);
  } else {
    ambientAudioController.stop();
  }
  dispatchStation({ type: 'AUDIO_SET_AMBIENT', payload: { isAmbientPlaying: nextState } });
}

export function setAmbientSoundscapePreset({ ambientPreset, dispatchStation }) {
  ambientAudioController.setPreset(ambientPreset);
  dispatchStation({ type: 'AUDIO_SET_AMBIENT', payload: { ambientPreset } });
}

export function setAmbientSoundscapeVolume({ ambientVolume, dispatchStation }) {
  ambientAudioController.setVolume(ambientVolume);
  dispatchStation({ type: 'AUDIO_SET_AMBIENT', payload: { ambientVolume } });
}
