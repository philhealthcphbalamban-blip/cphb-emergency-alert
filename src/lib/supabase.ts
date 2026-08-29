import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EmergencyAlert, AlertResponder, CodeId, AlertStatus } from '@/types/emergency';
import { IHOMISPatient } from '@/types/ihomis';
import { EMERGENCY_CODES } from './constants';
import { IHOMISService } from './ihomisService';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vptgxwbsyccgamcuunya.supabase.co').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdGd4d2JzeWNjZ2FtY3V1bnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NjYxMDAsImV4cCI6MjEwMzU0MjEwMH0.tj58oXqpJy-MT5AhZtmpigk7dWFwdTiDEs8R9QWj3FY').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

function createSafeSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  } catch (e) {
    console.warn('Could not initialize Supabase client:', e);
    return null;
  }
}

export const supabase: SupabaseClient | null = createSafeSupabaseClient();

// Multi-tab BroadcastChannel for zero-latency local realtime syncing & offline fallback
const LOCAL_STORAGE_KEY_ALERTS = 'hospital_emergency_alerts_v1';
const CHANNEL_NAME = 'hospital_realtime_alert_bus';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class EmergencyService {
  private static channel: BroadcastChannel | null = null;
  private static listeners: Set<(alert: EmergencyAlert | null, event: string) => void> = new Set();
  private static isInitialized = false;

  public static init() {
    if (typeof window === 'undefined') return;
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      if (typeof window.BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event && event.data) {
            const { type, payload } = event.data;
            this.listeners.forEach((listener) => {
              try {
                listener(payload, type);
              } catch (err) {
                console.error('Error in alert listener:', err);
              }
            });
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported or error:', e);
    }

    // Subscribe to Supabase Realtime across all hospital computers & phones
    if (supabase) {
      try {
        supabase
          .channel('public:emergency_alerts_global_realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'emergency_alerts' },
            async (changePayload) => {
              const activeAlert = await this.getActiveAlert();
              this.notifyListeners(activeAlert, changePayload.eventType);
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Supabase realtime subscription error:', e);
      }
    }

    // High-frequency Realtime Poller (every 2.5 seconds)
    // Guarantees alerts reach mobile phones and remote PCs even if WebSockets are asleep or backgrounded
    setInterval(async () => {
      try {
        const activeAlert = await this.getActiveAlert();
        this.notifyListeners(activeAlert, activeAlert ? 'POLL_SYNC' : 'RESOLVED');
      } catch (e) {
        // ignore
      }
    }, 2500);
  }

  public static subscribe(callback: (alert: EmergencyAlert | null, event: string) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyListeners(alert: EmergencyAlert | null, eventType: string) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type: eventType, payload: alert });
      } catch (e) {
        console.warn('Error posting to BroadcastChannel:', e);
      }
    }
    this.listeners.forEach((listener) => {
      try {
        listener(alert, eventType);
      } catch (err) {
        console.error('Error in listener callback:', err);
      }
    });
  }

  // Get current active alert from Cloud database
  public static async getActiveAlert(): Promise<EmergencyAlert | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('emergency_alerts')
          .select('*, responders:alert_responders(*)')
          .in('status', ['ACTIVE', 'RESPONDING'])
          .order('triggered_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          const patient = data.patient_details || IHOMISService.findPatientByLocation(data.location_text);
          return {
            ...data,
            code_details: EMERGENCY_CODES[data.code_id] || EMERGENCY_CODES.code_blue,
            patient_details: patient,
          };
        }
      } catch (e) {
        console.warn('Supabase fetch failed, fallback to local store:', e);
      }
    }

    // LocalStorage Fallback
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ALERTS);
        if (raw) {
          const alerts: EmergencyAlert[] = JSON.parse(raw);
          const active = alerts.find(a => a.status === 'ACTIVE' || a.status === 'RESPONDING');
          if (active) {
            const patient = active.patient_details || IHOMISService.findPatientByLocation(active.location_text);
            return {
              ...active,
              code_details: EMERGENCY_CODES[active.code_id] || EMERGENCY_CODES.code_blue,
              patient_details: patient,
            };
          }
        }
      } catch (e) {
        console.warn('Error reading from localStorage:', e);
      }
    }
    return null;
  }

  // Get all alerts history
  public static async getAllAlerts(): Promise<EmergencyAlert[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('emergency_alerts')
          .select('*, responders:alert_responders(*)')
          .order('triggered_at', { ascending: false });

        if (data && !error) {
          return data.map(d => ({
            ...d,
            code_details: EMERGENCY_CODES[d.code_id] || EMERGENCY_CODES.code_blue,
            patient_details: d.patient_details || IHOMISService.findPatientByLocation(d.location_text),
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch history failed, fallback to local store:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ALERTS);
        if (raw) {
          return JSON.parse(raw).map((d: EmergencyAlert) => ({
            ...d,
            code_details: EMERGENCY_CODES[d.code_id] || EMERGENCY_CODES.code_blue,
            patient_details: d.patient_details || IHOMISService.findPatientByLocation(d.location_text),
          }));
        }
      } catch (e) {
        console.warn('Error reading localStorage history:', e);
      }
    }
    return [];
  }

  // Trigger a new emergency code with valid UUID
  public static async triggerAlert(params: {
    code_id: CodeId;
    location_text: string;
    triggered_by_name: string;
    triggered_by_role: string;
    patient_details?: IHOMISPatient | null;
  }): Promise<EmergencyAlert> {
    const patient = params.patient_details || IHOMISService.findPatientByLocation(params.location_text);
    const alertUuid = generateUUID();

    const newAlert: EmergencyAlert = {
      id: alertUuid,
      code_id: params.code_id,
      code_details: EMERGENCY_CODES[params.code_id] || EMERGENCY_CODES.code_blue,
      location_text: params.location_text,
      status: 'ACTIVE',
      triggered_by_name: params.triggered_by_name || 'Staff Nurse',
      triggered_by_role: params.triggered_by_role || 'Staff Nurse',
      triggered_at: new Date().toISOString(),
      patient_details: patient,
      responders: [],
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('emergency_alerts').insert({
          id: alertUuid,
          code_id: newAlert.code_id,
          location_text: newAlert.location_text,
          status: newAlert.status,
          triggered_by_name: newAlert.triggered_by_name,
          triggered_by_role: newAlert.triggered_by_role,
          triggered_at: newAlert.triggered_at,
          patient_id_optional: patient?.hrn || null,
          patient_details: patient || null,
        });

        if (error) {
          console.error('Failed inserting emergency_alerts to Supabase:', error);
        }
      } catch (e) {
        console.error('Exception inserting to Supabase:', e);
      }
    }

    // Save locally
    if (typeof window !== 'undefined') {
      try {
        const history = await this.getAllAlerts();
        const updated = [newAlert, ...history.filter(h => h.id !== newAlert.id)];
        localStorage.setItem(LOCAL_STORAGE_KEY_ALERTS, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed saving alert locally:', e);
      }
    }

    this.notifyListeners(newAlert, 'TRIGGERED');
    return newAlert;
  }

  // Acknowledge & add responder with valid UUID
  public static async addResponder(params: {
    alert_id: string;
    responder_name: string;
    role: AlertResponder['role'];
    eta_minutes: number;
  }): Promise<AlertResponder> {
    const responderUuid = generateUUID();

    const newResponder: AlertResponder = {
      id: responderUuid,
      alert_id: params.alert_id,
      responder_name: params.responder_name,
      role: params.role,
      eta_minutes: params.eta_minutes,
      status: 'EN_ROUTE',
      responded_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        await supabase.from('alert_responders').insert(newResponder);
        await supabase.from('emergency_alerts').update({
          status: 'RESPONDING',
          acknowledged_at: new Date().toISOString()
        }).eq('id', params.alert_id);
      } catch (e) {
        console.error('Failed inserting responder to Supabase:', e);
      }
    }

    this.notifyListeners(await this.getActiveAlert(), 'RESPONDER_ADDED');
    return newResponder;
  }

  // Mark responder arrived on scene
  public static async markOnScene(alert_id: string, responder_id: string): Promise<void> {
    const arrivedAt = new Date().toISOString();
    if (supabase) {
      try {
        await supabase
          .from('alert_responders')
          .update({ status: 'ON_SCENE', arrived_at: arrivedAt })
          .eq('id', responder_id);
      } catch (e) {
        console.error('Failed updating responder status in Supabase:', e);
      }
    }
    this.notifyListeners(await this.getActiveAlert(), 'RESPONDER_ARRIVED');
  }

  // Resolve emergency code
  public static async resolveAlert(params: {
    alert_id: string;
    resolved_by_name: string;
    resolution_notes: string;
    status: AlertStatus;
  }): Promise<void> {
    const resolvedAt = new Date().toISOString();

    if (supabase) {
      try {
        await supabase
          .from('emergency_alerts')
          .update({
            status: params.status,
            resolved_at: resolvedAt,
            resolved_by_name: params.resolved_by_name,
            resolution_notes: params.resolution_notes,
          })
          .eq('id', params.alert_id);

        // Also log to audit logs
        await supabase.from('emergency_audit_logs').insert({
          alert_id: params.alert_id,
          event_type: 'RESOLVED',
          actor_name: params.resolved_by_name,
          details: { notes: params.resolution_notes, resolved_at: resolvedAt },
        });
      } catch (e) {
        console.error('Failed resolving alert in Supabase:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ALERTS);
        if (raw) {
          const alerts: EmergencyAlert[] = JSON.parse(raw);
          const updated = alerts.map(a => {
            if (a.id === params.alert_id) {
              return {
                ...a,
                status: params.status,
                resolved_at: resolvedAt,
                resolved_by_name: params.resolved_by_name,
                resolution_notes: params.resolution_notes,
              };
            }
            return a;
          });
          localStorage.setItem(LOCAL_STORAGE_KEY_ALERTS, JSON.stringify(updated));
        }
      } catch (e) {
        console.warn('Failed resolving alert locally:', e);
      }
    }

    this.notifyListeners(null, 'RESOLVED');
  }
}
