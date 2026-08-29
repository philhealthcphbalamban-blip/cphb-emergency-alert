'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Tv, 
  Smartphone, 
  History, 
  Activity, 
  HeartPulse, 
  Flame, 
  Baby, 
  CheckCircle2, 
  Users, 
  Clock, 
  ArrowRight, 
  Zap, 
  Building, 
  MapPin, 
  Bed,
  Monitor
} from 'lucide-react';
import { EmergencyAlert } from '@/types/emergency';
import { EmergencyService } from '@/lib/supabase';
import { EMERGENCY_CODES } from '@/lib/constants';
import { IHOMISService } from '@/lib/ihomisService';
import { audioEngine } from '@/lib/audioEngine';
import { IHOMISPatientCard } from '@/components/IHOMISPatientCard';

export default function CommandHubPage() {
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [testTriggering, setTestTriggering] = useState(false);
  const [metrics, setMetrics] = useState(IHOMISService.getMetrics());

  useEffect(() => {
    EmergencyService.init();
    IHOMISService.initCloudSync();

    EmergencyService.getActiveAlert().then((alert) => {
      setActiveAlert(alert);
      setLoading(false);
    });

    IHOMISService.fetchPatientsFromCloud().then(() => {
      setMetrics(IHOMISService.getMetrics());
    });

    const unsubscribe = EmergencyService.subscribe((alert, eventType) => {
      if (eventType === 'RESOLVED') {
        setActiveAlert(null);
      } else if (alert && (alert.status === 'ACTIVE' || alert.status === 'RESPONDING')) {
        setActiveAlert(alert);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleQuickSimulation = async (codeId: 'code_blue' | 'code_baby_blue') => {
    setTestTriggering(true);
    audioEngine.playChime();
    
    const locations = [
      'ICU NEW ROOM - ICU01',
      'ICU NEW ROOM (NICU) - TEMPBED4-ICU4',
    ];
    const loc = codeId === 'code_baby_blue' ? locations[1] : locations[0];

    await EmergencyService.triggerAlert({
      code_id: codeId,
      location_text: loc,
      triggered_by_name: 'Nurse Station Staff',
      triggered_by_role: 'Triage Nurse',
    });

    setTestTriggering(false);
  };

  const handleResolveActive = async () => {
    if (!activeAlert) return;
    audioEngine.stopSiren();
    audioEngine.stopSpeech();
    await EmergencyService.resolveAlert({
      alert_id: activeAlert.id,
      resolved_by_name: 'Dr. Santos (Resuscitation Team Leader)',
      resolution_notes: 'Patient stabilized and transferred to CCU/ICU.',
      status: 'RESOLVED',
    });
  };

  return (
    <div className="w-full max-w-[98%] mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Hospital Command Dashboard
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-black text-blue-700 border border-blue-200">
              CPHB Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cebu Provincial Hospital - Balamban • Rapid Code Dispatch & iHOMIS Plus Realtime Integration
          </p>
        </div>

        {/* Quick Test Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-bold mr-1 flex items-center">
            <Zap className="h-3.5 w-3.5 text-amber-500 mr-1" />
            Quick Test:
          </span>
          <button
            onClick={() => handleQuickSimulation('code_blue')}
            disabled={testTriggering}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <HeartPulse className="h-3.5 w-3.5" />
            <span>Simulate Code Blue (ICU)</span>
          </button>
          <button
            onClick={() => handleQuickSimulation('code_baby_blue')}
            disabled={testTriggering}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Baby className="h-3.5 w-3.5" />
            <span>Simulate Baby Blue (NICU)</span>
          </button>
        </div>
      </div>

      {/* Hospital Realtime Census Overview Metrics Bar (Exact Match with Live iHOMIS Plus System) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Inpatient Admissions */}
        <Link href="/ihomis" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <Bed className="h-4 w-4 text-emerald-600" />
            <span>Inpatient Admissions</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">{metrics.activeAdmissions}</div>
          <span className="text-[10px] text-emerald-700 font-bold">172 Admitted Inpatients • 11 Wards</span>
        </Link>

        {/* Card 2: ER Consultations */}
        <Link href="/ihomis" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-red-500 hover:shadow-md transition">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <span>ER Consultations</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">{metrics.erEncounters}</div>
          <span className="text-[10px] text-red-700 font-bold">294 Live Encounters • Emergency</span>
        </Link>

        {/* Card 3: Long Stay Admissions */}
        <Link href="/ihomis" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md transition">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <Clock className="h-4 w-4 text-amber-600" />
            <span>Long Stay Admissions</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">{metrics.longStayCount}</div>
          <span className="text-[10px] text-slate-500 font-semibold">55 Patients &ge; 7 Days</span>
        </Link>

        {/* Card 4: Bed Capacity */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <Building className="h-4 w-4 text-blue-600" />
            <span>Hospital Capacity</span>
          </div>
          <div className="text-3xl font-black text-blue-700 mt-1">372 Beds</div>
          <span className="text-[10px] text-blue-700 font-bold">53 Rooms • 11 Wards Active</span>
        </div>
      </div>

      {/* Emergency Status Banner */}
      <div>
        {activeAlert ? (
          <div className={`relative overflow-hidden rounded-3xl border-2 p-6 shadow-md transition-all ${
            activeAlert.code_id === 'code_blue' || activeAlert.code_id === 'code_baby_blue'
              ? 'bg-blue-900 text-white border-blue-400'
              : 'bg-red-900 text-white border-red-400'
          }`}>
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow">
                      <span className="h-2 w-2 rounded-full bg-white animate-ping mr-1" />
                      EMERGENCY ACTIVE
                    </span>
                    <span className="text-xs text-slate-200 font-medium">
                      Started: {new Date(activeAlert.triggered_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                    {activeAlert.code_details?.code_name} — {activeAlert.code_details?.title}
                  </h2>

                  <p className="text-base font-black text-amber-300 mt-1 flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-red-400 shrink-0" />
                    {activeAlert.location_text}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/monitor"
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5"
                  >
                    <Monitor className="h-4 w-4" />
                    <span>Open Emergency Kiosk</span>
                  </Link>
                  <button
                    onClick={handleResolveActive}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Clear Emergency
                  </button>
                </div>
              </div>

              {activeAlert.patient_details && (
                <div className="pt-3 border-t border-white/20">
                  <IHOMISPatientCard patient={activeAlert.patient_details} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-slate-900">Hospital Operations Normal — All Clear</h3>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
                    STANDBY
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  No active emergency codes. Realtime broadcasting channels and iHOMIS census are connected.
                </p>
              </div>
            </div>

            <Link
              href="/trigger"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition shrink-0"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Trigger Code Alert</span>
            </Link>
          </div>
        )}
      </div>

      {/* 4 Clean Station Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Hospital Code Alert Stations
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Station 1: Trigger */}
          <Link 
            href="/trigger"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-red-500 hover:shadow-md transition group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-red-500 group-hover:translate-x-1 transition" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 mt-3 group-hover:text-red-600 transition">
              1. Trigger Station
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Nurse interface with 1-touch & slide-to-activate emergency dispatch and auto-matched iHOMIS beds.
            </p>
          </Link>

          {/* Station 2: Monitor */}
          <Link 
            href="/monitor"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <Tv className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 mt-3 group-hover:text-blue-600 transition">
              2. Central TV Monitor
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Hallway & ER wall display with loud siren, text-to-speech voice announcements, and live responder ETA.
            </p>
          </Link>

          {/* Station 3: Responder */}
          <Link 
            href="/responder"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Smartphone className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 mt-3 group-hover:text-emerald-600 transition">
              3. Responder Mobile
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              For on-call doctors & nurses. 1-tap "I am responding (ETA: 2 mins)" and on-scene arrival logging.
            </p>
          </Link>

          {/* Station 4: iHOMIS Census */}
          <Link 
            href="/ihomis"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 hover:shadow-md transition group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                <Building className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 mt-3 group-hover:text-purple-600 transition">
              4. iHOMIS Census
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Browse 172 Inpatients & 293 ER Encounters matching CPH Balamban with 1-click emergency dispatch.
            </p>
          </Link>

        </div>
      </div>

    </div>
  );
}
