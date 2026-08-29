export type IHOMISSourceModule = 'ADMISSION' | 'EMERGENCY' | 'OUTPATIENT';

export type CodeStatus = 'FULL_CODE' | 'DNR' | 'DNI' | 'COMFORT_CARE';

export interface IHOMISPatient {
  hrn: string;                      // Health Record No e.g. '000000000084045'
  case_no: string;                  // Admission / ER Case Number e.g. 'ADM-2026-084045'
  patient_name: string;             // e.g. 'CARIAS, JENNIFER, SIAROT'
  age: number;
  dob?: string;                     // Date of Birth e.g. '06/09/1994'
  gender: 'FEMALE' | 'MALE';
  source_module: IHOMISSourceModule;
  ward_name: string;                // e.g. 'WARD 5 (OB-GYN)' or 'Emergency Room (ER)'
  room_bed: string;                 // e.g. 'TEMPOB-01', 'ICU-01', 'Trauma Bay 1'
  admitting_diagnosis: string;      // e.g. 'G2P1 (1001) PU 38 3/7 WEEKS AOG PREVIOUS CS X 1'
  chief_complaint?: string;         // e.g. 'Active labor pains'
  accommodation: 'NON-BASIC' | 'BASIC' | 'SERVICE';
  type_of_service: 'OBNEWROOM' | 'MEDICAL' | 'SURGICAL' | 'PEDIATRICS' | 'OBSTETRICS' | 'ICU' | 'TRAUMA';
  attending_physician: string;      // e.g. 'Dr. Santos, MD (OB-GYN)'
  admission_date: string;           // e.g. '08/29/2026'
  admission_time: string;           // e.g. '09:00 AM'
  disposition?: string;             // e.g. 'FOR ADMISSION', 'TREATED', 'UNDER OBSERVATION'
  code_status: CodeStatus;
  allergies: string[];              // e.g. ['Penicillin']
  blood_type?: string;              // e.g. 'O+'
  fall_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  ihomis_url: string;               // Direct link to iHOMIS Plus module
}

export interface IHOMISMetrics {
  activeAdmissions: number;         // e.g. 182
  admissionsMale: number;           // e.g. 80
  admissionsFemale: number;         // e.g. 102
  longStayCount: number;            // e.g. 57 (7 days and above)
  erEncounters: number;             // e.g. 297
  erMale: number;                   // e.g. 5
  erFemale: number;                 // e.g. 10
  erForAdmission: number;           // e.g. 0
}

export interface IHOMISConfig {
  baseUrl: string;                  // 'https://ihomis-plus.cphb.local'
  admissionUrl: string;             // 'https://ihomis-plus.cphb.local/Admission'
  emergencyUrl: string;             // 'https://ihomis-plus.cphb.local/Emergency/index'
  outpatientUrl: string;            // 'https://ihomis-plus.cphb.local/Outpatient'
  personnelUrl: string;             // 'https://ihomis-plus.cphb.local/Ref_Personnel'
  hospitalName: string;             // 'Cebu Provincial Hospital - Balamban (CPHB)'
  isLiveConnected: boolean;
}
