/**
 * ============================================================================
 * CPH BALAMBAN - iHOMIS Plus Realtime Cloud Auto-Sync Content Script
 * ============================================================================
 */

console.log('%c🏥 [CPHB iHOMIS+ Cloud Sync] Active & Monitoring Encounters...', 'background: #059669; color: #fff; font-size: 12px; font-weight: bold; padding: 3px 6px; border-radius: 4px;');

const VERCEL_API = 'https://cphb-emergency-alert.vercel.app/api/ihomis/patients';
let lastSyncedSignature = '';

function extractAndSyncEncounters() {
  const tableRows = Array.from(document.querySelectorAll('table tbody tr'));
  if (tableRows.length === 0) return;

  const url = window.location.href.toLowerCase();
  const pageText = document.body.innerText.toLowerCase();

  const isER = url.includes('emergency') || pageText.includes('current emergency consultations') || pageText.includes('encounters');
  const isOPD = url.includes('outpatient') || pageText.includes('current outpatient consultations');
  const moduleType = isER ? 'EMERGENCY' : isOPD ? 'OUTPATIENT' : 'ADMISSION';

  const patients = [];

  tableRows.forEach((tr, index) => {
    const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
    if (cells.length < 3) return;

    // Extract HRN (e.g. 000000000148651)
    const rawHrn = cells[0]?.replace(/[^0-9]/g, '') || `000000000${157200 + index}`;
    
    // Extract Name (e.g. MACAVINTA, BLESSYN ANYA, OLACO)
    const rawName = cells[1] || '';
    if (!rawName || rawName.length < 2) return;

    // Extract Gender
    const rawSex = (cells[2] || 'FEMALE').toUpperCase().startsWith('M') ? 'MALE' : 'FEMALE';

    // Extract Date of Birth or Accommodation
    const dob = cells[3] && cells[3].includes('/') ? cells[3] : '01/01/1995';

    // Extract Diagnosis & Service
    let diag = 'ACUTE CLINICAL ENCOUNTER';
    let service = 'GENERAL';

    if (moduleType === 'ADMISSION') {
      diag = cells[4] || diag;
      service = cells[6] || cells[5] || 'OBNEWROOM';
    } else if (moduleType === 'EMERGENCY') {
      diag = cells[4] || 'ACUTE EMERGENCY ENCOUNTER';
      service = cells[4] || 'MEDICAL';
      if (cells.length >= 6) {
        service = cells[4] || 'MEDICAL';
      }
    } else if (moduleType === 'OUTPATIENT') {
      service = cells[3] || 'HEMODIALYSIS';
      diag = `OUTPATIENT ${service} CONSULTATION`;
    }

    patients.push({
      hrn: rawHrn.padStart(15, '0'),
      case_no: moduleType === 'EMERGENCY' ? `ER-2026-${rawHrn.slice(-6)}` : moduleType === 'OUTPATIENT' ? `OPD-2026-${rawHrn.slice(-6)}` : `ADM-2026-${rawHrn.slice(-6)}`,
      patient_name: rawName.toUpperCase(),
      age: 35,
      dob: dob,
      gender: rawSex,
      source_module: moduleType,
      ward_name: moduleType === 'EMERGENCY' ? 'Emergency Department (ER)' : moduleType === 'OUTPATIENT' ? 'Outpatient Department (OPD)' : 'WARD 5 (OB-GYN)',
      room_bed: moduleType === 'EMERGENCY' ? 'ER Bed' : 'Ward Bed',
      admitting_diagnosis: diag,
      accommodation: moduleType === 'ADMISSION' ? 'NON-BASIC' : 'SERVICE',
      type_of_service: service,
      attending_physician: 'Attending Physician',
      admission_date: new Date().toLocaleDateString('en-US'),
      admission_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      disposition: moduleType === 'EMERGENCY' ? 'UNDER EVALUATION' : 'ACTIVE',
      code_status: 'FULL_CODE',
      allergies: ['NKDA'],
      blood_type: 'O+',
      fall_risk: 'MEDIUM',
      ihomis_url: window.location.href,
    });
  });

  if (patients.length === 0) return;

  const currentSignature = `${moduleType}_${patients.length}_${patients[0].hrn}`;
  if (currentSignature === lastSyncedSignature) return; // No new changes

  lastSyncedSignature = currentSignature;

  // Send to Chrome Extension Background Worker
  chrome.runtime.sendMessage({
    type: 'SYNC_PATIENTS_PAYLOAD',
    payload: {
      patients,
      module: moduleType,
      synced_by: 'CPHB Chrome Extension (Developer Mode)',
      sync_source: 'CHROME_EXTENSION_LIVE',
    }
  }, (response) => {
    if (response && response.success) {
      console.log(`%c✓ [CPHB Extension] Synced ${patients.length} ${moduleType} Patients to Vercel Cloud!`, 'color: #10b981; font-weight: bold;');
    }
  });
}

// Initial Sync on load
setTimeout(extractAndSyncEncounters, 1500);

// Polling interval every 10 seconds
setInterval(extractAndSyncEncounters, 10000);

// Observe DOM updates when new patients are admitted
const observer = new MutationObserver(() => {
  extractAndSyncEncounters();
});
observer.observe(document.body, { childList: true, subtree: true });
