import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EmergencyAlert, AlertResponder, CodeId, AlertStatus } from '@/types/emergency';
import { IHOMISPatient } from '@/types/ihomis';
import { EMERGENCY_CODES } from './constants';
import { IHOMISService } from './ihomisService';
import { HospitalService } from './hospitalService';

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
  private static lastAlertId: string | null = null;

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

    // Subscribe to Supabase Realtime channel
    if (supabase) {
      try {
        supabase
          .channel('public:emergency_alerts_global_live')
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

    // ⚡ Ultra-Fast 1.5-Second HTTP REST Heartbeat Poller
    // Guarantees all mobile phones and desktop computers receive alerts in real-time
    setInterval(async () => {
      try {
        const activeAlert = await this.getActiveAlert();
        const currentId = activeAlert ? activeAlert.id : null;
        
        if (currentId !== this.lastAlertId) {
          this.lastAlertId = currentId;
          this.notifyListeners(activeAlert, activeAlert ? 'TRIGGERED' : 'RESOLVED');
        } else if (activeAlert) {
          this.notifyListeners(activeAlert, 'POLL_SYNC');
        }
      } catch (e) {
        // ignore
      }
    }, 1500);
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

  public static async getActiveAlert(hospitalId?: string): Promise<EmergencyAlert | null> {
    const hid = hospitalId || HospitalService.getActiveHospital().id;

    try {
      const res = await fetch(`/api/emergency/alerts?hospital_id=${hid}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.activeAlert) {
          return json.activeAlert;
        }
        if (json.success && json.activeAlert === null) {
          return null;
        }
      }
    } catch (e) {
      // ignore
    }

    if (supabase) {
      try {
        let query = supabase
          .from('emergency_alerts')
          .select('*, responders:alert_responders(*)')
          .in('status', ['ACTIVE', 'RESPONDING'])
          .order('triggered_at', { ascending: false });

        if (hid === 'cphb') {
          query = query.or(`hospital_id.eq.${hid},hospital_id.is.null`);
        } else {
          query = query.eq('hospital_id', hid);
        }

        const { data, error } = await query.limit(1).maybeSingle();

        if (data && !error) {
          const patient = data.patient_details || IHOMISService.findPatientByLocation(data.location_text);
          return {
            ...data,
            code_details: EMERGENCY_CODES[data.code_id] || EMERGENCY_CODES.code_blue,
            patient_details: patient,
          };
        }
      } catch (e) {
        console.warn('Supabase fetch failed:', e);
      }
    }

    return null;
  }

  public static async getAllAlerts(hospitalId?: string): Promise<EmergencyAlert[]> {
    const hid = hospitalId || HospitalService.getActiveHospital().id;

    try {
      const res = await fetch(`/api/emergency/alerts?all=true&hospital_id=${hid}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.alerts) && json.alerts.length > 0) {
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`cph_emergency_history_${hid}`, JSON.stringify(json.alerts));
            } catch (e) {}
          }
          return json.alerts;
        }
      }
    } catch (e) {}

    if (supabase) {
      try {
        let query = supabase
          .from('emergency_alerts')
          .select('*, responders:alert_responders(*)')
          .order('triggered_at', { ascending: false });

        if (hid === 'cphb') {
          query = query.or(`hospital_id.eq.${hid},hospital_id.is.null`);
        } else {
          query = query.eq('hospital_id', hid);
        }

        const { data, error } = await query;

        if (data && !error && data.length > 0) {
          const list = data.map(d => ({
            ...d,
            code_details: EMERGENCY_CODES[d.code_id] || EMERGENCY_CODES.code_blue,
            patient_details: d.patient_details || IHOMISService.findPatientByLocation(d.location_text),
          }));
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`cph_emergency_history_${hid}`, JSON.stringify(list));
            } catch (e) {}
          }
          return list;
        }
      } catch (e) {
        console.warn('Supabase fetch history failed:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`cph_emergency_history_${hid}`);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {}
    }

    return [];
  }

  public static async triggerAlert(params: {
    hospital_id?: string;
    code_id: CodeId;
    location_text: string;
    triggered_by_name: string;
    triggered_by_role: string;
    patient_details?: IHOMISPatient | null;
  }): Promise<EmergencyAlert> {
    const hid = params.hospital_id || HospitalService.getActiveHospital().id;
    const patient = params.patient_details || IHOMISService.findPatientByLocation(params.location_text);

    try {
      const res = await fetch('/api/emergency/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRIGGER',
          hospital_id: hid,
          code_id: params.code_id,
          location_text: params.location_text,
          triggered_by_name: params.triggered_by_name,
          triggered_by_role: params.triggered_by_role,
          patient_details: patient,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.alert) {
          this.lastAlertId = json.alert.id;
          if (typeof window !== 'undefined') {
            try {
              const current = JSON.parse(localStorage.getItem(`cph_emergency_history_${hid}`) || '[]');
              localStorage.setItem(`cph_emergency_history_${hid}`, JSON.stringify([json.alert, ...current.filter((x: any) => x.id !== json.alert.id)]));
            } catch (e) {}
          }
          this.notifyListeners(json.alert, 'TRIGGERED');
          return json.alert;
        }
      }
    } catch (e) {
      console.warn('Failed triggering alert via REST API, attempting direct Supabase:', e);
    }

    const alertUuid = generateUUID();
    const newAlert: EmergencyAlert = {
      id: alertUuid,
      hospital_id: hid,
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
        await supabase.from('emergency_alerts').insert({
          id: alertUuid,
          hospital_id: hid,
          code_id: params.code_id,
          location_text: params.location_text,
          status: 'ACTIVE',
          triggered_by_name: params.triggered_by_name,
          triggered_by_role: params.triggered_by_role,
          triggered_at: newAlert.triggered_at,
          patient_id_optional: patient?.hrn || null,
          patient_details: patient,
        });
      } catch (e) {
        console.error('Supabase trigger error:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const current = JSON.parse(localStorage.getItem(`cph_emergency_history_${hid}`) || '[]');
        localStorage.setItem(`cph_emergency_history_${hid}`, JSON.stringify([newAlert, ...current.filter((x: any) => x.id !== newAlert.id)]));
      } catch (e) {}
    }

    this.lastAlertId = alertUuid;
    this.notifyListeners(newAlert, 'TRIGGERED');
    return newAlert;
  }

  public static async addResponder(params: {
    alert_id: string;
    responder_name: string;
    role: AlertResponder['role'];
    eta_minutes: number;
  }): Promise<AlertResponder> {
    try {
      const res = await fetch('/api/emergency/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESPOND',
          alert_id: params.alert_id,
          responder_name: params.responder_name,
          role: params.role,
          eta_minutes: params.eta_minutes,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.responder) {
          this.notifyListeners(await this.getActiveAlert(), 'RESPONDER_ADDED');
          return json.responder;
        }
      }
    } catch (e) {
      // ignore
    }

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
        console.error('Supabase responder error:', e);
      }
    }

    this.notifyListeners(await this.getActiveAlert(), 'RESPONDER_ADDED');
    return newResponder;
  }

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

  // Resolve emergency code via REST API
  public static async resolveAlert(params: {
    alert_id: string;
    resolved_by_name: string;
    resolution_notes: string;
    status: AlertStatus;
  }): Promise<void> {
    try {
      await fetch('/api/emergency/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE',
          alert_id: params.alert_id,
          resolved_by_name: params.resolved_by_name,
          resolution_notes: params.resolution_notes,
        }),
      });
    } catch (e) {
      // ignore
    }

    if (supabase) {
      try {
        await supabase
          .from('emergency_alerts')
          .update({
            status: params.status,
            resolved_at: new Date().toISOString(),
            resolved_by_name: params.resolved_by_name,
            resolution_notes: params.resolution_notes,
          })
          .eq('id', params.alert_id);
      } catch (e) {
        console.error('Failed resolving in Supabase direct:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const current = JSON.parse(localStorage.getItem('cphb_emergency_history_v2') || '[]');
        const updated = current.map((a: any) => {
          if (!params.alert_id || params.alert_id === 'any' || a.id === params.alert_id) {
            return {
              ...a,
              status: params.status,
              resolved_at: new Date().toISOString(),
              resolved_by_name: params.resolved_by_name,
              resolution_notes: params.resolution_notes,
            };
          }
          return a;
        });
        localStorage.setItem('cphb_emergency_history_v2', JSON.stringify(updated));
      } catch (e) {}
    }

    this.lastAlertId = null;
    this.notifyListeners(null, 'RESOLVED');
  }
}
