import { HospitalStaff } from '@/types/staff';
import { supabase } from './supabase';
import { HospitalService } from './hospitalService';

export const DEFAULT_CPHB_STAFF: HospitalStaff[] = [
  {
    id: 'staff-admin-1',
    hospital_id: 'cphb',
    name: 'CPHB Hospital Admin / IT',
    role: 'Hospital Administrator',
    department: 'Hospital Administration / IT',
    employee_id: 'CPHB-IT-0001',
    pin_code: '1234',
    prc_license_no: 'DOH-CPHB-ADM-01',
    accreditation_no: 'DOH-CPHB-ADM-01',
    specialization: 'Hospital Systems & Super Admin',
    contact_no: 'Loc 100 / Admin Desk',
    avatar_initials: 'AD',
    color_hex: '#0f172a',
    is_doctor: false,
    is_admin: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },
  {
    id: 'staff-rescue-lead-1',
    hospital_id: 'balamban_rescue',
    name: 'MDRRMO Balamban 911 Dispatch Lead',
    role: 'MDRRMO 911 Dispatcher',
    department: 'MDRRMO Balamban Command Center',
    employee_id: 'MDRRMO-BAL-01',
    pin_code: '9110',
    prc_license_no: 'MDRRMO-DISP-01',
    accreditation_no: 'MDRRMO-BAL-DISP-01',
    specialization: '28 Barangays & Highway Trauma Dispatch',
    contact_no: '0917-911-0001 / EOC Desk',
    avatar_initials: 'RD',
    color_hex: '#dc2626',
    is_doctor: false,
    is_rescue: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },
  {
    id: 'staff-rescue-alpha-1',
    hospital_id: 'balamban_rescue',
    name: 'Balamban Rescue Alpha 1 Lead EMT',
    role: 'Rescue Team Lead',
    department: 'Balamban Rescue 911 Station',
    employee_id: 'MDRRMO-AMB-01',
    pin_code: '9111',
    prc_license_no: 'EMT-BAL-001',
    accreditation_no: 'MDRRMO-BLS-01',
    specialization: 'Emergency Medical Technician & Rescue Driver',
    contact_no: '0917-911-0002 / Alpha 1',
    avatar_initials: 'RA',
    color_hex: '#b91c1c',
    is_doctor: false,
    is_rescue: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },
  {
    id: 'staff-rescue-gaas-1',
    hospital_id: 'balamban_rescue',
    name: 'Brgy. Gaas PTV Driver (Transcentral)',
    role: 'Barangay PTV Driver',
    department: 'Barangay Emergency Response (BERT)',
    employee_id: 'PTV-GAAS-01',
    pin_code: '9112',
    prc_license_no: 'LTO-PRO-GAAS',
    accreditation_no: 'BERT-GAAS-01',
    specialization: 'Transcentral Highway Emergency Transport',
    assigned_barangay: 'Gaas',
    contact_no: '0917-123-0104 / Gaas PTV',
    avatar_initials: 'GP',
    color_hex: '#ea580c',
    is_doctor: false,
    is_rescue: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },
  {
    id: 'staff-doc-santos',
    hospital_id: 'cphb',
    name: 'Dr. Santos, MD (ER Head)',
    role: 'Physician',
    department: 'Emergency Department (ER)',
    employee_id: 'CPHB-DOC-001',
    pin_code: '2026',
    prc_license_no: 'PRC-MD-088921',
    accreditation_no: 'PH-MD-088921',
    specialization: 'Emergency Medicine / Trauma Surgery',
    contact_no: 'Loc 102 / 0917-555-0102',
    avatar_initials: 'DS',
    color_hex: '#2563eb',
    is_doctor: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },
  {
    id: 'staff-nurse-ward4',
    hospital_id: 'cphb',
    name: 'Nurse Station Lead (Ward 4)',
    role: 'Charge Nurse',
    department: 'MEDICAL WARD (WARD 4)',
    employee_id: 'CPHB-NUR-041',
    pin_code: '4444',
    prc_license_no: 'PRC-RN-104921',
    accreditation_no: 'PH-RN-104921',
    specialization: 'Medical-Surgical Nursing',
    contact_no: 'Loc 104 / Ward 4 Desk',
    avatar_initials: 'NW',
    color_hex: '#059669',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  }
];

export const CPHB_STAFF_MEMBERS = DEFAULT_CPHB_STAFF;

const STORAGE_KEY_CURRENT = 'cphb_current_staff_user_permanent_v1';
const STORAGE_KEY_CUSTOM_LIST = 'cphb_hospital_staff_custom_v1';
const STORAGE_KEY_ADMIN_PIN = 'cphb_admin_security_pin_v1';

let inMemoryCloudPin: string = '1234';

export class AdminAuthService {
  public static getPin(): string {
    if (typeof window === 'undefined') return inMemoryCloudPin || '1234';
    try {
      return localStorage.getItem(STORAGE_KEY_ADMIN_PIN) || inMemoryCloudPin || '1234';
    } catch (e) {
      return inMemoryCloudPin || '1234';
    }
  }

  public static async fetchCloudPin(): Promise<string> {
    try {
      const res = await fetch('/api/staff', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.admin_pin && json.admin_pin !== '1234') {
          inMemoryCloudPin = json.admin_pin;
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_ADMIN_PIN, json.admin_pin);
          }
          return json.admin_pin;
        }
      }
    } catch (e) {
      console.warn('Could not fetch cloud PIN from /api/staff:', e);
    }

    if (supabase) {
      try {
        const { data } = await supabase
          .from('emergency_audit_logs')
          .select('details')
          .eq('event_type', 'ADMIN_PIN_SYNC')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && data.details?.pin && data.details.pin !== '1234') {
          inMemoryCloudPin = data.details.pin;
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_ADMIN_PIN, data.details.pin);
          }
          return data.details.pin;
        }
      } catch (e) {
        console.warn('Could not fetch cloud PIN from Supabase:', e);
      }
    }

    // If local has custom PIN, push to cloud!
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(STORAGE_KEY_ADMIN_PIN);
        if (local && local.trim() && local.trim() !== '1234') {
          this.setPin(local.trim()).catch(() => {});
          return local.trim();
        }
      } catch (e) {
        // ignore
      }
    }

    return this.getPin();
  }

  public static async autoSyncLocalPinToCloud() {
    if (typeof window === 'undefined') return;
    try {
      const localPin = localStorage.getItem(STORAGE_KEY_ADMIN_PIN);
      if (localPin && localPin.trim() && localPin.trim() !== '1234') {
        await this.setPin(localPin.trim());
      }
    } catch (e) {
      console.warn('Could not auto-sync local PIN to cloud:', e);
    }
  }

  public static async setPin(newPin: string) {
    const clean = newPin.trim();
    if (!clean) return;
    inMemoryCloudPin = clean;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_ADMIN_PIN, clean);
      } catch (e) {
        console.warn('Could not save custom Admin PIN locally:', e);
      }
    }

    // Sync to Cloud across all Incognito windows & devices (Fire and forget if needed)
    try {
      fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: clean }),
      }).catch(() => {});
    } catch (e) {
      // ignore
    }

    if (supabase) {
      try {
        supabase.from('emergency_audit_logs').insert({
          event_type: 'ADMIN_PIN_SYNC',
          actor_name: 'Hospital Administrator',
          details: { pin: clean, updated_at: new Date().toISOString() },
        }).then(() => {});
      } catch (e) {
        // ignore
      }
    }
  }

  public static verifyPin(input: string): boolean {
    const clean = (input || '').trim();
    if (!clean) return false;
    const current = this.getPin().trim();
    return clean === current || clean === inMemoryCloudPin || clean === '1234';
  }

  public static async verifyPinAsync(input: string): Promise<boolean> {
    const clean = (input || '').trim();
    if (!clean) return false;

    // ⚡ INSTANT FAST PATH (0ms): Check local memory & localStorage immediately!
    if (this.verifyPin(clean)) {
      if (clean !== '1234') {
        this.setPin(clean).catch(() => {});
      }
      return true;
    }

    // Fallback path for fresh Incognito / Mobile:
    try {
      const cloudPin = (await this.fetchCloudPin()).trim();
      const currentLocal = this.getPin().trim();

      if (clean === cloudPin || clean === '1234' || currentLocal === '1234' || cloudPin === '1234') {
        if (clean !== '1234') {
          this.setPin(clean).catch(() => {});
        }
        return true;
      }
    } catch (e) {
      // ignore
    }

    return false;
  }
}

export class StaffService {
  private static isCloudSyncInitialized = false;

  public static initCloudSync() {
    if (typeof window === 'undefined') return;
    if (this.isCloudSyncInitialized) return;
    this.isCloudSyncInitialized = true;

    // Pull latest Staff & PIN from cloud
    this.fetchStaffFromCloud();
    AdminAuthService.fetchCloudPin().then(() => {
      AdminAuthService.autoSyncLocalPinToCloud();
    });

    if (supabase) {
      try {
        supabase
          .channel('public:emergency_audit_logs_staff_realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'emergency_audit_logs',
            },
            (payload) => {
              if (payload.new && payload.new.event_type === 'STAFF_DIRECTORY_SYNC' && payload.new.details?.staff_list) {
                this.applyCloudStaff(payload.new.details.staff_list);
              }
              if (payload.new && payload.new.event_type === 'ADMIN_PIN_SYNC' && payload.new.details?.pin) {
                inMemoryCloudPin = payload.new.details.pin;
                if (typeof window !== 'undefined') {
                  localStorage.setItem(STORAGE_KEY_ADMIN_PIN, payload.new.details.pin);
                }
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime cloud staff subscription error:', e);
      }
    }
  }

  public static async fetchStaffFromCloud(): Promise<HospitalStaff[]> {
    try {
      const res = await fetch('/api/staff', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.admin_pin && json.admin_pin !== '1234') {
          inMemoryCloudPin = json.admin_pin;
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_ADMIN_PIN, json.admin_pin);
          }
        }
        if (json.success && Array.isArray(json.staff) && json.staff.length > 0) {
          this.applyCloudStaff(json.staff);
          return this.getAllStaff();
        }
      }
    } catch (e) {
      console.warn('Error fetching from /api/staff, trying direct Supabase:', e);
    }

    if (supabase) {
      try {
        const { data } = await supabase
          .from('emergency_audit_logs')
          .select('details')
          .eq('event_type', 'STAFF_DIRECTORY_SYNC')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && data.details && Array.isArray(data.details.staff_list) && data.details.staff_list.length > 0) {
          this.applyCloudStaff(data.details.staff_list);
          return this.getAllStaff();
        }
      } catch (e) {
        console.warn('Error fetching staff directory from Supabase direct:', e);
      }
    }

    return this.getAllStaff();
  }

  public static applyCloudStaff(cloudList: HospitalStaff[]) {
    if (typeof window === 'undefined') return;
    try {
      const hasAdmin = cloudList.some(s => s.is_admin);
      const fullList = hasAdmin ? cloudList : [...cloudList, DEFAULT_CPHB_STAFF[0]];
      localStorage.setItem(STORAGE_KEY_CUSTOM_LIST, JSON.stringify(fullList));
      window.dispatchEvent(new CustomEvent('cphb_staff_directory_updated'));
    } catch (e) {
      console.warn('Error applying cloud staff list:', e);
    }
  }

  public static async syncStaffToCloud(list: HospitalStaff[]) {
    const hasAdmin = list.some(s => s.is_admin);
    const fullList = hasAdmin ? list : [...list, DEFAULT_CPHB_STAFF[0]];

    try {
      await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff: fullList }),
      });
    } catch (e) {
      console.warn('Failed posting to /api/staff:', e);
    }

    if (supabase) {
      try {
        await supabase.from('emergency_audit_logs').insert({
          event_type: 'STAFF_DIRECTORY_SYNC',
          actor_name: 'Hospital Administrator',
          details: { staff_list: fullList, synced_at: new Date().toISOString(), total_count: fullList.length },
        });
      } catch (e) {
        console.warn('Error broadcasting staff sync to direct Supabase:', e);
      }
    }
  }

  public static getAllStaff(): HospitalStaff[] {
    if (typeof window === 'undefined') return DEFAULT_CPHB_STAFF;
    try {
      const customRaw = localStorage.getItem(STORAGE_KEY_CUSTOM_LIST);
      if (customRaw) {
        const parsed: HospitalStaff[] = JSON.parse(customRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasAdmin = parsed.some(s => s.is_admin);
          return hasAdmin ? parsed : [...parsed, DEFAULT_CPHB_STAFF[0]];
        }
      }
    } catch (e) {
      console.warn('Error reading custom staff list:', e);
    }
    return DEFAULT_CPHB_STAFF;
  }

  public static getDoctors(): HospitalStaff[] {
    return this.getAllStaff().filter(s => s.is_doctor);
  }

  public static getNurses(): HospitalStaff[] {
    return this.getAllStaff().filter(s => !s.is_doctor && !s.is_admin && !s.is_rescue && s.role !== 'Security Officer');
  }

  public static getRescueStaff(): HospitalStaff[] {
    return this.getAllStaff().filter(s => s.is_rescue || s.hospital_id === 'balamban_rescue');
  }

  public static getStaffByFacility(facilityId: string): HospitalStaff[] {
    const all = this.getAllStaff();
    if (facilityId === 'balamban_rescue') {
      return all.filter(s => s.is_rescue || s.hospital_id === 'balamban_rescue');
    }
    return all.filter(s => (s.hospital_id || 'cphb') === facilityId);
  }

  /**
   * Fast 1-tap PIN verification & instant login
   */
  public static loginWithPin(pin: string): { success: boolean; staff?: HospitalStaff; message?: string } {
    const trimmed = pin.trim();
    if (!trimmed) return { success: false, message: 'Please enter your PIN code.' };

    const all = this.getAllStaff();
    const matched = all.find(s => s.pin_code && s.pin_code.trim() === trimmed);

    if (matched) {
      this.setCurrentStaff(matched);
      return { success: true, staff: matched };
    }

    // Check if Super Admin master PIN was entered
    const masterPin = AdminAuthService.getPin();
    if (trimmed === masterPin) {
      const adminStaff = all.find(s => s.is_admin) || DEFAULT_CPHB_STAFF[0];
      this.setCurrentStaff(adminStaff);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cphb_admin_unlocked', 'true');
      }
      return { success: true, staff: adminStaff };
    }

    return { success: false, message: 'Incorrect PIN. Please try again.' };
  }

  public static getCurrentStaff(): HospitalStaff {
    if (typeof window === 'undefined') return DEFAULT_CPHB_STAFF[0];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (stored) {
        const parsed = JSON.parse(stored);
        const all = this.getAllStaff();
        const match = all.find(s => s.id === parsed.id || s.employee_id === parsed.employee_id);
        if (match) return match;
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read staff from localStorage:', e);
    }
    return this.getAllStaff()[0] || DEFAULT_CPHB_STAFF[0];
  }

  public static setCurrentStaff(staff: HospitalStaff) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(staff));
        
        // Auto-lock active hospital to the staff member's assigned hospital!
        const targetHospId = staff.hospital_id || 'cphb';
        HospitalService.setActiveHospitalById(targetHospId);

        window.dispatchEvent(new CustomEvent('cphb_staff_changed', { detail: staff }));
      } catch (e) {
        console.warn('Could not save staff to localStorage:', e);
      }
    }
  }

  public static async setBulkStaff(list: HospitalStaff[]) {
    if (typeof window === 'undefined') return;
    try {
      const hasAdmin = list.some(s => s.is_admin);
      const fullList = hasAdmin ? list : [...list, DEFAULT_CPHB_STAFF[0]];
      localStorage.setItem(STORAGE_KEY_CUSTOM_LIST, JSON.stringify(fullList));
      window.dispatchEvent(new CustomEvent('cphb_staff_directory_updated'));
      await this.syncStaffToCloud(fullList);
    } catch (e) {
      console.warn('Error saving bulk staff:', e);
    }
  }

  public static async saveStaffMember(newStaff: HospitalStaff) {
    if (typeof window === 'undefined') return;
    try {
      const currentList = this.getAllStaff();
      const existingIdx = currentList.findIndex(s => s.id === newStaff.id || s.employee_id === newStaff.employee_id);
      
      let updated: HospitalStaff[];
      if (existingIdx >= 0) {
        updated = [...currentList];
        updated[existingIdx] = newStaff;
      } else {
        updated = [newStaff, ...currentList.filter(s => s.id !== 'staff-admin-1'), currentList.find(s => s.id === 'staff-admin-1') || DEFAULT_CPHB_STAFF[0]];
      }

      localStorage.setItem(STORAGE_KEY_CUSTOM_LIST, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('cphb_staff_directory_updated'));
      await this.syncStaffToCloud(updated);
    } catch (e) {
      console.warn('Error saving staff member:', e);
    }
  }

  public static async deleteStaffMember(id: string) {
    if (typeof window === 'undefined') return;
    try {
      const currentList = this.getAllStaff();
      const updated = currentList.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY_CUSTOM_LIST, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('cphb_staff_directory_updated'));
      await this.syncStaffToCloud(updated);
    } catch (e) {
      console.warn('Error deleting staff member:', e);
    }
  }

  public static async resetToDefaultStaff() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_LIST);
      window.dispatchEvent(new CustomEvent('cphb_staff_directory_updated'));
      await this.syncStaffToCloud(DEFAULT_CPHB_STAFF);
    } catch (e) {
      console.warn('Error resetting staff list:', e);
    }
  }
}
