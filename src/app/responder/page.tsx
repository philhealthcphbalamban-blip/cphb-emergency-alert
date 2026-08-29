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
  UserCheck
} from 'lucide-react';
import { EmergencyAlert, AlertResponder } from '@/types/emergency';
import { EmergencyService } from '@/lib/supabase';
import { StaffService } from '@/lib/staffService';
import { audioEngine } from '@/lib/audioEngine';
import { IHOMISPatientCard } from '@/components/IHOMISPatientCard';

export default function ResponderPage() {
  const currentStaff = StaffService.getCurrentStaff();
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [responderName, setResponderName] = useState<string>(currentStaff.name);
  const [responderRole, setResponderRole] = useState<AlertResponder['role']>(currentStaff.is_doctor ? 'Physician' : 'Nurse');
  const [selectedEta, setSelectedEta] = useState<number>(2);
  const [hasResponded, setHasResponded] = useState<boolean>(false);
  const [myResponderId, setMyResponderId] = useState<string | null>(null);
  const [isOnScene, setIsOnScene] = useState<boolean>(false);

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

    EmergencyService.getActiveAlert().then((alert) => {
      setActiveAlert(alert);
      checkIfAlreadyResponded(alert);
    });

    const unsubscribe = EmergencyService.subscribe((alert, eventType) => {
      if (eventType === 'RESOLVED') {
        setActiveAlert(null);
        setHasResponded(false);
        setIsOnScene(false);
        setMyResponderId(null);
      } else if (alert && (alert.status === 'ACTIVE' || alert.status === 'RESPONDING')) {
        setActiveAlert(alert);
        checkIfAlreadyResponded(alert);
        if (eventType === 'TRIGGERED') {
          audioEngine.playChime();
        }
      }
    });

    return () => unsubscribe();
  }, [responderName]);

  const checkIfAlreadyResponded = (alert: EmergencyAlert | null) => {
    if (!alert || !alert.responders) return;
    const existing = alert.responders.find(r => r.responder_name === responderName);
    if (existing) {
      setHasResponded(true);
      setMyResponderId(existing.id);
      setIsOnScene(existing.status === 'ON_SCENE');
    }
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
  };

  const handleMarkArrived = async () => {
    if (!activeAlert || !myResponderId) return;
    audioEngine.playChime();
    await EmergencyService.markOnScene(activeAlert.id, myResponderId);
    setIsOnScene(true);
  };

  const code = activeAlert?.code_details;
  const isCodeBlue = activeAlert?.code_id === 'code_blue' || activeAlert?.code_id === 'code_baby_blue';
  const patient = activeAlert?.patient_details;

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
              Mobile Code Responder (CPHB)
            </h1>
            <p className="text-xs text-slate-500">
              Personal Dispatch & Response Acknowledgment • iHOMIS Sync
            </p>
          </div>
        </div>
      </div>

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
                className="bg-transparent text-xs text-slate-900 font-bold w-full focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Medical Role:</label>
            <select
              value={responderRole}
              onChange={(e) => setResponderRole(e.target.value as any)}
              className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none"
            >
              <option value="Physician">Physician / Attending</option>
              <option value="Resident">Resident Physician</option>
              <option value="RT">Respiratory Therapist (RT)</option>
              <option value="Nurse">Staff / ICU Nurse</option>
              <option value="Anesthesiologist">Anesthesiologist</option>
              <option value="Security">Hospital Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Alert Card */}
      {activeAlert ? (
        <div className={`rounded-3xl border-2 p-6 shadow-xl space-y-5 ${
          isCodeBlue 
            ? 'bg-blue-50 border-blue-500' 
            : 'bg-red-50 border-red-500'
        }`}>
          
          {/* Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow">
              <span className="h-2 w-2 rounded-full bg-white animate-ping mr-1" />
              EMERGENCY IN PROGRESS
            </span>
            <span className="text-xs text-slate-600 font-bold font-mono">
              {new Date(activeAlert.triggered_at).toLocaleTimeString()}
            </span>
          </div>

          {/* Title & Location */}
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {code?.code_name}
            </h2>
            <p className="text-sm font-bold text-slate-700 mt-0.5">
              {code?.title}
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 flex items-center space-x-3 shadow-sm">
              <div className="p-3 rounded-xl bg-red-100 text-red-600 shrink-0">
                <MapPin className="h-6 w-6 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-700 block">
                  Target Location
                </span>
                <p className="text-base font-black text-slate-900">
                  {activeAlert.location_text}
                </p>
              </div>
            </div>
          </div>

          {/* Responder Action State */}
          {!hasResponded ? (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-black text-slate-800 block">
                Estimated Time of Arrival (ETA):
              </label>
              
              {/* ETA Selector Pills */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 5].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedEta(mins)}
                    className={`py-3 rounded-xl border text-xs font-black transition ${
                      selectedEta === mins
                        ? 'bg-blue-600 border-blue-700 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    ~{mins} Min{mins > 1 ? 's' : ''}
                  </button>
                ))}
              </div>

              {/* Confirm Respond Button */}
              <button
                type="button"
                onClick={handleSendResponse}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>I Am Responding (ETA ~{selectedEta} min)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-center">
                <span className="text-xs font-black uppercase text-emerald-800 flex items-center justify-center mb-1">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Your Response Is Broadcasted to Central Command
                </span>
                <p className="text-xs font-bold text-emerald-900">
                  Status: <strong>{isOnScene ? 'ARRIVED ON SCENE' : 'EN ROUTE TO ROOM'}</strong>
                </p>
              </div>

              {!isOnScene ? (
                <button
                  type="button"
                  onClick={handleMarkArrived}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
                >
                  <Navigation className="h-5 w-5" />
                  <span>I Have Arrived On Scene</span>
                </button>
              ) : (
                <div className="text-center py-2 text-xs font-black text-emerald-700">
                  ✓ Recorded On Scene by Central Command
                </div>
              )}
            </div>
          )}

          {/* Current Responders in Team */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-xs font-black text-slate-700 block mb-2">
              Other Responding Team Members ({activeAlert.responders?.length || 0}):
            </span>
            <div className="space-y-1.5">
              {activeAlert.responders?.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-white border border-slate-200 shadow-sm"
                >
                  <span className="font-bold text-slate-800">{r.responder_name} ({r.role})</span>
                  <span className="font-bold text-amber-700">
                    {r.status === 'ON_SCENE' ? '✓ On Scene' : `ETA ${r.eta_minutes}m`}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <HeartPulse className="h-12 w-12 text-emerald-600 mx-auto mb-3 animate-pulse" />
          <h3 className="text-lg font-black text-slate-900">No Active Emergency Calls</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You are on standby at CPH Balamban. When a Code Blue or emergency is paged, an audible alert will notify your device.
          </p>
        </div>
      )}

    </div>
  );
}
