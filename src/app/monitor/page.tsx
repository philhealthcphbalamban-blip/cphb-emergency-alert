'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Users, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  MapPin, 
  Maximize2, 
  Minimize2,
  HeartPulse,
  Building,
  Calendar,
  Layers
} from 'lucide-react';
import { EmergencyAlert, AlertResponder } from '@/types/emergency';
import { EmergencyService } from '@/lib/supabase';
import { audioEngine } from '@/lib/audioEngine';
import { HospitalService } from '@/lib/hospitalService';
import { StaffService } from '@/lib/staffService';

import { audioController } from '@/lib/audioController';

export default function MonitorPage() {
  const [activeHospital, setActiveHospital] = useState(HospitalService.getActiveHospital());
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({});
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Resolve modal state
  const [resolvingAlert, setResolvingAlert] = useState<EmergencyAlert | null>(null);
  const [resolveNotes, setResolveNotes] = useState<string>('Code cleared. Patient stabilized.');
  const [resolverName, setResolverName] = useState<string>('Dr. Santos, MD (Team Lead)');

  const lastAlertsHashRef = useRef<string>('');

  const fetchActiveAlerts = async () => {
    const list = await EmergencyService.getActiveAlerts(activeHospital.id);
    setActiveAlerts(list);

    const newHash = list.map(a => a.id).sort().join(',');

    if (newHash !== lastAlertsHashRef.current) {
      lastAlertsHashRef.current = newHash;
      audioController.syncAlerts(list);
    }
  };

  useEffect(() => {
    EmergencyService.init();

    // Request Screen Wake Lock for continuous Kiosk display
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').catch(() => {});
    }

    const currentStaff = StaffService.getCurrentStaff();
    if (currentStaff) {
      setResolverName(`${currentStaff.name} (${currentStaff.role})`);
    }

    fetchActiveAlerts();

    const handleHospChange = (e: any) => {
      if (e.detail) {
        setActiveHospital(e.detail);
        lastAlertsHashRef.current = '';
      }
    };
    window.addEventListener('cph_hospital_changed', handleHospChange);

    const unsubscribe = EmergencyService.subscribe(() => {
      fetchActiveAlerts();
    });

    const pollInterval = setInterval(() => {
      fetchActiveAlerts();
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      window.removeEventListener('cph_hospital_changed', handleHospChange);
      audioController.stopAllImmediate();
    };
  }, [activeHospital.id]);

  // Elapsed time counters for all active alerts
  useEffect(() => {
    if (activeAlerts.length === 0) {
      setElapsedTimes({});
      return;
    }

    const updateTimers = () => {
      const now = Date.now();
      const updated: Record<string, number> = {};
      activeAlerts.forEach((alert) => {
        const start = new Date(alert.triggered_at).getTime();
        updated[alert.id] = Math.max(0, Math.floor((now - start) / 1000));
      });
      setElapsedTimes(updated);
    };

    updateTimers();
    const timer = setInterval(updateTimers, 1000);
    return () => clearInterval(timer);
  }, [activeAlerts]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioController.setMuted(!next);
    if (next && activeAlerts.length > 0) {
      audioController.syncAlerts(activeAlerts);
    }
  };

  const toggleTTS = () => {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    audioController.setVoiceDisabled(!next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolvingAlert) return;
    
    // Instant 0ms audio termination
    audioController.stopAllImmediate();

    await EmergencyService.resolveAlert({
      alert_id: resolvingAlert.id,
      resolved_by_name: resolverName,
      resolution_notes: resolveNotes,
      status: 'RESOLVED',
    });

    setResolvingAlert(null);
    await fetchActiveAlerts();
  };

  const formatElapsed = (sec: number | undefined) => {
    if (sec === undefined) return '00:00';
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Top Kiosk Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <Tv className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black uppercase tracking-wider text-slate-900">
                Central Monitor Kiosk — {activeHospital.name}
              </h1>
              {activeAlerts.length > 1 && (
                <span className="bg-red-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center space-x-1">
                  <Layers className="h-3 w-3 inline mr-1" />
                  {activeAlerts.length} Active Codes (Split View)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              High-Visibility Screen • Multi-Code Concurrent Broadcast Engine • 24/7 LAN Sync
            </p>
          </div>
        </div>

        {/* Display Controls */}
        <div className="flex items-center space-x-2">
          
          {/* Siren Audio Toggle */}
          <button
            onClick={toggleSound}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition ${
              soundEnabled
                ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-amber-600 animate-pulse" /> : <VolumeX className="h-4 w-4" />}
            <span>Siren: {soundEnabled ? 'ON' : 'MUTED'}</span>
          </button>

          {/* TTS Voice Toggle */}
          <button
            onClick={toggleTTS}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition ${
              ttsEnabled
                ? 'bg-blue-100 border-blue-300 text-blue-900 shadow-sm'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            {ttsEnabled ? <Mic className="h-4 w-4 text-blue-600" /> : <MicOff className="h-4 w-4" />}
            <span>Voice: {ttsEnabled ? 'ON' : 'MUTED'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeAlerts.length > 0 ? (
        activeAlerts.length === 1 ? (
          /* SINGLE HIGH VISIBILITY CODE BANNER */
          (() => {
            const singleAlert = activeAlerts[0];
            const code = singleAlert.code_details;
            const isCodeBlue = singleAlert.code_id === 'code_blue' || singleAlert.code_id === 'code_baby_blue';
            const elapsed = elapsedTimes[singleAlert.id];

            return (
              <div className="space-y-6 animate-fade-in">
                
                {/* HIGH VISIBILITY EMERGENCY CODE BANNER */}
                <div className={`relative overflow-hidden rounded-3xl border-4 p-8 sm:p-10 shadow-2xl text-center text-white ${
                  isCodeBlue
                    ? 'border-blue-400 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 shadow-blue-500/50 radar-pulse-blue'
                    : 'border-red-500 bg-gradient-to-br from-red-600 via-red-700 to-rose-900 shadow-red-500/50 radar-pulse-red'
                }`}>
                  
                  {/* Top Status Header */}
                  <div className="inline-flex items-center space-x-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 text-xs sm:text-sm font-black uppercase tracking-widest text-amber-300 mb-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400 animate-ping mr-1" />
                    <span>ACTIVE EMERGENCY BROADCAST IN PROGRESS</span>
                  </div>

                  {/* Huge Code Name */}
                  <h2 className="text-5xl sm:text-8xl font-black text-white uppercase tracking-tight drop-shadow-md">
                    {code?.code_name}
                  </h2>

                  <p className="text-xl sm:text-3xl font-black text-slate-100 mt-1 tracking-wide drop-shadow-sm">
                    {code?.title}
                  </p>

                  {/* Giant Location Card */}
                  <div className="mt-6 mx-auto max-w-3xl rounded-2xl bg-white text-slate-900 border-4 border-amber-400 p-4 sm:p-6 shadow-2xl">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-700 block mb-1">
                      DISPATCH LOCATION
                    </span>
                    <p className="text-2xl sm:text-5xl font-black text-slate-900 tracking-tight flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-red-600 mr-2 shrink-0 animate-bounce" />
                      {singleAlert.location_text}
                    </p>
                  </div>

                  {/* Elapsed Time & Triggered By */}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm font-bold">
                    <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/20 flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-amber-300 animate-spin" />
                      <span className="text-slate-200">Elapsed Time:</span>
                      <span className="font-mono text-xl text-amber-300 font-black">{formatElapsed(elapsed)}</span>
                    </div>
                    <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/20 text-slate-200">
                      Triggered By: <span className="text-white font-bold">{singleAlert.triggered_by_name} ({singleAlert.triggered_by_role})</span>
                    </div>
                  </div>

                </div>

                {/* RESPONDERS DISPATCH BOARD & LIVE ACTIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Responders List (8 cols) */}
                  <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-base font-black text-slate-900">
                          Code Team Responders ({singleAlert.responders?.length || 0})
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">Live Status Tracking</span>
                    </div>

                    {singleAlert.responders && singleAlert.responders.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {singleAlert.responders.map((resp) => {
                          const isOnScene = resp.status === 'ON_SCENE';
                          return (
                            <div
                              key={resp.id}
                              className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
                                isOnScene
                                  ? 'bg-emerald-50 border-emerald-300'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div>
                                <span className="text-sm font-black text-slate-900">
                                  {resp.responder_name}
                                </span>
                                <p className="text-xs font-bold text-slate-600">
                                  {resp.role}
                                </p>
                              </div>

                              <div className="text-right">
                                {isOnScene ? (
                                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-300 flex items-center">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    ON SCENE
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 border border-amber-300">
                                    ETA ~{resp.eta_minutes} min
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-10 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                        <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">
                          Awaiting First Responder Acknowledgment...
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          On-call physicians and code team are receiving push alerts.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Stand Down Actions (4 cols) */}
                  <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900 mb-1">
                        Code Control Station
                      </h3>
                      <p className="text-xs text-slate-500 mb-5">
                        Authorize resolution or stand down once patient resuscitation is complete.
                      </p>

                      <div className="space-y-3">
                        <button
                          onClick={() => setResolvingAlert(singleAlert)}
                          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          <span>Clear & Resolve Code</span>
                        </button>

                        <button
                          onClick={() => audioController.stopAllImmediate()}
                          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
                        >
                          Mute Alarm Sirens Temporarily
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center font-semibold">
                      Hospital Protocol Compliant • All Actions Time-Stamped
                    </div>
                  </div>

                </div>

              </div>
            );
          })()
        ) : (
          /* MULTI-CODE SPLIT SCREEN GRID (2 OR MORE ACTIVE CODES) */
          <div className="space-y-4 animate-fade-in">
            <div className="p-3 bg-red-600 text-white rounded-2xl flex items-center justify-between font-black text-xs uppercase tracking-wider shadow-md">
              <span className="flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 animate-bounce" />
                <span>MULTIPLE CONCURRENT EMERGENCY CODES IN PROGRESS ({activeAlerts.length} ACTIVE)</span>
              </span>
              <span className="text-[11px] bg-red-800 px-3 py-1 rounded-lg">Split Screen Dispatch Mode</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeAlerts.map((alert, idx) => {
                const code = alert.code_details;
                const isCodeBlue = alert.code_id === 'code_blue' || alert.code_id === 'code_baby_blue';
                const elapsed = elapsedTimes[alert.id];

                return (
                  <div 
                    key={alert.id}
                    className="rounded-3xl border-4 bg-white overflow-hidden shadow-2xl flex flex-col justify-between"
                    style={{ borderColor: code?.color_hex || '#2563eb' }}
                  >
                    {/* Header Banner */}
                    <div 
                      className="p-6 text-white text-center shadow-md relative"
                      style={{ backgroundColor: code?.color_hex || '#2563eb' }}
                    >
                      <div className="inline-flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-300 mb-2">
                        <span className="h-2 w-2 rounded-full bg-red-400 animate-ping mr-1" />
                        <span>ACTIVE EMERGENCY #{idx + 1}</span>
                      </div>

                      <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight drop-shadow-md">
                        {code?.code_name}
                      </h2>
                      <p className="text-base sm:text-lg font-extrabold text-white/90 mt-0.5">
                        {code?.title}
                      </p>

                      {/* Location Box */}
                      <div className="mt-4 rounded-xl bg-white text-slate-900 p-3.5 shadow-md border-2 border-amber-400">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                          DISPATCH LOCATION
                        </span>
                        <p className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center mt-0.5">
                          <MapPin className="h-5 w-5 text-red-600 mr-1.5 shrink-0 animate-bounce" />
                          {alert.location_text}
                        </p>
                      </div>

                      {/* Timer */}
                      <div className="mt-3 flex items-center justify-center space-x-2 text-xs font-bold bg-black/30 py-1.5 px-3 rounded-lg w-fit mx-auto">
                        <Clock className="h-3.5 w-3.5 text-amber-300 animate-spin" />
                        <span>Elapsed Time:</span>
                        <span className="font-mono text-base font-black text-amber-300">{formatElapsed(elapsed)}</span>
                      </div>
                    </div>

                    {/* Responders & Control */}
                    <div className="p-5 space-y-4 bg-slate-50 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1 text-blue-600" />
                            Responders ({alert.responders?.length || 0})
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">Live Team</span>
                        </div>

                        {alert.responders && alert.responders.length > 0 ? (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {alert.responders.map((r) => (
                              <div key={r.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-bold">
                                <span>{r.responder_name} <span className="text-[10px] text-slate-500 font-normal">({r.role})</span></span>
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                  {r.status === 'ON_SCENE' ? 'ON SCENE' : `ETA ~${r.eta_minutes}m`}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 rounded-xl bg-white border border-dashed border-slate-200 text-xs text-slate-500 font-bold">
                            Awaiting Responders...
                          </div>
                        )}
                      </div>

                      {/* Stand down button for this specific alert */}
                      <button
                        onClick={() => setResolvingAlert(alert)}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Clear / Resolve {code?.code_name}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        /* Standby / Idle Monitor Screen */
        <div className="text-center py-20 px-6 rounded-3xl bg-white border border-slate-200 shadow-sm my-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 mb-6 shadow-inner">
            <HeartPulse className="h-12 w-12 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            CENTRAL MONITOR STANDBY
          </h2>
          <p className="text-base text-emerald-700 font-bold mt-1.5">
            System Online & Listening to Realtime Dispatch ({activeHospital.name})
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
            When a Nurse or Doctor triggers a Code Blue, Baby Blue, or Code Red, this screen will immediately flash and broadcast sirens with automated voice directions. Multiple simultaneous codes will automatically activate Split-Screen mode!
          </p>
        </div>
      )}

      {/* RESOLVE DIALOG MODAL */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Resolve {resolvingAlert.code_details?.code_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Location: {resolvingAlert.location_text}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Resolved By (Team Lead Name):
              </label>
              <input
                type="text"
                value={resolverName}
                onChange={(e) => setResolverName(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Resolution Notes / Outcome:
              </label>
              <textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                placeholder="e.g. ROSC achieved. Patient stabilized and transferred to CCU."
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setResolvingAlert(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md transition flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm Stand Down</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
