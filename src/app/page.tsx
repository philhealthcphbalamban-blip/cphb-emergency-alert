'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Tv, 
  Smartphone, 
  History, 
  Users, 
  Building, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Zap, 
  Activity, 
  HeartPulse, 
  Baby, 
  Bed, 
  MapPin, 
  Monitor, 
  Flame, 
  Layers,
  Ambulance,
  Radio,
  Car,
  ChevronRight,
  PhoneCall
} from 'lucide-react';
import { EmergencyAlert } from '@/types/emergency';
import { CommunityEmergencyAlert, COMMUNITY_EMERGENCY_DEFS, BALAMBAN_BARANGAYS } from '@/types/rescue';
import { EmergencyService } from '@/lib/supabase';
import { RescueService } from '@/lib/rescueService';
import { HospitalService } from '@/lib/hospitalService';
import { IHOMISService } from '@/lib/ihomisService';
import { audioEngine } from '@/lib/audioEngine';

export default function CommandHubPage() {
  const [activeHospital, setActiveHospital] = useState(HospitalService.getActiveHospital());
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [communityAlerts, setCommunityAlerts] = useState<CommunityEmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [testTriggering, setTestTriggering] = useState(false);

  const isRescueFacility = activeHospital.isRescue || activeHospital.id === 'balamban_rescue';

  const fetchAlerts = async () => {
    if (isRescueFacility) {
      setCommunityAlerts(RescueService.getCommunityAlerts());
    } else {
      const list = await EmergencyService.getActiveAlerts(activeHospital.id);
      setActiveAlerts(list);
    }
    setLoading(false);
  };

  useEffect(() => {
    EmergencyService.init();
    RescueService.init();
    IHOMISService.initCloudSync();

    setActiveHospital(HospitalService.getActiveHospital());
    fetchAlerts();

    const handleHospChange = (e: any) => {
      if (e.detail) setActiveHospital(e.detail);
    };
    window.addEventListener('cph_hospital_changed', handleHospChange);

    const unsubHospital = EmergencyService.subscribe(() => {
      if (!isRescueFacility) fetchAlerts();
    });

    const unsubRescue = RescueService.subscribe((updated) => {
      if (isRescueFacility) setCommunityAlerts(updated);
    });

    const poll = setInterval(fetchAlerts, 2500);

    return () => {
      unsubHospital();
      unsubRescue();
      clearInterval(poll);
      window.removeEventListener('cph_hospital_changed', handleHospChange);
    };
  }, [activeHospital.id, isRescueFacility]);

  // Hospital Simulation Handlers
  const handleQuickSimulation = async (codeId: 'code_blue' | 'code_baby_blue') => {
    setTestTriggering(true);
    audioEngine.playChime();
    
    const locations = HospitalService.getLocationsForHospital(activeHospital.id);
    const loc = locations[0]?.room_bed || 'ICU NEW ROOM - ICU01';

    await EmergencyService.triggerAlert({
      hospital_id: activeHospital.id,
      code_id: codeId,
      location_text: `${locations[0]?.unit_ward || 'ICU'} - ${loc}`,
      triggered_by_name: 'Nurse Station Staff',
      triggered_by_role: 'Triage Nurse',
    });

    await fetchAlerts();
    setTimeout(() => setTestTriggering(false), 2000);
  };

  // Rescue Simulation Handlers
  const handleSimulateRescue = async (type: 'CODE_TRAUMA' | 'CODE_MATERNAL') => {
    setTestTriggering(true);
    audioEngine.playChime();

    if (type === 'CODE_TRAUMA') {
      await RescueService.dispatchCommunityAlert({
        emergency_type: 'CODE_TRAUMA',
        barangay_name: 'Gaas',
        sitio_or_landmark: 'Transcentral Highway Km 38 (Near Viewpoint)',
        patient_condition: 'Multiple Vehicle Accident (MVA) - 2 motorcycle riders with head & leg trauma.',
        caller_name: 'BHW Patrol Leader (Gaas)',
        caller_phone: '0917-555-0199',
        destination_facility: 'Cebu Provincial Hospital - Balamban (CPHB ER Trauma Bay)',
      });
    } else {
      await RescueService.dispatchCommunityAlert({
        emergency_type: 'CODE_MATERNAL',
        barangay_name: 'Baliwagan (Poblacion)',
        sitio_or_landmark: 'Sitio JNT Riverside',
        patient_condition: 'Female 17 yrs old, 38 weeks pregnancy with active vaginal bleeding and strong labor pains.',
        caller_name: 'Barangay Health Worker Desk',
        caller_phone: '0917-123-0101',
        destination_facility: 'Cebu Provincial Hospital - Balamban (CPHB ER Trauma Bay)',
      });
    }

    setCommunityAlerts(RescueService.getCommunityAlerts());
    setTimeout(() => setTestTriggering(false), 2000);
  };

  const handleResolveAlert = async (alertId: string) => {
    audioEngine.stopSiren();
    audioEngine.stopSpeech();
    await EmergencyService.resolveAlert({
      alert_id: alertId,
      resolved_by_name: 'Dr. Santos (Resuscitation Team Leader)',
      resolution_notes: 'Patient stabilized and transferred to CCU/ICU.',
      status: 'RESOLVED',
    });
    await fetchAlerts();
  };

  const handleAdvanceRescueStatus = async (alertId: string, currentStatus: CommunityEmergencyAlert['status']) => {
    const statusProgression: Record<CommunityEmergencyAlert['status'], CommunityEmergencyAlert['status']> = {
      DISPATCHED: 'EN_ROUTE',
      EN_ROUTE: 'ON_SCENE',
      ON_SCENE: 'TRANSPORTING_TO_CPHB',
      TRANSPORTING_TO_CPHB: 'ARRIVED_AT_CPHB',
      ARRIVED_AT_CPHB: 'RESOLVED',
      RESOLVED: 'RESOLVED',
    };

    const next = statusProgression[currentStatus];
    await RescueService.updateAlertStatus(alertId, next);
    setCommunityAlerts(RescueService.getCommunityAlerts());
    audioEngine.playChime();
  };

  const activeCommunityAlerts = communityAlerts.filter(a => a.status !== 'RESOLVED');

  // =========================================================================
  // 🚑 MDRRMO BALAMBAN RESCUE 911 EOC DASHBOARD
  // =========================================================================
  if (isRescueFacility) {
    return (
      <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-red-500/30 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3.5 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/50 animate-pulse shrink-0">
              <Ambulance className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  MDRRMO Balamban Rescue 911 • EOC Command Hub
                </h1>
                <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-black text-red-300 border border-red-500/40">
                  RESCUE Live
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Emergency Operations Center • 28 Monitored Barangays & Transcentral Highway Direct Dispatch
              </p>
            </div>
          </div>

          {/* Quick Simulation Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-amber-300 font-bold mr-1 flex items-center">
              <Zap className="h-3.5 w-3.5 text-amber-400 mr-1" />
              Quick Dispatch Simulation:
            </span>
            <button
              onClick={() => handleSimulateRescue('CODE_TRAUMA')}
              disabled={testTriggering}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Car className="h-3.5 w-3.5" />
              <span>Simulate Trauma (Highway MVA)</span>
            </button>
            <button
              onClick={() => handleSimulateRescue('CODE_MATERNAL')}
              disabled={testTriggering}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Baby className="h-3.5 w-3.5" />
              <span>Simulate Maternal (OB)</span>
            </button>
          </div>
        </div>

        {/* Rescue 4 Preparedness Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Card 1: 28 Barangays Monitored */}
          <Link href="/rescue" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-red-500 hover:shadow-md transition">
            <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
              <MapPin className="h-4 w-4 text-red-600" />
              <span>28 Monitored Barangays</span>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">28 Brgys</div>
            <span className="text-[10px] text-red-700 font-bold">8 Upland • 7 Coastal • 13 Lowland</span>
          </Link>

          {/* Card 2: 4 Emergency Protocols */}
          <Link href="/trigger" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md transition">
            <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
              <Radio className="h-4 w-4 text-amber-600" />
              <span>Emergency Protocols</span>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">4 Protocols</div>
            <span className="text-[10px] text-amber-700 font-bold">Trauma, Maternal, Transport, Cardiac</span>
          </Link>

          {/* Card 3: Active Rescue Units & PTVs */}
          <Link href="/responder" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition">
            <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
              <Ambulance className="h-4 w-4 text-blue-600" />
              <span>Active Rescue Units</span>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">MDRRMO & PTVs</div>
            <span className="text-[10px] text-blue-700 font-bold">Alpha 1, Delta 2 & 28 Barangay PTVs</span>
          </Link>

          {/* Card 4: CPHB Trauma Bay Link */}
          <Link href="/rescue/monitor" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition">
            <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>CPHB Hospital Link</span>
            </div>
            <div className="text-3xl font-black text-emerald-700 mt-1">Direct Link</div>
            <span className="text-[10px] text-emerald-700 font-bold">CPHB ER Trauma Bay Prepped</span>
          </Link>
        </div>

        {/* Emergency Status Section (Balamban Community Incidents) */}
        <div>
          {activeCommunityAlerts.length > 0 ? (
            <div className="space-y-3">
              <div className="p-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-between shadow-lg">
                <span className="flex items-center space-x-2">
                  <Radio className="h-4 w-4 animate-ping" />
                  <span>{activeCommunityAlerts.length} ACTIVE RESCUE & TRAUMA DISPATCH IN PROGRESS</span>
                </span>
                <Link href="/rescue/monitor" className="underline text-red-100 hover:text-white flex items-center space-x-1">
                  <span>Open Rescue TV Command Screen</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className={`grid grid-cols-1 ${activeCommunityAlerts.length > 1 ? 'lg:grid-cols-2' : ''} gap-4`}>
                {activeCommunityAlerts.map((alert) => {
                  const def = COMMUNITY_EMERGENCY_DEFS[alert.emergency_type] || COMMUNITY_EMERGENCY_DEFS.CODE_TRAUMA;

                  return (
                    <div
                      key={alert.id}
                      className="bg-slate-900 text-white rounded-3xl border-2 border-red-500 p-5 sm:p-6 shadow-xl space-y-4 animate-fade-in"
                    >
                      <div className="flex items-start justify-between border-b border-white/10 pb-3">
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase text-white ${def.color}`}>
                              {def.title}
                            </span>
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                              STATUS: {alert.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                            Brgy. {alert.barangay_name}
                          </h2>
                          <p className="text-xs text-amber-300 font-bold flex items-center mt-0.5">
                            <MapPin className="h-3.5 w-3.5 mr-1 text-red-400 shrink-0" />
                            {alert.sitio_or_landmark}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Link
                            href="/rescue/monitor"
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                            title="Open Fullscreen TV Monitor"
                          >
                            <Tv className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>

                      {/* Condition & Caller */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-[10px] text-white/50 font-bold block uppercase">Emergency Condition:</span>
                          <span className="text-white font-semibold">{alert.patient_condition}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-[10px] text-white/50 font-bold block uppercase">Caller / Contact:</span>
                          <span className="text-amber-300 font-bold">{alert.caller_name} ({alert.caller_phone})</span>
                        </div>
                      </div>

                      {/* Advance & Resolve Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10 flex-wrap gap-2">
                        <span className="text-xs text-slate-400 font-mono">
                          Dispatched: {new Date(alert.dispatched_at).toLocaleTimeString()}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAdvanceRescueStatus(alert.id, alert.status)}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center space-x-1 cursor-pointer"
                          >
                            <span>Advance Step ❯</span>
                          </button>
                          <button
                            onClick={async () => {
                              audioEngine.stopSiren();
                              audioEngine.stopSpeech();
                              await RescueService.updateAlertStatus(alert.id, 'RESOLVED', 'Resolved & Cleared via EOC Command Hub');
                              setCommunityAlerts(RescueService.getCommunityAlerts());
                              audioEngine.playChime();
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Resolve & Clear Code ✓</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    <h3 className="text-base font-black text-slate-900">MDRRMO Rescue Operations Standby — All Clear</h3>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
                      28 BRGYS MONITORED
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    No active trauma or medical emergency dispatch. Transcentral highway network and all 28 Barangay PTVs are ready.
                  </p>
                </div>
              </div>

              <Link
                href="/trigger"
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition shrink-0"
              >
                <Ambulance className="h-4 w-4" />
                <span>Dispatch 911 Rescue</span>
              </Link>
            </div>
          )}
        </div>

        {/* 4 Clean Station Cards Grid for Balamban Rescue */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Balamban Rescue 911 Operations Stations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Link href="/trigger" className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-red-500 hover:shadow-lg transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition">
                  <Ambulance className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-red-600">Dispatch 911</span>
              </div>
              <h4 className="text-base font-black text-slate-900">911 Dispatch Station</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Dispatch Highway Trauma, Maternal, Cardiac, and Patient Transport across all 28 Barangays.
              </p>
            </Link>

            <Link href="/rescue/monitor" className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Tv className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-blue-600">24/7 TV Screen</span>
              </div>
              <h4 className="text-base font-black text-slate-900">Rescue TV Screen</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                High-visibility 24/7 TV Kiosk for MDRRMO Command Center with Voice Audio alerts.
              </p>
            </Link>

            <Link href="/responder" className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Smartphone className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-emerald-600">Mobile Hub</span>
              </div>
              <h4 className="text-base font-black text-slate-900">PTV Responders</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Mobile responder dashboard for ambulance drivers, EMTs, and Barangay Health Workers.
              </p>
            </Link>

            <Link href="/rescue" className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-500 hover:shadow-lg transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                  <MapPin className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-purple-600">Barangays</span>
              </div>
              <h4 className="text-base font-black text-slate-900">28 Barangays Directory</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Full directory of Balamban's 28 Barangays with emergency contacts, terrain, and distances.
              </p>
            </Link>

          </div>
        </div>

      </div>
    );
  }

  // =========================================================================
  // 🏥 CEBU PROVINCIAL HOSPITAL (CPHB) DASHBOARD
  // =========================================================================
  return (
    <div className="w-full max-w-[98%] mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Hospital Command Dashboard
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-black text-blue-700 border border-blue-200">
              {activeHospital.code} Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeHospital.name} • Multi-Code Concurrent Broadcasting Engine Active
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

      {/* Hospital Emergency Preparedness & Location Readiness */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Monitored Hospital Wards */}
        <Link href="/trigger" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <Building className="h-4 w-4 text-blue-600" />
            <span>Monitored Wards</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {HospitalService.getLocationsForHospital(activeHospital.id).length > 20 ? '11 Wards' : '8 Wards'}
          </div>
          <span className="text-[10px] text-blue-700 font-bold">{activeHospital.shortName} Monitored</span>
        </Link>

        {/* Card 2: Emergency Bed Locations */}
        <Link href="/trigger" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <Bed className="h-4 w-4 text-emerald-600" />
            <span>Bed Locations</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">{activeHospital.bedCapacity} Beds</div>
          <span className="text-[10px] text-emerald-700 font-bold">{activeHospital.municipality}</span>
        </Link>

        {/* Card 3: Rapid Response Teams */}
        <Link href="/responder" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-red-500 hover:shadow-md transition">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <span>24/7 Response Teams</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">4 Teams</div>
          <span className="text-[10px] text-red-700 font-bold">Code Blue, Baby Blue, Red, Pink</span>
        </Link>

        {/* Card 4: Data Privacy Protection */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Data Privacy (RA 10173)</span>
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-1">Protected</div>
          <span className="text-[10px] text-emerald-700 font-bold">100% Ward & Location-Based Dispatch</span>
        </div>
      </div>

      {/* Emergency Status Section (Concurrent Alerts Grid) */}
      <div>
        {activeAlerts.length > 0 ? (
          <div className="space-y-3">
            {activeAlerts.length > 1 && (
              <div className="p-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex flex-wrap items-center justify-between shadow-md gap-2">
                <span className="flex items-center space-x-1.5">
                  <Layers className="h-4 w-4 animate-bounce" />
                  <span>{activeAlerts.length} CONCURRENT EMERGENCY CODES IN PROGRESS</span>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleResolveAlert('any')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm transition flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Clear All ({activeAlerts.length}) Active Codes ✓</span>
                  </button>
                  <Link href="/monitor" className="underline text-red-100 hover:text-white text-xs">
                    Open Monitor ➔
                  </Link>
                </div>
              </div>
            )}

            <div className={`grid grid-cols-1 ${activeAlerts.length > 1 ? 'lg:grid-cols-2' : ''} gap-4`}>
              {activeAlerts.map((alert) => {
                const code = alert.code_details;
                const isCodeBlue = alert.code_id === 'code_blue' || alert.code_id === 'code_baby_blue';

                return (
                  <div
                    key={alert.id}
                    className={`relative overflow-hidden rounded-3xl border-2 p-6 shadow-md transition-all ${
                      isCodeBlue
                        ? 'bg-blue-900 text-white border-blue-400'
                        : 'bg-red-900 text-white border-red-400'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center space-x-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow">
                              <span className="h-2 w-2 rounded-full bg-white animate-ping mr-1" />
                              EMERGENCY ACTIVE
                            </span>
                            <span className="text-xs text-slate-200 font-medium">
                              Started: {new Date(alert.triggered_at).toLocaleTimeString()}
                            </span>
                          </div>

                          <h2 className="text-2xl font-black text-white mt-1.5">
                            {code?.code_name} — {code?.title}
                          </h2>

                          <p className="text-base font-black text-amber-300 mt-1 flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-red-400 shrink-0" />
                            {alert.location_text}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href="/monitor"
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition flex items-center space-x-1.5"
                          >
                            <Monitor className="h-4 w-4" />
                            <span>Kiosk</span>
                          </Link>
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  No active emergency codes in {activeHospital.name}. Realtime broadcasting channels and iHOMIS census are connected.
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
          Emergency Command Stations & Quick Access
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link href="/trigger" className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-red-500 hover:shadow-lg transition group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-red-600">1-Tap Trigger</span>
            </div>
            <h4 className="text-base font-black text-slate-900">Code Trigger Station</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Nurse Station & Triage rapid dispatch with 58 monitored wards & rooms.
            </p>
          </Link>

          <Link href="/monitor" className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <Tv className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-blue-600">Split View Ready</span>
            </div>
            <h4 className="text-base font-black text-slate-900">Central TV Monitor</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              High-visibility hallway display with loud sirens, Voice TTS, and split-screen mode.
            </p>
          </Link>

          <Link href="/responder" className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Smartphone className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600">Mobile Alerts</span>
            </div>
            <h4 className="text-base font-black text-slate-900">Code Responder Hub</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              For on-duty doctors and nurses to acknowledge codes, send ETA, and coordinate.
            </p>
          </Link>

          <Link href="/history" className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-500 hover:shadow-lg transition group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                <History className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-purple-600">Audit Logs</span>
            </div>
            <h4 className="text-base font-black text-slate-900">Incident History</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Full hospital CQI response audit logs with timestamps and responder metrics.
            </p>
          </Link>

        </div>
      </div>

    </div>
  );
}
