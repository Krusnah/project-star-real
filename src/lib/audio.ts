class StarAudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('project_star_muted');
      this.isMuted = savedMute === 'true';
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Resume context if suspended (browser security autounlock)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('project_star_muted', muted ? 'true' : 'false');
    }
  }

  public getMute(): boolean {
    return this.isMuted;
  }

  private createOscillator(
    type: OscillatorType,
    freq: number,
    duration: number,
    gainStart: number,
    delay: number = 0
  ) {
    if (this.isMuted || !this.ctx) return;

    const time = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    gainNode.gain.setValueAtTime(0, time);
    // Exponential ramp for smooth sound
    gainNode.gain.linearRampToValueAtTime(gainStart, time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }

  public playTwinkle() {
    this.initContext();
    if (!this.ctx) return;

    // Twinkling star chimes: two high, clean notes spaced slightly apart
    this.createOscillator('sine', 880, 0.4, 0.08, 0); // A5
    this.createOscillator('sine', 1318.51, 0.6, 0.06, 0.08); // E6
  }

  public playClick() {
    this.initContext();
    if (!this.ctx) return;

    // Warm, organic click sound
    this.createOscillator('triangle', 330, 0.08, 0.12, 0); // E4
  }

  public playSuccess() {
    this.initContext();
    if (!this.ctx) return;

    // Pleasant major chord (C Major)
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this.createOscillator('sine', freq, 0.8, 0.04, idx * 0.05);
    });
  }

  public playTransition() {
    this.initContext();
    if (!this.ctx) return;

    // Low, soft sweep transition
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(400, time + 0.3);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.08, time + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.0001, time + 0.3);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.35);
  }

  public playConstellation() {
    this.initContext();
    if (!this.ctx) return;

    // Upward-sweeping, magical arpeggio
    const arpeggio = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // C4 to C6
    arpeggio.forEach((freq, idx) => {
      this.createOscillator('sine', freq, 0.5, 0.05, idx * 0.06);
    });
  }

  public playHug() {
    this.initContext();
    if (!this.ctx) return;

    // Soft, comforting warm swell
    const notes = [293.66, 369.99, 440.0, 587.33]; // D4, F#4, A4, D5 (D Major)
    notes.forEach((freq) => {
      if (!this.ctx) return;
      const time = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.03, time + 0.2); // slow attack
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 1.2); // long decay

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 1.3);
    });
  }
}

export const audioSystem = new StarAudioSystem();
