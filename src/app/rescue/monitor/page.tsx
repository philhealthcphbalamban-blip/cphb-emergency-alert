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
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RefreshCw,
  Tv,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { 
  CommunityEmergencyAlert, 
  CommunityEmergencyType, 
  COMMUNITY_EMERGENCY_DEFS 
} from '@/types/rescue';
import { RescueService } from '@/lib/rescueService';
import { audioEngine } from '@/lib/audioEngine';

export default function BalambanRescueMonitorPage() {
  const [alerts, setAlerts] = useState<CommunityEmergencyAlert[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  const loadAlerts = () => {
    setAlerts(RescueService.getCommunityAlerts());
  };

  useEffect(() => {
    loadAlerts();

    // Keep screen awake for 24/7 Smart TV kiosk
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').catch(() => {});
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);

    const unsubscribe = RescueService.subscribe((updated) => {
      setAlerts(updated);
      const active = updated.filter(a => a.status !== 'RESOLVED');
      if (active.length > 0 && soundEnabled) {
        audioEngine.playChime();
      }
    });

    const poll = setInterval(loadAlerts, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(poll);
      unsubscribe();
    };
  }, [soundEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
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

  const activeAlerts = alerts.filter(a => a.status !== 'RESOLVED');

  return (
    <div className="min-h-screen bg-slate-950 text-white p-3 sm:p-6 space-y-4 flex flex-col justify-between">
      
      {/* Top TV Kiosk Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-red-950 via-slate-900 to-blue-950 p-4 sm:p-5 rounded-3xl border border-red-500/30 shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/50 animate-pulse">
            <Ambulance className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-white">
                MDRRMO Balamban Rescue 911 • TV Command Monitor
              </h1>
              <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center">
                <Radio className="h-3 w-3 mr-1 inline animate-ping" />
                28 Barangays Realtime Dispatch
              </span>
            </div>
            <p className="text-xs text-white/60">
              Balamban Emergency Response • Transcentral Highway Rescue • CPH Balamban ER Trauma Link
            </p>
          </div>
        </div>

        {/* TV Controls & Clock */}
        <div className="flex items-center space-x-2">
          <div className="bg-black/50 border border-white/10 px-3.5 py-1.5 rounded-2xl text-right font-mono">
            <span className="text-xs font-black text-amber-300">{currentTime || 'LIVE DISPATCH'}</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition ${
              soundEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-amber-400 animate-pulse" /> : <VolumeX className="h-4 w-4" />}
            <span>{soundEnabled ? 'Alarm: ON' : 'MUTED'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition"
            title="Toggle TV Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <Link
            href="/monitor"
            className="px-3 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold border border-blue-400/30 transition flex items-center space-x-1"
          >
            <Tv className="h-3.5 w-3.5" />
            <span>Hospital TV</span>
          </Link>
        </div>
      </div>

      {/* Main Screen Content */}
      {activeAlerts.length > 0 ? (
        <div className={`grid gap-4 flex-1 my-2 ${
          activeAlerts.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
        }`}>
          {activeAlerts.map((alert) => {
            const def = COMMUNITY_EMERGENCY_DEFS[alert.emergency_type] || COMMUNITY_EMERGENCY_DEFS.CODE_TRAUMA;
            return (
              <div 
                key={alert.id}
                className="bg-slate-900/90 rounded-3xl border-2 border-red-500 p-6 shadow-2xl flex flex-col justify-between space-y-4 animate-fade-in"
              >
                
                {/* Alert Header */}
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3.5">
                    <div className={`p-3.5 rounded-2xl ${def.accentBg} text-white shadow-lg animate-pulse`}>
                      <Ambulance className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-white/20 text-white">
                          {def.badge}
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 animate-pulse">
                          STATUS: {alert.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                        Brgy. {alert.barangay_name}
                      </h2>
                    </div>
                  </div>

                  <div className="text-right text-xs text-white/70">
                    <Clock className="h-4 w-4 inline mr-1 text-amber-300" />
                    <span>Dispatched: {new Date(alert.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Location & Patient Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10">
                    <span className="text-white/60 font-semibold block text-xs uppercase">Sitio / Specific Location:</span>
                    <p className="font-black text-amber-300 text-base mt-1 flex items-center">
                      <MapPin className="h-4 w-4 text-red-400 mr-1.5 shrink-0" />
                      {alert.sitio_or_landmark}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10">
                    <span className="text-white/60 font-semibold block text-xs uppercase">Caller / Contact Person:</span>
                    <p className="font-bold text-white text-base mt-1">
                      {alert.caller_name} ({alert.caller_phone})
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-sm">
                  <span className="text-white/60 font-semibold block text-xs uppercase">Emergency Condition:</span>
                  <p className="text-white font-bold mt-1 text-base leading-relaxed">
                    {alert.patient_condition}
                  </p>
                </div>

                {/* Dispatched Units */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-white/60 block">
                    Dispatched Responders & Transport Units:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {alert.responding_units.map((unit) => (
                      <div key={unit.unit_id} className="p-3 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-between text-sm">
                        <div>
                          <span className="font-black text-blue-300 text-sm block">{unit.unit_name}</span>
                          <span className="text-xs text-white/80">{unit.driver_or_lead}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ETA ~{unit.eta_mins}m
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hospital Pre-Arrival Banner */}
                <div className="p-3.5 rounded-2xl bg-blue-950/90 border border-blue-500/40 flex items-center justify-between text-sm text-blue-200">
                  <div className="flex items-center space-x-2.5">
                    <Building2 className="h-5 w-5 text-blue-400 shrink-0" />
                    <span>Destination Facility: <strong>{alert.destination_facility}</strong></span>
                  </div>
                  <span className="text-xs font-black text-amber-300 bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-500/40">
                    TRAUMA BAY PREPPED
                  </span>
                </div>

                {/* Quick Status Advance Button */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white/60">
                    Status: <strong className="text-white font-mono">{alert.status}</strong>
                  </span>

                  <button
                    onClick={() => handleAdvanceStatus(alert.id, alert.status)}
                    className="py-2.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition flex items-center space-x-2 shadow-lg"
                  >
                    <span>
                      {alert.status === 'DISPATCHED' && 'Mark En Route 🚑'}
                      {alert.status === 'EN_ROUTE' && 'Mark On Scene 📍'}
                      {alert.status === 'ON_SCENE' && 'Transporting to CPHB 🏥'}
                      {alert.status === 'TRANSPORTING_TO_CPHB' && 'Arrived at CPHB ER 🏁'}
                      {alert.status === 'ARRIVED_AT_CPHB' && 'Clear & Resolve ✓'}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-900/60 rounded-3xl border border-white/10 my-4 space-y-3">
          <div className="p-4 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-black text-white">MDRRMO BALAMBAN RESCUE STANDBY</h2>
          <p className="text-sm text-white/60 max-w-md">
            All 28 Barangays and Transcentral Highway patrol stations are clear. System listening 24/7 for community emergency dispatches.
          </p>
        </div>
      )}

      {/* Footer System Status */}
      <div className="flex flex-wrap items-center justify-between text-xs text-white/50 border-t border-white/10 pt-3">
        <span>Municipality of Balamban Emergency Operations Center</span>
        <span>Connected to CPH Balamban Trauma Emergency Network</span>
      </div>

    </div>
  );
}
