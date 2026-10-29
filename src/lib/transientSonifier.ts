/**
 * Tsukuyomi Watch: The Samurai’s Celestial Guide
 * Web Audio API Sonification Engine for Astronomical Light Curves & Spectra
 * Converts time-domain brightness and spectral wavelengths into acoustic waves.
 */

class TransientSonifier {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentTimeout: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Sonifies a time-domain light curve:
   * Maps normalized flux (0.1 to 1.0) to frequencies from 220Hz (A3) to 880Hz (A5).
   */
  public sonifyLightCurve(
    points: { flux_normalized: number; day: number }[],
    onStep?: (index: number) => void,
    onComplete?: () => void
  ) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    const durationPerPoint = 0.12; // 120ms per data point
    let idx = 0;

    const playNext = () => {
      if (!this.isPlaying || !this.ctx || idx >= points.length) {
        this.isPlaying = false;
        if (onComplete) onComplete();
        return;
      }

      const p = points[idx];
      if (onStep) onStep(idx);

      // Frequency calculation: higher flux = higher pitch
      const minFreq = 220; // A3
      const maxFreq = 880; // A5
      const freq = minFreq + p.flux_normalized * (maxFreq - minFreq);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Celestial envelope
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, this.ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationPerPoint - 0.01);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + durationPerPoint);

      idx++;
      this.currentTimeout = window.setTimeout(playNext, durationPerPoint * 1000);
    };

    playNext();
  }

  /**
   * Plays a resonant chord for an identified spectral line
   */
  public playSpectralTone(wavelength: number) {
    this.initContext();
    if (!this.ctx) return;

    // Map 3800-8000 Å to 300-900 Hz
    const freq = 300 + ((wavelength - 3800) / 4200) * 600;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(freq * 1.5, this.ctx.currentTime); // Perfect fifth harmony

    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, this.ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.6);
    osc2.stop(this.ctx.currentTime + 0.6);
  }

  public stop() {
    this.isPlaying = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const transientSonifier = new TransientSonifier();

