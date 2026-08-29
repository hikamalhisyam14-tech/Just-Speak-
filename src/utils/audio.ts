// Web Audio API Synthesizer for tactile speaking timer sounds

class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    try {
      if (typeof window === 'undefined') return;
      if (!this.ctx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Audio context might be restricted in some iframe environments
    }
  }

  // Soft wooden click / tick for timer countdown
  playTick() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Roulette ratchet click sound
  playRollTick(pitchMultiplier = 1) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      const freq = Math.max(100, 440 * pitchMultiplier);
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(50, freq * 0.5), now + 0.03);
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  }

  // Reveal chime when final topic settles
  playReveal() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.06);
        
        // Web Audio exponential ramp cannot start from 0; start from 0.0001
        gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.6);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.65);
      });
    } catch {}
  }

  // Start timer chime
  playStart() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  // Warm gong / celebration fanfare for 1-minute completion
  playCompletionGong() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Warm chord gong
      const chord = [392.00, 493.88, 587.33, 783.99]; // G major
      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 1.9);
      });
    } catch {}
  }
}

export const sound = new SoundManager();
