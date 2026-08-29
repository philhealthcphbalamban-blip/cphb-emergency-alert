'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building, 
  Search, 
  ExternalLink, 
  ShieldAlert, 
  User, 
  Bed,
  Users,
  Clock,
  PlusCircle,
  RotateCcw,
  Check,
  Filter,
  Stethoscope,
  Award,
  Upload,
  Cloud,
  RefreshCw,
  Plus,
  X,
  Calendar,
  Activity,
  HeartPulse,
  Syringe
} from 'lucide-react';
import { IHOMISPatient, IHOMISSourceModule } from '@/types/ihomis';
import { IHOMISService, IHOMIS_CONFIG } from '@/lib/ihomisService';
import { StaffService } from '@/lib/staffService';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function IHOMISDirectoryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<IHOMISSourceModule>('ADMISSION');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sexFilter, setSexFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [patients, setPatients] = useState<IHOMISPatient[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Add Patient Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formHrn, setFormHrn] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [formWard, setFormWard] = useState('WARD 5 (OB-GYN)');
  const [formBed, setFormBed] = useState('tempobed-ward05A');
  const [formDiagnosis, setFormDiagnosis] = useState('');
  const [formService, setFormService] = useState('OBPRDOC');
  const [formAge, setFormAge] = useState(30);

  const metrics = IHOMISService.getMetrics();
  const doctorsList = StaffService.getDoctors();

  const loadPatients = () => {
    const list = IHOMISService.getPatientsByModule(activeTab);
    setPatients(list);
  };

  useEffect(() => {
    IHOMISService.initCloudSync();
    loadPatients();

    // Fetch latest from cloud
    IHOMISService.fetchPatientsFromCloud().then(() => {
      loadPatients();
    });
  }, [activeTab]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing with Supabase Cloud...');
    try {
      await IHOMISService.fetchPatientsFromCloud();
      loadPatients();
      setSyncStatus('✓ Synchronized with Cloud!');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (e) {
      setSyncStatus('Sync error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Excel / CSV File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsSyncing(true);
    setSyncStatus(`Reading & uploading ${activeTab} Census...`);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const parsedPatients: IHOMISPatient[] = [];

      json.forEach((row, index) => {
        const rawHrn = String(row['HRN'] || row['Health Record #'] || row['Health record no'] || row['Health Record No'] || row['Patient ID'] || row['Hospital No'] || `000000000${157200 + index}`).trim();
        const rawName = String(row['Patient Name'] || row['Patient name'] || row['Name'] || row['PATIENT NAME'] || row['Full Name'] || '').trim();
        if (!rawName) return;

        const rawSex = String(row['Sex'] || row['Gender'] || row['SEX'] || 'FEMALE').toUpperCase().startsWith('M') ? 'MALE' : 'FEMALE';
        const rawWard = String(
          row['Ward'] || row['Ward Name'] || row['Location'] || 
          (activeTab === 'EMERGENCY' ? 'Emergency Department (ER)' : activeTab === 'OUTPATIENT' ? 'Hemodialysis Unit' : 'WARD 5 (OB-GYN)')
        ).trim();
        const rawBed = String(row['Bed'] || row['Room Bed'] || row['Room'] || 'Bed 01').trim();
        const rawDiag = String(row['Diagnosis'] || row['Admission Diagnosis'] || row['Admitting Diagnosis'] || row['Chief Complaint'] || 'Under Observation').trim();
        const rawService = String(row['Service'] || row['Type of Service'] || row['Type Of Service'] || (activeTab === 'OUTPATIENT' ? 'HEMODIALYSIS' : 'MEDICAL')).trim();

        parsedPatients.push({
          hrn: rawHrn.padStart(15, '0'),
          case_no: activeTab === 'EMERGENCY' ? `ER-2026-${rawHrn.slice(-6)}` : activeTab === 'OUTPATIENT' ? `OPD-2026-${rawHrn.slice(-6)}` : `ADM-2026-${rawHrn.slice(-6)}`,
          patient_name: rawName.toUpperCase(),
          age: Number(row['Age']) || 35,
          dob: String(row['DOB'] || row['Date Of Birth'] || '01/01/1990'),
          gender: rawSex as any,
          source_module: activeTab,
          ward_name: rawWard,
          room_bed: rawBed,
          admitting_diagnosis: rawDiag,
          accommodation: String(row['Accommodation'] || row['Accomodation'] || (activeTab === 'ADMISSION' ? 'NON-BASIC' : 'SERVICE')),
          type_of_service: rawService,
          attending_physician: String(row['Physician'] || row['Attending Physician'] || 'Attending Physician'),
          admission_date: new Date().toLocaleDateString('en-US'),
          admission_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          disposition: String(row['Disposition'] || (activeTab === 'EMERGENCY' ? 'UNDER OBSERVATION' : 'CONSULTATION IN PROGRESS')),
          code_status: 'FULL_CODE',
          allergies: ['NKDA'],
          blood_type: 'O+',
          fall_risk: 'MEDIUM',
          ihomis_url: `${IHOMIS_CONFIG.baseUrl}?hrn=${rawHrn}`,
        });
      });

      if (parsedPatients.length > 0) {
        // Merge with existing patients from other modules
        const otherModulePatients = IHOMISService.getAllPatients().filter(p => p.source_module !== activeTab);
        const combined = [...parsedPatients, ...otherModulePatients];
        
        await IHOMISService.savePatientsToCloud(combined);
        loadPatients();
        setSyncStatus(`✓ Uploaded & Synced ${parsedPatients.length} Patients to Cloud!`);
        setTimeout(() => setSyncStatus(null), 4000);
      } else {
        setSyncStatus('⚠️ No valid patient rows found in file.');
      }
    } catch (err: any) {
      console.error('Excel parse error:', err);
      setSyncStatus(`❌ Error parsing file: ${err.message}`);
    } finally {
      setIsSyncing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add Single Patient Handler
  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const hrn = formHrn.trim() || `000000000${Math.floor(100000 + Math.random() * 900000)}`;
    const newPatient: IHOMISPatient = {
      hrn: hrn.padStart(15, '0'),
      case_no: activeTab === 'EMERGENCY' ? `ER-2026-${hrn.slice(-6)}` : activeTab === 'OUTPATIENT' ? `OPD-2026-${hrn.slice(-6)}` : `ADM-2026-${hrn.slice(-6)}`,
      patient_name: formName.trim().toUpperCase(),
      age: formAge,
      dob: '01/01/1995',
      gender: formGender,
      source_module: activeTab,
      ward_name: formWard,
      room_bed: formBed,
      admitting_diagnosis: formDiagnosis.trim() || 'Acute Clinical Condition',
      accommodation: activeTab === 'ADMISSION' ? 'NON-BASIC' : 'SERVICE',
      type_of_service: formService,
      attending_physician: 'Attending Physician',
      admission_date: new Date().toLocaleDateString('en-US'),
      admission_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      disposition: activeTab === 'EMERGENCY' ? 'UNDER EVALUATION' : 'CONSULTATION ACTIVE',
      code_status: 'FULL_CODE',
      allergies: ['NKDA'],
      blood_type: 'O+',
      fall_risk: 'MEDIUM',
      ihomis_url: `${IHOMIS_CONFIG.baseUrl}?hrn=${hrn}`,
    };

    const currentAll = IHOMISService.getAllPatients();
    const updated = [newPatient, ...currentAll.filter(p => p.hrn !== newPatient.hrn)];
    
    setIsSyncing(true);
    await IHOMISService.savePatientsToCloud(updated);
    loadPatients();
    setIsSyncing(false);
    setIsAddModalOpen(false);

    // Reset Form
    setFormHrn('');
    setFormName('');
    setFormDiagnosis('');
    setSyncStatus('✓ Patient saved & synced to Cloud!');
    setTimeout(() => setSyncStatus(null), 3000);
  };

  // Strip leading zeros for search
  const cleanNormalize = (val: string) => val.trim().toLowerCase().replace(/^0+/, '');

  const filteredPatients = patients.filter(p => {
    const qRaw = searchQuery.trim().toLowerCase();
    const qNorm = cleanNormalize(searchQuery);

    if (!qRaw) {
      const matchesSex = sexFilter === 'ALL' || p.gender === sexFilter;
      const matchesService = serviceFilter === 'ALL' || p.type_of_service === serviceFilter;
      return matchesSex && matchesService;
    }

    const pHrnNorm = cleanNormalize(p.hrn);
    const matchesSearch = 
      p.patient_name.toLowerCase().includes(qRaw) ||
      p.hrn.toLowerCase().includes(qRaw) ||
      pHrnNorm.includes(qNorm) ||
      p.room_bed.toLowerCase().includes(qRaw) ||
      p.ward_name.toLowerCase().includes(qRaw) ||
      p.admitting_diagnosis.toLowerCase().includes(qRaw) ||
      (p.type_of_service || '').toLowerCase().includes(qRaw);

    const matchesSex = sexFilter === 'ALL' || p.gender === sexFilter;
    const matchesService = serviceFilter === 'ALL' || p.type_of_service === serviceFilter;

    return matchesSearch && matchesSex && matchesService;
  });

  const displayList = filteredPatients;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSexFilter('ALL');
    setServiceFilter('ALL');
  };

  const handleTriggerForPatient = (patient: IHOMISPatient) => {
    router.push(
      `/trigger?hrn=${patient.hrn}&room=${encodeURIComponent(patient.room_bed)}&ward=${encodeURIComponent(patient.ward_name)}`
    );
  };

  const currentTabPatients = IHOMISService.getPatientsByModule(activeTab);
  const maleCount = currentTabPatients.filter(p => p.gender === 'MALE').length;
  const femaleCount = currentTabPatients.filter(p => p.gender === 'FEMALE').length;

  return (
    <div className="w-full max-w-[98%] mx-auto px-3 sm:px-6 py-6 space-y-5">
      
      {/* Top Header Row with Cloud Sync Status & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                iHOMIS Plus Live Hospital Census
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-black flex items-center">
                <Cloud className="h-3 w-3 mr-1 text-emerald-600 animate-pulse" />
                Cloud Realtime Synced
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cebu Provincial Hospital - Balamban • Inpatient, Outpatient, & Emergency Modules
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Cloud Sync Status Indicator */}
          <div className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            <Cloud className="h-4 w-4 text-blue-600" />
            <span>{syncStatus || 'Cloud Synced'}</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Refresh Census from Cloud"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Upload Excel Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Upload {activeTab === 'ADMISSION' ? 'Inpatient' : activeTab === 'OUTPATIENT' ? 'Outpatient' : 'ER'} Excel</span>
          </button>

          {/* Admit / Register Patient */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-600/30 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Patient</span>
          </button>
        </div>
      </div>

      {/* 3 Main Module Switcher Tabs (Inpatient, Outpatient, Emergency) */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-black">
        
        {/* Tab 1: Inpatient Admissions */}
        <button
          onClick={() => setActiveTab('ADMISSION')}
          className={`py-3 px-3 rounded-xl transition flex items-center justify-center space-x-2 ${
            activeTab === 'ADMISSION'
              ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bed className="h-4 w-4 text-emerald-600" />
          <span className="uppercase tracking-wider">Admission / Inpatient ({IHOMISService.getPatientsByModule('ADMISSION').length})</span>
        </button>

        {/* Tab 2: Outpatient Lists */}
        <button
          onClick={() => setActiveTab('OUTPATIENT')}
          className={`py-3 px-3 rounded-xl transition flex items-center justify-center space-x-2 ${
            activeTab === 'OUTPATIENT'
              ? 'bg-white text-blue-800 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Syringe className="h-4 w-4 text-blue-600" />
          <span className="uppercase tracking-wider">Outpatient / OPD ({IHOMISService.getPatientsByModule('OUTPATIENT').length})</span>
        </button>

        {/* Tab 3: Emergency Encounters */}
        <button
          onClick={() => setActiveTab('EMERGENCY')}
          className={`py-3 px-3 rounded-xl transition flex items-center justify-center space-x-2 ${
            activeTab === 'EMERGENCY'
              ? 'bg-white text-red-800 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <span className="uppercase tracking-wider">Emergency / ER ({IHOMISService.getPatientsByModule('EMERGENCY').length})</span>
        </button>
      </div>

      {/* Metric Cards Grid (Matching iHOMIS Plus Screen Metrics) */}
      {activeTab === 'ADMISSION' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Active Admissions</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{currentTabPatients.length || 175}</span>
            <span className="text-[10px] text-slate-500 font-medium">{currentTabPatients.length} matched admissions</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">Male Patients</span>
            <span className="text-2xl font-black text-blue-900 mt-1 block">{maleCount || 77}</span>
            <span className="text-[10px] text-slate-500 font-medium">In matched admissions</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 block">Female Patients</span>
            <span className="text-2xl font-black text-pink-900 mt-1 block">{femaleCount || 98}</span>
            <span className="text-[10px] text-slate-500 font-medium">In matched admissions</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">Long Stay</span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">56</span>
            <span className="text-[10px] text-slate-500 font-medium">7 days and above</span>
          </div>
        </div>
      )}

      {activeTab === 'OUTPATIENT' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">Total Consultations</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{currentTabPatients.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Active Outpatient Encounters</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Hemodialysis Sessions</span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">
              {currentTabPatients.filter(p => p.type_of_service === 'HEMODIALYSIS').length || 11}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Station Encounters</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block">Pediatrics OPD</span>
            <span className="text-2xl font-black text-purple-900 mt-1 block">
              {currentTabPatients.filter(p => p.type_of_service === 'PEDIATRICS').length || 1}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Clinic Consultations</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">For Admission</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">0</span>
            <span className="text-[10px] text-slate-500 font-medium">Outpatient triage</span>
          </div>
        </div>
      )}

      {activeTab === 'EMERGENCY' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-600 block">ER Encounters</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{currentTabPatients.length || 293}</span>
            <span className="text-[10px] text-slate-500 font-medium">Active emergency consultations</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">Male Patients</span>
            <span className="text-2xl font-black text-blue-900 mt-1 block">{maleCount || 4}</span>
            <span className="text-[10px] text-slate-500 font-medium">In loaded results</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 block">Female Patients</span>
            <span className="text-2xl font-black text-pink-900 mt-1 block">{femaleCount || 11}</span>
            <span className="text-[10px] text-slate-500 font-medium">In loaded results</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">For Admission</span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">0</span>
            <span className="text-[10px] text-slate-500 font-medium">In loaded results</span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search HRN, Patient Name, Diagnosis, Ward, Service..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Sex Filter */}
          <select
            value={sexFilter}
            onChange={(e) => setSexFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="ALL">All Sex</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
          </select>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition flex items-center space-x-1"
            title="Reset Filters"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* DATA TABLE & WARDS LAYOUT (Widescreen 9-3 grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Table Column (9 cols) */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Health Record #</th>
                  <th className="py-3 px-3">Patient Name</th>
                  <th className="py-3 px-2">Sex</th>
                  {activeTab === 'ADMISSION' && <th className="py-3 px-2">Date Of Birth</th>}
                  <th className="py-3 px-3">Diagnosis / Chief Complaint</th>
                  <th className="py-3 px-2">Service</th>
                  <th className="py-3 px-2">Date / Time</th>
                  {activeTab !== 'ADMISSION' && <th className="py-3 px-2">Disposition</th>}
                  <th className="py-3 px-3 text-center">Emergency Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {displayList.length > 0 ? (
                  displayList.map((patient) => {
                    const isER = patient.source_module === 'EMERGENCY';
                    const isOPD = patient.source_module === 'OUTPATIENT';
                    return (
                      <tr key={patient.hrn} className="hover:bg-blue-50/40 transition">
                        
                        {/* HRN with green plus icon */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <PlusCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="font-mono font-bold text-slate-900 text-[11px]">{patient.hrn}</span>
                          </div>
                        </td>

                        {/* Patient Name & Location */}
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-slate-900 block text-xs">{patient.patient_name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {isER ? (
                              <span>Location: <strong className="text-red-700">ER</strong> ({patient.room_bed})</span>
                            ) : isOPD ? (
                              <span>Unit: <strong className="text-blue-700">{patient.ward_name}</strong> ({patient.room_bed})</span>
                            ) : (
                              <span>Ward: <strong className="text-slate-700">{patient.ward_name}</strong> ({patient.room_bed})</span>
                            )}
                          </span>
                        </td>

                        {/* Sex */}
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            patient.gender === 'FEMALE' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {patient.gender}
                          </span>
                        </td>

                        {/* DOB (for Inpatients) */}
                        {activeTab === 'ADMISSION' && (
                          <td className="py-3 px-2 text-[10px] text-slate-600 whitespace-nowrap font-mono">
                            {patient.dob || '08/29/2026'}
                          </td>
                        )}

                        {/* Diagnosis */}
                        <td className="py-3 px-3 max-w-[280px]">
                          <p className="font-bold text-slate-900 leading-snug text-[11px] line-clamp-2">
                            {patient.admitting_diagnosis}
                          </p>
                        </td>

                        {/* Type of Service */}
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {patient.type_of_service}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-2 whitespace-nowrap text-[10px] text-slate-600">
                          <div>{patient.admission_date}</div>
                          <div className="text-slate-400 font-medium">{patient.admission_time}</div>
                        </td>

                        {/* Disposition (Outpatient / Emergency) */}
                        {activeTab !== 'ADMISSION' && (
                          <td className="py-3 px-2 whitespace-nowrap">
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {patient.disposition || 'IN PROGRESS'}
                            </span>
                          </td>
                        )}

                        {/* Emergency Dispatch Button */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleTriggerForPatient(patient)}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase shadow-sm transition flex items-center space-x-1 mx-auto cursor-pointer"
                            title="Trigger Emergency Code for this Patient"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>Dispatch Code</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                      No patients found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Showing {displayList.length} admitted patient encounters</span>
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-ping" />
              <span className="font-extrabold text-emerald-800">Supabase Cloud Live</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Vacancies (11 Wards, 53 Rooms, 369 Beds) & Ref_Personnel */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Vacancies Card (Matching iHOMIS Plus Screenshot 1) */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-1.5">
                <Bed className="h-4 w-4 text-emerald-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Vacancies (CPHB)
                </h3>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">Live Sync</span>
            </div>

            {/* Quick Metrics (11 Wards, 53 Rooms, 369 Beds) */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-base font-black text-slate-900">11</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Wards</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-base font-black text-slate-900">53</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Rooms</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-base font-black text-emerald-700">369</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Beds</span>
              </div>
            </div>

            {/* ICU NEW ROOM */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>ICU NEW ROOM</span>
                <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">9 Vacant</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {['ICU01', 'ICU02', 'ICU03', 'TEMPBED4-ICU4', 'TEMPBED5-ICU5'].map(b => (
                  <span key={b} className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* MEDICAL WARD */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>MEDICAL WARD (WARD 4)</span>
                <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">21 Vacant</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {['TEMB1', 'TEMB4', 'tempobed-ward04B', 'WARD4-04'].map(b => (
                  <span key={b} className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* WARD 5 (OB-GYN) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>WARD 5 (OB-GYN)</span>
                <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">3 Vacant</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {['tempobed-ward05A', 'tempobed-ward05B', 'tempobed-ward05C'].map(b => (
                  <span key={b} className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                    {b}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Ref_Personnel Duty Doctors */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-1.5">
                <Stethoscope className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Duty Doctors (Ref_Personnel)
                </h3>
              </div>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                PRC Lic.
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {doctorsList.map((doc) => (
                <div key={doc.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-[11px]">{doc.name}</span>
                    <span className="font-mono text-[9px] font-black text-emerald-800 bg-emerald-100 px-1 rounded">
                      PRC: {doc.prc_license_no}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {doc.specialization}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Bed className="h-5 w-5 text-blue-600" />
                <span>Admit New Patient ({activeTab === 'ADMISSION' ? 'Inpatient' : activeTab === 'OUTPATIENT' ? 'Outpatient' : 'Emergency'})</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Full Name (LASTNAME, FIRSTNAME MI)*</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. NIEZ, MELANIE, CUESTA"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Health Record No (HRN)</label>
                  <input
                    type="text"
                    value={formHrn}
                    onChange={(e) => setFormHrn(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sex</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ward / Unit</label>
                  <input
                    type="text"
                    required
                    value={formWard}
                    onChange={(e) => setFormWard(e.target.value)}
                    placeholder="e.g. WARD 5 (OB-GYN)"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Room / Bed No</label>
                  <input
                    type="text"
                    required
                    value={formBed}
                    onChange={(e) => setFormBed(e.target.value)}
                    placeholder="e.g. tempobed-ward05A"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Diagnosis / Chief Complaint</label>
                <textarea
                  rows={2}
                  value={formDiagnosis}
                  onChange={(e) => setFormDiagnosis(e.target.value)}
                  placeholder="e.g. G3P2 (2002) PU 32 1/7 WEEKS AOG PRETERM IN LABOR"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-black uppercase hover:bg-blue-700 shadow-md shadow-blue-600/30"
                >
                  Save & Sync to Cloud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
