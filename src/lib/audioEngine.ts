import { SirenPattern } from '@/types/emergency';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private sirenInterval: any = null;

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playChime() {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    } catch (e) {
      console.warn('Chime audio error:', e);
    }
  }

  public startSiren(pattern: SirenPattern = 'hi_lo') {
    try {
      this.stopSiren();
      this.initContext();
      if (!this.audioCtx) return;

      this.isPlaying = true;
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      this.gainNode.connect(this.audioCtx.destination);

      this.osc = this.audioCtx.createOscillator();
      this.osc.type = 'sawtooth';

      if (pattern === 'hi_lo') {
        let isHigh = true;
        this.osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
        this.sirenInterval = setInterval(() => {
          if (!this.audioCtx || !this.osc) return;
          isHigh = !isHigh;
          this.osc.frequency.setValueAtTime(
            isHigh ? 960 : 720,
            this.audioCtx.currentTime
          );
        }, 450);
      } else if (pattern === 'wail') {
        this.osc.type = 'triangle';
        let freq = 600;
        let direction = 1;
        this.sirenInterval = setInterval(() => {
          if (!this.audioCtx || !this.osc) return;
          freq += direction * 35;
          if (freq >= 1250) direction = -1;
          if (freq <= 550) direction = 1;
          this.osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        }, 50);
      } else if (pattern === 'strobe_beep') {
        this.osc.type = 'square';
        this.osc.frequency.setValueAtTime(1050, this.audioCtx.currentTime);
        let on = true;
        this.sirenInterval = setInterval(() => {
          if (!this.audioCtx || !this.gainNode) return;
          on = !on;
          this.gainNode.gain.setValueAtTime(on ? 0.2 : 0.0, this.audioCtx.currentTime);
        }, 180);
      } else {
        // pulse
        this.osc.type = 'sine';
        this.osc.frequency.setValueAtTime(520, this.audioCtx.currentTime);
        let on = true;
        this.sirenInterval = setInterval(() => {
          if (!this.audioCtx || !this.gainNode) return;
          on = !on;
          this.gainNode.gain.setValueAtTime(on ? 0.25 : 0.02, this.audioCtx.currentTime);
        }, 350);
      }

      this.osc.connect(this.gainNode);
      this.osc.start();
    } catch (e) {
      console.warn('Siren audio error:', e);
    }
  }

  public stopSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.osc) {
      try {
        this.osc.stop();
        this.osc.disconnect();
      } catch (e) {}
      this.osc = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (e) {}
      this.gainNode = null;
    }
    this.isPlaying = false;
  }

  public speak(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // clear previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92; // Clear and deliberate
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      // Select high quality English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David')) && v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (onEnd) onEnd();
    }
  }

  public stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public isSirenActive() {
    return this.isPlaying;
  }
}

export const audioEngine = new AudioEngine();
