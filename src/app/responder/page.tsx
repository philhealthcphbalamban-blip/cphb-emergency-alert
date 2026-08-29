'use client';

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  User, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Navigation, 
  Users, 
  Send, 
  HeartPulse, 
  Building,
  UserCheck,
  Layers
} from 'lucide-react';
import { EmergencyAlert, AlertResponder } from '@/types/emergency';
import { EmergencyService } from '@/lib/supabase';
import { StaffService } from '@/lib/staffService';
import { audioEngine } from '@/lib/audioEngine';
import { HospitalService } from '@/lib/hospitalService';

export default function ResponderPage() {
  const currentStaff = StaffService.getCurrentStaff();
  const [activeHospital, setActiveHospital] = useState(HospitalService.getActiveHospital());
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [responderName, setResponderName] = useState<string>(currentStaff.name);
  const [responderRole, setResponderRole] = useState<AlertResponder['role']>(currentStaff.is_doctor ? 'Physician' : 'Nurse');
  const [selectedEta, setSelectedEta] = useState<number>(2);
  const [hasResponded, setHasResponded] = useState<boolean>(false);
  const [myResponderId, setMyResponderId] = useState<string | null>(null);
  const [isOnScene, setIsOnScene] = useState<boolean>(false);

  const fetchAlerts = async () => {
    const list = await EmergencyService.getActiveAlerts(activeHospital.id);
    setActiveAlerts(list);
    if (list.length > 0) {
      // If current selected activeAlert is not in list, select first
      if (!activeAlert || !list.some(a => a.id === activeAlert.id)) {
        setActiveAlert(list[0]);
        checkIfAlreadyResponded(list[0]);
      } else {
        const updated = list.find(a => a.id === activeAlert.id) || list[0];
        setActiveAlert(updated);
        checkIfAlreadyResponded(updated);
      }
    } else {
      setActiveAlert(null);
      setHasResponded(false);
      setIsOnScene(false);
      setMyResponderId(null);
    }
  };

  useEffect(() => {
    const handleStaffChange = (e: any) => {
      if (e.detail) {
        setResponderName(e.detail.name);
        setResponderRole(e.detail.is_doctor ? 'Physician' : 'Nurse');
      }
    };
    window.addEventListener('cphb_staff_changed', handleStaffChange);
    return () => window.removeEventListener('cphb_staff_changed', handleStaffChange);
  }, []);

  useEffect(() => {
    EmergencyService.init();
    fetchAlerts();

    const handleHospChange = (e: any) => {
      if (e.detail) setActiveHospital(e.detail);
    };
    window.addEventListener('cph_hospital_changed', handleHospChange);

    const unsubscribe = EmergencyService.subscribe(() => {
      fetchAlerts();
    });

    const poll = setInterval(fetchAlerts, 2500);

    return () => {
      unsubscribe();
      clearInterval(poll);
      window.removeEventListener('cph_hospital_changed', handleHospChange);
    };
  }, [activeHospital.id, responderName]);

  const checkIfAlreadyResponded = (alert: EmergencyAlert | null) => {
    if (!alert || !alert.responders) {
      setHasResponded(false);
      setIsOnScene(false);
      setMyResponderId(null);
      return;
    }
    const existing = alert.responders.find(r => r.responder_name === responderName);
    if (existing) {
      setHasResponded(true);
      setMyResponderId(existing.id);
      setIsOnScene(existing.status === 'ON_SCENE');
    } else {
      setHasResponded(false);
      setIsOnScene(false);
      setMyResponderId(null);
    }
  };

  const selectAlert = (alert: EmergencyAlert) => {
    setActiveAlert(alert);
    checkIfAlreadyResponded(alert);
  };

  const handleSendResponse = async () => {
    if (!activeAlert) return;
    audioEngine.playChime();

    const resp = await EmergencyService.addResponder({
      alert_id: activeAlert.id,
      responder_name: responderName,
      role: responderRole,
      eta_minutes: selectedEta,
    });

    setMyResponderId(resp.id);
    setHasResponded(true);
    await fetchAlerts();
  };

  const handleMarkArrived = async () => {
    if (!activeAlert || !myResponderId) return;
    audioEngine.playChime();
    await EmergencyService.markOnScene(activeAlert.id, myResponderId);
    setIsOnScene(true);
    await fetchAlerts();
  };

  const code = activeAlert?.code_details;
  const isCodeBlue = activeAlert?.code_id === 'code_blue' || activeAlert?.code_id === 'code_baby_blue';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-28 space-y-5">
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-wider text-slate-900">
              Mobile Code Responder — {activeHospital.name}
            </h1>
            <p className="text-xs text-slate-500">
              Personal Dispatch & Response Acknowledgment • Multi-Code Dispatch Active
            </p>
          </div>
        </div>
      </div>

      {/* MULTI-ALERT SELECTOR TABS (When 2+ Codes are Active) */}
      {activeAlerts.length > 1 && (
        <div className="p-3.5 bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl shadow-md space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-300">
            <span className="flex items-center space-x-1.5">
              <Layers className="h-4 w-4 animate-bounce" />
              <span>{activeAlerts.length} CONCURRENT EMERGENCY CODES ACTIVE</span>
            </span>
            <span className="text-[10px] text-slate-300">Select which code to respond to:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {activeAlerts.map((alert) => {
              const isSelected = activeAlert?.id === alert.id;
              const hasMyResponse = alert.responders?.some(r => r.responder_name === responderName);

              return (
                <button
                  key={alert.id}
                  onClick={() => selectAlert(alert)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 transition shrink-0 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-400/50'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/15'
                  }`}
                >
                  <span 
                    className="h-3 w-3 rounded-full shrink-0" 
                    style={{ backgroundColor: alert.code_details?.color_hex || '#ef4444' }} 
                  />
                  <span>{alert.code_details?.code_name}</span>
                  <span className="text-[10px] text-slate-300 font-normal">
                    • {alert.location_text.split('•').pop()?.trim() || alert.location_text}
                  </span>
                  {hasMyResponse && (
                    <span className="ml-1 bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded text-[9px] font-black">
                      RESPONDED ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff Profile Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
          Your Duty Identity (Linked to Staff Session)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Name / Title:</label>
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <User className="h-4 w-4 text-blue-600 shrink-0" />
              <input
                type="text"
                value={responderName}
                onChange={(e) => setResponderName(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 w-full focus:outline-none"
                placeholder="Enter responder name"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Role / Designation:</label>
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <select
                value={responderRole}
                onChange={(e) => setResponderRole(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-900 w-full focus:outline-none"
              >
                <option value="Physician">Physician / Doctor</option>
                <option value="Nurse">Nurse / Code Team</option>
                <option value="Security">Security Officer</option>
                <option value="Admin">Administrator / Support</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alert Card */}
      {activeAlert ? (
        <div className="space-y-5 animate-fade-in">
          
          {/* Main Alert Card */}
          <div className={`p-6 sm:p-8 rounded-3xl border-4 text-white shadow-2xl relative overflow-hidden text-center ${
            isCodeBlue
              ? 'border-blue-400 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 shadow-blue-500/50 radar-pulse-blue'
              : 'border-red-500 bg-gradient-to-br from-red-600 via-red-700 to-rose-900 shadow-red-500/50 radar-pulse-red'
          }`}>
            <div className="inline-flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest text-amber-300 mb-2">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
              <span>LIVE HOSPITAL CODE BROADCAST</span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight">
              {code?.code_name}
            </h2>
            <p className="text-base sm:text-xl font-bold text-slate-100 mt-0.5">
              {code?.title}
            </p>

            <div className="mt-5 rounded-2xl bg-white text-slate-900 border-2 border-amber-400 p-4 shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block mb-0.5">
                DISPATCH LOCATION
              </span>
              <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center">
                <MapPin className="h-6 w-6 text-red-600 mr-2 shrink-0 animate-bounce" />
                {activeAlert.location_text}
              </p>
            </div>
          </div>

          {/* Action Card: Send ETA / Mark On Scene */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
              <Navigation className="h-4 w-4 mr-2 text-blue-600" />
              Your Deployment Action ({code?.code_name})
            </h3>

            {!hasResponded ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">
                    Estimated Time of Arrival (ETA):
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 5].map((eta) => (
                      <button
                        key={eta}
                        onClick={() => setSelectedEta(eta)}
                        className={`py-2.5 rounded-xl font-black text-xs transition border ${
                          selectedEta === eta
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ~{eta} Min{eta > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSendResponse}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>I AM RESPONDING TO {code?.code_name} (ETA ~{selectedEta} MIN)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black">Response Registered!</p>
                      <p className="text-[11px] text-emerald-700">Team knows you are responding ({responderRole}).</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-emerald-200 px-2.5 py-1 rounded-lg">
                    {isOnScene ? 'ON SCENE' : `ETA ~${selectedEta}m`}
                  </span>
                </div>

                {!isOnScene && (
                  <button
                    onClick={handleMarkArrived}
                    className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>I HAVE ARRIVED AT {activeAlert.location_text.split('•').pop()?.trim() || 'LOCATION'} (MARK ON-SCENE)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Responders List */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Active Responders ({activeAlert.responders?.length || 0})
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500">Live Team</span>
            </div>

            {activeAlert.responders && activeAlert.responders.length > 0 ? (
              <div className="space-y-2">
                {activeAlert.responders.map((resp) => {
                  const onScene = resp.status === 'ON_SCENE';
                  return (
                    <div
                      key={resp.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                        onScene ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div>
                        <span>{resp.responder_name}</span>
                        <span className="text-[10px] text-slate-500 font-normal ml-1">({resp.role})</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        onScene ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {onScene ? 'ON SCENE' : `ETA ~${resp.eta_minutes}m`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Awaiting First Responder Acknowledgment...
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Standby */
        <div className="text-center py-16 px-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <HeartPulse className="h-12 w-12 text-emerald-500 mx-auto mb-3 animate-pulse" />
          <h2 className="text-xl font-black text-slate-900">NO ACTIVE EMERGENCY CODES</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Stand by for code broadcasting. You will receive alarms and push notifications automatically.
          </p>
        </div>
      )}

    </div>
  );
}
