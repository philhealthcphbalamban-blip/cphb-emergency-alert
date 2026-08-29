import { SirenPattern } from '@/types/emergency';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private sirenInterval: any = null;
  private vibrationInterval: any = null;

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

  // Mobile Device Haptic Vibration (repeats until alert is acknowledged/stopped)
  public startMobileVibration() {
    if (typeof window === 'undefined' || !navigator.vibrate) return;
    try {
      this.stopMobileVibration();
      // Vibrate pattern: Vibrate 600ms, Pause 200ms, Vibrate 600ms, Pause 200ms, Vibrate 1000ms
      navigator.vibrate([600, 200, 600, 200, 1000]);
      this.vibrationInterval = setInterval(() => {
        if (navigator.vibrate) {
          navigator.vibrate([600, 200, 600, 200, 1000]);
        }
      }, 3000);
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

  // Browser Web Notification (Displays banner on desktop/mobile lockscreen)
  public requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }

  public triggerPushNotification(title: string, body: string) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'cphb-emergency-alert',
            requireInteraction: true,
          });
        } catch (e) {
          console.warn('Web Notification error:', e);
        }
      }
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
      this.startMobileVibration();
      if (!this.audioCtx) return;

      this.isPlaying = true;
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
      this.gainNode.connect(this.audioCtx.destination);

      this.osc = this.audioCtx.createOscillator();
      this.osc.type = 'sawtooth';

      const now = this.audioCtx.currentTime;

      if (pattern === 'hi_lo') {
        // High-Low British Ambulance / Resuscitation Chime (780Hz <-> 960Hz)
        let isHigh = true;
        this.osc.frequency.setValueAtTime(960, now);
        this.sirenInterval = setInterval(() => {
          if (!this.osc || !this.audioCtx) return;
          const currTime = this.audioCtx.currentTime;
          if (isHigh) {
            this.osc.frequency.setValueAtTime(780, currTime);
          } else {
            this.osc.frequency.setValueAtTime(960, currTime);
          }
          isHigh = !isHigh;
        }, 450);
      } else if (pattern === 'wail') {
        // Continuous Fire / Code Red Wail (500Hz to 1200Hz)
        this.osc.frequency.setValueAtTime(500, now);
        let goingUp = true;
        this.sirenInterval = setInterval(() => {
          if (!this.osc || !this.audioCtx) return;
          const currTime = this.audioCtx.currentTime;
          if (goingUp) {
            this.osc.frequency.linearRampToValueAtTime(1200, currTime + 1.2);
          } else {
            this.osc.frequency.linearRampToValueAtTime(500, currTime + 1.2);
          }
          goingUp = !goingUp;
        }, 1250);
      } else if (pattern === 'strobe_beep') {
        // Rapid Security Beep (Code Pink / Infant Alert)
        let beeping = true;
        this.osc.frequency.setValueAtTime(1400, now);
        this.sirenInterval = setInterval(() => {
          if (!this.gainNode || !this.audioCtx) return;
          const currTime = this.audioCtx.currentTime;
          this.gainNode.gain.setValueAtTime(beeping ? 0.25 : 0, currTime);
          beeping = !beeping;
        }, 180);
      } else {
        // Pulse / Code White / Code Black
        this.osc.frequency.setValueAtTime(600, now);
        let on = true;
        this.sirenInterval = setInterval(() => {
          if (!this.gainNode || !this.audioCtx) return;
          const currTime = this.audioCtx.currentTime;
          this.gainNode.gain.setValueAtTime(on ? 0.2 : 0, currTime);
          on = !on;
        }, 500);
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
  }

  public speak(text: string, repeats: number = 2) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      let count = 0;

      const speakOnce = () => {
        if (count >= repeats) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Female') || v.name.includes('Natural')));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onend = () => {
          count++;
          if (count < repeats) {
            setTimeout(speakOnce, 800);
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      setTimeout(speakOnce, 250);
    } catch (e) {
      console.warn('TTS Speech error:', e);
    }
  }
}

export const audioEngine = new AudioEngine();
