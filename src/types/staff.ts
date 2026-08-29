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
  | string;

export interface HospitalStaff {
  id: string;
  name: string;
  role: StaffRole;
  department: HospitalDepartment;
  employee_id: string;
  prc_license_no: string;           // Kept for compatibility
  accreditation_no?: string;        // Accreditation No. (e.g. PhilHealth / Hospital Accreditation)
  specialization?: string;          // e.g. 'Emergency Medicine / Trauma'
  contact_no?: string;              // Local / Mobile e.g. 'Loc 102 / 0917-123-4567'
  avatar_initials: string;
  color_hex: string;
  is_doctor: boolean;
  is_admin?: boolean;
  can_trigger_code: boolean;
  can_respond_code: boolean;
  can_resolve_code: boolean;
}
