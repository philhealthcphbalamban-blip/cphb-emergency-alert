export type CommunityEmergencyType = 
  | 'CODE_TRAUMA'
  | 'CODE_MATERNAL'
  | 'CODE_CARDIAC'
  | 'CODE_TRANSPORT'
  | 'CODE_RESCUE';

export interface CommunityEmergencyDetails {
  type: CommunityEmergencyType;
  title: string;
  badge: string;
  color: string;
  accentBg: string;
  description: string;
  iconName: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface BalambanBarangay {
  id: string;
  name: string;
  zone: 'POBLACION' | 'COASTAL' | 'UPLAND_TRANSCENTRAL' | 'NORTHERN' | 'SOUTHERN';
  distanceToCPHBalambanKm: number;
  estimatedDriveTimeMins: number;
  contactNumber: string;
  hasStationedPTV: boolean;
  assignedPTVUnit?: string;
}

export interface CommunityEmergencyAlert {
  id: string;
  emergency_type: CommunityEmergencyType;
  barangay_name: string;
  sitio_or_landmark: string;
  patient_condition: string;
  caller_name: string;
  caller_phone: string;
  status: 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'TRANSPORTING_TO_CPHB' | 'ARRIVED_AT_CPHB' | 'RESOLVED';
  dispatched_at: string;
  responding_units: {
    unit_id: string;
    unit_name: string;
    unit_type: 'MDRRMO_RESCUE' | 'BARANGAY_PTV' | 'BERT_RESPONDER' | 'POLICE_FIRE';
    driver_or_lead: string;
    contact: string;
    eta_mins: number;
    status: 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'TRANSPORTING';
  }[];
  destination_facility: string;
  triage_notes?: string;
  resolved_at?: string;
}

export const BALAMBAN_BARANGAYS: BalambanBarangay[] = [
  { id: 'b-baliwagan', name: 'Baliwagan (Poblacion)', zone: 'POBLACION', distanceToCPHBalambanKm: 1.2, estimatedDriveTimeMins: 3, contactNumber: '0917-123-0101', hasStationedPTV: true, assignedPTVUnit: 'Baliwagan PTV-1' },
  { id: 'b-santacruz', name: 'Santa Cruz (Poblacion)', zone: 'POBLACION', distanceToCPHBalambanKm: 1.5, estimatedDriveTimeMins: 4, contactNumber: '0917-123-0102', hasStationedPTV: true, assignedPTVUnit: 'Santa Cruz PTV-1' },
  { id: 'b-aliwanay', name: 'Aliwanay', zone: 'COASTAL', distanceToCPHBalambanKm: 3.5, estimatedDriveTimeMins: 7, contactNumber: '0917-123-0103', hasStationedPTV: true, assignedPTVUnit: 'Aliwanay Ambulance 1' },
  { id: 'b-arpili', name: 'Arpili', zone: 'COASTAL', distanceToCPHBalambanKm: 6.8, estimatedDriveTimeMins: 12, contactNumber: '0917-123-0104', hasStationedPTV: true, assignedPTVUnit: 'Arpili PTV-1' },
  { id: 'b-buanoy', name: 'Buanoy', zone: 'COASTAL', distanceToCPHBalambanKm: 5.2, estimatedDriveTimeMins: 9, contactNumber: '0917-123-0105', hasStationedPTV: true, assignedPTVUnit: 'Buanoy Rescue PTV' },
  { id: 'b-combado', name: 'Combado', zone: 'COASTAL', distanceToCPHBalambanKm: 2.8, estimatedDriveTimeMins: 5, contactNumber: '0917-123-0106', hasStationedPTV: false },
  { id: 'b-pondol', name: 'Pondol', zone: 'COASTAL', distanceToCPHBalambanKm: 4.1, estimatedDriveTimeMins: 8, contactNumber: '0917-123-0107', hasStationedPTV: true, assignedPTVUnit: 'Pondol PTV-1' },
  { id: 'b-prenza', name: 'Prenza', zone: 'COASTAL', distanceToCPHBalambanKm: 3.9, estimatedDriveTimeMins: 7, contactNumber: '0917-123-0108', hasStationedPTV: true, assignedPTVUnit: 'Prenza PTV-1' },
  { id: 'b-tal-ot', name: 'Tal-ot', zone: 'COASTAL', distanceToCPHBalambanKm: 5.9, estimatedDriveTimeMins: 10, contactNumber: '0917-123-0109', hasStationedPTV: false },
  { id: 'b-nangka', name: 'Nangka', zone: 'COASTAL', distanceToCPHBalambanKm: 4.6, estimatedDriveTimeMins: 8, contactNumber: '0917-123-0110', hasStationedPTV: true, assignedPTVUnit: 'Nangka PTV-1' },
  { id: 'b-gaas', name: 'Gaas (Transcentral Highway)', zone: 'UPLAND_TRANSCENTRAL', distanceToCPHBalambanKm: 18.5, estimatedDriveTimeMins: 32, contactNumber: '0917-123-0111', hasStationedPTV: true, assignedPTVUnit: 'Gaas Mountain Highway PTV' },
  { id: 'b-cansomoroy', name: 'Cansomoroy (Highway)', zone: 'UPLAND_TRANSCENTRAL', distanceToCPHBalambanKm: 12.0, estimatedDriveTimeMins: 22, contactNumber: '0917-123-0112', hasStationedPTV: true, assignedPTVUnit: 'Cansomoroy PTV-1' },
  { id: 'b-sunog', name: 'Sunog', zone: 'UPLAND_TRANSCENTRAL', distanceToCPHBalambanKm: 15.2, estimatedDriveTimeMins: 28, contactNumber: '0917-123-0113', hasStationedPTV: false },
  { id: 'b-liki', name: 'Liki', zone: 'UPLAND_TRANSCENTRAL', distanceToCPHBalambanKm: 10.4, estimatedDriveTimeMins: 19, contactNumber: '0917-123-0114', hasStationedPTV: false },
  { id: 'b-cabagdalan', name: 'Cabagdalan', zone: 'UPLAND_TRANSCENTRAL', distanceToCPHBalambanKm: 14.1, estimatedDriveTimeMins: 26, contactNumber: '0917-123-0115', hasStationedPTV: false },
  { id: 'b-cabasiangan', name: 'Cabasiangan', zone: 'UPLAND_TRANSCENTRAL', distanceToCPHBalambanKm: 16.7, estimatedDriveTimeMins: 30, contactNumber: '0917-123-0116', hasStationedPTV: false },
  { id: 'b-ginatilan', name: 'Ginatilan', zone: 'NORTHERN', distanceToCPHBalambanKm: 7.2, estimatedDriveTimeMins: 13, contactNumber: '0917-123-0117', hasStationedPTV: true, assignedPTVUnit: 'Ginatilan PTV-1' },
  { id: 'b-matun-og', name: 'Matun-og', zone: 'NORTHERN', distanceToCPHBalambanKm: 8.5, estimatedDriveTimeMins: 15, contactNumber: '0917-123-0118', hasStationedPTV: false },
  { id: 'b-hingatmonan', name: 'Hingatmonan', zone: 'NORTHERN', distanceToCPHBalambanKm: 11.2, estimatedDriveTimeMins: 20, contactNumber: '0917-123-0119', hasStationedPTV: false },
  { id: 'b-cantuod', name: 'Cantuod', zone: 'SOUTHERN', distanceToCPHBalambanKm: 4.8, estimatedDriveTimeMins: 8, contactNumber: '0917-123-0120', hasStationedPTV: true, assignedPTVUnit: 'Cantuod PTV-1' },
  { id: 'b-cambuhawe', name: 'Cambuhawe', zone: 'SOUTHERN', distanceToCPHBalambanKm: 6.1, estimatedDriveTimeMins: 11, contactNumber: '0917-123-0121', hasStationedPTV: false },
  { id: 'b-singsing', name: 'Singsing', zone: 'SOUTHERN', distanceToCPHBalambanKm: 7.9, estimatedDriveTimeMins: 14, contactNumber: '0917-123-0122', hasStationedPTV: true, assignedPTVUnit: 'Singsing PTV-1' },
  { id: 'b-tubod', name: 'Tubod', zone: 'SOUTHERN', distanceToCPHBalambanKm: 8.9, estimatedDriveTimeMins: 16, contactNumber: '0917-123-0123', hasStationedPTV: false },
  { id: 'b-duangan', name: 'Duangan', zone: 'SOUTHERN', distanceToCPHBalambanKm: 10.3, estimatedDriveTimeMins: 18, contactNumber: '0917-123-0124', hasStationedPTV: false },
  { id: 'b-lamesa', name: 'Lamesa', zone: 'UPLAND_TRANSCENTRAL', distanceToCPHBalambanKm: 13.5, estimatedDriveTimeMins: 25, contactNumber: '0917-123-0125', hasStationedPTV: false },
  { id: 'b-luca', name: 'Luca', zone: 'COASTAL', distanceToCPHBalambanKm: 9.1, estimatedDriveTimeMins: 16, contactNumber: '0917-123-0126', hasStationedPTV: true, assignedPTVUnit: 'Luca PTV-1' },
];

export const COMMUNITY_EMERGENCY_DEFS: Record<CommunityEmergencyType, CommunityEmergencyDetails> = {
  CODE_TRAUMA: {
    type: 'CODE_TRAUMA',
    title: 'Code Trauma / MVA (Highway Accident)',
    badge: '🚨 CODE TRAUMA',
    color: 'border-red-500 bg-red-950/90 text-red-100',
    accentBg: 'bg-red-600',
    description: 'Vehicular crash, Transcentral highway motorcycle collision, severe trauma, or blunt injury.',
    iconName: 'CarCrash',
    priority: 'CRITICAL',
  },
  CODE_MATERNAL: {
    type: 'CODE_MATERNAL',
    title: 'Code Maternal / OB Emergency',
    badge: '🤰 CODE MATERNAL',
    color: 'border-pink-500 bg-pink-950/90 text-pink-100',
    accentBg: 'bg-pink-600',
    description: 'Imminent home delivery, eclampsia, postpartum hemorrhage, or emergency labor in barangay.',
    iconName: 'Baby',
    priority: 'CRITICAL',
  },
  CODE_CARDIAC: {
    type: 'CODE_CARDIAC',
    title: 'Code Cardiac / Out-of-Hospital Arrest',
    badge: '🫀 CODE CARDIAC',
    color: 'border-blue-500 bg-blue-950/90 text-blue-100',
    accentBg: 'bg-blue-600',
    description: 'Unresponsive resident, sudden cardiac arrest, acute stroke, or severe respiratory distress.',
    iconName: 'HeartPulse',
    priority: 'CRITICAL',
  },
  CODE_TRANSPORT: {
    type: 'CODE_TRANSPORT',
    title: 'Code Transport (Barangay PTV / Ambulance)',
    badge: '🚐 CODE TRANSPORT',
    color: 'border-emerald-500 bg-emerald-950/90 text-emerald-100',
    accentBg: 'bg-emerald-600',
    description: 'Urgent hospital transfer, bedridden patient dispatch, dialysis transfer, or triage transport.',
    iconName: 'Ambulance',
    priority: 'HIGH',
  },
  CODE_RESCUE: {
    type: 'CODE_RESCUE',
    title: 'Code Rescue / Disaster Response',
    badge: '🔥 CODE RESCUE',
    color: 'border-amber-500 bg-amber-950/90 text-amber-100',
    accentBg: 'bg-amber-600',
    description: 'MDRRMO Balamban Rescue, flood extraction, landslide, structural collapse, or fire response.',
    iconName: 'Flame',
    priority: 'HIGH',
  },
};
