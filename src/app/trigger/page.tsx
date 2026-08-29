'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Building, 
  HeartPulse, 
  Baby, 
  ExternalLink,
  Users,
  Check,
  UserCheck
} from 'lucide-react';
import { EMERGENCY_CODES } from '@/lib/constants';
import { CodeId, HospitalLocation } from '@/types/emergency';
import { IHOMISPatient } from '@/types/ihomis';
import { IHOMISService } from '@/lib/ihomisService';
import { EmergencyService } from '@/lib/supabase';
import { StaffService } from '@/lib/staffService';
import { HospitalService } from '@/lib/hospitalService';
import { audioEngine } from '@/lib/audioEngine';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function TriggerPadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const hrnParam = searchParams.get('hrn');
  const roomParam = searchParams.get('room');
  const wardParam = searchParams.get('ward');

  // Active Hospital
  const [activeHospital, setActiveHospital] = useState(HospitalService.getActiveHospital());
  const [hospitalLocations, setHospitalLocations] = useState<HospitalLocation[]>(HospitalService.getLocationsForHospital());

  // Active Staff Member
  const currentStaff = StaffService.getCurrentStaff();
  const [staffName, setStaffName] = useState<string>(currentStaff.name);
  const [staffRole, setStaffRole] = useState<string>(`${currentStaff.role} (${currentStaff.department.split(' ')[0]})`);

  // Selection States
  const [selectedCode, setSelectedCode] = useState<CodeId>('code_blue');
  const [selectedLocationIndex, setSelectedLocationIndex] = useState<number>(0);
  const [customRoom, setCustomRoom] = useState<string>('');
  
  // Slide to confirm interaction state
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [triggeredSuccess, setTriggeredSuccess] = useState<boolean>(false);

  // iHOMIS Matched Patient State
  const [matchedPatient, setMatchedPatient] = useState<IHOMISPatient | null>(null);

  // Auto-detect on hospital or staff change
  useEffect(() => {
    const handleHospChange = (e: any) => {
      if (e.detail) {
        setActiveHospital(e.detail);
        const locs = HospitalService.getLocationsForHospital(e.detail.id);
        setHospitalLocations(locs);
        setSelectedLocationIndex(0);
        setCustomRoom('');
      }
    };
    const handleLocsUpdate = () => {
      setHospitalLocations(HospitalService.getLocationsForHospital());
    };

    window.addEventListener('cph_hospital_changed', handleHospChange);
    window.addEventListener('cph_locations_updated', handleLocsUpdate);

    return () => {
      window.removeEventListener('cph_hospital_changed', handleHospChange);
      window.removeEventListener('cph_locations_updated', handleLocsUpdate);
    };
  }, []);

  useEffect(() => {
    const handleStaffChange = (e: any) => {
      if (e.detail) {
        setStaffName(e.detail.name);
        setStaffRole(`${e.detail.role} (${e.detail.department.split(' ')[0]})`);

        if (!hrnParam) {
          const dept = e.detail.department.toLowerCase();
          const foundIdx = hospitalLocations.findIndex(loc => {
            const locWard = loc.unit_ward.toLowerCase();
            return dept && locWard && (
              (dept.includes('ward 4') && locWard.includes('ward 4')) ||
              (dept.includes('ward 5') && locWard.includes('ward 5')) ||
              (dept.includes('ward 6') && locWard.includes('ward 6')) ||
              (dept.includes('icu') && locWard.includes('icu')) ||
              (dept.includes('er') && locWard.includes('er'))
            );
          });
          if (foundIdx !== -1) {
            setSelectedLocationIndex(foundIdx);
          }
        }
      }
    };

    window.addEventListener('cphb_staff_changed', handleStaffChange);
    return () => window.removeEventListener('cphb_staff_changed', handleStaffChange);
  }, [hrnParam, hospitalLocations]);

  // Initial Load & Direct HRN Patient Auto-Detection
  useEffect(() => {
    EmergencyService.init();

    if (hrnParam) {
      const p = IHOMISService.findPatientByHRN(hrnParam);
      if (p) {
        setMatchedPatient(p);
        setCustomRoom(p.room_bed);

        // Find exact matching location in hospitalLocations
        const idx = hospitalLocations.findIndex(loc => {
          const locRoom = loc.room_bed.toLowerCase().trim();
          const pRoom = p.room_bed.toLowerCase().trim();
          const locWard = loc.unit_ward.toLowerCase().trim();
          const pWard = p.ward_name.toLowerCase().trim();

          return (
            locRoom === pRoom ||
            (locWard.includes('emergency') && pWard.includes('emergency')) ||
            (locWard.includes('er') && pWard.includes('emergency')) ||
            (locWard.includes('ward 4') && pWard.includes('ward 4')) ||
            (locWard.includes('ward 5') && pWard.includes('ward 5')) ||
            (locWard.includes('ward 6') && pWard.includes('ward 6')) ||
            (locWard.includes('icu') && pWard.includes('icu'))
          );
        });

        if (idx !== -1) {
          setSelectedLocationIndex(idx);
        }
      }
    } else {
      // Default to initial location match based on staff department
      const dept = currentStaff.department.toLowerCase();
      const foundIdx = hospitalLocations.findIndex(loc => {
        const locWard = loc.unit_ward.toLowerCase();
        return (
          (dept.includes('ward 4') && locWard.includes('ward 4')) ||
          (dept.includes('ward 5') && locWard.includes('ward 5')) ||
          (dept.includes('ward 6') && locWard.includes('ward 6')) ||
          (dept.includes('icu') && locWard.includes('icu')) ||
          (dept.includes('er') && locWard.includes('er'))
        );
      });

      const targetIdx = foundIdx !== -1 ? foundIdx : 0;
      setSelectedLocationIndex(targetIdx);
      const targetLookup = hospitalLocations[targetIdx]?.room_bed || '';
      const p = IHOMISService.findPatientByLocation(targetLookup);
      setMatchedPatient(p);
    }
  }, [hrnParam, hospitalLocations]);

  // Manual Location selection (only if NO hrnParam was passed)
  const handleLocationChange = (newIdx: number) => {
    setSelectedLocationIndex(newIdx);
    setCustomRoom('');
    if (!hrnParam && hospitalLocations[newIdx]) {
      const loc = hospitalLocations[newIdx];
      const p = IHOMISService.findPatientByLocation(loc.room_bed);
      setMatchedPatient(p);
    }
  };

  const handleCustomRoomChange = (val: string) => {
    setCustomRoom(val);
    if (!hrnParam) {
      const p = IHOMISService.findPatientByLocation(val);
      setMatchedPatient(p);
    }
  };

  const activeCodeObj = EMERGENCY_CODES[selectedCode] || EMERGENCY_CODES.code_blue;
  const activeLocation = hospitalLocations[selectedLocationIndex] || hospitalLocations[0] || {
    id: 'default',
    building: 'Main Complex',
    floor: 'Ground Floor',
    unit_ward: 'Emergency Department',
    room_bed: 'Main Room',
  };
  
  const finalLocationString = matchedPatient
    ? `${matchedPatient.ward_name} - ${customRoom || matchedPatient.room_bed}`
    : customRoom 
      ? `${activeLocation.floor} • ${activeLocation.unit_ward} - ${customRoom}`
      : `${activeLocation.floor} • ${activeLocation.unit_ward} - ${activeLocation.room_bed}`;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    if (val >= 98 && !isSubmitting) {
      triggerEmergency();
    }
  };

  const handleSliderRelease = () => {
    if (sliderValue < 98) {
      setSliderValue(0);
    }
  };

  const triggerEmergency = async () => {
    setIsSubmitting(true);
    audioEngine.playChime();

    try {
      await EmergencyService.triggerAlert({
        hospital_id: activeHospital.id,
        code_id: selectedCode,
        location_text: finalLocationString,
        triggered_by_name: staffName,
        triggered_by_role: staffRole,
        patient_details: matchedPatient || undefined,
      });

      setTriggeredSuccess(true);
      setTimeout(() => {
        router.push('/monitor');
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setSliderValue(0);
    }
  };

  return (
    <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 py-6 space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
              Emergency Code Trigger Station
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Nurse Station Rapid Dispatch • Auto-Detected Ward & Bed from iHOMIS Plus
          </p>
        </div>

        {/* Staff Identity Tag */}
        <div className="flex items-center space-x-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-sm"
            style={{ backgroundColor: currentStaff.color_hex }}
          >
            {currentStaff.avatar_initials}
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Duty Dispatcher:</span>
            <span className="font-extrabold text-slate-900 text-xs">{staffName}</span>
          </div>
        </div>
      </div>

      {triggeredSuccess ? (
        <div className="my-12 text-center py-12 px-6 rounded-3xl bg-white border-2 border-emerald-500 shadow-2xl animate-pulse">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {activeCodeObj.code_name} BROADCAST DISPATCHED!
          </h2>
          <p className="text-sm text-emerald-700 font-bold mt-2">
            Dispatched to: {finalLocationString}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Redirecting to Central Monitor View in 1 second...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Code Selection Grid (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 mr-2" />
                Step 1: Select Emergency Code Protocol
              </h2>
              <span className="text-[11px] text-slate-400 font-semibold">Tap to select</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(EMERGENCY_CODES).map((code) => {
                const isSelected = selectedCode === code.id;
                const isCritical = code.priority_level === 1;

                return (
                  <button
                    key={code.id}
                    type="button"
                    onClick={() => {
                      setSelectedCode(code.id);
                      audioEngine.playChime();
                    }}
                    className={`relative p-4 rounded-2xl text-left border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 shadow-md ring-4 ring-blue-500/20 scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm"
                          style={{ backgroundColor: code.color_hex }}
                        >
                          {code.code_name.replace('Code ', '')[0]}
                        </div>
                        <span className="font-black text-sm text-slate-900 tracking-wide">
                          {code.code_name}
                        </span>
                      </div>

                      {isCritical && (
                        <span className="rounded bg-red-100 border border-red-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-red-700">
                          PRIORITY 1
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs font-bold text-slate-800 line-clamp-1">
                      {code.title}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                      {code.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Ward Emergency Location Summary */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2 shadow-sm">
                <span className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center">
                  <Building className="h-4 w-4 text-blue-600 mr-1.5" />
                  Hospital Location Dispatch Protocol
                </span>
                <p className="text-xs text-blue-950 font-medium leading-relaxed">
                  Emergency broadcasts are strictly location-based pursuant to the <strong>Data Privacy Act of 2012 (RA 10173)</strong>. Responders will be dispatched directly to the selected Ward, Room, and Bed.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Location & Trigger Activation (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Step 2: Location Selector */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center">
                <MapPin className="h-4 w-4 text-red-600 mr-1.5" />
                Step 2: Emergency Ward & Bed Location
              </h2>

              {/* 1-Tap Quick Ward Filter Buttons */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  1-Tap Quick Ward Select:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'All', key: 'ALL' },
                    { label: '🚑 ER', key: 'Emergency' },
                    { label: '🫀 ICU', key: 'ICU' },
                    { label: '👶 NICU', key: 'NICU' },
                    { label: '🤰 OB New (Ward 5)', key: 'OB NEW' },
                    { label: '👩‍⚕️ OB Priv', key: 'OBPR' },
                    { label: '🧸 Pedia Ward', key: 'PEDIA' },
                    { label: '🩹 Ortho & Surg', key: 'ORTHO' },
                    { label: '😷 PUI Ward (R201-R209)', key: 'PUI' },
                    { label: '🚪 Private Rooms', key: 'PRIVATE' },
                    { label: '🩺 Wards 4-12', key: 'WARD' },
                  ].map((w) => (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => {
                        if (w.key === 'ALL') {
                          setSelectedLocationIndex(0);
                          setCustomRoom('');
                        } else {
                          const foundIdx = hospitalLocations.findIndex(l => 
                            l.unit_ward.toLowerCase().includes(w.key.toLowerCase())
                          );
                          if (foundIdx !== -1) {
                            setSelectedLocationIndex(foundIdx);
                            setCustomRoom('');
                            audioEngine.playChime();
                          }
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition border border-slate-200"
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Select Ward & Room ({hospitalLocations.length} Monitored {activeHospital.shortName} Locations)
                </label>
                <select
                  value={selectedLocationIndex}
                  onChange={(e) => handleLocationChange(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-3 text-xs font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none shadow-inner"
                >
                  <optgroup label={`📍 Ground Floor (${activeHospital.shortName})`}>
                    {hospitalLocations.filter(l => l.floor === 'Ground Floor').map((loc) => {
                      const realIdx = hospitalLocations.findIndex(x => x.id === loc.id);
                      return (
                        <option key={loc.id} value={realIdx}>
                          {loc.unit_ward} — {loc.room_bed}
                        </option>
                      );
                    })}
                  </optgroup>

                  <optgroup label={`📍 Second Floor (${activeHospital.shortName})`}>
                    {hospitalLocations.filter(l => l.floor === 'Second Floor').map((loc) => {
                      const realIdx = hospitalLocations.findIndex(x => x.id === loc.id);
                      return (
                        <option key={loc.id} value={realIdx}>
                          {loc.unit_ward} — {loc.room_bed}
                        </option>
                      );
                    })}
                  </optgroup>

                  <optgroup label={`📍 Third Floor (${activeHospital.shortName})`}>
                    {hospitalLocations.filter(l => l.floor === 'Third Floor').map((loc) => {
                      const realIdx = hospitalLocations.findIndex(x => x.id === loc.id);
                      return (
                        <option key={loc.id} value={realIdx}>
                          {loc.unit_ward} — {loc.room_bed}
                        </option>
                      );
                    })}
                  </optgroup>

                  {/* Fallback for other floors or uncategorized */}
                  {hospitalLocations.filter(l => !['Ground Floor', 'Second Floor', 'Third Floor'].includes(l.floor)).length > 0 && (
                    <optgroup label={`📍 Other Hospital Areas (${activeHospital.shortName})`}>
                      {hospitalLocations.filter(l => !['Ground Floor', 'Second Floor', 'Third Floor'].includes(l.floor)).map((loc) => {
                        const realIdx = hospitalLocations.findIndex(x => x.id === loc.id);
                        return (
                          <option key={loc.id} value={realIdx}>
                            {loc.floor} • {loc.unit_ward} — {loc.room_bed}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Specific Bed / Room
                </label>
                <input
                  type="text"
                  value={customRoom}
                  onChange={(e) => handleCustomRoomChange(e.target.value)}
                  placeholder={`e.g. ${activeLocation.room_bed}`}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none font-bold"
                />
              </div>
            </div>

            {/* Step 3: Confirmation Summary Box */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider block">
                Broadcast Target Summary:
              </span>
              <div className="mt-1 flex items-center space-x-2">
                <div 
                  className="h-3.5 w-3.5 rounded-full animate-ping"
                  style={{ backgroundColor: activeCodeObj.color_hex }}
                />
                <span className="text-base font-black text-slate-900">
                  {activeCodeObj.code_name}
                </span>
              </div>
              <p className="text-xs font-black text-blue-900 mt-1">
                📍 {finalLocationString}
              </p>
            </div>

            {/* Step 4: Slide to Trigger Slider */}
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-red-700 flex items-center">
                  <ShieldAlert className="h-4 w-4 mr-1.5" />
                  Swipe / Slide to Confirm Alert
                </span>
                <span className="text-xs text-red-800 font-mono font-bold">
                  {sliderValue}%
                </span>
              </div>

              {/* Slider Input */}
              <div className="relative flex items-center justify-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderValue}
                  onChange={handleSliderChange}
                  onMouseUp={handleSliderRelease}
                  onTouchEnd={handleSliderRelease}
                  disabled={isSubmitting}
                  className="w-full h-14 bg-white rounded-2xl appearance-none cursor-pointer border border-red-300 accent-red-600 focus:outline-none relative z-10 shadow-inner"
                />
                
                {/* Visual Slide Guidance Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-black tracking-widest text-red-700 uppercase animate-pulse">
                  <span>SLIDE TO BROADCAST &rarr;&rarr;&rarr;</span>
                </div>
              </div>

              {/* Instant 1-Click Fallback Trigger Button */}
              <button
                type="button"
                onClick={triggerEmergency}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-600/30 transition active:scale-95 flex items-center justify-center space-x-2"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Instant 1-Click Trigger ({activeCodeObj.code_name})</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default function TriggerPadPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Loading Trigger Station...</div>}>
      <TriggerPadContent />
    </Suspense>
  );
}
