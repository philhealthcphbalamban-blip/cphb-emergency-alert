'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
  Home
} from 'lucide-react';
import { 
  CommunityEmergencyAlert, 
  CommunityEmergencyType, 
  COMMUNITY_EMERGENCY_DEFS 
} from '@/types/rescue';
import { RescueService } from '@/lib/rescueService';
import { audioEngine } from '@/lib/audioEngine';
import { audioController } from '@/lib/audioController';

export default function BalambanRescueMonitorPage() {
  const [alerts, setAlerts] = useState<CommunityEmergencyAlert[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const lastRescueHashRef = useRef<string>('');

  const syncRescueAudio = (list: CommunityEmergencyAlert[]) => {
    const active = list.filter(a => a.status !== 'RESOLVED');
    const hash = active.map(a => `${a.id}_${a.status}`).sort().join(',');
    if (hash !== lastRescueHashRef.current) {
      lastRescueHashRef.current = hash;
      if (active.length > 0 && soundEnabled) {
        audioController.syncCommunityAlerts(active);
      } else {
        audioController.stopAllImmediate();
      }
    }
  };

  const loadAlerts = () => {
    const list = RescueService.getCommunityAlerts();
    setAlerts(list);
    syncRescueAudio(list);
  };

  useEffect(() => {
    // Keep screen awake for 24/7 Smart TV kiosk
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').catch(() => {});
    }

    audioController.unlockAudio();
    loadAlerts();

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);

    const unsubscribe = RescueService.subscribe((updated) => {
      setAlerts(updated);
      syncRescueAudio(updated);
    });

    const poll = setInterval(loadAlerts, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(poll);
      unsubscribe();
      audioController.stopAllImmediate();
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
                MDRRMO Balamban Rescue 911 • TV Command Screen
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
            onClick={() => {
              if (soundEnabled) {
                audioController.stopAllImmediate();
                setSoundEnabled(false);
              } else {
                setSoundEnabled(true);
                audioController.unlockAudio();
                lastRescueHashRef.current = '';
                syncRescueAudio(alerts);
              }
            }}
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
            href="/"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition flex items-center space-x-1.5"
          >
            <Home className="h-3.5 w-3.5" />
            <span>EOC Dashboard</span>
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
                        <span className={`px-3 py-0.5 rounded-md text-xs font-black uppercase text-white ${def.color}`}>
                          {def.title}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase bg-amber-400 text-slate-950">
                          STATUS: {alert.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                        Brgy. {alert.barangay_name}
                      </h2>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-white/50 font-mono block">
                      Dispatched: {new Date(alert.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Location & Caller Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-xs font-bold text-white/60 uppercase flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-red-400" />
                      Sitio / Specific Location:
                    </span>
                    <span className="text-base font-black text-amber-300 block">
                      {alert.sitio_or_landmark}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-xs font-bold text-white/60 uppercase flex items-center">
                      <PhoneCall className="h-3.5 w-3.5 mr-1 text-blue-400" />
                      Caller / Contact Person:
                    </span>
                    <span className="text-base font-black text-white block">
                      {alert.caller_name} ({alert.caller_phone})
                    </span>
                  </div>
                </div>

                {/* Patient Emergency Condition */}
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 space-y-1">
                  <span className="text-xs font-bold text-red-300 uppercase">Emergency Condition:</span>
                  <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                    {alert.patient_condition}
                  </p>
                </div>

                {/* Responding Units & PTVs */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase text-white/60 tracking-wider block">
                    Dispatched Responders & Transport Units:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {alert.responding_units.map((unit) => (
                      <div 
                        key={unit.unit_id} 
                        className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <Car className="h-4 w-4 text-amber-400" />
                          <div>
                            <span className="text-xs font-extrabold text-white block">{unit.unit_name}</span>
                            <span className="text-[10px] text-white/60">{unit.driver_or_lead}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                          ETA ~{unit.eta_mins}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Destination & Action Bar */}
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-xs text-blue-300">
                    <Building2 className="h-4 w-4 text-blue-400" />
                    <span>Destination Facility: <strong>{alert.destination_facility}</strong></span>
                    <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase">
                      Trauma Bay Prepped
                    </span>
                  </div>

                  <button
                    onClick={() => handleAdvanceStatus(alert.id, alert.status)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>
                      {alert.status === 'DISPATCHED' && 'Mark En Route ❯'}
                      {alert.status === 'EN_ROUTE' && 'Mark On Scene ❯'}
                      {alert.status === 'ON_SCENE' && 'Transporting to CPHB ❯'}
                      {alert.status === 'TRANSPORTING_TO_CPHB' && 'Arrived at CPHB ER ❯'}
                      {alert.status === 'ARRIVED_AT_CPHB' && 'Resolve & Clear Incident ✓'}
                    </span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Standby Screen when 0 Active Emergencies */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-5 rounded-3xl border border-white/10 bg-slate-900/40">
          <div className="p-6 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 animate-pulse">
            <CheckCircle2 className="h-16 w-16" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
              All 28 Barangays Normal • System Standby
            </h2>
            <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto mt-2 font-medium">
              No active rescue, highway trauma, or emergency dispatches in Balamban municipality. 
              Listening to 24/7 MDRRMO Radio and Barangay hotline alerts.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono text-white/40 pt-2">
            <span>● 28 Barangay PTVs Ready</span>
            <span>● MDRRMO Alpha & Delta Standby</span>
            <span>● CPHB ER Direct Link Active</span>
          </div>
        </div>
      )}

      {/* TV Screen Footer Bar */}
      <div className="p-3 rounded-2xl bg-black/60 border border-white/10 flex flex-wrap items-center justify-between text-xs text-white/50 px-5">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping mr-2" />
            24/7 Smart TV Broadcast Link Active
          </span>
          <span className="hidden md:inline">Covering: Aliwanay, Arpili, Buanoy, Gaas, Pondol, Poblacion & 22 more</span>
        </div>
        <div className="font-mono text-[11px] text-amber-400">
          MDRRMO Emergency Hotline: (032) 333-2199 / 911
        </div>
      </div>

    </div>
  );
}
