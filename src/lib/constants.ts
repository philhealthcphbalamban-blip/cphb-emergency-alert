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

// CPH Balamban Hospital Wards & Beds based on live iHOMIS Plus system
export const INITIAL_LOCATIONS: HospitalLocation[] = [
  { id: 'cphb-w4-temb4', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD (WARD 4)', room_bed: 'TEMB4' },
  { id: 'cphb-w4-temb1', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD (WARD 4)', room_bed: 'TEMB1' },
  { id: 'cphb-w4-temp04', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD (WARD 4)', room_bed: 'tempobed-ward04' },
  { id: 'cphb-icu-1', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'ICU NEW ROOM', room_bed: 'ICU01' },
  { id: 'cphb-icu-2', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'ICU NEW ROOM', room_bed: 'ICU02' },
  { id: 'cphb-icu-4', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'ICU NEW ROOM', room_bed: 'TEMPBED4-ICU4' },
  { id: 'cphb-w5-a', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 5 (OB-GYN)', room_bed: 'tempobed-ward05A' },
  { id: 'cphb-w5-b', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 5 (OB-GYN)', room_bed: 'tempobed-ward05B' },
  { id: 'cphb-w6-crib2', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 6 (Nursery / Pedia)', room_bed: 'Crib 02' },
  { id: 'cphb-w6-bed3', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'WARD 6 (Nursery / Pedia)', room_bed: 'Nursery Bed 03' },
  { id: 'cphb-er-1', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Trauma Bay 1' },
  { id: 'cphb-er-2', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Resuscitation Bay 2' },
  { id: 'cphb-er-3', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Surgical Bay 3' },
  { id: 'cphb-w7-1', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'WARD 7 (Surgical)', room_bed: 'WARD7 - Bed 1' },
  { id: 'cphb-w10-1', building: 'Annex Wing', floor: 'Ground Floor', unit_ward: 'WARD 10 (Isolation / Infectious)', room_bed: 'WARD10 - Bed 1' },
  { id: 'cphb-opd-1', building: 'OPD Building', floor: 'Ground Floor', unit_ward: 'Outpatient Clinic', room_bed: 'Cardio Clinic Room 102' },
];
