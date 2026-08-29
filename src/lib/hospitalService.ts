import { HospitalInfo, CEBU_PROVINCIAL_HOSPITALS } from '@/types/hospital';
import { HospitalLocation } from '@/types/emergency';
import { INITIAL_LOCATIONS } from '@/lib/constants';

const STORAGE_KEY_ACTIVE_HOSPITAL = 'cph_active_hospital_id';
const STORAGE_KEY_CUSTOM_LOCATIONS = 'cph_custom_hospital_locations_v1';

export class HospitalService {
  public static getAllHospitals(): HospitalInfo[] {
    return CEBU_PROVINCIAL_HOSPITALS;
  }

  public static getActiveHospital(): HospitalInfo {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_HOSPITAL);
      if (savedId) {
        const found = CEBU_PROVINCIAL_HOSPITALS.find(h => h.id === savedId);
        if (found) return found;
      }
    }
    return CEBU_PROVINCIAL_HOSPITALS[0]; // Default CPH Balamban
  }

  public static setActiveHospital(hospital: HospitalInfo): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ACTIVE_HOSPITAL, hospital.id);
      window.dispatchEvent(new CustomEvent('cph_hospital_changed', { detail: hospital }));
    }
  }

  public static getLocationsForHospital(hospitalId?: string): HospitalLocation[] {
    const currentId = hospitalId || this.getActiveHospital().id;

    // Check if custom imported locations exist for this hospital
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY_CUSTOM_LOCATIONS}_${currentId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {}
    }

    // Default Balamban official locations
    if (currentId === 'cphb') {
      return INITIAL_LOCATIONS;
    }

    // Default templates for other Cebu Provincial Hospitals
    if (currentId === 'cphd') {
      return [
        { id: 'cphd-er-1', hospital_id: 'cphd', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Trauma Bay 1' },
        { id: 'cphd-er-2', hospital_id: 'cphd', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Resuscitation Bay 2' },
        { id: 'cphd-icu-1', hospital_id: 'cphd', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'ICU WARD', room_bed: 'ICU Bed 01' },
        { id: 'cphd-icu-2', hospital_id: 'cphd', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'ICU WARD', room_bed: 'ICU Bed 02' },
        { id: 'cphd-w1-1', hospital_id: 'cphd', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD', room_bed: 'Room 201 Bed A' },
        { id: 'cphd-w1-2', hospital_id: 'cphd', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL WARD', room_bed: 'Room 202 Bed B' },
        { id: 'cphd-ob-1', hospital_id: 'cphd', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'OB-GYN WARD', room_bed: 'Labor Room Suite' },
        { id: 'cphd-pedia-1', hospital_id: 'cphd', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'PEDIATRIC WARD', room_bed: 'Pedia Room 301' },
      ];
    }

    if (currentId === 'cphc') {
      return [
        { id: 'cphc-er-1', hospital_id: 'cphc', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Trauma Bay 1' },
        { id: 'cphc-er-2', hospital_id: 'cphc', building: 'Main Complex', floor: 'Ground Floor', unit_ward: 'Emergency Department (ER)', room_bed: 'ER Resuscitation Bay 2' },
        { id: 'cphc-icu-1', hospital_id: 'cphc', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'ICU WARD', room_bed: 'ICU Bed 01' },
        { id: 'cphc-w1-1', hospital_id: 'cphc', building: 'Main Complex', floor: '2nd Floor', unit_ward: 'MEDICAL SURGICAL WARD', room_bed: 'Room 201' },
        { id: 'cphc-ob-1', hospital_id: 'cphc', building: 'Main Complex', floor: '3rd Floor', unit_ward: 'OBSTETRICS WARD', room_bed: 'Delivery Suite' },
      ];
    }

    // Default fallback
    return INITIAL_LOCATIONS;
  }

  public static saveCustomLocations(hospitalId: string, locations: HospitalLocation[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_CUSTOM_LOCATIONS}_${hospitalId}`, JSON.stringify(locations));
      window.dispatchEvent(new CustomEvent('cph_locations_updated', { detail: { hospitalId, locations } }));
    }
  }
}
