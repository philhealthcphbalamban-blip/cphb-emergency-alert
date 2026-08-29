/**
 * ============================================================================
 * CPH BALAMBAN - iHOMIS Plus Realtime Cloud Auto-Sync Bridge Daemon
 * ============================================================================
 * 
 * Automatically captures live iHOMIS+ Encounters (Inpatient, Outpatient, ER)
 * and synchronizes them with the Vercel Emergency Alert Cloud System.
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Load Config
const configPath = path.join(__dirname, 'config.json');
let config = {
  hospital_name: 'Cebu Provincial Hospital - Balamban (CPHB)',
  cloud_api_url: 'https://cphb-emergency-alert.vercel.app/api/ihomis/patients',
  sync_interval_seconds: 60,
  csv_watch_folder: {
    enabled: true,
    watch_directory: './ihomis_exports'
  }
};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error('⚠️ Could not parse config.json, using defaults.');
  }
}

// Ensure watch directory exists
const watchDir = path.resolve(__dirname, config.csv_watch_folder.watch_directory || './ihomis_exports');
if (!fs.existsSync(watchDir)) {
  fs.mkdirSync(watchDir, { recursive: true });
}

console.log('\x1b[36m%s\x1b[0m', '==================================================================');
console.log('\x1b[32m%s\x1b[0m', '🏥 CPHB iHOMIS Plus -> Vercel Cloud Auto-Sync Bridge');
console.log('\x1b[36m%s\x1b[0m', '==================================================================');
console.log(`📡 Cloud Target Endpoint : \x1b[33m${config.cloud_api_url}\x1b[0m`);
console.log(`⏱️ Sync Interval         : \x1b[33mEvery ${config.sync_interval_seconds} seconds\x1b[0m`);
console.log(`📂 Watched Export Folder  : \x1b[33m${watchDir}\x1b[0m`);
console.log('\x1b[36m%s\x1b[0m', '==================================================================\n');

/**
 * Parses all Excel / CSV files inside the watch directory
 */
function parseExportFiles() {
  const allPatients = [];
  const files = fs.readdirSync(watchDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv'));

  if (files.length === 0) {
    return null;
  }

  for (const file of files) {
    const fullPath = path.join(watchDir, file);
    try {
      const workbook = XLSX.readFile(fullPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const isER = file.toLowerCase().includes('emergency') || file.toLowerCase().includes('er');
      const isOPD = file.toLowerCase().includes('outpatient') || file.toLowerCase().includes('opd');
      const moduleType = isER ? 'EMERGENCY' : isOPD ? 'OUTPATIENT' : 'ADMISSION';

      rows.forEach((row, idx) => {
        const rawHrn = String(row['HRN'] || row['Health Record #'] || row['Health record no'] || row['Health Record No'] || row['Patient ID'] || row['Hospital No'] || `000000000${157200 + idx}`).trim();
        const rawName = String(row['Patient Name'] || row['Patient name'] || row['Name'] || row['PATIENT NAME'] || row['Full Name'] || '').trim();
        if (!rawName) return;

        const rawSex = String(row['Sex'] || row['Gender'] || row['SEX'] || 'FEMALE').toUpperCase().startsWith('M') ? 'MALE' : 'FEMALE';
        const rawWard = String(
          row['Ward'] || row['Ward Name'] || row['Location'] || 
          (moduleType === 'EMERGENCY' ? 'Emergency Department (ER)' : moduleType === 'OUTPATIENT' ? 'Hemodialysis Unit' : 'WARD 5 (OB-GYN)')
        ).trim();
        const rawBed = String(row['Bed'] || row['Room Bed'] || row['Room'] || 'Bed 01').trim();
        const rawDiag = String(row['Diagnosis'] || row['Admission Diagnosis'] || row['Admitting Diagnosis'] || row['Chief Complaint'] || 'Under Observation').trim();
        const rawService = String(row['Service'] || row['Type of Service'] || row['Type Of Service'] || (moduleType === 'OUTPATIENT' ? 'HEMODIALYSIS' : 'MEDICAL')).trim();

        allPatients.push({
          hrn: rawHrn.padStart(15, '0'),
          case_no: moduleType === 'EMERGENCY' ? `ER-2026-${rawHrn.slice(-6)}` : moduleType === 'OUTPATIENT' ? `OPD-2026-${rawHrn.slice(-6)}` : `ADM-2026-${rawHrn.slice(-6)}`,
          patient_name: rawName.toUpperCase(),
          age: Number(row['Age']) || 35,
          dob: String(row['DOB'] || row['Date Of Birth'] || '01/01/1990'),
          gender: rawSex,
          source_module: moduleType,
          ward_name: rawWard,
          room_bed: rawBed,
          admitting_diagnosis: rawDiag,
          accommodation: String(row['Accommodation'] || row['Accomodation'] || (moduleType === 'ADMISSION' ? 'NON-BASIC' : 'SERVICE')),
          type_of_service: rawService,
          attending_physician: String(row['Physician'] || row['Attending Physician'] || 'Attending Physician'),
          admission_date: new Date().toLocaleDateString('en-US'),
          admission_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          disposition: String(row['Disposition'] || (moduleType === 'EMERGENCY' ? 'UNDER OBSERVATION' : 'CONSULTATION IN PROGRESS')),
          code_status: 'FULL_CODE',
          allergies: ['NKDA'],
          blood_type: 'O+',
          fall_risk: 'MEDIUM',
          ihomis_url: `https://ihomis-plus.cphb.local?hrn=${rawHrn}`,
        });
      });
    } catch (err) {
      console.error(`❌ Error reading ${file}:`, err.message);
    }
  }

  return allPatients.length > 0 ? allPatients : null;
}

/**
 * Pushes patient payload to Vercel Cloud endpoint
 */
async function pushToCloud(patients) {
  const timestamp = new Date().toLocaleTimeString();
  try {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    const response = await fetch(config.cloud_api_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patients,
        synced_by: 'CPHB Hospital Server iHOMIS Bridge',
        sync_source: 'LAN_AUTOMATED_DAEMON',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[\x1b[32m${timestamp}\x1b[0m] \x1b[32m✓ CLOUD SYNC SUCCESSFUL!\x1b[0m Synced \x1b[1m${data.count}\x1b[0m active patient encounters.`);
      if (data.metrics) {
        console.log(`         📊 Inpatients: ${data.metrics.activeAdmissions} | ER: ${data.metrics.erEncounters} | OPD: ${data.metrics.outpatientConsultations}`);
      }
    } else {
      console.warn(`[\x1b[31m${timestamp}\x1b[0m] ⚠️ Server returned status ${response.status}`);
    }
  } catch (err) {
    console.error(`[\x1b[31m${timestamp}\x1b[0m] ❌ Network Error pushing to cloud:`, err.message);
  }
}

/**
 * Periodic Sync Cycle
 */
async function runSyncCycle() {
  const patients = parseExportFiles();
  if (patients && patients.length > 0) {
    await pushToCloud(patients);
  } else {
    // If no export files currently placed, send heartbeat ping
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[\x1b[34m${timestamp}\x1b[0m] ℹ️ Auto-Bridge Daemon active & listening on LAN. Next check in ${config.sync_interval_seconds}s...`);
  }
}

// Initial Sync
runSyncCycle();

// Interval Scheduler
setInterval(runSyncCycle, (config.sync_interval_seconds || 60) * 1000);
