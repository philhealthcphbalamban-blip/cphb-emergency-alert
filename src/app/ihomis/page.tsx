'use client';

import React, { useState, useEffect } from 'react';
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
  Award
} from 'lucide-react';
import { IHOMISPatient, IHOMISSourceModule } from '@/types/ihomis';
import { IHOMISService, IHOMIS_CONFIG } from '@/lib/ihomisService';
import { StaffService } from '@/lib/staffService';
import { useRouter } from 'next/navigation';

export default function IHOMISDirectoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<IHOMISSourceModule>('ADMISSION');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sexFilter, setSexFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [patients, setPatients] = useState<IHOMISPatient[]>([]);

  const metrics = IHOMISService.getMetrics();
  const doctorsList = StaffService.getDoctors();

  useEffect(() => {
    const list = IHOMISService.getPatientsByModule(activeTab);
    setPatients(list);
  }, [activeTab]);

  // Strip leading zeros for ultra-flexible search
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
      p.admitting_diagnosis.toLowerCase().includes(qRaw);

    const matchesSex = sexFilter === 'ALL' || p.gender === sexFilter;
    const matchesService = serviceFilter === 'ALL' || p.type_of_service === serviceFilter;

    return matchesSearch && matchesSex && matchesService;
  });

  // If filtered is empty but user typed a valid HRN, check global lookup
  const displayList = filteredPatients.length > 0 
    ? filteredPatients 
    : (searchQuery.trim().length >= 3 ? (() => {
        const found = IHOMISService.findPatientByHRN(searchQuery, activeTab);
        return found ? [found] : [];
      })() : []);

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

  return (
    <div className="w-full max-w-[98%] mx-auto px-3 sm:px-6 py-6 space-y-5">
      
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-xs">
            <Bed className="h-4 w-4 text-emerald-700" />
            <span>
              {activeTab === 'ADMISSION' ? 'Admission / Inpatient Lists' : 'Emergency Department Encounters'}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-bold">•</span>
          <span className="text-xs text-slate-500 font-semibold hidden md:inline">
            Cebu Provincial Hospital - Balamban
          </span>
        </div>

        {/* Live Module Switcher & Direct iHOMIS Links */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab('ADMISSION');
                setSearchQuery('');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                activeTab === 'ADMISSION' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              /Admission ({metrics.activeAdmissions})
            </button>
            <button
              onClick={() => {
                setActiveTab('EMERGENCY');
                setSearchQuery('');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                activeTab === 'EMERGENCY' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              /Emergency ({metrics.erEncounters})
            </button>
          </div>

          <a
            href={activeTab === 'ADMISSION' ? IHOMIS_CONFIG.admissionUrl : IHOMIS_CONFIG.emergencyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center space-x-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
          >
            <span>Open in iHOMIS</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <a
            href={IHOMIS_CONFIG.personnelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center space-x-1 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition"
          >
            <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
            <span>/Ref_Personnel</span>
          </a>
        </div>
      </div>

      {/* TOP METRICS ROW (Exact styling from Image 1 & Image 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Active Admissions / Encounters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
            {activeTab === 'ADMISSION' ? <Bed className="h-4 w-4 text-emerald-600" /> : <Users className="h-4 w-4 text-emerald-600" />}
            <span>{activeTab === 'ADMISSION' ? 'ACTIVE ADMISSIONS' : 'ENCOUNTERS'}</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {activeTab === 'ADMISSION' ? metrics.activeAdmissions : metrics.erEncounters}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {activeTab === 'ADMISSION' ? '182 of 182 matched' : '297 of 297 matched'}
          </p>
        </div>

        {/* Card 2: Male Count */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
            <User className="h-4 w-4 text-blue-600" />
            <span>MALE</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {activeTab === 'ADMISSION' ? metrics.admissionsMale : metrics.erMale}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {activeTab === 'ADMISSION' ? 'In matched admissions' : 'In loaded results'}
          </p>
        </div>

        {/* Card 3: Female Count */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
            <User className="h-4 w-4 text-pink-600" />
            <span>FEMALE</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {activeTab === 'ADMISSION' ? metrics.admissionsFemale : metrics.erFemale}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {activeTab === 'ADMISSION' ? 'In matched admissions' : 'In loaded results'}
          </p>
        </div>

        {/* Card 4: Long Stay / For Admission */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
            {activeTab === 'ADMISSION' ? <Clock className="h-4 w-4 text-amber-600" /> : <Bed className="h-4 w-4 text-blue-600" />}
            <span>{activeTab === 'ADMISSION' ? 'LONG STAY' : 'FOR ADMISSION'}</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {activeTab === 'ADMISSION' ? metrics.longStayCount : metrics.erForAdmission}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {activeTab === 'ADMISSION' ? '57 Patients ≥ 7 Days' : 'In loaded results'}
          </p>
        </div>

      </div>

      {/* FILTER & SEARCH BAR WITH APPLY & RESET (Exact from Image 1 & 2) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          
          {/* Search by Patient / HRN (4 cols) */}
          <div className="lg:col-span-4">
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Patient / HRN (e.g. 000000000068409 or 68409 or Mancia)
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient or record no"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Sex Filter (2 cols) */}
          <div className="lg:col-span-2">
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Sex
            </label>
            <select
              value={sexFilter}
              onChange={(e) => setSexFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-emerald-500"
            >
              <option value="ALL">All</option>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
            </select>
          </div>

          {/* Accommodation Filter (2 cols) */}
          <div className="lg:col-span-2">
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Accommodation
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-emerald-500"
            >
              <option value="ALL">All</option>
              <option value="NON-BASIC">Non-Basic</option>
              <option value="SERVICE">Service</option>
            </select>
          </div>

          {/* Type of Service (2 cols) */}
          <div className="lg:col-span-2">
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Type of Service
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-emerald-500"
            >
              <option value="ALL">All Services</option>
              <option value="OBNEWROOM">OBNEWROOM</option>
              <option value="MEDICAL">MEDICAL</option>
              <option value="SURGICAL">SURGICAL</option>
              <option value="PEDIATRICS">PEDIATRICS</option>
              <option value="OBSTETRICS">OBSTETRICS</option>
              <option value="ICU">ICU</option>
            </select>
          </div>

          {/* Apply & Reset Buttons (2 cols) */}
          <div className="lg:col-span-2 flex items-center space-x-1.5">
            <button
              onClick={() => {}}
              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center space-x-1 transition"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Apply</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs border border-slate-200 transition"
              title="Reset Filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* DATA TABLE & WARDS / PERSONNEL LAYOUT (Widescreen 9-3 grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Table Column (9 cols) */}
        <div className="lg:col-span-9 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Health Record No</th>
                  <th className="py-3 px-3">Patient Name (Lastname, Firstname Middlename)</th>
                  <th className="py-3 px-2">Sex</th>
                  {activeTab === 'ADMISSION' && <th className="py-3 px-2">DOB</th>}
                  <th className="py-3 px-3">Diagnosis / Chief Complaint</th>
                  <th className="py-3 px-2">Service</th>
                  <th className="py-3 px-2">Date / Time</th>
                  <th className="py-3 px-3 text-center">Emergency Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {displayList.length > 0 ? (
                  displayList.map((patient) => {
                    const isER = patient.source_module === 'EMERGENCY';
                    return (
                      <tr key={patient.hrn} className="hover:bg-blue-50/40 transition">
                        
                        {/* HRN with green plus icon */}
                        <td className="py-3 px-3 whitespace-nowrap">
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
                              <span>Location: <strong className="text-red-700">Emergency Department (ER)</strong> ({patient.room_bed})</span>
                            ) : (
                              <span>Ward: <strong className="text-slate-700">{patient.ward_name}</strong> ({patient.room_bed})</span>
                            )}
                          </span>
                        </td>

                        {/* Sex */}
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            patient.gender === 'FEMALE' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {patient.gender}
                          </span>
                        </td>

                        {/* DOB */}
                        {activeTab === 'ADMISSION' && (
                          <td className="py-3 px-2 text-[10px] text-slate-500 whitespace-nowrap">
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
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {patient.type_of_service}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-2 whitespace-nowrap text-[10px] text-slate-600">
                          <div>{patient.admission_date}</div>
                          <div className="text-slate-400 font-medium">{patient.admission_time}</div>
                        </td>

                        {/* Emergency Dispatch Button */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleTriggerForPatient(patient)}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase shadow-sm transition flex items-center space-x-1 mx-auto"
                            title="Trigger Code Alert for this Patient"
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
                      No patients matched "{searchQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Match Count */}
          <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {displayList.length} of {activeTab === 'ADMISSION' ? metrics.activeAdmissions : metrics.erEncounters} entries</span>
            <div className="flex items-center space-x-1">
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-bold">1</span>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">Live Synced</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Doctors Registry (Ref_Personnel) & Ward Vacancies */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* CPHB Ref_Personnel: Duty Doctors & PRC License Numbers */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
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

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {doctorsList.map((doc) => (
                <div key={doc.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5 text-xs">
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

          {/* Ward Vacancies */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-1.5">
                <Bed className="h-4 w-4 text-emerald-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Ward Vacancies
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">11 WARDS</span>
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
                <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">4 Vacant</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {['TEMB1', 'TEMB4', 'tempobed-ward04'].map(b => (
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
                {['tempobed-ward05A', 'tempobed-ward05B'].map(b => (
                  <span key={b} className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                    {b}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
