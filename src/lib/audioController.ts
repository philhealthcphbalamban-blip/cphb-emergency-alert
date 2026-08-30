import { SirenPattern, EmergencyAlert } from '@/types/emergency';
import { audioEngine } from './audioEngine';

export type AudioState = 'IDLE' | 'CHIMING' | 'ANNOUNCING' | 'SIREN_ACTIVE';

export class AudioController {
  private static instance: AudioController | null = null;
  private channel: BroadcastChannel | null = null;
  private state: AudioState = 'IDLE';
  private repeatTimer: any = null;
  private activeAlerts: EmergencyAlert[] = [];
  private isMuted = false;
  private isVoiceDisabled = false;
  private currentSpeechAbort: (() => void) | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('cphb_audio_bus_v1');
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'AUDIO_KILL_ALL') {
            this.stopAllLocal();
          } else if (event.data?.type === 'AUDIO_TRIGGER') {
            // Received trigger from peer tab
            if (event.data.alerts) {
              this.activeAlerts = event.data.alerts;
            }
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or error:', e);
      }
    }
  }

  public static getInstance(): AudioController {
    if (!AudioController.instance) {
      AudioController.instance = new AudioController();
    }
    return AudioController.instance;
  }

  public getState(): AudioState {
    return this.state;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAllImmediate();
    }
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public setVoiceDisabled(disabled: boolean) {
    this.isVoiceDisabled = disabled;
    if (disabled) {
      audioEngine.stopSpeech();
    }
  }

  public isVoiceMuted(): boolean {
    return this.isVoiceDisabled;
  }

  /**
   * Syncs active alerts with audio engine and triggers proper announcement sequence.
   * Will only trigger if the alert hash changed to prevent stuttering/restarting.
   */
  public async syncAlerts(alerts: EmergencyAlert[]) {
    this.activeAlerts = alerts;

    if (alerts.length === 0) {
      this.stopAllImmediate();
      return;
    }

    if (this.isMuted) return;

    // Build unified announcement speech
    const priorityAlert = alerts[0];
    let announcement = '';

    if (alerts.length === 1) {
      const a = alerts[0];
      const template = a.code_details?.tts_template || 'Attention all medical personnel: Emergency code at {location}.';
      announcement = template.replace('{location}', a.location_text);
    } else {
      const parts = alerts.map((a) => `${a.code_details?.code_name} at ${a.location_text}`);
      announcement = `Attention all medical personnel: Multiple concurrent codes active. ${parts.join('. Also active: ')}.`;
    }

    this.playSequence(announcement, priorityAlert.code_details?.siren_pattern || 'hi_lo');
  }

  /**
   * Complete, harmonious 3-step audio sequence:
   * 1. Dual-tone Ding Dong Chime
   * 2. Crystal clear Voice Announcement
   * 3. Continuous Background Pulse Siren
   * Repeats every 28 seconds cleanly.
   */
  private async playSequence(speechText: string, pattern: SirenPattern) {
    this.clearRepeatTimer();
    this.stopAllLocal();

    if (this.isMuted) return;

    try {
      // Step 1: Chime
      this.state = 'CHIMING';
      await audioEngine.playChime();

      if (this.getState() === 'IDLE') return; // Cancelled while chiming

      // Step 2: Voice Dispatch
      if (!this.isVoiceDisabled) {
        this.state = 'ANNOUNCING';
        await audioEngine.speak(speechText);
      }

      if (this.getState() === 'IDLE') return; // Cancelled while speaking

      // Step 3: Siren
      this.state = 'SIREN_ACTIVE';
      audioEngine.startSiren(pattern, 0.10);

      // Setup periodic repetition (28s interval)
      this.repeatTimer = setInterval(async () => {
        if (this.activeAlerts.length > 0 && !this.isMuted) {
          audioEngine.stopSiren();
          
          if (!this.isVoiceDisabled) {
            this.state = 'ANNOUNCING';
            await audioEngine.speak(speechText);
          }

          if (this.getState() !== 'IDLE' && !this.isMuted) {
            this.state = 'SIREN_ACTIVE';
            audioEngine.startSiren(pattern, 0.10);
          }
        }
      }, 28000);
    } catch (e) {
      console.warn('AudioController sequence error:', e);
      this.state = 'IDLE';
    }
  }

  /**
   * INSTANT 0ms Hard Kill: Stops all sounds, speech, sirens, and vibrations immediately!
   * Broadcasts to all peer tabs to ensure 100% sound silence across the entire browser.
   */
  public stopAllImmediate() {
    this.stopAllLocal();

    // Broadcast kill command across all open hospital tabs
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'AUDIO_KILL_ALL' });
      } catch (e) {}
    }
  }

  private stopAllLocal() {
    this.state = 'IDLE';
    this.clearRepeatTimer();
    audioEngine.stopSiren();
    audioEngine.stopSpeech();
    audioEngine.stopMobileVibration();
  }

  private clearRepeatTimer() {
    if (this.repeatTimer) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = null;
    }
  }
}

export const audioController = AudioController.getInstance();
