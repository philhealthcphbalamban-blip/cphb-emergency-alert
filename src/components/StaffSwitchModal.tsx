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
  HeartPulse,
  Unlock,
  Search
} from 'lucide-react';
import { HospitalStaff } from '@/types/staff';
import { StaffService, AdminAuthService } from '@/lib/staffService';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleCategory, setRoleCategory] = useState<'ALL' | 'DOCTORS' | 'NURSES'>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Admin PIN prompt state
  const [pendingAdminStaff, setPendingAdminStaff] = useState<HospitalStaff | null>(null);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  if (!isOpen) return null;

  const allStaff = StaffService.getAllStaff();

  // Extract unique departments from the actual staff list
  const dynamicDepts = Array.from(new Set(allStaff.map(s => s.department).filter(Boolean)));
  const departments = ['ALL', ...dynamicDepts];

  let filtered = allStaff;

  // Filter by category
  if (roleCategory === 'DOCTORS') {
    filtered = filtered.filter(s => s.is_doctor);
  } else if (roleCategory === 'NURSES') {
    filtered = filtered.filter(s => !s.is_doctor && !s.is_admin);
  }

  // Filter by department
  if (selectedDept !== 'ALL') {
    filtered = filtered.filter(s => s.department === selectedDept);
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(s => {
      const name = s.name.toLowerCase();
      const accred = (s.accreditation_no || s.prc_license_no || '').toLowerCase();
      const empId = s.employee_id.toLowerCase();
      const dept = s.department.toLowerCase();
      const role = s.role.toLowerCase();
      return name.includes(q) || accred.includes(q) || empId.includes(q) || dept.includes(q) || role.includes(q);
    });
  }

  const handleStaffClick = (staff: HospitalStaff) => {
    if (staff.is_admin) {
      setPendingAdminStaff(staff);
      setAdminPinInput('');
      setPinError('');
      return;
    }

    onSelectStaff(staff);
    onClose();
  };

  const handleVerifyAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (AdminAuthService.verifyPin(adminPinInput)) {
      if (pendingAdminStaff) {
        onSelectStaff(pendingAdminStaff);
      }
      setPendingAdminStaff(null);
      onClose();
    } else {
      setPinError('Sayop ang Admin PIN!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[850px]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Hospital Duty Staff & Station Switcher
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                1-Touch Instant Duty Switching • No Password Needed for Wards & Doctors
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="p-3 sm:p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div 
              className="h-10 w-10 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow shrink-0"
              style={{ backgroundColor: currentStaff.color_hex }}
            >
              {currentStaff.avatar_initials}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                Active Duty Session (Permanent Standby):
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 truncate block">
                {currentStaff.name} <span className="text-slate-600 font-normal">({currentStaff.role})</span> • {currentStaff.department}
              </span>
              <span className="text-[11px] font-mono text-emerald-900 font-bold">
                Accred No: {currentStaff.accreditation_no || currentStaff.prc_license_no || 'N/A'}
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center shrink-0 ml-2">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Logged In
          </span>
        </div>

        {/* Search Bar & Category Tabs Toolbar */}
        <div className="p-3 bg-white border-b border-slate-200 space-y-2 shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, accreditation no, or ward..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Buttons */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setRoleCategory('ALL')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition ${
                  roleCategory === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Staff ({allStaff.length})
              </button>
              <button
                onClick={() => setRoleCategory('DOCTORS')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg flex items-center justify-center space-x-1 transition ${
                  roleCategory === 'DOCTORS' ? 'bg-blue-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Doctors ({StaffService.getDoctors().length})</span>
              </button>
              <button
                onClick={() => setRoleCategory('NURSES')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg flex items-center justify-center space-x-1 transition ${
                  roleCategory === 'NURSES' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HeartPulse className="h-3.5 w-3.5" />
                <span>Nurses ({StaffService.getNurses().length})</span>
              </button>
            </div>
          </div>

          {/* Clean Department Filter Sub-bar (No raw scrollbars) */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 text-xs scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {departments.slice(0, 10).map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold text-[11px] transition shadow-xs ${
                  selectedDept === dept
                    ? 'bg-slate-900 text-white font-black'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {dept === 'ALL' ? 'All Sections / Wards' : dept}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Grid List with Clean Custom Scrollbar */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50">
          {filtered.length > 0 ? (
            filtered.map((staff) => {
              const isCurrent = staff.id === currentStaff.id;
              return (
                <button
                  key={staff.id}
                  onClick={() => handleStaffClick(staff)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                    <div
                      className="h-11 w-11 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0"
                      style={{ backgroundColor: staff.color_hex }}
                    >
                      {staff.avatar_initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">{staff.name}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                          staff.is_admin ? 'bg-slate-900 text-white' :
                          staff.is_doctor ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                          'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {staff.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-semibold mt-0.5 truncate">
                        {staff.department} • <strong className="text-blue-900 font-mono">Accred No: {staff.accreditation_no || staff.prc_license_no || 'N/A'}</strong> • ID: <span className="font-mono text-slate-500">{staff.employee_id}</span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isCurrent ? (
                      <span className="p-2 rounded-xl bg-emerald-600 text-white block shadow-sm">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-black hover:bg-blue-600 hover:text-white transition border border-slate-200 shadow-2xs">
                        {staff.is_admin ? 'Admin PIN 🔒' : 'Switch Duty →'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-16 text-center text-slate-400 font-semibold space-y-1">
              <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-600">Walay nakit-an nga staff base sa imong gipangita.</p>
              <p className="text-xs text-slate-400">Sulayi pag-clear ang search box o pilia ang "All Staff".</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-medium shrink-0 flex items-center justify-between px-6">
          <span>Showing <strong>{filtered.length}</strong> of <strong>{allStaff.length}</strong> personnel</span>
          <span className="text-[11px] text-slate-400">Wards & Doctors switch instantly with 1-click</span>
        </div>

      </div>

      {/* ADMIN PIN VERIFICATION MODAL */}
      {pendingAdminStaff && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 text-center">
            <div className="h-14 w-14 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Lock className="h-7 w-7" />
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900">Administrator Security Access</h4>
              <p className="text-xs text-slate-500 mt-0.5">Enter Admin PIN to switch to Administrator Mode</p>
            </div>

            <form onSubmit={handleVerifyAdminPin} className="space-y-3">
              <input
                type="password"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="Enter PIN (Default: 1234)"
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center font-mono font-bold text-sm tracking-widest focus:outline-none focus:border-blue-600 focus:bg-white"
              />

              {pinError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 py-1.5 rounded-lg border border-red-200">
                  {pinError}
                </p>
              )}

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingAdminStaff(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-1"
                >
                  <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Verify</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
