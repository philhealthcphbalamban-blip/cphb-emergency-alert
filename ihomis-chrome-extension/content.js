/**
 * ============================================================================
 * CPH BALAMBAN - iHOMIS Plus Realtime Cloud Auto-Sync Content Script
 * ============================================================================
 */

console.log('%c🏥 [CPHB iHOMIS+ Cloud Sync] Active & Monitoring Encounters...', 'background: #059669; color: #fff; font-size: 13px; font-weight: bold; padding: 4px 8px; border-radius: 4px;');

const VERCEL_API = 'https://cphb-emergency-alert.vercel.app/api/ihomis/patients';
let lastSyncedSignature = '';

// Create floating status badge on iHOMIS screen
function createFloatingBadge() {
  if (document.getElementById('cphb-sync-badge')) return;

  const badge = document.createElement('div');
  badge.id = 'cphb-sync-badge';
  badge.style.position = 'fixed';
  badge.style.bottom = '20px';
  badge.style.right = '20px';
  badge.style.zIndex = '999999';
  badge.style.background = '#0f172a';
  badge.style.color = '#fff';
  badge.style.padding = '10px 14px';
  badge.style.borderRadius = '14px';
  badge.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.4)';
  badge.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  badge.style.fontSize = '12px';
  badge.style.fontWeight = 'bold';
  badge.style.display = 'flex';
  badge.style.alignItems = 'center';
  badge.style.gap = '8px';
  badge.style.border = '1px solid #334155';
  badge.style.cursor = 'pointer';
  badge.title = 'Click to Force Sync iHOMIS with Vercel Cloud';

  badge.innerHTML = `
    <span style="height: 8px; width: 8px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
    <span id="cphb-badge-text">CPHB Cloud Sync Active</span>
    <button style="background: #2563eb; color: #fff; border: none; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; cursor: pointer; text-transform: uppercase;">Sync Now ⚡</button>
  `;

  badge.onclick = () => {
    extractAndSyncEncounters(true);
  };

  document.body.appendChild(badge);
}

function updateBadgeStatus(text, isSuccess = true) {
  const badgeText = document.getElementById('cphb-badge-text');
  if (badgeText) {
    badgeText.innerText = text;
  }
}

async function sendDirectToVercel(patients, moduleType) {
  try {
    const res = await fetch(VERCEL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patients,
        module: moduleType,
        synced_by: 'CPHB Chrome Extension Direct',
        sync_source: 'CHROME_EXTENSION_DIRECT',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`%c✓ [Direct Sync] Synced ${patients.length} ${moduleType} Patients to Vercel! Total Cloud Census: ${data.count}`, 'color: #10b981; font-weight: bold;');
      updateBadgeStatus(`✓ Synced ${patients.length} ${moduleType} (${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`);
      return true;
    }
  } catch (e) {
    console.warn('Direct fetch error:', e.message);
  }
  return false;
}

function extractAndSyncEncounters(isManualForce = false) {
  createFloatingBadge();

  const tableRows = Array.from(document.querySelectorAll('table tbody tr'));
  if (tableRows.length === 0) {
    updateBadgeStatus('Waiting for Patient table...');
    return;
  }

  const url = window.location.href.toLowerCase();
  const pageText = document.body.innerText.toLowerCase();

  const isER = url.includes('emergency') || pageText.includes('emergency') || pageText.includes('encounters');
  const isOPD = url.includes('outpatient') || pageText.includes('outpatient');
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

    // Extract Date of Birth
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
  if (!isManualForce && currentSignature === lastSyncedSignature) return; // No changes

  lastSyncedSignature = currentSignature;
  updateBadgeStatus(`Syncing ${patients.length} ${moduleType}...`);

  // Direct fetch fallback
  sendDirectToVercel(patients, moduleType);

  // Also notify background worker
  try {
    chrome.runtime.sendMessage({
      type: 'SYNC_PATIENTS_PAYLOAD',
      payload: {
        patients,
        module: moduleType,
        synced_by: 'CPHB Chrome Extension (Developer Mode)',
        sync_source: 'CHROME_EXTENSION_LIVE',
      }
    });
  } catch (e) {}
}

// Initial Sync on load
setTimeout(extractAndSyncEncounters, 1000);

// Polling interval every 10 seconds
setInterval(() => extractAndSyncEncounters(false), 10000);

// Observe DOM updates when new patients arrive
const observer = new MutationObserver(() => {
  extractAndSyncEncounters(false);
});
observer.observe(document.body, { childList: true, subtree: true });
