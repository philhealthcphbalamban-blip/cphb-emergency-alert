import { HospitalStaff } from '@/types/staff';

// Default empty/clean list with only the System Administrator until the user inputs or screenshots Ref_Personnel
export const DEFAULT_CPHB_STAFF: HospitalStaff[] = [
  {
    id: 'staff-admin-1',
    name: 'CPHB Hospital Admin / IT',
    role: 'Hospital Administrator',
    department: 'Hospital Administration / IT',
    employee_id: 'CPHB-IT-0001',
    prc_license_no: 'DOH-CPHB-ADM-01',
    specialization: 'Hospital Systems & User Access Management',
    contact_no: 'Loc 100 / Admin Desk',
    avatar_initials: 'AD',
    color_hex: '#0f172a',
    is_doctor: false,
    is_admin: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },
];

export const CPHB_STAFF_MEMBERS = DEFAULT_CPHB_STAFF;

const STORAGE_KEY_CURRENT = 'cphb_current_staff_user_permanent_v1';
const STORAGE_KEY_CUSTOM_LIST = 'cphb_hospital_staff_custom_v1';

export class StaffService {
  public static getAllStaff(): HospitalStaff[] {
    if (typeof window === 'undefined') return DEFAULT_CPHB_STAFF;
    try {
      const customRaw = localStorage.getItem(STORAGE_KEY_CUSTOM_LIST);
      if (customRaw) {
        const parsed: HospitalStaff[] = JSON.parse(customRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
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
    return this.getAllStaff().filter(s => !s.is_doctor && !s.is_admin && s.role !== 'Security Officer');
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
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(staff));
      window.dispatchEvent(new CustomEvent('cphb_staff_changed', { detail: staff }));
    } catch (e) {
      console.warn('Could not save staff to localStorage:', e);
    }
  }

  public static setBulkStaff(list: HospitalStaff[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_LIST, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('cphb_staff_directory_updated'));
      window.dispatchEvent(new CustomEvent('cphb_staff_changed', { detail: list[0] }));
    } catch (e) {
      console.warn('Error saving bulk staff:', e);
    }
  }

  public static saveStaffMember(newStaff: HospitalStaff) {
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
    } catch (e) {
      console.warn('Error saving staff member:', e);
    }
  }

  public static deleteStaffMember(id: string) {
    if (typeof window === 'undefined') return;
    try {
      const currentList = this.getAllStaff();
      const updated = currentList.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY_CUSTOM_LIST, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('cphb_staff_directory_updated'));
    } catch (e) {
      console.warn('Error deleting staff member:', e);
    }
  }

  public static resetToDefaultStaff() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_LIST);
      window.dispatchEvent(new CustomEvent('cphb_staff_directory_updated'));
    } catch (e) {
      console.warn('Error resetting staff list:', e);
    }
  }
}
