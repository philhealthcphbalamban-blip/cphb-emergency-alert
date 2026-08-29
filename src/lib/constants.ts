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

// Exact Official Wards & Rooms extracted from CPH Balamban iHOMIS+ System
export const INITIAL_LOCATIONS: HospitalLocation[] = [
  {
    "id": "cphb-er-trauma1",
    "building": "Main Complex",
    "floor": "Ground Floor",
    "unit_ward": "Emergency Department (ER)",
    "room_bed": "ER Trauma Bay 1"
  },
  {
    "id": "cphb-er-resus2",
    "building": "Main Complex",
    "floor": "Ground Floor",
    "unit_ward": "Emergency Department (ER)",
    "room_bed": "ER Resuscitation Bay 2"
  },
  {
    "id": "cphb-er-surg3",
    "building": "Main Complex",
    "floor": "Ground Floor",
    "unit_ward": "Emergency Department (ER)",
    "room_bed": "ER Surgical Bay 3"
  },
  {
    "id": "cphb-er-pedia",
    "building": "Main Complex",
    "floor": "Ground Floor",
    "unit_ward": "Emergency Department (ER)",
    "room_bed": "ER Pediatric Bay"
  },
  {
    "id": "cphb-er-triage",
    "building": "Main Complex",
    "floor": "Ground Floor",
    "unit_ward": "Emergency Department (ER)",
    "room_bed": "ER Triage Desk"
  },
  {
    "id": "cphb-pui-pui01",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "PUI WARD (Medical)",
    "room_bed": "R201 (PUI01)"
  },
  {
    "id": "cphb-pui-pui02",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "PUI WARD (Medical)",
    "room_bed": "R202 (PUI02)"
  },
  {
    "id": "cphb-pui-pui03",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "PUI WARD (Medical)",
    "room_bed": "R203 (PUI03)"
  },
  {
    "id": "cphb-pui-pui04",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "PUI WARD (Medical)",
    "room_bed": "R204 (PUI04)"
  },
  {
    "id": "cphb-pui-pui05",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "PUI WARD (Medical)",
    "room_bed": "R205 (PUI05)"
  },
  {
    "id": "cphb-pui-pui06",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "PUI WARD (Medical)",
    "room_bed": "R206 (PUI06)"
  },
  {
    "id": "cphb-pui-pui07",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "PUI WARD (Medical)",
    "room_bed": "R207 (PUI07)"
  },
  {
    "id": "cphb-pui-pui08",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "PUI WARD (Medical)",
    "room_bed": "R208 (PUI08)"
  },
  {
    "id": "cphb-pui-pui09",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "PUI WARD (Medical)",
    "room_bed": "R209 (PUI09)"
  },
  {
    "id": "cphb-prvt-prvt2",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "PRIVATE ROOMS",
    "room_bed": "PRIVATEROOM2 (PRVT2)"
  },
  {
    "id": "cphb-prvt-prvte",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "PRIVATE ROOMS",
    "room_bed": "PRIVATEROOM1 (PRVTE)"
  },
  {
    "id": "cphb-pdw-pdw",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "PEDIA WARD",
    "room_bed": "PEDIA WARD (PDW)"
  },
  {
    "id": "cphb-pdw-pdw2",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "PEDIA WARD",
    "room_bed": "PDW2 (PDW2)"
  },
  {
    "id": "cphb-pdw-pdw3",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "PEDIA WARD",
    "room_bed": "PEDIAWARD (PDW3)"
  },
  {
    "id": "cphb-pdw-pdw8",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "PEDIA WARD",
    "room_bed": "PEDIA WARD (PDW8)"
  },
  {
    "id": "cphb-pdw-pdw9",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "PEDIA WARD",
    "room_bed": "PEDIA WARD (PDW9)"
  },
  {
    "id": "cphb-obnr-227ob",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEWBORN NR",
    "room_bed": "OB227NEWBORN NR (227OB)"
  },
  {
    "id": "cphb-obnew-0b222",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB222NEWROOM (0B222)"
  },
  {
    "id": "cphb-obnew-ob221",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB221NEWROOM (OB221)"
  },
  {
    "id": "cphb-obnew-ob223",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB223NEWROOM (OB223)"
  },
  {
    "id": "cphb-obnew-ob224",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB224NEWROOM (OB224)"
  },
  {
    "id": "cphb-obnew-ob225",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB225NEWROOM (OB225)"
  },
  {
    "id": "cphb-obnew-ob226",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB226NEWROOM (OB226)"
  },
  {
    "id": "cphb-obnew-ob227",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB227NEWROOM (OB227)"
  },
  {
    "id": "cphb-obnew-ob228",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB228NEWROOM (OB228)"
  },
  {
    "id": "cphb-obnew-ob229",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB299NEWROOM (OB229)"
  },
  {
    "id": "cphb-obnew-ob231",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB231NEWROOM (OB231)"
  },
  {
    "id": "cphb-obnew-ob232",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB232NEWROOM (OB232)"
  },
  {
    "id": "cphb-obnew-ob233",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB233NEWROOMGYNEWARD (OB233)"
  },
  {
    "id": "cphb-obnew-ob234",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB234NEWROOMGYNEWARD (OB234)"
  },
  {
    "id": "cphb-obnew-ob235",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB235NEWROOM (OB235)"
  },
  {
    "id": "cphb-obnew-ob236",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB236NEWROOM (OB236)"
  },
  {
    "id": "cphb-obnew-ob237",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OB NEW ROOM (WARD 5)",
    "room_bed": "OB237NEWROOM (OB237)"
  },
  {
    "id": "cphb-obpr-ob230",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OBPRDOC (WARD 5)",
    "room_bed": "OB230 (OB230)"
  },
  {
    "id": "cphb-obpr-ob238",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "OBPRDOC (WARD 5)",
    "room_bed": "OB238NEWROOM (OB238)"
  },
  {
    "id": "cphb-nicu-nicu3",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "NICU WARD",
    "room_bed": "NICU NEW ROOM (NICU3)"
  },
  {
    "id": "cphb-wrd-ward4",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "WARD4 (WARD)",
    "room_bed": "WARD4 (WARD4)"
  },
  {
    "id": "cphb-wrd-ward5",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "WARD5 (WARD)",
    "room_bed": "WARD5 (WARD5)"
  },
  {
    "id": "cphb-wrd-ward6",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "WARD6 (WARD)",
    "room_bed": "WARD6 (WARD6)"
  },
  {
    "id": "cphb-wrd-ward7",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "WARD7 (WARD)",
    "room_bed": "WARD7 (WARD7)"
  },
  {
    "id": "cphb-wrd-wrd10",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "WRD10 (WARD)",
    "room_bed": "WRD10 (WRD10)"
  },
  {
    "id": "cphb-wrd-wrd11",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "WRD11 (WARD)",
    "room_bed": "WRD11 (WRD11)"
  },
  {
    "id": "cphb-wrd-wrd12",
    "building": "Main Complex",
    "floor": "Third Floor",
    "unit_ward": "WRD12 (WARD)",
    "room_bed": "WRD12 (WRD12)"
  },
  {
    "id": "cphb-icu-icu2f",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "ICU NEW ROOM",
    "room_bed": "ICU-01 (ICU2F)"
  },
  {
    "id": "cphb-ortho-hallw",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "ORTHO & SURGICAL WARD+",
    "room_bed": "HALLWAY (HALLW)"
  },
  {
    "id": "cphb-ortho-r210a",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "ORTHO & SURGICAL WARD+",
    "room_bed": "R210 (R210A)"
  },
  {
    "id": "cphb-ortho-r211",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "ORTHO & SURGICAL WARD+",
    "room_bed": "R211 (R211)"
  },
  {
    "id": "cphb-ortho-r212",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "ORTHO & SURGICAL WARD+",
    "room_bed": "R212 (R212)"
  },
  {
    "id": "cphb-ortho-r213",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "ORTHO & SURGICAL WARD+",
    "room_bed": "R213 (R213)"
  },
  {
    "id": "cphb-ortho-r214",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "ORTHO & SURGICAL WARD+",
    "room_bed": "R214 (R214)"
  },
  {
    "id": "cphb-ortho-r215",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "ORTHO & SURGICAL WARD+",
    "room_bed": "R215 (R215)"
  },
  {
    "id": "cphb-ortho-r216",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "ORTHO & SURGICAL WARD+",
    "room_bed": "R216 (R216)"
  },
  {
    "id": "cphb-ortho-r217",
    "building": "Main Complex",
    "floor": "Second Floor",
    "unit_ward": "ORTHO & SURGICAL WARD+",
    "room_bed": "R217 (R217)"
  }
];
