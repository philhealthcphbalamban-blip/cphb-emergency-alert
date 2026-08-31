export interface HospitalInfo {
  id: string; // e.g. 'cphb', 'cphd', 'cphc', 'cphbogo', 'balamban_rescue'
  name: string; // e.g. 'Cebu Provincial Hospital - Balamban'
  shortName: string; // e.g. 'CPH Balamban'
  code: string; // 'CPHB'
  municipality: string; // 'Balamban, Cebu'
  classification: string; // 'Level 2 Provincial Hospital'
  bedCapacity: number;
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  isRescue?: boolean;
}

export const CEBU_PROVINCIAL_HOSPITALS: HospitalInfo[] = [
  {
    id: 'cphb',
    name: 'Cebu Provincial Hospital - Balamban',
    shortName: 'CPH Balamban',
    code: 'CPHB',
    municipality: 'Balamban, Cebu',
    classification: 'Level 2 Provincial Hospital',
    bedCapacity: 378,
    colorHex: '#2563eb',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800 border-blue-300',
  },
  {
    id: 'balamban_rescue',
    name: 'MDRRMO Balamban Rescue 911',
    shortName: 'Balamban Rescue',
    code: 'RESCUE',
    municipality: 'Balamban, Cebu (Municipal EOC)',
    classification: 'Municipal Emergency Operations & 28 Barangays Network',
    bedCapacity: 28,
    colorHex: '#dc2626',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800 border-red-300',
    isRescue: true,
  },
  {
    id: 'cphd',
    name: 'Cebu Provincial Hospital - Danao',
    shortName: 'CPH Danao',
    code: 'CPHD',
    municipality: 'Danao City, Cebu',
    classification: 'Level 2 Provincial Hospital',
    bedCapacity: 200,
    colorHex: '#0284c7',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800 border-sky-300',
  },
  {
    id: 'cphc',
    name: 'Cebu Provincial Hospital - Carcar',
    shortName: 'CPH Carcar',
    code: 'CPHC',
    municipality: 'Carcar City, Cebu',
    classification: 'Level 2 Provincial Hospital',
    bedCapacity: 200,
    colorHex: '#059669',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800 border-emerald-300',
  },
  {
    id: 'cphbogo',
    name: 'Cebu Provincial Hospital - Bogo',
    shortName: 'CPH Bogo',
    code: 'CPHBOGO',
    municipality: 'Bogo City, Cebu',
    classification: 'Level 2 Provincial Hospital',
    bedCapacity: 150,
    colorHex: '#7c3aed',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800 border-purple-300',
  }
];
