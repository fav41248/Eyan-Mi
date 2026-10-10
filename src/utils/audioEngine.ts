/**
 * Eyan mi Soundtrack Audio Engine
 * Provides multiple rich ambient soundscapes & handles custom audio streams.
 * Includes smooth ducking when recorded voice notes are played.
 */

import { SoundtrackPreset } from '../types';

class SoundtrackEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private isMutedState = false;
  private timerId: number | null = null;
  private padTimerId: number | null = null;
  private noteIndex = 0;
  private chordIndex = 0;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private currentPreset: SoundtrackPreset = 'none';
  private customAudioElement: HTMLAudioElement | null = null;

  // Emotional Chord Progressions
  // 1. Acoustic Piano (Warm & Romantic: Cmaj9 -> Am9 -> Fmaj7 -> Gsus4)
  private readonly pianoProgression = [
    {
      bass: 130.81, // C3
      pad: [261.63, 329.63, 392.0, 493.88],
      melody: [523.25, 587.33, 659.25, 493.88, 392.0, 523.25, 659.25],
    },
    {
      bass: 110.0, // A2
      pad: [220.0, 261.63, 329.63, 392.0],
      melody: [440.0, 523.25, 659.25, 587.33, 523.25, 440.0, 493.88],
    },
    {
      bass: 87.31, // F2
      pad: [174.61, 261.63, 329.63, 349.23],
      melody: [349.23, 440.0, 523.25, 659.25, 523.25, 440.0, 392.0],
    },
    {
      bass: 98.0, // G2
      pad: [196.0, 261.63, 293.66, 392.0],
      melody: [392.0, 493.88, 587.33, 523.25, 493.88, 392.0, 329.63],
    },
  ];

  // 2. Lo-Fi Sunset (Mellow & Nostalgic: Dm9 -> G13 -> Cmaj9 -> A7#9)
  private readonly lofiProgression = [
    {
      bass: 73.42, // D2
      pad: [146.83, 220.0, 261.63, 329.63],
      melody: [293.66, 349.23, 440.0, 523.25, 440.0, 349.23],
    },
    {
      bass: 98.0, // G2
      pad: [196.0, 246.94, 293.66, 349.23, 440.0],
      melody: [392.0, 440.0, 493.88, 587.33, 493.88, 392.0],
    },
    {
      bass: 65.41, // C2
      pad: [130.81, 196.0, 246.94, 329.63],
      melody: [261.63, 329.63, 392.0, 493.88, 392.0, 329.63],
    },
  ];

  // 3. Cinematic Strings (Grand & Atmospheric)
  private readonly stringsProgression = [
    {
      bass: 65.41,
      pad: [130.81, 196.0, 261.63, 329.63, 392.0],
      melody: [523.25, 659.25, 783.99, 659.25],
    },
    {
      bass: 87.31,
      pad: [174.61, 220.0, 261.63, 349.23],
      melody: [698.46, 523.25, 659.25, 523.25],
    },
  ];

  // 4. Golden Harp (Celestial Arpeggios)
  private readonly harpProgression = [
    {
      bass: 130.81,
      pad: [261.63, 329.63, 392.0],
      melody: [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25],
    },
    {
      bass: 110.0,
      pad: [220.0, 261.63, 329.63],
      melody: [220.0, 261.63, 329.63, 440.0, 523.25, 659.25, 880.0, 659.25, 523.25, 440.0],
    },
  ];

  public init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMutedState ? 0 : 0.22, this.ctx.currentTime);

      this.filter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public start(preset: SoundtrackPreset = 'none', customUrl?: string) {
    this.currentPreset = preset;

    // If silent, stop any playback
    if (preset === 'none') {
      this.stop();
      return;
    }

    // If custom audio link
    if (preset === 'custom' && customUrl && customUrl.trim()) {
      this.stopSynthesized();
      this.playCustomAudio(customUrl.trim());
      return;
    }

    // Synthesized soundscape presets
    if (this.customAudioElement) {
      this.customAudioElement.pause();
      this.customAudioElement = null;
    }

    this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.isPlaying) return;
    this.isPlaying = true;

    this.playNextMelodyNote();
    this.playSustainedPad();
  }

  private playCustomAudio(url: string) {
    try {
      if (this.customAudioElement) {
        this.customAudioElement.pause();
      }
      this.customAudioElement = new Audio(url);
      this.customAudioElement.loop = true;
      this.customAudioElement.volume = this.isMutedState ? 0 : 0.45;
      this.customAudioElement.play().catch(() => {
        // Autoplay policy fallback
      });
      this.isPlaying = true;
    } catch (e) {
      console.warn('Custom audio play notice:', e);
    }
  }

  public stop() {
    this.isPlaying = false;
    this.stopSynthesized();
    if (this.customAudioElement) {
      this.customAudioElement.pause();
      this.customAudioElement = null;
    }
  }

  private stopSynthesized() {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.padTimerId !== null) {
      window.clearTimeout(this.padTimerId);
      this.padTimerId = null;
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx && !this.isMutedState) {
      const target = Math.max(0, Math.min(vol, 0.35));
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.4);
    }
    if (this.customAudioElement && !this.isMutedState) {
      this.customAudioElement.volume = Math.max(0, Math.min(vol * 2, 0.8));
    }
  }

  /**
   * Duck background volume down when voice recording plays, restore when paused
   */
  public duck(isDucked: boolean) {
    if (this.isMutedState) return;
    this.setVolume(isDucked ? 0.05 : 0.22);
  }

  public toggleMute(): boolean {
    this.isMutedState = !this.isMutedState;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMutedState ? 0 : 0.22,
        this.ctx.currentTime,
        0.1
      );
    }
    if (this.customAudioElement) {
      this.customAudioElement.volume = this.isMutedState ? 0 : 0.45;
    }
    if (!this.isPlaying && !this.isMutedState && this.currentPreset !== 'none') {
      this.start(this.currentPreset);
    }
    return this.isMutedState;
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public isCurrentlyPlaying(): boolean {
    return this.isPlaying && !this.isMutedState && this.currentPreset !== 'none';
  }

  private getActiveProgression() {
    switch (this.currentPreset) {
      case 'lofi-sunset':
        return this.lofiProgression;
      case 'cinematic-strings':
        return this.stringsProgression;
      case 'golden-harp':
        return this.harpProgression;
      case 'acoustic-piano':
      default:
        return this.pianoProgression;
    }
  }

  private playSustainedPad() {
    if (!this.isPlaying || !this.ctx || !this.filter) return;

    try {
      const progression = this.getActiveProgression();
      const chord = progression[this.chordIndex % progression.length];
      const now = this.ctx.currentTime;
      const duration = 4.0;

      // Soft bass
      const wave: OscillatorType = this.currentPreset === 'cinematic-strings' ? 'sawtooth' : 'triangle';
      this.createPadTone(chord.bass, now, duration, 0.10, wave);

      // Warm chord notes
      chord.pad.forEach((freq) => {
        this.createPadTone(freq, now, duration, 0.05, 'sine');
      });

      this.chordIndex++;
      this.padTimerId = window.setTimeout(() => {
        this.playSustainedPad();
      }, 3900);
    } catch {
      // safe
    }
  }

  private createPadTone(
    freq: number,
    startTime: number,
    duration: number,
    peakGain: number,
    waveType: OscillatorType
  ) {
    if (!this.ctx || !this.filter) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 1.2);
      gain.gain.setValueAtTime(peakGain, startTime + duration - 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.filter);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    } catch {
      // safe
    }
  }

  private playNextMelodyNote() {
    if (!this.isPlaying || !this.ctx || !this.filter) return;

    try {
      const progression = this.getActiveProgression();
      const currentChord =
        progression[
          Math.floor(this.chordIndex > 0 ? this.chordIndex - 1 : 0) % progression.length
        ];
      const melodyList = currentChord.melody;
      const freq = melodyList[this.noteIndex % melodyList.length];

      this.playNote(freq);
      this.noteIndex++;

      const tempo = this.currentPreset === 'golden-harp' ? 320 : 500;
      const delay = tempo + Math.sin(this.noteIndex * 0.7) * 40;
      this.timerId = window.setTimeout(() => this.playNextMelodyNote(), delay);
    } catch {
      // safe
    }
  }

  private playNote(freq: number) {
    if (!this.ctx || !this.filter) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = this.currentPreset === 'lofi-sunset' ? 'triangle' : 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.16, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      osc1.connect(gain1);
      gain1.connect(this.filter);
      osc1.start(now);
      osc1.stop(now + 2.05);

      if (this.currentPreset === 'golden-harp') {
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 3, now);
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.03, now + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc2.connect(gain2);
        gain2.connect(this.filter);
        osc2.start(now);
        osc2.stop(now + 0.65);
      }
    } catch {
      // safe
    }
  }
}

export const soundtrackEngine = new SoundtrackEngine();
// Alias for backwards compatibility
export const romanticAmbientSynth = soundtrackEngine;
