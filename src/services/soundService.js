/**
 * Veyro - Audio, Notification & Story Music Engine
 * Synthesizes crisp mobile notification chimes and rhythmic workout story beats
 * using the Web Audio API. Zero network delay and 100% WebView compatible.
 */

export const STORY_MUSIC_TRACKS = [
  {
    id: "phonk_pr",
    title: "PR Phonk Bass",
    artist: "Veyro Gym Beats",
    genre: "Drift Phonk",
    bpm: 140,
    notes: [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 130.81],
    wave: "sawtooth"
  },
  {
    id: "hardstyle_gym",
    title: "Olympia Hardstyle",
    artist: "Titan Audio",
    genre: "Hardstyle",
    bpm: 150,
    notes: [146.83, 146.83, 174.61, 196.00, 220.00, 196.00, 174.61, 164.81],
    wave: "square"
  },
  {
    id: "hiphop_pump",
    title: "Heavy Iron Beat",
    artist: "Barbell Club",
    genre: "Trap / Pump",
    bpm: 128,
    notes: [98.00, 98.00, 116.54, 130.81, 98.00, 146.83, 130.81, 116.54],
    wave: "triangle"
  },
  {
    id: "cardio_energy",
    title: "Cardio Rush",
    artist: "Pulse Runner",
    genre: "Electro House",
    bpm: 132,
    notes: [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 349.23],
    wave: "sine"
  },
  {
    id: "focus_flow",
    title: "Midnight Lift",
    artist: "Obsidian Synth",
    genre: "Dark Synthwave",
    bpm: 118,
    notes: [130.81, 164.81, 196.00, 246.94, 261.63, 246.94, 196.00, 164.81],
    wave: "triangle"
  }
];

class SoundService {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.musicInterval = null;
    this.activeAudioEl = null;
    this.isMusicMuted = false;
    this.initAudioUnlock();
  }

  getAudioContext(forceCreate = false) {
    if (!this.unlocked && !this.ctx && !forceCreate) {
      return null;
    }
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.unlocked = true;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  initAudioUnlock() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && !this.ctx) {
          this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        this.unlocked = true;
      } catch (e) {}
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
  }

  /**
   * Plays a rhythmic workout synth loop or recorded voice clip for a Story.
   */
  playStoryMusic(trackIdOrData) {
    this.stopStoryMusic();
    if (this.isMusicMuted || !trackIdOrData) return;

    // Check if custom recorded audio dataUrl is provided
    if (typeof trackIdOrData === "object" && trackIdOrData.audioDataUrl) {
      try {
        const audio = new Audio(trackIdOrData.audioDataUrl);
        audio.loop = true;
        audio.volume = 0.85;
        audio.play().catch(() => {});
        this.activeAudioEl = audio;
      } catch (e) {}
      return;
    }

    const trackId = typeof trackIdOrData === "object" ? trackIdOrData.id : trackIdOrData;
    const track = STORY_MUSIC_TRACKS.find(t => t.id === trackId);
    if (!track) return;

    try {
      const ctx = this.getAudioContext(true);
      if (!ctx) return;

      let step = 0;
      const stepMs = Math.round((60 / track.bpm) * 500); // 8th notes

      const playStep = () => {
        if (this.isMusicMuted) return;
        try {
          const now = ctx.currentTime;
          const freq = track.notes[step % track.notes.length];

          // Lead / Bass synth note
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = track.wave || "sawtooth";
          osc.frequency.setValueAtTime(freq, now);

          filter.type = "lowpass";
          filter.frequency.setValueAtTime(950, now);
          filter.frequency.exponentialRampToValueAtTime(280, now + (stepMs / 1000) * 0.9);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (stepMs / 1000) * 0.92);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + (stepMs / 1000));

          // Kick drum pulse on even steps
          if (step % 2 === 0) {
            const kickOsc = ctx.createOscillator();
            const kickGain = ctx.createGain();
            kickOsc.type = "sine";
            kickOsc.frequency.setValueAtTime(135, now);
            kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.11);
            kickGain.gain.setValueAtTime(0.24, now);
            kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            kickOsc.connect(kickGain);
            kickGain.connect(ctx.destination);
            kickOsc.start(now);
            kickOsc.stop(now + 0.15);
          }

          step++;
        } catch (e) {}
      };

      playStep();
      this.musicInterval = setInterval(playStep, stepMs);
    } catch (e) {}
  }

  stopStoryMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.activeAudioEl) {
      try {
        this.activeAudioEl.pause();
        this.activeAudioEl.currentTime = 0;
      } catch (e) {}
      this.activeAudioEl = null;
    }
  }

  toggleStoryMute() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      this.stopStoryMusic();
    }
    return this.isMusicMuted;
  }

  /**
   * Plays a sleek 2-tone chime for incoming chat messages & notifications.
   */
  playMessageChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.09);
      gain2.gain.setValueAtTime(0.001, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.24, now + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.46);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 50, 120]);
      }
    } catch (e) {
      console.warn("Sound play error", e);
    }
  }

  playPhotoChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  playMatchChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.22, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.24);
      });
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch (e) {}
  }
}

export const soundService = new SoundService();
