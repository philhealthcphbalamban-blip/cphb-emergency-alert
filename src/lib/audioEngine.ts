import { SirenPattern } from '@/types/emergency';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private sirenInterval: any = null;
  private vibrationInterval: any = null;
  private isSpeaking = false;

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public unlockAudio() {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Mobile Device Haptic Vibration
  public startMobileVibration() {
    if (typeof window === 'undefined' || !navigator.vibrate) return;
    try {
      this.stopMobileVibration();
      navigator.vibrate([500, 200, 500, 200, 1000]);
      this.vibrationInterval = setInterval(() => {
        if (navigator.vibrate) {
          navigator.vibrate([500, 200, 500, 200, 1000]);
        }
      }, 3500);
    } catch (e) {
      console.warn('Vibration API error:', e);
    }
  }

  public stopMobileVibration() {
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(0);
    }
  }

  public requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }

  public triggerPushNotification(title: string, body: string) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/icon.svg',
            tag: 'cphb-emergency-alert',
            requireInteraction: true,
          });
        } catch (e) {
          console.warn('Web Notification error:', e);
        }
      }
    }
  }

  // Hospital Ding-Dong Chime (Harmonious Dual Tone)
  public playChime(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.initContext();
        if (!this.audioCtx) {
          resolve();
          return;
        }

        const now = this.audioCtx.currentTime;
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        const gain2 = this.audioCtx.createGain();

        // Note 1: High F#5 (739.99 Hz) -> Note 2: D5 (587.33 Hz)
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(739.99, now);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.25, now + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(587.33, now + 0.3);
        gain2.gain.setValueAtTime(0, now + 0.3);
        gain2.gain.linearRampToValueAtTime(0.25, now + 0.35);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);

        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);

        osc1.start(now);
        osc1.stop(now + 0.55);

        osc2.start(now + 0.3);
        osc2.stop(now + 0.95);

        setTimeout(resolve, 950);
      } catch (e) {
        console.warn('Chime audio error:', e);
        resolve();
      }
    });
  }

  public isSirenRunning(): boolean {
    return this.isPlaying;
  }

  public startSiren(pattern: SirenPattern = 'hi_lo', volume: number = 0.12) {
    if (this.isPlaying) return; // Prevent duplicate overlapping oscillators

    try {
      this.stopSiren();
      this.initContext();
      this.startMobileVibration();
      if (!this.audioCtx) return;

      this.isPlaying = true;
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      this.gainNode.connect(this.audioCtx.destination);

      this.osc = this.audioCtx.createOscillator();
      this.osc.type = 'sine'; // Sine wave sounds much smoother and pleasant than harsh sawtooth

      const now = this.audioCtx.currentTime;

      if (pattern === 'hi_lo') {
        // Smooth Hospital Code Blue Chime (700Hz <-> 880Hz)
        let isHigh = true;
        this.osc.frequency.setValueAtTime(880, now);
        this.sirenInterval = setInterval(() => {
          if (!this.osc || !this.audioCtx || !this.isPlaying) return;
          const currTime = this.audioCtx.currentTime;
          this.osc.frequency.setValueAtTime(isHigh ? 700 : 880, currTime);
          isHigh = !isHigh;
        }, 550);
      } else if (pattern === 'wail') {
        // Continuous Code Red Wail (550Hz to 1100Hz)
        this.osc.frequency.setValueAtTime(550, now);
        let goingUp = true;
        this.sirenInterval = setInterval(() => {
          if (!this.osc || !this.audioCtx || !this.isPlaying) return;
          const currTime = this.audioCtx.currentTime;
          this.osc.frequency.linearRampToValueAtTime(goingUp ? 1100 : 550, currTime + 1.2);
          goingUp = !goingUp;
        }, 1300);
      } else {
        // Pulse Beep (650Hz)
        this.osc.frequency.setValueAtTime(650, now);
        let on = true;
        this.sirenInterval = setInterval(() => {
          if (!this.gainNode || !this.audioCtx || !this.isPlaying) return;
          const currTime = this.audioCtx.currentTime;
          this.gainNode.gain.setValueAtTime(on ? volume : 0, currTime);
          on = !on;
        }, 450);
      }

      this.osc.connect(this.gainNode);
      this.osc.start(now);
    } catch (e) {
      console.warn('Start siren error:', e);
    }
  }

  public stopSiren() {
    this.stopMobileVibration();
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

  public stopSpeech() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.isSpeaking = false;
  }

  public speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        this.isSpeaking = true;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.lang.startsWith('en') && 
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Female'))
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
          this.isSpeaking = false;
          resolve();
        };

        utterance.onerror = () => {
          this.isSpeaking = false;
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('TTS Speech error:', e);
        this.isSpeaking = false;
        resolve();
      }
    });
  }

  // Combined Hospital Emergency Sequence: Chime -> Clear Speech -> Siren
  public async playHospitalAlertSequence(speechText: string, pattern: SirenPattern = 'hi_lo', playSirenAfter: boolean = true) {
    this.stopSiren();
    this.stopSpeech();

    // 1. Play Ding-Dong chime
    await this.playChime();

    // 2. Clear voice announcement
    await this.speak(speechText);

    // 3. Start background alert siren if requested
    if (playSirenAfter) {
      this.startSiren(pattern, 0.10);
    }
  }
}

export const audioEngine = new AudioEngine();
