'use client';

import React, { useState } from 'react';
import { 
  Users, 
  X, 
  Check, 
  ShieldCheck, 
  Stethoscope, 
  Building, 
  User, 
  CheckCircle2,
  Lock,
  HeartPulse
} from 'lucide-react';
import { HospitalStaff } from '@/types/staff';
import { StaffService, CPHB_STAFF_MEMBERS } from '@/lib/staffService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentStaff: HospitalStaff;
  onSelectStaff: (staff: HospitalStaff) => void;
}

export const StaffSwitchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentStaff,
  onSelectStaff,
}) => {
  const [roleCategory, setRoleCategory] = useState<'ALL' | 'DOCTORS' | 'NURSES'>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  if (!isOpen) return null;

  let filtered = CPHB_STAFF_MEMBERS;

  if (roleCategory === 'DOCTORS') {
    filtered = filtered.filter(s => s.is_doctor);
  } else if (roleCategory === 'NURSES') {
    filtered = filtered.filter(s => !s.is_doctor && s.role !== 'Security Officer');
  }

  if (selectedDept !== 'ALL') {
    filtered = filtered.filter(s => s.department === selectedDept);
  }

  const departments = [
    'ALL',
    'Emergency Department (ER)',
    'ICU NEW ROOM',
    'MEDICAL WARD (WARD 4)',
    'WARD 5 (OB-GYN)',
    'WARD 6 (Nursery / Pedia)',
    'WARD 7 (Surgical)',
    'WARD 10 (Isolation)',
    'Outpatient Clinic (OPD)',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Hospital Duty Staff & Personnel Directory</h3>
              <p className="text-xs text-slate-500">Cebu Provincial Hospital - Balamban • Live Ref_Personnel with PRC Licenses</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div 
              className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm"
              style={{ backgroundColor: currentStaff.color_hex }}
            >
              {currentStaff.avatar_initials}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                Active Duty Session:
              </span>
              <span className="text-xs font-black text-slate-900">
                {currentStaff.name} ({currentStaff.role}) • {currentStaff.department} • <span className="font-mono text-emerald-800 font-bold">PRC: {currentStaff.prc_license_no}</span>
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Logged In
          </span>
        </div>

        {/* Category Tabs (All / Doctors / Nurses) */}
        <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setRoleCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition ${
                roleCategory === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Staff ({CPHB_STAFF_MEMBERS.length})
            </button>
            <button
              onClick={() => setRoleCategory('DOCTORS')}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs flex items-center space-x-1 transition ${
                roleCategory === 'DOCTORS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Doctors (MD) ({StaffService.getDoctors().length})</span>
            </button>
            <button
              onClick={() => setRoleCategory('NURSES')}
              className={`px-3.5 py-1.5 rounded-lg font-black text-xs flex items-center space-x-1 transition ${
                roleCategory === 'NURSES' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="h-3.5 w-3.5" />
              <span>Nurses (RN) ({StaffService.getNurses().length})</span>
            </button>
          </div>
        </div>

        {/* Department Filter Sub-bar */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center space-x-1 overflow-x-auto text-xs">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-bold text-[11px] transition ${
                selectedDept === dept
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {dept === 'ALL' ? 'All Wards' : dept.replace('Emergency Department', 'ER').replace('MEDICAL WARD', 'Med Ward')}
            </button>
          ))}
        </div>

        {/* Staff Grid List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {filtered.map((staff) => {
            const isCurrent = staff.id === currentStaff.id;
            return (
              <button
                key={staff.id}
                onClick={() => {
                  onSelectStaff(staff);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm shrink-0"
                    style={{ backgroundColor: staff.color_hex }}
                  >
                    {staff.avatar_initials}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-900">{staff.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                        staff.is_doctor ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {staff.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                      {staff.department} • <strong className="text-blue-900 font-mono">PRC: {staff.prc_license_no}</strong> • ID: <span className="font-mono text-slate-500">{staff.employee_id}</span>
                    </p>
                    {staff.specialization && (
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1">
                        {staff.specialization}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {isCurrent ? (
                    <span className="p-1.5 rounded-full bg-emerald-600 text-white block">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-blue-600 hover:text-white transition border border-slate-200">
                      Switch Duty &rarr;
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400 font-medium">
          Access from any device on hospital LAN: <strong className="text-blue-600 font-mono">http://192.168.12.240:3000</strong>
        </div>

      </div>
    </div>
  );
};
