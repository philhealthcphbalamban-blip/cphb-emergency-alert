'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Ambulance, 
  ShieldAlert, 
  MapPin, 
  PhoneCall, 
  Clock, 
  Navigation, 
  AlertTriangle, 
  CheckCircle2, 
  Car, 
  Building2, 
  Radio, 
  HeartPulse, 
  Baby, 
  Flame, 
  Send,
  Check,
  ChevronRight,
  RefreshCw,
  Users
} from 'lucide-react';
import { 
  CommunityEmergencyAlert, 
  CommunityEmergencyType, 
  BALAMBAN_BARANGAYS, 
  COMMUNITY_EMERGENCY_DEFS,
  BalambanBarangay
} from '@/types/rescue';
import { RescueService } from '@/lib/rescueService';
import { audioEngine } from '@/lib/audioEngine';

export default function BalambanRescuePage() {
  const [alerts, setAlerts] = useState<CommunityEmergencyAlert[]>([]);
  const [selectedType, setSelectedType] = useState<CommunityEmergencyType>('CODE_TRAUMA');
  const [selectedBarangayName, setSelectedBarangayName] = useState<string>(BALAMBAN_BARANGAYS[0].name);
  const [sitioLandmark, setSitioLandmark] = useState('');
  const [patientCondition, setPatientCondition] = useState('');
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const selectedBarangay = BALAMBAN_BARANGAYS.find(b => b.name === selectedBarangayName) || BALAMBAN_BARANGAYS[0];
  const emergencyDef = COMMUNITY_EMERGENCY_DEFS[selectedType];

  const loadAlerts = () => {
    setAlerts(RescueService.getCommunityAlerts());
  };

  useEffect(() => {
    loadAlerts();
    const unsubscribe = RescueService.subscribe((updated) => {
      setAlerts(updated);
    });
    return () => unsubscribe();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sitioLandmark.trim() || !patientCondition.trim()) {
      alert('Please enter the Sitio / Landmark and describe the patient emergency condition.');
      return;
    }

    setIsSubmitting(true);
    audioEngine.playChime();

    const newAlert = await RescueService.dispatchCommunityAlert({
      emergency_type: selectedType,
      barangay_name: selectedBarangayName,
      sitio_or_landmark: sitioLandmark.trim(),
      patient_condition: patientCondition.trim(),
      caller_name: callerName.trim() || 'Barangay Health Worker / Official',
      caller_phone: callerPhone.trim() || selectedBarangay.contactNumber,
      destination_facility: 'Cebu Provincial Hospital - Balamban (CPHB ER Trauma Bay)',
    });

    setSitioLandmark('');
    setPatientCondition('');
    setIsSubmitting(false);
    setSuccessBanner(`🚨 ${emergencyDef.title} successfully dispatched to Barangay ${selectedBarangayName}! MDRRMO & PTV notified.`);
    setTimeout(() => setSuccessBanner(''), 5000);
  };

  const handleAdvanceStatus = async (alertId: string, currentStatus: CommunityEmergencyAlert['status']) => {
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
    audioEngine.playChime();
  };

  const activeCommunityAlerts = alerts.filter(a => a.status !== 'RESOLVED');
  const pastCommunityAlerts = alerts.filter(a => a.status === 'RESOLVED');

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-blue-950 p-5 sm:p-7 rounded-3xl border border-red-500/30 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3.5 rounded-2xl bg-red-600/90 text-white shadow-lg shadow-red-600/40 animate-pulse shrink-0">
            <Ambulance className="h-7 w-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                Municipality of Balamban
              </span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center">
                <Radio className="h-3 w-3 mr-1 inline animate-ping" />
                MDRRMO 911 & 28 Barangays PTV Network
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Community Emergency & Barangay Rapid Rescue Channel
            </h1>
            <p className="text-xs text-white/70 mt-1 max-w-2xl">
              Rapid dispatch coordination for Balamban Rescue, Barangay Ambulances / Patient Transport Vehicles (PTV), and direct pre-arrival trauma alert to CPH Balamban Emergency Department.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-2xl text-right">
            <span className="text-[10px] uppercase font-bold text-white/60 block">Receiving Hospital</span>
            <span className="text-xs font-black text-amber-300 flex items-center justify-end">
              <Building2 className="h-3.5 w-3.5 mr-1" />
              CPH Balamban ER
            </span>
          </div>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-500 text-emerald-100 text-xs font-black flex items-center space-x-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Main Grid: Left = Dispatch Trigger Form, Right = Active Rescue Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Emergency Dispatch Station (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-red-100 text-red-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Broadcast Community Code
                </h2>
                <p className="text-xs text-slate-500">
                  Notify nearest PTV, MDRRMO Rescue, and CPHB ER.
                </p>
              </div>
            </div>

            <form onSubmit={handleDispatch} className="space-y-4">
              
              {/* Emergency Category Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  1. Select Emergency Type:
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {(Object.keys(COMMUNITY_EMERGENCY_DEFS) as CommunityEmergencyType[]).map((typeKey) => {
                    const def = COMMUNITY_EMERGENCY_DEFS[typeKey];
                    const isSelected = selectedType === typeKey;
                    return (
                      <button
                        type="button"
                        key={typeKey}
                        onClick={() => setSelectedType(typeKey)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                            isSelected ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-800'
                          }`}>
                            {def.badge}
                          </span>
                          <span className="text-xs font-bold">{def.title.split('(')[0]}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Barangay Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  2. Select Barangay in Balamban:
                </label>
                <select
                  value={selectedBarangayName}
                  onChange={(e) => setSelectedBarangayName(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                >
                  {BALAMBAN_BARANGAYS.map((b) => (
                    <option key={b.id} value={b.name}>
                      Brgy. {b.name} — {b.distanceToCPHBalambanKm} km ({b.estimatedDriveTimeMins} mins to CPHB ER)
                    </option>
                  ))}
                </select>

                {/* Barangay Info Chip */}
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <Navigation className="h-3.5 w-3.5 text-blue-600" />
                    <span>Zone: <strong className="text-slate-900">{selectedBarangay.zone}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <Car className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                      {selectedBarangay.hasStationedPTV 
                        ? <strong className="text-emerald-700 font-black">PTV Stationed ✅</strong> 
                        : <span className="text-amber-700">MDRRMO Dispatched</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sitio / Landmark */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  3. Sitio / Landmark / House Address:
                </label>
                <input
                  type="text"
                  value={sitioLandmark}
                  onChange={(e) => setSitioLandmark(e.target.value)}
                  placeholder="e.g. Sitio Balamban Heights near Chapel / KM 34 Transcentral"
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              {/* Patient Condition */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  4. Patient Condition & Emergency Details:
                </label>
                <textarea
                  value={patientCondition}
                  onChange={(e) => setPatientCondition(e.target.value)}
                  rows={2}
                  placeholder="e.g. Severe trauma, motorcycle collision, bleeding from head, patient semi-conscious."
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              {/* Caller / Reporter */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Caller / BHW Name:</label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    placeholder="e.g. Kagawad Rey"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Phone:</label>
                  <input
                    type="text"
                    value={callerPhone}
                    onChange={(e) => setCallerPhone(e.target.value)}
                    placeholder="0917-xxx-xxxx"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'Broadcasting Code...' : 'Transmit Emergency Dispatch'}</span>
              </button>

            </form>

          </div>
        </div>

        {/* RIGHT COLUMN: Active Community Emergency Tracker (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-slate-900">
                Active Community Incidents
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-black border border-red-200">
                {activeCommunityAlerts.length} Active
              </span>
            </div>
            <button
              onClick={loadAlerts}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Refresh Rescue Incidents"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Active Alert Cards */}
          <div className="space-y-3.5">
            {activeCommunityAlerts.map((alert) => {
              const def = COMMUNITY_EMERGENCY_DEFS[alert.emergency_type] || COMMUNITY_EMERGENCY_DEFS.CODE_TRAUMA;
              return (
                <div 
                  key={alert.id}
                  className={`p-5 rounded-3xl border-2 shadow-lg transition ${
                    alert.emergency_type === 'CODE_TRAUMA'
                      ? 'bg-slate-950 text-white border-red-500 shadow-red-600/20'
                      : alert.emergency_type === 'CODE_MATERNAL'
                      ? 'bg-slate-950 text-white border-pink-500 shadow-pink-600/20'
                      : 'bg-slate-950 text-white border-blue-500 shadow-blue-600/20'
                  }`}
                >
                  
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-2xl ${def.accentBg} text-white shrink-0 animate-pulse`}>
                        <Ambulance className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 text-white">
                            {def.badge}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 animate-pulse">
                            STATUS: {alert.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white mt-1">
                          Brgy. {alert.barangay_name}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-white/70">
                      <Clock className="h-3.5 w-3.5 inline mr-1 text-amber-300" />
                      <span>{new Date(alert.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Location & Condition Details */}
                  <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-white/60 font-semibold block text-[10px] uppercase">Exact Sitio / Landmark:</span>
                      <p className="font-bold text-amber-300 text-xs mt-0.5 flex items-center">
                        <MapPin className="h-3.5 w-3.5 text-red-400 mr-1 shrink-0" />
                        {alert.sitio_or_landmark}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-white/60 font-semibold block text-[10px] uppercase">Caller / Contact:</span>
                      <p className="font-bold text-white text-xs mt-0.5">
                        {alert.caller_name} ({alert.caller_phone})
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
                    <span className="text-white/60 font-semibold block text-[10px] uppercase">Emergency Condition:</span>
                    <p className="text-white font-medium mt-0.5 leading-relaxed">
                      {alert.patient_condition}
                    </p>
                  </div>

                  {/* Responding Units & Drivers */}
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/60 block">
                      Dispatched Responders & Transport Units:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {alert.responding_units.map((unit) => (
                        <div key={unit.unit_id} className="p-2.5 rounded-xl bg-black/40 border border-white/15 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-extrabold text-blue-300 block">{unit.unit_name}</span>
                            <span className="text-[11px] text-white/80">{unit.driver_or_lead}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ETA ~{unit.eta_mins}m
                            </span>
                            <a 
                              href={`tel:${unit.contact}`}
                              className="block mt-1 text-[10px] text-blue-400 hover:underline font-bold"
                            >
                              📞 Call Unit
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Destination Hospital Banner */}
                  <div className="mt-3 p-2.5 rounded-2xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
                      <span>Destination: <strong>{alert.destination_facility}</strong></span>
                    </div>
                    <span className="text-[10px] font-black text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                      TRAUMA BAY ON STANDBY
                    </span>
                  </div>

                  {/* Status Progress Button Bar */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-white/70">
                      Current: <strong className="text-white font-mono">{alert.status}</strong>
                    </div>

                    <button
                      onClick={() => handleAdvanceStatus(alert.id, alert.status)}
                      className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition flex items-center space-x-1.5 shadow-md"
                    >
                      <span>
                        {alert.status === 'DISPATCHED' && 'Mark En Route 🚑'}
                        {alert.status === 'EN_ROUTE' && 'Mark On Scene 📍'}
                        {alert.status === 'ON_SCENE' && 'Transporting to CPHB 🏥'}
                        {alert.status === 'TRANSPORTING_TO_CPHB' && 'Arrived at CPHB ER 🏁'}
                        {alert.status === 'ARRIVED_AT_CPHB' && 'Close & Resolve Incident ✓'}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}

            {activeCommunityAlerts.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h3 className="text-base font-black text-slate-900">All Barangays Standby & Clear</h3>
                <p className="text-xs max-w-sm mx-auto text-slate-500">
                  No active community trauma or PTV calls in the Municipality of Balamban at this moment.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
