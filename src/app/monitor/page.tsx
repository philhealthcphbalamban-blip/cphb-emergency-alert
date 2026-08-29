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
  Calendar
} from 'lucide-react';
import { EmergencyAlert, AlertResponder } from '@/types/emergency';
import { EmergencyService } from '@/lib/supabase';
import { audioEngine } from '@/lib/audioEngine';
import { IHOMISPatientCard } from '@/components/IHOMISPatientCard';

export default function MonitorPage() {
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState<boolean>(false);
  const [resolveNotes, setResolveNotes] = useState<string>('Code cleared. Patient stabilized.');
  const [resolverName, setResolverName] = useState<string>('Dr. Santos, MD (Team Lead)');

  const ttsIntervalRef = useRef<any>(null);

  // Initialize Realtime subscription & WakeLock
  useEffect(() => {
    EmergencyService.init();

    // Request Screen Wake Lock for continuous Kiosk display
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').catch((err: any) => {
        console.log('Screen Wake Lock request ignored/not supported:', err);
      });
    }

    EmergencyService.getActiveAlert().then((alert) => {
      setActiveAlert(alert);
      if (alert) handleAlertActivated(alert);
    });

    const unsubscribe = EmergencyService.subscribe((alert, eventType) => {
      if (eventType === 'RESOLVED') {
        stopAllAudio();
        setActiveAlert(null);
      } else if (alert && (alert.status === 'ACTIVE' || alert.status === 'RESPONDING')) {
        setActiveAlert(alert);
        if (eventType === 'TRIGGERED') {
          handleAlertActivated(alert);
        }
      }
    });

    return () => {
      unsubscribe();
      stopAllAudio();
    };
  }, []);

  // Elapsed time counter
  useEffect(() => {
    if (!activeAlert) {
      setElapsedSeconds(0);
      return;
    }

    const start = new Date(activeAlert.triggered_at).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [activeAlert]);

  const handleAlertActivated = (alert: EmergencyAlert) => {
    if (soundEnabled) {
      audioEngine.startSiren(alert.code_details?.siren_pattern || 'hi_lo');
    }
    
    // Announce voice alert
    speakAlertAnnouncement(alert);

    // Repeat voice announcement every 18 seconds
    if (ttsIntervalRef.current) clearInterval(ttsIntervalRef.current);
    ttsIntervalRef.current = setInterval(() => {
      if (ttsEnabled) {
        speakAlertAnnouncement(alert);
      }
    }, 18000);
  };

  const speakAlertAnnouncement = (alert: EmergencyAlert) => {
    const loc = alert.location_text;
    const template = alert.code_details?.tts_template || 'Attention: Emergency code at {location}.';
    const text = template.replace('{location}', loc);
    audioEngine.speak(text);
  };

  const stopAllAudio = () => {
    audioEngine.stopSiren();
    audioEngine.stopSpeech();
    if (ttsIntervalRef.current) {
      clearInterval(ttsIntervalRef.current);
      ttsIntervalRef.current = null;
    }
  };

  const toggleSound = () => {
    if (soundEnabled) {
      audioEngine.stopSiren();
      setSoundEnabled(false);
    } else {
      setSoundEnabled(true);
      if (activeAlert) {
        audioEngine.startSiren(activeAlert.code_details?.siren_pattern || 'hi_lo');
      }
    }
  };

  const toggleTTS = () => {
    if (ttsEnabled) {
      audioEngine.stopSpeech();
      setTtsEnabled(false);
    } else {
      setTtsEnabled(true);
      if (activeAlert) {
        speakAlertAnnouncement(activeAlert);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleConfirmResolve = async () => {
    if (!activeAlert) return;
    stopAllAudio();
    await EmergencyService.resolveAlert({
      alert_id: activeAlert.id,
      resolved_by_name: resolverName,
      resolution_notes: resolveNotes,
      status: 'RESOLVED',
    });
    setResolveDialogOpen(false);
  };

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`;
  };

  const code = activeAlert?.code_details;
  const isCodeBlue = activeAlert?.code_id === 'code_blue' || activeAlert?.code_id === 'code_baby_blue';
  const patient = activeAlert?.patient_details;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 space-y-6">
      
      {/* Top Kiosk Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <Tv className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-wider text-slate-900">
              Central Hospital Monitor Kiosk (CPH Balamban)
            </h1>
            <p className="text-xs text-slate-500">
              High-Visibility Wall Display • Audio Alarm Engine Active • iHOMIS LAN Sync
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
            <span>TTS Voice: {ttsEnabled ? 'ON' : 'MUTED'}</span>
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
      {activeAlert ? (
        <div className="space-y-6">
          
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
                {activeAlert.location_text}
              </p>
            </div>

            {/* Elapsed Time & Triggered By */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm font-bold">
              <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/20 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-amber-300 animate-spin" />
                <span className="text-slate-200">Elapsed Time:</span>
                <span className="font-mono text-xl text-amber-300 font-black">{formatElapsed(elapsedSeconds)}</span>
              </div>
              <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/20 text-slate-200">
                Triggered By: <span className="text-white font-bold">{activeAlert.triggered_by_name} ({activeAlert.triggered_by_role})</span>
              </div>
            </div>

          </div>

          {/* iHOMIS LIVE PATIENT RECORD SECTION */}
          {patient && (
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center">
                <Building className="h-4 w-4 text-blue-600 mr-1.5" />
                iHOMIS Plus Admitted Patient Context (Live at Scene)
              </span>
              <IHOMISPatientCard patient={patient} />
            </div>
          )}

          {/* RESPONDERS DISPATCH BOARD & LIVE ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Responders List (8 cols) */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-black text-slate-900">
                    Code Team Responders ({activeAlert.responders?.length || 0})
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">Live Status Tracking</span>
              </div>

              {activeAlert.responders && activeAlert.responders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeAlert.responders.map((resp) => {
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
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm font-black text-slate-900">
                              {resp.responder_name}
                            </span>
                          </div>
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
                    On-call physicians and code team are receiving alerts.
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
                    onClick={() => setResolveDialogOpen(true)}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Clear & Resolve Code</span>
                  </button>

                  <button
                    onClick={() => {
                      audioEngine.stopSiren();
                      audioEngine.stopSpeech();
                    }}
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
            System Online & Listening to Realtime Dispatch
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
            When a Nurse or Doctor triggers a Code Blue, Baby Blue, or Code Red, this screen will immediately flash and broadcast sirens with automated voice directions and iHOMIS Plus patient data.
          </p>
        </div>
      )}

      {/* RESOLVE DIALOG MODAL */}
      {resolveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Resolve Emergency Code</h3>
                <p className="text-xs text-slate-500">Mark incident as completed & log resolution</p>
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

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setResolveDialogOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition"
              >
                Confirm Stand Down
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
