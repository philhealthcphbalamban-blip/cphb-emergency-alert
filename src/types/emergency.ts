import { IHOMISPatient } from './ihomis';

export type CodeId = 
  | 'code_blue' 
  | 'code_baby_blue' 
  | 'code_pink' 
  | 'code_red' 
  | 'code_black' 
  | 'code_white' 
  | 'code_orange';

export type AlertStatus = 'ACTIVE' | 'RESPONDING' | 'RESOLVED' | 'STANDDOWN' | 'FALSE_ALARM';

export type ResponderStatus = 'EN_ROUTE' | 'ON_SCENE' | 'STANDBY';

export type SirenPattern = 'hi_lo' | 'wail' | 'strobe_beep' | 'pulse';

export interface EmergencyCode {
  id: CodeId;
  code_name: string;
  title: string;
  color_hex: string;
  bg_gradient: string;
  priority_level: number;
  tts_template: string;
  siren_pattern: SirenPattern;
  description?: string;
}

export interface HospitalLocation {
  id: string;
  hospital_id?: string;
  building: string;
  floor: string;
  unit_ward: string;
  room_bed: string;
}

export interface AlertResponder {
  id: string;
  alert_id: string;
  responder_name: string;
  role: 'Physician' | 'Resident' | 'RT' | 'Nurse' | 'Security' | 'Anesthesiologist';
  eta_minutes: number;
  status: ResponderStatus;
  responded_at: string;
  arrived_at?: string | null;
}

export interface EmergencyAlert {
  id: string;
  hospital_id?: string;
  code_id: CodeId;
  code_details?: EmergencyCode;
  location_id?: string;
  location_text: string;
  status: AlertStatus;
  triggered_by_name: string;
  triggered_by_role: string;
  triggered_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  resolved_by_name?: string | null;
  resolution_notes?: string | null;
  patient_details?: IHOMISPatient | null;
  responders?: AlertResponder[];
}

export interface EmergencyAuditLog {
  id: string;
  alert_id: string;
  event_type: 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESPONDER_JOINED' | 'RESOLVED';
  details: Record<string, any>;
  actor_name: string;
  created_at: string;
}
