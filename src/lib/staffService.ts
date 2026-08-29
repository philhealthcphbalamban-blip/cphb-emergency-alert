import { HospitalStaff } from '@/types/staff';
import { supabase } from './supabase';

export const DEFAULT_CPHB_STAFF: HospitalStaff[] = [
  // ==========================================
  // SYSTEM ADMINISTRATOR
  // ==========================================
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

  // ==========================================
  // PHYSICIANS / DOCTORS (Ref_Personnel)
  // ==========================================
  {
    id: 'staff-er-doc-1',
    name: 'Dr. Anton Cruz, MD',
    role: 'Physician',
    department: 'Emergency Department (ER)',
    employee_id: 'CPHB-MD-0129',
    prc_license_no: '0129845',
    specialization: 'Emergency Medicine & Acute Trauma Care',
    contact_no: 'Loc 101 / 0917-882-1401',
    avatar_initials: 'AC',
    color_hex: '#2563eb',
    is_doctor: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },
  {
    id: 'staff-w5-doc-1',
    name: 'Dr. Maria Santos, MD',
    role: 'Physician',
    department: 'WARD 5 (OB-GYN)',
    employee_id: 'CPHB-MD-0042',
    prc_license_no: '0042189',
    specialization: 'Obstetrics & Maternal-Fetal Medicine (Code Blue Lead)',
    contact_no: 'Loc 105 / 0917-553-2940',
    avatar_initials: 'MS',
    color_hex: '#e11d48',
    is_doctor: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },
  {
    id: 'staff-icu-doc-1',
    name: 'Dr. Eduardo Reyes, MD',
    role: 'Physician',
    department: 'ICU NEW ROOM',
    employee_id: 'CPHB-MD-0098',
    prc_license_no: '0098732',
    specialization: 'Critical Care & Pulmonology / Intensivist',
    contact_no: 'Loc 109 / 0918-994-3112',
    avatar_initials: 'ER',
    color_hex: '#4f46e5',
    is_doctor: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },
  {
    id: 'staff-w4-doc-1',
    name: 'Dr. Roberto Gomez, MD',
    role: 'Physician',
    department: 'MEDICAL WARD (WARD 4)',
    employee_id: 'CPHB-MD-0155',
    prc_license_no: '0155621',
    specialization: 'Internal Medicine & Adult Cardiology',
    contact_no: 'Loc 104 / 0919-441-8023',
    avatar_initials: 'RG',
    color_hex: '#0d9488',
    is_doctor: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },
  {
    id: 'staff-w6-doc-1',
    name: 'Dr. Patricia Flores, MD',
    role: 'Physician',
    department: 'WARD 6 (Nursery / Pedia)',
    employee_id: 'CPHB-MD-0210',
    prc_license_no: '0210493',
    specialization: 'Pediatrics & Pediatric Advanced Life Support (PALS)',
    contact_no: 'Loc 106 / 0920-771-4950',
    avatar_initials: 'PF',
    color_hex: '#0891b2',
    is_doctor: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },
  {
    id: 'staff-w7-doc-1',
    name: 'Dr. Manuel Tan, MD',
    role: 'Physician',
    department: 'WARD 7 (Surgical)',
    employee_id: 'CPHB-MD-0077',
    prc_license_no: '0077840',
    specialization: 'General Surgery & Advanced Trauma Resuscitation',
    contact_no: 'Loc 107 / 0917-332-9018',
    avatar_initials: 'MT',
    color_hex: '#ea580c',
    is_doctor: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },

  // ==========================================
  // NURSING PERSONNEL (CPHB Ref_Personnel)
  // ==========================================
  {
    id: 'staff-er-nurse-1',
    name: 'Nurse Sarah Jen, RN',
    role: 'Staff Nurse',
    department: 'Emergency Department (ER)',
    employee_id: 'CPHB-RN-0842',
    prc_license_no: '0842190',
    specialization: 'Emergency & Triage Nursing (BLS/ACLS)',
    contact_no: 'Loc 101',
    avatar_initials: 'SJ',
    color_hex: '#dc2626',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },
  {
    id: 'staff-icu-nurse-1',
    name: 'Nurse Dexter Alcantara, RN',
    role: 'Head Nurse',
    department: 'ICU NEW ROOM',
    employee_id: 'CPHB-RN-0512',
    prc_license_no: '0512398',
    specialization: 'Critical Care Head Nurse / ACLS Certified',
    contact_no: 'Loc 109',
    avatar_initials: 'DA',
    color_hex: '#0284c7',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },
  {
    id: 'staff-w4-nurse-1',
    name: 'Nurse Mary Rose, RN',
    role: 'Staff Nurse',
    department: 'MEDICAL WARD (WARD 4)',
    employee_id: 'CPHB-RN-0994',
    prc_license_no: '0994512',
    specialization: 'Adult Medical Care & Chronic Illness',
    contact_no: 'Loc 104',
    avatar_initials: 'MR',
    color_hex: '#059669',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },
  {
    id: 'staff-w5-nurse-1',
    name: 'Nurse Camille Perez, RN',
    role: 'Staff Nurse',
    department: 'WARD 5 (OB-GYN)',
    employee_id: 'CPHB-RN-0771',
    prc_license_no: '0771823',
    specialization: 'Maternal & Child Health / Delivery Room',
    contact_no: 'Loc 105',
    avatar_initials: 'CP',
    color_hex: '#db2777',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },
  {
    id: 'staff-w6-nurse-1',
    name: 'Nurse Christine Joy, RN',
    role: 'Staff Nurse',
    department: 'WARD 6 (Nursery / Pedia)',
    employee_id: 'CPHB-RN-0638',
    prc_license_no: '0638491',
    specialization: 'Neonatal Care & PALS Certified (Code Baby Blue Team)',
    contact_no: 'Loc 106',
    avatar_initials: 'CJ',
    color_hex: '#06b6d4',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },
  {
    id: 'staff-sec-1',
    name: 'Officer Dante Morales',
    role: 'Security Officer',
    department: 'Hospital Security & Command',
    employee_id: 'CPHB-SEC-0012',
    prc_license_no: 'SOSIA-SEC-2024-88',
    specialization: 'Hospital Safety & Incident Perimeter Control',
    contact_no: 'Loc 100',
    avatar_initials: 'DM',
    color_hex: '#27272a',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
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
    // Default to ER Doctor or Admin
    return DEFAULT_CPHB_STAFF[1] || DEFAULT_CPHB_STAFF[0];
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

  // Add new Doctor / Nurse / Admin
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
        updated = [newStaff, ...currentList];
      }

      localStorage.setItem(STORAGE_KEY_CUSTOM_LIST, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('cphb_staff_directory_updated'));
    } catch (e) {
      console.warn('Error saving staff member:', e);
    }
  }

  // Delete staff member
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

  // Reset to default
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
