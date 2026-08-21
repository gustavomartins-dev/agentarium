/**
 * Tiny procedural audio layer for the asset-free first slice.
 * It never talks to an external service and only starts after a user gesture.
 */
export class AudioSystem {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private muted = false;
  private lastStepAt = -1;

  private readonly unlockFromGesture = () => {
    void this.unlock();
  };

  constructor() {
    window.addEventListener('pointerdown', this.unlockFromGesture, { once: true });
    window.addEventListener('keydown', this.unlockFromGesture, { once: true });
  }

  async unlock(): Promise<void> {
    if (this.context) {
      if (this.context.state !== 'running') await this.context.resume();
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.ambienceGain = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.72;
    this.ambienceGain.gain.value = 0.065;
    this.ambienceGain.connect(this.master);
    this.master.connect(this.context.destination);
    await this.context.resume();
    this.startAmbience();
  }

  toggleMuted(): boolean {
    return this.setMuted(!this.muted);
  }

  setMuted(muted: boolean): boolean {
    this.muted = muted;
    if (this.context && this.master) {
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.72, this.context.currentTime, 0.025);
    }
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** A soft, pitch-varied dirt-and-stone step. */
  footstep(elapsed: number, speed: number): void {
    if (!this.context || !this.master || speed < 0.9) return;
    const interval = speed > 7 ? 0.22 : 0.34;
    if (elapsed - this.lastStepAt < interval) return;
    this.lastStepAt = elapsed;

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(108 + (Math.sin(elapsed * 17) + 1) * 9, now);
    oscillator.frequency.exponentialRampToValueAtTime(64, now + 0.075);
    filter.type = 'lowpass';
    filter.frequency.value = 480;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);
    oscillator.connect(filter).connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  /** A short three-note seal when a location is discovered. */
  discovery(index: number): void {
    if (!this.context || !this.master) return;
    const root = 220 + (index % 3) * 18;
    [1, 1.25, 1.5].forEach((ratio, note) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      const start = this.context!.currentTime + note * 0.07;
      oscillator.type = note === 2 ? 'sine' : 'triangle';
      oscillator.frequency.value = root * ratio;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.055, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
      oscillator.connect(gain).connect(this.master!);
      oscillator.start(start);
      oscillator.stop(start + 0.25);
    });
  }

  ui(): void {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(520, now);
    oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.045);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.08);
  }

  dispose(): void {
    window.removeEventListener('pointerdown', this.unlockFromGesture);
    window.removeEventListener('keydown', this.unlockFromGesture);
    this.ambienceSource?.stop();
    this.ambienceSource = null;
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.ambienceGain = null;
  }

  private startAmbience(): void {
    if (!this.context || !this.ambienceGain || this.ambienceSource) return;
    const seconds = 3;
    const length = this.context.sampleRate * seconds;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let value = 0;
    for (let i = 0; i < length; i += 1) {
      const seedNoise = Math.sin(i * 12.9898) * 43758.5453;
      const white = (seedNoise - Math.floor(seedNoise)) * 2 - 1;
      value = value * 0.985 + white * 0.015;
      const phase = i / length;
      const breeze = Math.sin(phase * Math.PI * 6) * 0.12;
      const seam = Math.sin(Math.PI * phase);
      data[i] = (value * 0.7 + breeze) * seam;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 780;
    filter.Q.value = 0.35;
    source.buffer = buffer;
    source.loop = true;
    source.connect(filter).connect(this.ambienceGain);
    source.start();
    this.ambienceSource = source;
  }
}
