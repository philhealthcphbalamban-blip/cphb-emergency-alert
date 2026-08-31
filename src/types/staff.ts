export type StaffRole = 
  | 'Staff Nurse'
  | 'Head Nurse'
  | 'Charge Nurse'
  | 'Physician'
  | 'Resident Physician'
  | 'Anesthesiologist'
  | 'Respiratory Therapist'
  | 'Security Officer'
  | 'Hospital Administrator'
  | 'MDRRMO 911 Dispatcher'
  | 'Rescue Team Lead'
  | 'Ambulance EMT / Driver'
  | 'Barangay PTV Driver'
  | 'Barangay Health Worker (BHW)'
  | string;

export type HospitalDepartment = 
  | 'Emergency Department (ER)'
  | 'ICU NEW ROOM'
  | 'MEDICAL WARD (WARD 4)'
  | 'WARD 5 (OB-GYN)'
  | 'WARD 6 (Nursery / Pedia)'
  | 'WARD 7 (Surgical)'
  | 'WARD 10 (Isolation)'
  | 'Outpatient Clinic (OPD)'
  | 'Medical Section'
  | 'Nursing Section'
  | 'Resuscitation Code Team'
  | 'Hospital Security & Command'
  | 'Hospital Administration / IT'
  | 'MDRRMO Balamban Command Center'
  | 'Balamban Rescue 911 Station'
  | 'Barangay Emergency Response (BERT)'
  | string;

export interface HospitalStaff {
  id: string;
  hospital_id?: string;             // e.g. 'cphb', 'balamban_rescue', 'cphd', 'cphc', 'cphbogo'
  name: string;
  role: StaffRole;
  department: HospitalDepartment;
  employee_id: string;
  pin_code?: string;                // 4-6 digit numeric PIN for quick 1-tap login / keypad
  prc_license_no: string;           // Kept for compatibility
  accreditation_no?: string;        // Accreditation No. (e.g. PhilHealth / Hospital / MDRRMO Badge)
  specialization?: string;          // e.g. 'Emergency Medicine / Trauma' or 'BLS / EVOC Driver'
  contact_no?: string;              // Local / Mobile e.g. 'Loc 102 / 0917-123-4567'
  assigned_barangay?: string;       // e.g. 'Gaas', 'Pondol', 'Poblacion'
  avatar_initials: string;
  color_hex: string;
  is_doctor: boolean;
  is_rescue?: boolean;              // True for MDRRMO Balamban Rescue personnel
  is_admin?: boolean;
  can_trigger_code: boolean;
  can_respond_code: boolean;
  can_resolve_code: boolean;
}
