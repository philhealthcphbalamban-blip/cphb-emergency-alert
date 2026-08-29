export type StaffRole = 
  | 'Staff Nurse'
  | 'Head Nurse'
  | 'Physician'
  | 'Resident Physician'
  | 'Anesthesiologist'
  | 'Respiratory Therapist'
  | 'Security Officer'
  | 'Hospital Administrator';

export type HospitalDepartment = 
  | 'Emergency Department (ER)'
  | 'ICU NEW ROOM'
  | 'MEDICAL WARD (WARD 4)'
  | 'WARD 5 (OB-GYN)'
  | 'WARD 6 (Nursery / Pedia)'
  | 'WARD 7 (Surgical)'
  | 'WARD 10 (Isolation)'
  | 'Outpatient Clinic (OPD)'
  | 'Resuscitation Code Team'
  | 'Hospital Security & Command';

export interface HospitalStaff {
  id: string;
  name: string;
  role: StaffRole;
  department: HospitalDepartment;
  employee_id: string;
  prc_license_no: string;           // DOH / PRC License Number e.g. '0129845'
  specialization?: string;          // e.g. 'Emergency Medicine / Trauma'
  contact_no?: string;              // Local / Mobile e.g. 'Loc 102 / +63 917 123 4567'
  avatar_initials: string;
  color_hex: string;
  is_doctor: boolean;
  can_trigger_code: boolean;
  can_respond_code: boolean;
  can_resolve_code: boolean;
}
