'use client';

import React, { useEffect, useState } from 'react';
import { EmergencyAlert } from '@/types/emergency';
import { EmergencyService } from '@/lib/supabase';
import { audioEngine } from '@/lib/audioEngine';
import { Siren, X, Monitor, CheckCircle, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { RescueService } from '@/lib/rescueService';
import { CommunityEmergencyAlert } from '@/types/rescue';

export const GlobalAlertModal: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [activeCommunityAlert, setActiveCommunityAlert] = useState<CommunityEmergencyAlert | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Request notification permission for desktop & mobile alerts
    audioEngine.requestNotificationPermission();

    EmergencyService.init();
    RescueService.init();

    // Check on initial load
    EmergencyService.getActiveAlert().then((alert) => {
      setActiveAlert(alert);
      if (alert) {
        setDismissed(false);
        triggerAlarmEffects(alert);
      }
    });

    const commAlerts = RescueService.getCommunityAlerts().filter(c => c.status !== 'RESOLVED');
    if (commAlerts.length > 0) {
      setActiveCommunityAlert(commAlerts[0]);
    }

    // Realtime subscription + cross-tab/cross-device poller
    const unsubscribe = EmergencyService.subscribe((alert, eventType) => {
      if (eventType === 'RESOLVED') {
        setActiveAlert(null);
      } else if (alert && (alert.status === 'ACTIVE' || alert.status === 'RESPONDING')) {
        setActiveAlert(alert);
        setDismissed(false);
        if (eventType === 'TRIGGERED') {
          triggerAlarmEffects(alert);
        }
      }
    });

    const unsubscribeRescue = RescueService.subscribe((updated) => {
      const active = updated.filter(c => c.status !== 'RESOLVED');
      if (active.length > 0) {
        setActiveCommunityAlert(active[0]);
        setDismissed(false);
      } else {
        setActiveCommunityAlert(null);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeRescue();
    };
  }, []);

  const triggerAlarmEffects = (alert: EmergencyAlert) => {
    // 1. Mobile Haptic Vibration
    audioEngine.startMobileVibration();

    // 2. Web Push Notification banner for desktop lockscreens
    const codeName = alert.code_details?.code_name || 'EMERGENCY CODE';
    audioEngine.triggerPushNotification(
      `🚨 ${codeName} - ${alert.location_text}`,
      `Immediate Code Team deployment required at ${alert.location_text}!`
    );
  };

  const handleAcknowledge = () => {
    setDismissed(true);
    audioEngine.stopMobileVibration();
  };

  // Only suppress on full-screen monitor pages
  if (pathname === '/monitor' || pathname === '/rescue/monitor' || dismissed) {
    return null;
  }

  if (!activeAlert && !activeCommunityAlert) {
    return null;
  }

  if (activeAlert) {
    const code = activeAlert.code_details;
    const isCodeBlue = activeAlert.code_id === 'code_blue' || activeAlert.code_id === 'code_baby_blue';
    const isCodeRed = activeAlert.code_id === 'code_red';

    return (
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[460px] z-50 animate-bounce-short">
        <div className={`p-4 sm:p-5 rounded-3xl border-2 shadow-2xl backdrop-blur-xl ${
          isCodeBlue 
            ? 'bg-blue-950/95 border-blue-400 text-white shadow-blue-600/40' 
            : isCodeRed
            ? 'bg-red-950/95 border-red-400 text-white shadow-red-600/40'
            : 'bg-slate-950/95 border-amber-400 text-white shadow-amber-600/40'
        }`}>
          
          {/* Header Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-2xl animate-pulse shrink-0 ${
                isCodeBlue ? 'bg-blue-600' : isCodeRed ? 'bg-red-600' : 'bg-amber-600'
              }`}>
                <Siren className="h-6 w-6 text-white animate-spin" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 text-white">
                    {code?.code_name || 'CODE ALERT'}
                  </span>
                  <span className="text-xs text-amber-300 font-mono font-bold animate-pulse flex items-center">
                    <span className="h-2 w-2 rounded-full bg-amber-400 inline-block mr-1.5 animate-ping" />
                    ACTIVE ALERT
                  </span>
                </div>
                <h4 className="text-base font-black tracking-tight text-white mt-1">
                  {code?.title || 'Hospital Emergency Code'}
                </h4>
              </div>
            </div>

            <button 
              onClick={handleAcknowledge}
              className="text-white/60 hover:text-white p-1 rounded-xl hover:bg-white/10 transition"
              title="Dismiss alert popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Location Info Box */}
          <div className="mt-3.5 p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white/70 font-semibold">Location:</span>
              <span className="font-mono font-black text-amber-300 text-xs sm:text-sm tracking-wide">
                {activeAlert.location_text}
              </span>
            </div>
          </div>

          {/* Clean Functional Action Buttons */}
          <div className="mt-4 flex items-center space-x-2">
            <Link 
              href="/monitor"
              className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs uppercase tracking-wider text-center transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30"
            >
              <Monitor className="h-4 w-4 shrink-0" />
              <span>Open Emergency Kiosk</span>
            </Link>

            <button
              onClick={handleAcknowledge}
              className="py-3 px-4 rounded-2xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs text-center transition border border-white/20 whitespace-nowrap flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Acknowledge</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  if (activeCommunityAlert) {
    return (
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[460px] z-50 animate-bounce-short">
        <div className="p-4 sm:p-5 rounded-3xl border-2 border-red-500 bg-red-950/95 text-white shadow-2xl shadow-red-600/40 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-red-600 animate-pulse shrink-0">
                <Siren className="h-6 w-6 text-white animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 text-white">
                  BALAMBAN RESCUE 911
                </span>
                <h4 className="text-base font-black tracking-tight text-white mt-1">
                  Brgy. {activeCommunityAlert.barangay_name}
                </h4>
              </div>
            </div>
            <button onClick={handleAcknowledge} className="text-white/60 hover:text-white p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3.5 p-3 rounded-2xl bg-black/40 border border-white/10 text-xs">
            <span className="text-white/70 block">Landmark: <strong className="text-amber-300">{activeCommunityAlert.sitio_or_landmark}</strong></span>
            <span className="text-white/80 block mt-1">{activeCommunityAlert.patient_condition}</span>
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <Link 
              href="/rescue/monitor"
              className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider text-center transition flex items-center justify-center space-x-2"
            >
              <Monitor className="h-4 w-4 shrink-0" />
              <span>Open Rescue Kiosk</span>
            </Link>
            <button
              onClick={handleAcknowledge}
              className="py-3 px-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs text-center border border-white/20"
            >
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
