'use client';

import React, { useState } from 'react';
import { 
  Building, 
  Search, 
  ShieldAlert, 
  Bed, 
  MapPin, 
  CheckCircle2, 
  Activity, 
  HeartPulse, 
  Baby, 
  ArrowRight,
  Lock,
  Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { INITIAL_LOCATIONS } from '@/lib/constants';

interface WardInfo {
  name: string;
  floor: string;
  building: string;
  bedCapacity: number;
  rooms: string[];
  type: string;
  color: string;
}

const CPHB_WARDS: WardInfo[] = [
  {
    name: 'Emergency Department (ER)',
    floor: 'Ground Floor',
    building: 'Main Complex',
    bedCapacity: 45,
    rooms: ['ER Trauma Bay 1', 'ER Resuscitation Bay 2', 'ER Surgical Bay 3', 'ER Pedia Bay', 'Triage Area'],
    type: 'Acute & Critical Care',
    color: 'border-red-500 bg-red-50/40 text-red-700',
  },
  {
    name: 'ICU NEW ROOM',
    floor: '2nd Floor',
    building: 'Main Complex',
    bedCapacity: 12,
    rooms: ['ICU 01', 'ICU 02', 'TEMPBED3-ICU3', 'TEMPBED4-ICU4', 'TEMPOBED-ICU'],
    type: 'Intensive Care',
    color: 'border-blue-500 bg-blue-50/40 text-blue-700',
  },
  {
    name: 'NICU / Nursery',
    floor: '3rd Floor',
    building: 'Main Complex',
    bedCapacity: 16,
    rooms: ['Incubator Station 1', 'Incubator Station 2', 'Crib Station A', 'Crib Station B'],
    type: 'Neonatal Intensive Care',
    color: 'border-sky-500 bg-sky-50/40 text-sky-700',
  },
  {
    name: 'WARD 5 (OB-GYN)',
    floor: '3rd Floor',
    building: 'Main Complex',
    bedCapacity: 48,
    rooms: ['OBNEWROOM', 'OBPRDOC', 'tempobed-ward05A', 'tempobed-ward05B', 'tempobed-ward05C'],
    type: 'Obstetrics & Gynecology',
    color: 'border-pink-500 bg-pink-50/40 text-pink-700',
  },
  {
    name: 'MEDICAL WARD (WARD 4)',
    floor: '2nd Floor',
    building: 'Main Complex',
    bedCapacity: 52,
    rooms: ['TEMB1', 'TEMB4', 'tempobed-ward04A', 'tempobed-ward04B', 'WARD4-04'],
    type: 'Internal Medicine',
    color: 'border-emerald-500 bg-emerald-50/40 text-emerald-700',
  },
  {
    name: 'WARD 6 (Pediatric Ward)',
    floor: '3rd Floor',
    building: 'Main Complex',
    bedCapacity: 38,
    rooms: ['Crib 01', 'Crib 02', 'Nursery Bed 03', 'Pedia Station A', 'Pedia Station B'],
    type: 'Pediatrics',
    color: 'border-indigo-500 bg-indigo-50/40 text-indigo-700',
  },
  {
    name: 'WARD 7 (Surgical Ward)',
    floor: '2nd Floor',
    building: 'Main Complex',
    bedCapacity: 44,
    rooms: ['WARD7 - Bed 1', 'WARD7 - Bed 2', 'Post-Op Room 701', 'Post-Op Room 702'],
    type: 'Surgical & Orthopedic',
    color: 'border-amber-500 bg-amber-50/40 text-amber-700',
  },
  {
    name: 'WARD 10 (Isolation Ward)',
    floor: 'Ground Floor',
    building: 'Annex Wing',
    bedCapacity: 20,
    rooms: ['Isolation Room 101', 'Isolation Room 102', 'Negative Pressure Room 1'],
    type: 'Infectious & Respiratory Isolation',
    color: 'border-purple-500 bg-purple-50/40 text-purple-700',
  },
  {
    name: 'Hemodialysis Unit',
    floor: 'Ground Floor',
    building: 'Annex Wing',
    bedCapacity: 24,
    rooms: ['Station 01', 'Station 02', 'Station 03', 'Station 04', 'Station 05', 'Station 06'],
    type: 'Renal Replacement Therapy',
    color: 'border-cyan-500 bg-cyan-50/40 text-cyan-700',
  },
  {
    name: 'Operating & Delivery Suites (OR/DR)',
    floor: '2nd Floor',
    building: 'Main Complex',
    bedCapacity: 10,
    rooms: ['Main OR Suite 1', 'Minor OR Suite 2', 'Delivery Room 1', 'Recovery Room PACU'],
    type: 'Surgical & Obstetrics Theater',
    color: 'border-rose-500 bg-rose-50/40 text-rose-700',
  },
  {
    name: 'Outpatient Department (OPD)',
    floor: 'Ground Floor',
    building: 'OPD Building',
    bedCapacity: 69,
    rooms: ['Cardio Clinic', 'Internal Med Clinic', 'Pediatric OPD', 'Dental Clinic', 'Triage Consultation'],
    type: 'Ambulatory Consultation',
    color: 'border-teal-500 bg-teal-50/40 text-teal-700',
  },
];

export default function HospitalWardsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWards = CPHB_WARDS.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.floor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.rooms.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalBeds = CPHB_WARDS.reduce((acc, curr) => acc + curr.bedCapacity, 0);

  const handleTriggerForWard = (ward: WardInfo) => {
    router.push(`/trigger?ward=${encodeURIComponent(ward.name)}&room=${encodeURIComponent(ward.rooms[0] || 'Main Station')}`);
  };

  return (
    <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                Hospital Wards & Locations Directory
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Lock className="h-3 w-3 mr-1" /> RA 10173 Compliant
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cebu Provincial Hospital - Balamban • 11 Monitored Clinical Wards & Emergency Dispatch Targets
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push('/trigger')}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Trigger Emergency Code 🚨</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <Building className="h-4 w-4 text-blue-600" />
            <span>Hospital Wards</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">{CPHB_WARDS.length} Wards</div>
          <span className="text-[10px] text-blue-700 font-bold">100% 24/7 Coverage</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <Bed className="h-4 w-4 text-emerald-600" />
            <span>Monitored Beds</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">{totalBeds} Beds</div>
          <span className="text-[10px] text-emerald-700 font-bold">53 Rooms & Clinical Bays</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Building Floors</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">3 Floors</div>
          <span className="text-[10px] text-amber-700 font-bold">Ground, 2nd & 3rd Floors</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
            <span>Data Privacy</span>
          </div>
          <div className="text-3xl font-black text-purple-700 mt-1">100% Safe</div>
          <span className="text-[10px] text-purple-700 font-bold">Zero Patient Names Broadcasted</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Ward Name, Floor, Room, or Clinical Specialization..."
          className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Wards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWards.map((ward) => (
          <div 
            key={ward.name}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${ward.color}`}>
                  {ward.type}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {ward.bedCapacity} Beds
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900 mt-2.5">
                {ward.name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center mt-1">
                <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400 shrink-0" />
                {ward.floor} • {ward.building}
              </p>

              {/* Rooms Badges */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                  Monitored Rooms & Stations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ward.rooms.map(room => (
                    <span 
                      key={room}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200"
                    >
                      {room}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleTriggerForWard(ward)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-red-600 text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-1.5 shadow-sm group"
            >
              <span>Dispatch Alert for this Ward</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
