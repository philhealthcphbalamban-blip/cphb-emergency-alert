'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  Tv, 
  Volume2, 
  Smartphone, 
  History, 
  Home, 
  ShieldAlert,
  Users,
  Building,
  Wifi,
  ChevronDown,
  UserCheck,
  Lock,
  Ambulance,
  MapPin
} from 'lucide-react';
import { audioEngine } from '@/lib/audioEngine';
import { audioController } from '@/lib/audioController';
import { HospitalStaff } from '@/types/staff';
import { StaffService, CPHB_STAFF_MEMBERS } from '@/lib/staffService';
import { StaffSwitchModal } from '@/components/StaffSwitchModal';
import { HospitalInfo } from '@/types/hospital';
import { HospitalService } from '@/lib/hospitalService';
import { HospitalSwitchModal } from '@/components/HospitalSwitchModal';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [time, setTime] = useState<string>('');
  const [currentStaff, setCurrentStaff] = useState<HospitalStaff>(CPHB_STAFF_MEMBERS[0]);
  const [currentHospital, setCurrentHospital] = useState<HospitalInfo>(HospitalService.getActiveHospital());
  const [modalOpen, setModalOpen] = useState(false);
  const [hospitalModalOpen, setHospitalModalOpen] = useState(false);
  const [lanCopied, setLanCopied] = useState(false);

  useEffect(() => {
    StaffService.initCloudSync();
    setCurrentStaff(StaffService.getCurrentStaff());
    setCurrentHospital(HospitalService.getActiveHospital());

    const handleStaffChange = (e: any) => {
      if (e.detail) setCurrentStaff(e.detail);
    };
    const handleDirUpdate = () => {
      setCurrentStaff(StaffService.getCurrentStaff());
    };
    const handleHospitalChange = (e: any) => {
      if (e.detail) setCurrentHospital(e.detail);
    };

    window.addEventListener('cphb_staff_changed', handleStaffChange);
    window.addEventListener('cphb_staff_directory_updated', handleDirUpdate);
    window.addEventListener('cph_hospital_changed', handleHospitalChange);

    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => {
      window.removeEventListener('cphb_staff_changed', handleStaffChange);
      clearInterval(timer);
    };
  }, []);

  const handleSelectStaff = (staff: HospitalStaff) => {
    StaffService.setCurrentStaff(staff);
    setCurrentStaff(staff);
  };

  const copyLanUrl = () => {
    navigator.clipboard.writeText('http://192.168.12.240:3000');
    setLanCopied(true);
    setTimeout(() => setLanCopied(false), 2000);
  };

  const isRescue = currentHospital.isRescue || currentHospital.id === 'balamban_rescue';

  const navItems = isRescue ? [
    { name: 'EOC Hub', href: '/', icon: Home },
    { name: 'Dispatch 911', href: '/trigger', icon: Ambulance, highlight: true },
    { name: 'Rescue TV', href: '/rescue/monitor', icon: Tv },
    { name: 'PTV Fleet', href: '/responder', icon: Smartphone },
    { name: '28 Barangays', href: '/rescue', icon: MapPin },
    { name: 'Personnel', href: '/admin/users', icon: Users },
  ] : [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Trigger Code', href: '/trigger', icon: ShieldAlert, highlight: true },
    { name: 'TV Monitor', href: '/monitor', icon: Tv },
    { name: 'Responder', href: '/responder', icon: Smartphone },
    { name: 'Locations', href: '/admin/locations', icon: MapPin },
    { name: 'Personnel', href: '/admin/users', icon: Users },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="w-full max-w-[98%] mx-auto flex h-16 items-center justify-between px-2 sm:px-4 lg:px-6">
          
          {/* Brand & Hospital Info */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group shrink-0">
            <div 
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm text-white transition shrink-0"
              style={{ backgroundColor: currentHospital.colorHex }}
            >
              {isRescue ? <Ambulance className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
            </div>
            <div className="shrink-0">
              <div className="flex items-center space-x-1.5 whitespace-nowrap">
                <span className="font-extrabold text-xs sm:text-sm lg:text-base tracking-tight text-slate-900">
                  {isRescue ? 'BALAMBAN RESCUE 911' : `${currentHospital.code} CODE ALERT`}
                </span>
                <span className={`rounded px-1.5 py-0.2 text-[9px] font-black uppercase border ${
                  isRescue ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-red-100 text-red-700 border-red-200'
                }`}>
                  {isRescue ? 'MDRRMO' : 'RAPID'}
                </span>
                <span className="hidden 2xl:inline-block rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-800 border border-blue-200">
                  {isRescue ? '28 BRGYS' : 'iHOMIS+'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block whitespace-nowrap">
                {currentHospital.name}
              </p>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? item.highlight 
                        ? 'bg-red-600 text-white shadow-sm'
                        : isRescue ? 'bg-red-700 text-white shadow-sm' : 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Status Indicators, LAN Share & Active Staff Switcher */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Hospital Switcher Button */}
            <button
              onClick={() => {
                if (currentStaff.is_admin) {
                  setHospitalModalOpen(true);
                } else {
                  alert(`🔒 Facility Locked: You are logged in as ${currentStaff.name} assigned to ${currentHospital.name}. Only Hospital Administrators can change facility dispatch.`);
                }
              }}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm shrink-0 ${
                currentStaff.is_admin
                  ? 'border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-900 cursor-pointer'
                  : 'border-slate-200 bg-slate-100/90 text-slate-700 cursor-default'
              }`}
              title={currentStaff.is_admin ? "Click to switch active Cebu Provincial Hospital" : `Assigned Facility: ${currentHospital.name} (Locked)`}
            >
              <div 
                className="h-5 w-5 rounded-lg flex items-center justify-center font-black text-[9px] text-white shadow-xs shrink-0"
                style={{ backgroundColor: currentHospital.colorHex }}
              >
                {currentHospital.code.slice(0, 3)}
              </div>
              <span className="font-extrabold hidden md:inline-block whitespace-nowrap">
                {currentHospital.shortName}
              </span>
              {currentStaff.is_admin ? (
                <ChevronDown className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              ) : (
                <Lock className="h-3 w-3 text-slate-400 shrink-0" />
              )}
            </button>

            {/* Share LAN IP Button */}
            <button
              onClick={copyLanUrl}
              className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-blue-800 transition shadow-sm shrink-0"
              title="Click to copy LAN URL for other devices on the hospital Wi-Fi (http://192.168.12.240:3000)"
            >
              <Wifi className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="hidden 2xl:inline">{lanCopied ? 'Copied IP!' : '192.168.12.240:3000'}</span>
              <span className="2xl:hidden font-mono text-[11px]">{lanCopied ? 'Copied!' : 'LAN IP'}</span>
            </button>

            {/* Active Duty Staff Switcher Button */}
            <button
              onClick={() => setModalOpen(true)}
              className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm shrink-0 ${
                currentStaff.is_admin 
                  ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
              }`}
              title="Click to switch active duty nurse, doctor, or rescue responder"
            >
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-sm"
                style={{ backgroundColor: currentStaff.color_hex }}
              >
                {currentStaff.avatar_initials}
              </div>
              <div className="text-left hidden md:block max-w-[90px] lg:max-w-[120px] xl:max-w-[150px] truncate">
                <span className={`block text-[11px] font-extrabold leading-tight truncate ${currentStaff.is_admin ? 'text-white' : 'text-slate-900'}`}>
                  {currentStaff.name}
                </span>
                <span className={`block text-[9px] leading-none truncate ${currentStaff.is_admin ? 'text-emerald-400 font-bold' : 'text-slate-500 font-medium'}`}>
                  {currentStaff.is_admin ? '● Hospital Admin' : `${currentStaff.role} • ${currentStaff.department}`}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Quick Log Out Admin Button */}
            {currentStaff.is_admin && (
              <button
                onClick={() => {
                  sessionStorage.removeItem('cphb_admin_unlocked');
                  const otherStaff = StaffService.getAllStaff().find(s => !s.is_admin) || StaffService.getAllStaff()[0];
                  StaffService.setCurrentStaff(otherStaff);
                  setModalOpen(false);
                }}
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-black text-red-700 transition shadow-sm"
                title="Log Out Admin"
              >
                <span>Log Out Admin 🚪</span>
              </button>
            )}

            {/* Audio Silence / Kill Button */}
            <button
              onClick={() => {
                if (audioController.getState() !== 'IDLE') {
                  audioController.stopAllImmediate();
                } else {
                  audioEngine.playChime();
                }
              }}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
              title="Silence All Audio / Play Chime"
            >
              <Volume2 className="h-3.5 w-3.5 text-amber-500" />
            </button>

            {/* Live Clock */}
            <div className="hidden xl:flex items-center font-mono text-xs font-bold text-slate-700 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
              {time || '00:00:00 AM'}
            </div>
          </div>

        </div>

        {/* Mobile nav bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-200 bg-white py-1.5 px-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold shrink-0 ${
                  isActive ? 'text-blue-600 font-extrabold' : 'text-slate-500'
                }`}
              >
                <Icon className={`h-4 w-4 mb-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Staff Switcher Modal */}
      <StaffSwitchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentStaff={currentStaff}
        onSelectStaff={handleSelectStaff}
      />

      {/* Hospital Switcher Modal */}
      <HospitalSwitchModal
        isOpen={hospitalModalOpen}
        onClose={() => setHospitalModalOpen(false)}
        currentHospital={currentHospital}
        onSelectHospital={(hosp) => {
          HospitalService.setActiveHospital(hosp);
          setCurrentHospital(hosp);
        }}
      />
    </>
  );
};
