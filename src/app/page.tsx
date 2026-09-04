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
  PhoneCall,
  Navigation,
  Phone,
  ShieldCheck,
  AlertCircle
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
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>(() => {
    return EmergencyService.getActiveAlertsSync(activeHospital.id);
  });
  const [communityAlerts, setCommunityAlerts] = useState<CommunityEmergencyAlert[]>(() => {
    return RescueService.getCommunityAlerts();
  });
  const [loading, setLoading] = useState(false);
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
  // 🚑 MDRRMO BALAMBAN RESCUE 911 EOC DASHBOA  // =========================================================================
  // 🚑 BALAMBAN RESCUE 911 (MDRRMO & 28 BARANGAYS) EOC DASHBOARD
  // =========================================================================
  if (isRescueFacility) {
    return (
      <div className="w-full max-w-[98%] mx-auto px-2 sm:px-4 lg:px-6 py-5 space-y-6">
        
        {/* Top Command Hub Hero Card */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 text-white p-5 sm:p-7 rounded-3xl border border-red-500/30 shadow-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center space-x-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-xl shadow-red-600/40 shrink-0 animate-pulse">
              <Ambulance className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                  MDRRMO Balamban Rescue 911
                </h1>
                <span className="rounded-full bg-red-500/20 px-3 py-0.5 text-xs font-black text-red-300 border border-red-500/40">
                  EOC LIVE ● 24/7
                </span>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/40 hidden sm:inline-block">
                  28 Barangays & TCH
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
                Emergency Operations Center • Rapid Trauma Dispatch, Maternal OB Response & Barangay Patient Transport (PTV) Network
              </p>
            </div>
          </div>

          {/* Action Buttons & Simulation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Link
              href="/trigger"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Ambulance className="h-4 w-4" />
              <span>Dispatch 911 Rescue</span>
            </Link>

            <Link
              href="/rescue/monitor"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Tv className="h-4 w-4" />
              <span>Rescue TV Screen</span>
            </Link>

            <div className="flex items-center space-x-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => handleSimulateRescue('CODE_TRAUMA')}
                disabled={testTriggering}
                className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 text-[11px] font-bold transition flex items-center space-x-1 border border-red-500/30"
                title="Simulate Transcentral Highway Vehicular Accident"
              >
                <Car className="h-3 w-3 text-red-400" />
                <span>Sim Trauma</span>
              </button>
              <button
                onClick={() => handleSimulateRescue('CODE_MATERNAL')}
                disabled={testTriggering}
                className="px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-200 text-[11px] font-bold transition flex items-center space-x-1 border border-amber-500/30"
                title="Simulate Barangay Imminent Delivery / OB Emergency"
              >
                <Baby className="h-3 w-3 text-amber-400" />
                <span>Sim Maternal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rescue 4 Preparedness Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          
          {/* Card 1: 28 Barangays Monitored */}
          <Link href="/rescue" className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-red-500 hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-2xl bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                Coverage
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">28 Brgys</div>
            <p className="text-[11px] text-slate-600 font-bold mt-1">8 Upland • 7 Coastal • 13 Lowland</p>
          </Link>

          {/* Card 2: 4 Emergency Protocols */}
          <Link href="/trigger" className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                <Radio className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Protocols
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">4 Codes</div>
            <p className="text-[11px] text-slate-600 font-bold mt-1">Trauma, Maternal, Cardiac, Transport</p>
          </Link>

          {/* Card 3: Active Rescue Units & PTVs */}
          <Link href="/responder" className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <Ambulance className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Fleet
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">MDRRMO & PTVs</div>
            <p className="text-[11px] text-slate-600 font-bold mt-1">Alpha 1, Delta 2 & 28 PTV Units</p>
          </Link>

          {/* Card 4: CPHB Trauma Bay Link */}
          <Link href="/rescue/monitor" className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition group">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Handoff
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">CPHB ER Link</div>
            <p className="text-[11px] text-slate-600 font-bold mt-1">Direct Trauma Bay Prepped & Synced</p>
          </Link>
        </div>

        {/* Emergency Status Section (Active Incidents or Standby) */}
        <div>
          {activeCommunityAlerts.length > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-3xl text-xs sm:text-sm font-black uppercase tracking-wider flex flex-wrap items-center justify-between shadow-xl gap-3">
                <span className="flex items-center space-x-2">
                  <Radio className="h-5 w-5 animate-ping text-amber-300" />
                  <span>{activeCommunityAlerts.length} ACTIVE EMERGENCY INCIDENTS IN PROGRESS</span>
                </span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={async () => {
                      audioEngine.stopSiren();
                      audioEngine.stopSpeech();
                      for (const alert of activeCommunityAlerts) {
                        await RescueService.updateAlertStatus(alert.id, 'RESOLVED', 'Batch cleared via EOC Hub');
                      }
                      setCommunityAlerts(RescueService.getCommunityAlerts());
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow transition cursor-pointer"
                  >
                    Clear All ({activeCommunityAlerts.length}) Dispatches ✓
                  </button>
                  <Link href="/rescue/monitor" className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl flex items-center space-x-1">
                    <span>Open TV Monitor</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className={`grid grid-cols-1 ${activeCommunityAlerts.length > 1 ? 'lg:grid-cols-2' : ''} gap-4`}>
                {activeCommunityAlerts.map((alert) => {
                  const def = COMMUNITY_EMERGENCY_DEFS[alert.emergency_type] || COMMUNITY_EMERGENCY_DEFS.CODE_TRAUMA;
                  const isMaternal = alert.emergency_type === 'CODE_MATERNAL';

                  return (
                    <div
                      key={alert.id}
                      className={`bg-slate-900 text-white rounded-3xl border-2 p-5 sm:p-6 shadow-2xl space-y-4 animate-fade-in ${
                        isMaternal ? 'border-pink-500 shadow-pink-950/40' : 'border-red-500 shadow-red-950/40'
                      }`}
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
            <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-sm shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">MDRRMO Rescue Operations Standby — All Clear</h3>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
                      28 BRGYS READY
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    No active trauma or medical emergency dispatch. Transcentral highway BERT and all 28 Barangay PTVs are on 24/7 Standby.
                  </p>
                </div>
              </div>

              <Link
                href="/trigger"
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center space-x-2 shadow-md transition shrink-0 cursor-pointer"
              >
                <Ambulance className="h-4 w-4" />
                <span>Dispatch 911 Rescue</span>
              </Link>
            </div>
          )}
        </div>

        {/* 4 Operations Stations Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Navigation className="h-3.5 w-3.5 text-red-600" />
              <span>Balamban Rescue 911 Operations Stations</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Quick System Access</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Link href="/trigger" className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-red-500 hover:shadow-xl transition group">
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

            <Link href="/rescue/monitor" className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition group">
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

            <Link href="/responder" className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition group">
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

            <Link href="/rescue" className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-500 hover:shadow-xl transition group">
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

        {/* NEW SECTION 1: 🚑 ACTIVE RESCUE & AMBULANCE FLEET READINESS */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Ambulance className="h-5 w-5 text-red-600" />
                <span>MDRRMO Active Emergency Fleet & Barangay PTV Units</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time operational readiness of Balamban frontline response vehicles and equipment
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping mr-1" />
              <span>All 6 Monitored Response Sectors Ready</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            
            {/* Unit 1: MDRRMO Alpha 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-red-300 transition flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-900">MDRRMO Alpha 1</span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-black bg-red-100 text-red-700 border border-red-200">
                    ALS UNIT
                  </span>
                </div>
                <p className="text-xs text-slate-500">Advanced Life Support • Poblacion Base</p>
                <div className="text-[11px] text-slate-600 font-medium">Equipped: Defibrillator, O2, Trauma Kit</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                🟢 STANDBY
              </span>
            </div>

            {/* Unit 2: MDRRMO Delta 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-red-300 transition flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-900">MDRRMO Delta 2</span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                    RESCUE RIG
                  </span>
                </div>
                <p className="text-xs text-slate-500">Highway Trauma • Transcentral Gaas Base</p>
                <div className="text-[11px] text-slate-600 font-medium">Equipped: Extrication Spreader, Spine Board</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                🟢 STANDBY
              </span>
            </div>

            {/* Unit 3: Baliwagan PTV-1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-900">Baliwagan PTV-1</span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200">
                    BRGY PTV
                  </span>
                </div>
                <p className="text-xs text-slate-500">Poblacion Sector • Brgy. Health Center</p>
                <div className="text-[11px] text-slate-600 font-medium">Equipped: Patient Stretcher, First Aid</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                🟢 READY
              </span>
            </div>

            {/* Unit 4: Buanoy Rescue Unit */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-900">Buanoy Rescue Unit</span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200">
                    COASTAL PTV
                  </span>
                </div>
                <p className="text-xs text-slate-500">Coastal Sector • Buanoy Barangay Hall</p>
                <div className="text-[11px] text-slate-600 font-medium">Equipped: Resuscitation Bag, O2 Tank</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                🟢 READY
              </span>
            </div>

            {/* Unit 5: Gaas BERT Rapid Unit */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 transition flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-900">Gaas BERT Unit</span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                    BERT MOTO
                  </span>
                </div>
                <p className="text-xs text-slate-500">Mountain Sector • KM 38 TCH Outpost</p>
                <div className="text-[11px] text-slate-600 font-medium">Equipped: Quick Trauma Response Kit</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                🟢 STANDBY
              </span>
            </div>

            {/* Unit 6: Arpili PTV-1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-900">Arpili PTV-1</span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200">
                    SOUTH PTV
                  </span>
                </div>
                <p className="text-xs text-slate-500">Southern Sector • Arpili Health Station</p>
                <div className="text-[11px] text-slate-600 font-medium">Equipped: Maternal OB Kit, Stretcher</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                🟢 READY
              </span>
            </div>

          </div>
        </div>

        {/* NEW SECTION 2: 🗺️ 28 BARANGAYS ZONE OVERVIEW & CPHB ETA */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <span>Balamban Municipality 28 Barangays Geographic Zones</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Average emergency transport time to Cebu Provincial Hospital - Balamban (CPHB ER)
              </p>
            </div>
            <Link href="/rescue" className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1">
              <span>View Full 28 Directory</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Zone 1: Poblacion */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-800">🏛️ Poblacion Center</span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">3-5 mins ETA</span>
              </div>
              <p className="text-xs text-slate-600">Baliwagan, Santa Cruz</p>
              <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                Immediate access to CPHB ER Trauma Bay. Stationed PTVs on standby.
              </div>
            </div>

            {/* Zone 2: Coastal Sector */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/40 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-teal-800">🌊 Coastal Highway</span>
                <span className="text-xs font-extrabold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">7-14 mins ETA</span>
              </div>
              <p className="text-xs text-slate-600">Aliwanay, Arpili, Buanoy, Combado, Pondol</p>
              <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                Direct highway access via Cebu West Coast Rd. High PTV coverage.
              </div>
            </div>

            {/* Zone 3: Upland Transcentral Highway */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/40 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-800">🌲 Transcentral Upland</span>
                <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">16-30 mins ETA</span>
              </div>
              <p className="text-xs text-slate-600">Gaas, Sunog, Magsaysay, Cansomoroy, Cabagdalan</p>
              <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                Mountainous highway terrain. Dedicated BERT Unit on standby for MVA crashes.
              </div>
            </div>

            {/* Zone 4: Lowland & Valley Sector */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/40 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-800">🌾 Lowland & Valley</span>
                <span className="text-xs font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">8-18 mins ETA</span>
              </div>
              <p className="text-xs text-slate-600">Cantuod, Nangka, Prenza, Hingatmonan, Biasong</p>
              <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                Connected via municipal feeder roads to main highway network.
              </div>
            </div>

          </div>
        </div>

        {/* NEW SECTION 3: 📞 24/7 EOC COMMUNICATIONS & EMERGENCY HOTLINES */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-sm shrink-0">
              <PhoneCall className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm block">MDRRMO 911 Emergency Communications Dispatch</span>
              <span className="text-slate-400 text-xs">Direct Link between Balamban Rescue, 28 Barangay PTVs & CPHB Trauma Bay</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-mono">
              <span className="text-red-400 font-bold mr-1">MDRRMO:</span>
              <span>(032) 333-2199 / 911</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-mono">
              <span className="text-blue-400 font-bold mr-1">CPHB ER:</span>
              <span>(032) 333-2200</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-mono">
              <span className="text-amber-400 font-bold mr-1">PNP:</span>
              <span>(032) 333-2211</span>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // =========================================================================
  // 🏥 CEBU PROVINCIAL HOSPITAL (CPHB) DASHBOARD
  // =============================================================================================
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
