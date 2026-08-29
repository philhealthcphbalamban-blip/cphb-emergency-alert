import { HospitalStaff } from '@/types/staff';

export const CPHB_STAFF_MEMBERS: HospitalStaff[] = [
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
  {
    id: 'staff-nicu-doc-1',
    name: 'Dr. Grace Bautista, MD',
    role: 'Physician',
    department: 'ICU NEW ROOM',
    employee_id: 'CPHB-MD-0114',
    prc_license_no: '0114890',
    specialization: 'Neonatology & Neonatal Resuscitation (Code Baby Blue Lead)',
    contact_no: 'Loc 110 / 0917-664-2109',
    avatar_initials: 'GB',
    color_hex: '#0284c7',
    is_doctor: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },
  {
    id: 'staff-anesth-doc-1',
    name: 'Dr. Alvin Navarro, MD',
    role: 'Anesthesiologist',
    department: 'Resuscitation Code Team',
    employee_id: 'CPHB-MD-0138',
    prc_license_no: '0138902',
    specialization: 'Anesthesiology & Difficult Airway Management',
    contact_no: 'Loc 112 / 0918-223-9041',
    avatar_initials: 'AN',
    color_hex: '#6366f1',
    is_doctor: true,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: true,
  },

  // ==========================================
  // NURSING PERSONNEL (CPHB Ref_Personnel)
  // ==========================================
  // --- EMERGENCY ROOM (ER) NURSES ---
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
    id: 'staff-er-nurse-2',
    name: 'Nurse Mark Anthony Villar, RN',
    role: 'Staff Nurse',
    department: 'Emergency Department (ER)',
    employee_id: 'CPHB-RN-0891',
    prc_license_no: '0891234',
    specialization: 'ER Trauma & Resuscitation Nursing',
    contact_no: 'Loc 101',
    avatar_initials: 'MV',
    color_hex: '#b91c1c',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },
  {
    id: 'staff-er-nurse-3',
    name: 'Nurse Angelica Mae Ruiz, RN',
    role: 'Staff Nurse',
    department: 'Emergency Department (ER)',
    employee_id: 'CPHB-RN-0912',
    prc_license_no: '0912450',
    specialization: 'ER Pediatric & OB Triage',
    contact_no: 'Loc 101',
    avatar_initials: 'AR',
    color_hex: '#991b1b',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },

  // --- ICU & CRITICAL CARE NURSES ---
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
    id: 'staff-icu-nurse-2',
    name: 'Nurse Jessa Marie Tan, RN',
    role: 'Staff Nurse',
    department: 'ICU NEW ROOM',
    employee_id: 'CPHB-RN-0876',
    prc_license_no: '0876120',
    specialization: 'ICU Hemodynamic & Ventilator Management',
    contact_no: 'Loc 109',
    avatar_initials: 'JT',
    color_hex: '#0369a1',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },
  {
    id: 'staff-icu-nurse-3',
    name: 'Nurse John Paul Lim, RN',
    role: 'Staff Nurse',
    department: 'ICU NEW ROOM',
    employee_id: 'CPHB-RN-0934',
    prc_license_no: '0934156',
    specialization: 'Critical Care & Cardiac Monitoring',
    contact_no: 'Loc 109',
    avatar_initials: 'JL',
    color_hex: '#075985',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },

  // --- MEDICAL WARD (WARD 4) NURSES ---
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
    id: 'staff-w4-nurse-2',
    name: 'Nurse Stephanie Joy Yap, RN',
    role: 'Staff Nurse',
    department: 'MEDICAL WARD (WARD 4)',
    employee_id: 'CPHB-RN-0881',
    prc_license_no: '0881245',
    specialization: 'Inpatient Medication & IV Therapy',
    contact_no: 'Loc 104',
    avatar_initials: 'SY',
    color_hex: '#047857',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },

  // --- WARD 5 (OB-GYN) NURSES ---
  {
    id: 'staff-w5-nurse-1',
    name: 'Nurse Camille Perez, RN',
    role: 'Staff Nurse',
    department: 'WARD 5 (OB-GYN)',
    employee_id: 'CPHB-RN-0771',
    prc_license_no: '0771823',
    specialization: 'Maternal & Child Health / Labor & Delivery',
    contact_no: 'Loc 105',
    avatar_initials: 'CP',
    color_hex: '#db2777',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },
  {
    id: 'staff-w5-nurse-2',
    name: 'Nurse Kristine Diane Chua, RN',
    role: 'Staff Nurse',
    department: 'WARD 5 (OB-GYN)',
    employee_id: 'CPHB-RN-0865',
    prc_license_no: '0865412',
    specialization: 'Post-Partum & High-Risk Pregnancy Care',
    contact_no: 'Loc 105',
    avatar_initials: 'KC',
    color_hex: '#be185d',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },

  // --- WARD 6 (NURSERY / NICU / PEDIA) NURSES ---
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
    id: 'staff-w6-nurse-2',
    name: 'Nurse Bea Katrina Oroc, RN',
    role: 'Staff Nurse',
    department: 'WARD 6 (Nursery / Pedia)',
    employee_id: 'CPHB-RN-0911',
    prc_license_no: '0911245',
    specialization: 'Pediatric Inpatient Care & Vaccination',
    contact_no: 'Loc 106',
    avatar_initials: 'BO',
    color_hex: '#0891b2',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },

  // --- WARD 7 (SURGICAL) NURSES ---
  {
    id: 'staff-w7-nurse-1',
    name: 'Nurse Neil Patrick Gomez, RN',
    role: 'Staff Nurse',
    department: 'WARD 7 (Surgical)',
    employee_id: 'CPHB-RN-0854',
    prc_license_no: '0854129',
    specialization: 'Post-Operative Surgical Care & Wound Management',
    contact_no: 'Loc 107',
    avatar_initials: 'NG',
    color_hex: '#ea580c',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },
  {
    id: 'staff-w7-nurse-2',
    name: 'Nurse Hannah Grace Villa, RN',
    role: 'Staff Nurse',
    department: 'WARD 7 (Surgical)',
    employee_id: 'CPHB-RN-0931',
    prc_license_no: '0931284',
    specialization: 'Surgical Trauma & Orthopedic Nursing',
    contact_no: 'Loc 107',
    avatar_initials: 'HV',
    color_hex: '#c2410c',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },

  // --- WARD 10 (ISOLATION) NURSES ---
  {
    id: 'staff-w10-nurse-1',
    name: 'Nurse Joshua Gabriel Diaz, RN',
    role: 'Staff Nurse',
    department: 'WARD 10 (Isolation)',
    employee_id: 'CPHB-RN-0874',
    prc_license_no: '0874512',
    specialization: 'Infectious Disease & Isolation Protocol',
    contact_no: 'Loc 108',
    avatar_initials: 'JD',
    color_hex: '#7c3aed',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },

  // --- OUTPATIENT (OPD) NURSES ---
  {
    id: 'staff-opd-nurse-1',
    name: 'Nurse Michelle Ann Torres, RN',
    role: 'Staff Nurse',
    department: 'Outpatient Clinic (OPD)',
    employee_id: 'CPHB-RN-0841',
    prc_license_no: '0841290',
    specialization: 'Ambulatory & Clinical Consultation Triage',
    contact_no: 'Loc 115',
    avatar_initials: 'MT',
    color_hex: '#4b5563',
    is_doctor: false,
    can_trigger_code: true,
    can_respond_code: true,
    can_resolve_code: false,
  },

  // ==========================================
  // SECURITY & COMMAND
  // ==========================================
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

const STORAGE_KEY = 'cphb_current_staff_user';

export class StaffService {
  public static getAllStaff(): HospitalStaff[] {
    return CPHB_STAFF_MEMBERS;
  }

  public static getDoctors(): HospitalStaff[] {
    return CPHB_STAFF_MEMBERS.filter(s => s.is_doctor);
  }

  public static getNurses(): HospitalStaff[] {
    return CPHB_STAFF_MEMBERS.filter(s => !s.is_doctor && s.role !== 'Security Officer');
  }

  public static getCurrentStaff(): HospitalStaff {
    if (typeof window === 'undefined') return CPHB_STAFF_MEMBERS[0];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = CPHB_STAFF_MEMBERS.find(s => s.id === parsed.id);
        if (match) return match;
      }
    } catch (e) {
      console.warn('Could not read staff from localStorage:', e);
    }
    return CPHB_STAFF_MEMBERS[0];
  }

  public static setCurrentStaff(staff: HospitalStaff) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
      window.dispatchEvent(new CustomEvent('cphb_staff_changed', { detail: staff }));
    } catch (e) {
      console.warn('Could not save staff to localStorage:', e);
    }
  }
}
