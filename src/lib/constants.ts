import { EmergencyCode, HospitalLocation } from '@/types/emergency';

export const EMERGENCY_CODES: Record<string, EmergencyCode> = {
  code_blue: {
    id: 'code_blue',
    code_name: 'Code Blue',
    title: 'Adult Cardiac / Respiratory Arrest',
    color_hex: '#1d4ed8',
    bg_gradient: 'from-blue-600 to-indigo-800',
    priority_level: 1,
    tts_template: 'Attention: Code Blue at {location}. Resuscitation code team respond immediately. Code Blue, {location}.',
    siren_pattern: 'hi_lo',
    description: 'Adult patient in cardiac or respiratory arrest requiring immediate CPR, defibrillation, and airway management.'
  },
  code_baby_blue: {
    id: 'code_baby_blue',
    code_name: 'Code Baby Blue',
    title: 'Infant / Pediatric Respiratory Arrest',
    color_hex: '#0284c7',
    bg_gradient: 'from-sky-500 to-blue-700',
    priority_level: 1,
    tts_template: 'Attention: Code Baby Blue at {location}. Pediatric resuscitation team deploy immediately. Code Baby Blue, {location}.',
    siren_pattern: 'hi_lo',
    description: 'Infant or pediatric patient in sudden respiratory arrest or life-threatening distress.'
  },
  code_pink: {
    id: 'code_pink',
    code_name: 'Code Pink',
    title: 'Infant / Child Abduction',
    color_hex: '#db2777',
    bg_gradient: 'from-pink-600 to-rose-700',
    priority_level: 1,
    tts_template: 'Security Alert: Code Pink at {location}. Seal all perimeter exits and inspect all exits immediately.',
    siren_pattern: 'strobe_beep',
    description: 'Suspected infant or child abduction. Mandatory lockdown of all hospital exits and inspection.'
  },
  code_red: {
    id: 'code_red',
    code_name: 'Code Red',
    title: 'Fire & Smoke Emergency',
    color_hex: '#dc2626',
    bg_gradient: 'from-red-600 to-amber-700',
    priority_level: 1,
    tts_template: 'Attention all staff: Code Red at {location}. Execute RACE protocol. Code Red at {location}.',
    siren_pattern: 'wail',
    description: 'Fire, smoke, or fire alarm activation. Rescue, Alarm, Contain, Extinguish/Evacuate.'
  },
  code_black: {
    id: 'code_black',
    code_name: 'Code Black',
    title: 'Bomb Threat / Security Threat',
    color_hex: '#27272a',
    bg_gradient: 'from-zinc-800 to-zinc-950',
    priority_level: 1,
    tts_template: 'Security Alert: Code Black at {location}. Standby for safety instructions and shelter in place.',
    siren_pattern: 'pulse',
    description: 'Active armed intruder, bomb threat, or severe external danger.'
  },
  code_white: {
    id: 'code_white',
    code_name: 'Code White',
    title: 'Violent / Combative Individual',
    color_hex: '#475569',
    bg_gradient: 'from-slate-600 to-slate-800',
    priority_level: 2,
    tts_template: 'Attention: Code White at {location}. Security de-escalation unit required.',
    siren_pattern: 'pulse',
    description: 'Aggressive or violent behavior posing danger to healthcare workers, patients, or visitors.'
  },
  code_orange: {
    id: 'code_orange',
    code_name: 'Code Orange',
    title: 'Mass Casualty / Hazardous Spill',
    color_hex: '#ea580c',
    bg_gradient: 'from-orange-600 to-amber-700',
    priority_level: 2,
    tts_template: 'Attention: Code Orange at {location}. Emergency Department triage and decontamination standby.',
    siren_pattern: 'wail',
    description: 'Mass casualty incoming or chemical/biohazard spill requiring containment.'
  }
};

// Full Complete List of All CPH Balamban Hospital Wards, Floors, Rooms & Beds
export const INITIAL_LOCATIONS: HospitalLocation[] = [
  // ==========================================
  // GROUND FLOOR
  // ==========================================
  { id: 'cphb-er-trauma1', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Trauma Bay 1' },
  { id: 'cphb-er-resus2', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Resuscitation Bay 2' },
  { id: 'cphb-er-surg3', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Surgical Bay 3' },
  { id: 'cphb-er-pedia1', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Pedia Bay 01' },
  { id: 'cphb-er-pedia2', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Pedia Bay 02' },
  { id: 'cphb-er-obs', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Observation Bay' },
  { id: 'cphb-er-triage', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Triage Desk' },

  { id: 'cphb-w10-bed1', building: 'Annex Wing', floor: 'Ground Floor', unit_ward: 'WARD 10 (Isolation Ward)', room_bed: 'WARD10 - Bed 1' },
  { id: 'cphb-w10-bed2', building: 'Annex Wing', floor: 'Ground Floor', unit_ward: 'WARD 10 (Isolation Ward)', room_bed: 'WARD10 - Bed 2' },
  { id: 'cphb-w10-negpress', building: 'Annex Wing', floor: 'Ground Floor', unit_ward: 'WARD 10 (Isolation Ward)', room_bed: 'Negative Pressure Suite' },

  { id: 'cphb-hd-01', building: 'Annex Wing', floor: 'Ground Floor', unit_ward: 'Hemodialysis Unit', room_bed: 'Dialysis Station 01' },
  { id: 'cphb-hd-02', building: 'Annex Wing', floor: 'Ground Floor', unit_ward: 'Hemodialysis Unit', room_bed: 'Dialysis Station 02' },
  { id: 'cphb-hd-03', building: 'Annex Wing', floor: 'Ground Floor', unit_ward: 'Hemodialysis Unit', room_bed: 'Dialysis Station 03' },
  { id: 'cphb-hd-04', building: 'Annex Wing', floor: 'Ground Floor', unit_ward: 'Hemodialysis Unit', room_bed: 'Dialysis Station 04' },
  { id: 'cphb-hd-05', building: 'Annex Wing', floor: 'Ground Floor', unit_ward: 'Hemodialysis Unit', room_bed: 'Dialysis Station 05' },
  { id: 'cphb-hd-06', building: 'Annex Wing', floor: 'Ground Floor', unit_ward: 'Hemodialysis Unit', room_bed: 'Dialysis Station 06' },

  { id: 'cphb-opd-med', building: 'OPD Building', floor: 'Ground Floor', unit_ward: 'Outpatient Department (OPD)', room_bed: 'Internal Medicine Clinic' },
  { id: 'cphb-opd-pedia', building: 'OPD Building', floor: 'Ground Floor', unit_ward: 'Outpatient Department (OPD)', room_bed: 'Pediatric Clinic' },
  { id: 'cphb-opd-obgyn', building: 'OPD Building', floor: 'Ground Floor', unit_ward: 'Outpatient Department (OPD)', room_bed: 'OB-GYN Clinic' },
  { id: 'cphb-opd-surg', building: 'OPD Building', floor: 'Ground Floor', unit_ward: 'Outpatient Department (OPD)', room_bed: 'Surgical Clinic' },
  { id: 'cphb-rad-xray', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Radiology & Imaging', room_bed: 'X-Ray & CT Scan Suite' },
  { id: 'cphb-lab-main', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Clinical Laboratory', room_bed: 'Laboratory & Blood Bank' },
  { id: 'cphb-pharm-main', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Pharmacy', room_bed: 'Main Hospital Pharmacy' },
  { id: 'cphb-lobby-main', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Hospital Lobby', room_bed: 'Admissions & Information Desk' },

  // ==========================================
  // 2ND FLOOR
  // ==========================================
  { id: 'cphb-icu-01', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'ICU NEW ROOM', room_bed: 'ICU Bed 01' },
  { id: 'cphb-icu-02', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'ICU NEW ROOM', room_bed: 'ICU Bed 02' },
  { id: 'cphb-icu-03', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'ICU NEW ROOM', room_bed: 'TEMPBED3-ICU3' },
  { id: 'cphb-icu-04', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'ICU NEW ROOM', room_bed: 'TEMPBED4-ICU4' },
  { id: 'cphb-icu-05', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'ICU NEW ROOM', room_bed: 'TEMPOBED-ICU' },

  { id: 'cphb-w4-temb1', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD (WARD 4)', room_bed: 'TEMB1' },
  { id: 'cphb-w4-temb2', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD (WARD 4)', room_bed: 'TEMB2' },
  { id: 'cphb-w4-temb3', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD (WARD 4)', room_bed: 'TEMB3' },
  { id: 'cphb-w4-temb4', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD (WARD 4)', room_bed: 'TEMB4' },
  { id: 'cphb-w4-temp04a', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD (WARD 4)', room_bed: 'tempobed-ward04A' },
  { id: 'cphb-w4-temp04b', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD (WARD 4)', room_bed: 'tempobed-ward04B' },
  { id: 'cphb-w4-room401', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD (WARD 4)', room_bed: 'Ward 4 Room 401' },
  { id: 'cphb-w4-room402', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD (WARD 4)', room_bed: 'Ward 4 Room 402' },

  { id: 'cphb-w7-bed1', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'WARD 7 (Surgical Ward)', room_bed: 'WARD7 - Bed 1' },
  { id: 'cphb-w7-bed2', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'WARD 7 (Surgical Ward)', room_bed: 'WARD7 - Bed 2' },
  { id: 'cphb-w7-bed3', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'WARD 7 (Surgical Ward)', room_bed: 'WARD7 - Bed 3' },
  { id: 'cphb-w7-room701', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'WARD 7 (Surgical Ward)', room_bed: 'Post-Op Room 701' },
  { id: 'cphb-w7-room702', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'WARD 7 (Surgical Ward)', room_bed: 'Post-Op Room 702' },

  { id: 'cphb-or-suite1', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'Operating Room Complex', room_bed: 'Main OR Suite 1' },
  { id: 'cphb-or-suite2', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'Operating Room Complex', room_bed: 'Minor OR Suite 2' },
  { id: 'cphb-or-pacu', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'Operating Room Complex', room_bed: 'PACU / Recovery Room' },
  { id: 'cphb-ns-2nd', building: 'Main Complex', floor: '2nd Floor', unit_ward: '2nd Floor Nurses Station', room_bed: 'Central Nurse Station' },

  // ==========================================
  // 3RD FLOOR
  // ==========================================
  { id: 'cphb-w5-obnew', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 5 (OB-GYN)', room_bed: 'OBNEWROOM' },
  { id: 'cphb-w5-obprdoc', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 5 (OB-GYN)', room_bed: 'OBPRDOC' },
  { id: 'cphb-w5-temp05a', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 5 (OB-GYN)', room_bed: 'tempobed-ward05A' },
  { id: 'cphb-w5-temp05b', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 5 (OB-GYN)', room_bed: 'tempobed-ward05B' },
  { id: 'cphb-w5-temp05c', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 5 (OB-GYN)', room_bed: 'tempobed-ward05C' },
  { id: 'cphb-w5-labor', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 5 (OB-GYN)', room_bed: 'Labor Room Suite' },

  { id: 'cphb-dr-suite1', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'Delivery Room Complex', room_bed: 'Delivery Room Suite 1' },
  { id: 'cphb-dr-suite2', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'Delivery Room Complex', room_bed: 'Delivery Room Suite 2' },

  { id: 'cphb-nicu-inc1', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'NICU / Neonatal ICU', room_bed: 'Incubator Station 01' },
  { id: 'cphb-nicu-inc2', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'NICU / Neonatal ICU', room_bed: 'Incubator Station 02' },
  { id: 'cphb-nicu-inc3', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'NICU / Neonatal ICU', room_bed: 'Incubator Station 03' },
  { id: 'cphb-nicu-warmer', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'NICU / Neonatal ICU', room_bed: 'Radiant Warmer Station' },

  { id: 'cphb-w6-crib1', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 6 (Pediatric Ward)', room_bed: 'Crib 01' },
  { id: 'cphb-w6-crib2', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 6 (Pediatric Ward)', room_bed: 'Crib 02' },
  { id: 'cphb-w6-bed3', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 6 (Pediatric Ward)', room_bed: 'Nursery Bed 03' },
  { id: 'cphb-w6-bed4', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 6 (Pediatric Ward)', room_bed: 'Pedia Bed 04' },
  { id: 'cphb-w6-iso601', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 6 (Pediatric Ward)', room_bed: 'Pedia Isolation Room 601' },
  { id: 'cphb-ns-3rd', building: 'Main Complex', floor: '3rd Floor', unit_ward: '3rd Floor Nurses Station', room_bed: 'OB & Pedia Nurse Station' },

  // ==========================================
  // SERVICE & ADMINISTRATIVE AREAS
  // ==========================================
  { id: 'cphb-admin-office', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'Hospital Administration', room_bed: 'Admin & Medical Director Office' },
  { id: 'cphb-dietary-main', building: 'Annex Wing', floor: 'Ground Floor', unit_ward: 'Dietary Department', room_bed: 'Main Kitchen & Nutrition' },
  { id: 'cphb-maint-eng', building: 'Annex Wing', floor: 'Ground Floor', unit_ward: 'Engineering & Maintenance', room_bed: 'Generator & Power Room' },
  { id: 'cphb-grounds-gate', building: 'Perimeter', floor: 'Ground Floor', unit_ward: 'Hospital Perimeter', room_bed: 'Main Entrance & Ambulance Gate' },
];
