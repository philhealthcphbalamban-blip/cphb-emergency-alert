import { 
  CommunityEmergencyAlert, 
  CommunityEmergencyType, 
  BALAMBAN_BARANGAYS, 
  COMMUNITY_EMERGENCY_DEFS 
} from '@/types/rescue';

const STORAGE_KEY_COMMUNITY_ALERTS = 'cphb_community_rescue_alerts_v1';

export class RescueService {
  private static listeners: Set<(alerts: CommunityEmergencyAlert[]) => void> = new Set();
  private static channel: BroadcastChannel | null = null;
  private static isInitialized = false;
  private static lastHash = '';

  public static init() {
    if (typeof window === 'undefined') return;
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      if (typeof window.BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel('cphb_rescue_bus_v1');
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'RESCUE_ALERTS_SYNC') {
            this.notifyListeners();
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    // Initial fetch from cloud
    this.fetchFromCloud();

    // ⚡ 1.5-Second Ultra-Fast Cloud Poller
    // Guarantees mobile phone dispatches immediately pop up on PC Rescue TV screens
    setInterval(() => {
      this.fetchFromCloud();
    }, 1500);
  }

  public static subscribe(callback: (alerts: CommunityEmergencyAlert[]) => void) {
    this.init();
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyListeners() {
    const list = this.getCommunityAlerts();
    this.listeners.forEach((l) => {
      try {
        l(list);
      } catch (e) {}
    });
  }

  public static async fetchFromCloud(): Promise<CommunityEmergencyAlert[]> {
    if (typeof window === 'undefined') return [];

    try {
      const res = await fetch('/api/rescue/alerts', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.alerts)) {
          const cloudAlerts: CommunityEmergencyAlert[] = json.alerts;
          const currentLocal = this.getCommunityAlerts();

          // Merge cloud alerts with local alerts
          const mergedMap = new Map<string, CommunityEmergencyAlert>();
          currentLocal.forEach(a => mergedMap.set(a.id, a));
          cloudAlerts.forEach(a => mergedMap.set(a.id, a));

          const merged = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.dispatched_at).getTime() - new Date(a.dispatched_at).getTime()
          );

          const newHash = merged.map(a => `${a.id}_${a.status}`).join('|');
          if (newHash !== this.lastHash) {
            this.lastHash = newHash;
            try {
              localStorage.setItem(STORAGE_KEY_COMMUNITY_ALERTS, JSON.stringify(merged));
            } catch (e) {}
            this.notifyListeners();
          }

          return merged;
        }
      }
    } catch (e) {
      // Offline fallback
    }

    return this.getCommunityAlerts();
  }

  public static getCommunityAlerts(): CommunityEmergencyAlert[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMMUNITY_ALERTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    // Default Initial Demo Active Alert if none exists
    const initialAlerts: CommunityEmergencyAlert[] = [
      {
        id: 'rescue-demo-01',
        emergency_type: 'CODE_TRAUMA',
        barangay_name: 'Gaas (Transcentral Highway)',
        sitio_or_landmark: 'Sitio Balamban Heights KM 34 (Near Viewdeck)',
        patient_condition: 'Motorcycle rider down with suspected leg fracture and lacerations.',
        caller_name: 'Kagawad Jun (Gaas Brgy Hall)',
        caller_phone: '0917-555-4321',
        status: 'EN_ROUTE',
        dispatched_at: new Date(Date.now() - 6 * 60000).toISOString(),
        responding_units: [
          {
            unit_id: 'unit-m1',
            unit_name: 'Balamban Rescue Alpha 1 (MDRRMO 911)',
            unit_type: 'MDRRMO_RESCUE',
            driver_or_lead: 'Paramedic Ramos / Driver Ed',
            contact: '0918-911-0001',
            eta_mins: 14,
            status: 'EN_ROUTE',
          },
          {
            unit_id: 'unit-p1',
            unit_name: 'Gaas Mountain Highway PTV',
            unit_type: 'BARANGAY_PTV',
            driver_or_lead: 'Driver Nonoy (On Scene)',
            contact: '0917-123-0111',
            eta_mins: 0,
            status: 'ON_SCENE',
          }
        ],
        destination_facility: 'Cebu Provincial Hospital - Balamban (CPHB ER Trauma Bay)',
        triage_notes: 'Cervical collar applied by Gaas BERT. IV line prepped. Awaiting Balamban Rescue Alpha 1 arrival.',
      },
    ];

    try {
      localStorage.setItem(STORAGE_KEY_COMMUNITY_ALERTS, JSON.stringify(initialAlerts));
    } catch (e) {}

    return initialAlerts;
  }

  public static async dispatchCommunityAlert(params: {
    emergency_type: CommunityEmergencyType;
    barangay_name: string;
    sitio_or_landmark: string;
    patient_condition: string;
    caller_name: string;
    caller_phone: string;
    destination_facility?: string;
  }): Promise<CommunityEmergencyAlert> {
    const list = this.getCommunityAlerts();
    const barangay = BALAMBAN_BARANGAYS.find(b => b.name === params.barangay_name);

    const respondingUnits: CommunityEmergencyAlert['responding_units'] = [];

    // Assign nearest MDRRMO or Barangay PTV
    if (barangay?.hasStationedPTV && barangay.assignedPTVUnit) {
      respondingUnits.push({
        unit_id: `ptv-${barangay.id}`,
        unit_name: barangay.assignedPTVUnit,
        unit_type: 'BARANGAY_PTV',
        driver_or_lead: `Brgy ${barangay.name} Duty Driver`,
        contact: barangay.contactNumber,
        eta_mins: Math.max(3, Math.round(barangay.estimatedDriveTimeMins * 0.4)),
        status: 'DISPATCHED',
      });
    }

    respondingUnits.push({
      unit_id: 'mdrrmo-alpha-1',
      unit_name: 'Balamban Rescue Alpha (MDRRMO 911)',
      unit_type: 'MDRRMO_RESCUE',
      driver_or_lead: 'MDRRMO On-Duty EMS Team',
      contact: '0918-911-0001 / (032) 465-2111',
      eta_mins: barangay ? barangay.estimatedDriveTimeMins : 10,
      status: 'DISPATCHED',
    });

    const newAlert: CommunityEmergencyAlert = {
      id: `rescue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      emergency_type: params.emergency_type,
      barangay_name: params.barangay_name,
      sitio_or_landmark: params.sitio_or_landmark,
      patient_condition: params.patient_condition,
      caller_name: params.caller_name || 'Barangay Health Worker / Official',
      caller_phone: params.caller_phone || '0917-000-0000',
      status: 'DISPATCHED',
      dispatched_at: new Date().toISOString(),
      responding_units: respondingUnits,
      destination_facility: params.destination_facility || 'Cebu Provincial Hospital - Balamban (CPHB ER)',
      triage_notes: `Emergency code broadcast to Balamban Rescue MDRRMO and Barangay ${params.barangay_name}.`,
    };

    const updated = [newAlert, ...list];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_COMMUNITY_ALERTS, JSON.stringify(updated));
        if (this.channel) {
          this.channel.postMessage({ type: 'RESCUE_ALERTS_SYNC', payload: newAlert });
        }
      } catch (e) {}
    }

    // ⚡ Sync to Cloud API (broadcasts to all mobile phones and TV monitors)
    try {
      fetch('/api/rescue/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISPATCH',
          alert: newAlert,
        }),
      }).catch(() => {});
    } catch (e) {}

    this.notifyListeners();
    return newAlert;
  }

  public static async updateAlertStatus(
    alertId: string, 
    status: CommunityEmergencyAlert['status'], 
    notes?: string
  ): Promise<void> {
    const list = this.getCommunityAlerts();
    const updated = list.map((a) => {
      if (a.id === alertId) {
        return {
          ...a,
          status,
          triage_notes: notes || a.triage_notes,
          resolved_at: status === 'RESOLVED' ? new Date().toISOString() : a.resolved_at,
        };
      }
      return a;
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_COMMUNITY_ALERTS, JSON.stringify(updated));
        if (this.channel) {
          this.channel.postMessage({ type: 'RESCUE_ALERTS_SYNC' });
        }
      } catch (e) {}
    }

    // ⚡ Sync Status to Cloud API
    try {
      fetch('/api/rescue/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          alertId,
          status,
          notes,
        }),
      }).catch(() => {});
    } catch (e) {}

    this.notifyListeners();
  }
}
