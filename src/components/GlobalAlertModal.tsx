'use client';

import React, { useEffect, useState } from 'react';
import { EmergencyAlert } from '@/types/emergency';
import { EmergencyService } from '@/lib/supabase';
import { audioEngine } from '@/lib/audioEngine';
import { Siren, X, ShieldAlert, Users, Volume2, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const GlobalAlertModal: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Request notification permission for phone alerts
    audioEngine.requestNotificationPermission();

    EmergencyService.init();

    EmergencyService.getActiveAlert().then((alert) => {
      setActiveAlert(alert);
      if (alert) {
        setDismissed(false);
        triggerAlarmEffects(alert);
      }
    });

    const unsubscribe = EmergencyService.subscribe((alert, eventType) => {
      if (eventType === 'RESOLVED') {
        setActiveAlert(null);
        audioEngine.stopSiren();
        audioEngine.stopMobileVibration();
      } else if (alert && (alert.status === 'ACTIVE' || alert.status === 'RESPONDING')) {
        setActiveAlert(alert);
        setDismissed(false);
        if (eventType === 'TRIGGERED') {
          triggerAlarmEffects(alert);
        }
      }
    });

    return () => {
      unsubscribe();
      audioEngine.stopSiren();
    };
  }, []);

  const triggerAlarmEffects = (alert: EmergencyAlert) => {
    // 1. Mobile Haptic Vibration
    audioEngine.startMobileVibration();

    // 2. Audible Sirens (if not on monitor page)
    if (pathname !== '/monitor') {
      audioEngine.playChime();
    }

    // 3. Web Push Notification banner
    const codeName = alert.code_details?.code_name || 'EMERGENCY CODE';
    audioEngine.triggerPushNotification(
      `🚨 ${codeName} - ${alert.location_text}`,
      `Triggered by ${alert.triggered_by_name}. Respond immediately!`
    );
  };

  if (pathname === '/monitor' || !activeAlert || dismissed) {
    return null;
  }

  const code = activeAlert.code_details;
  const isCodeBlue = activeAlert.code_id === 'code_blue' || activeAlert.code_id === 'code_baby_blue';

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[460px] z-50 animate-bounce-short">
      <div className={`p-5 rounded-2xl border-2 shadow-2xl ${
        isCodeBlue 
          ? 'bg-blue-900 border-blue-400 text-white shadow-blue-500/30' 
          : 'bg-red-900 border-red-400 text-white shadow-red-500/30'
      }`}>
        <div className="flex items-start justify-between">
          
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl animate-pulse ${isCodeBlue ? 'bg-blue-600' : 'bg-red-600'}`}>
              <Siren className="h-6 w-6 text-white animate-spin" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
                  {code?.code_name || 'EMERGENCY CODE'}
                </span>
                <span className="text-xs text-amber-300 font-mono font-bold animate-pulse">
                  ● ACTIVE ALERT
                </span>
              </div>
              <h4 className="text-base font-black tracking-tight text-white mt-1">
                {code?.title}
              </h4>
            </div>
          </div>

          <button 
            onClick={() => {
              setDismissed(true);
              audioEngine.stopMobileVibration();
            }}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10"
            title="Dismiss popup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/10 space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/70">Location:</span>
            <span className="font-extrabold text-amber-300 font-mono text-sm">{activeAlert.location_text}</span>
          </div>
          {activeAlert.patient_details && (
            <div className="flex justify-between items-center text-xs pt-1 border-t border-white/10">
              <span className="text-white/70">Patient:</span>
              <span className="font-bold text-white truncate max-w-[200px]">{activeAlert.patient_details.patient_name}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center space-x-2">
          <Link 
            href="/responder"
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider text-center transition flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>I Am Responding</span>
          </Link>
          <Link 
            href="/monitor"
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs text-center transition border border-white/20"
          >
            Open Kiosk
          </Link>
        </div>

      </div>
    </div>
  );
};
