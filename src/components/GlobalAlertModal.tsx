'use client';

import React, { useEffect, useState } from 'react';
import { EmergencyAlert } from '@/types/emergency';
import { EmergencyService } from '@/lib/supabase';
import { StaffService } from '@/lib/staffService';
import { audioEngine } from '@/lib/audioEngine';
import { Siren, X, Smartphone, Monitor } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export const GlobalAlertModal: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Request notification permission for desktop & mobile alerts
    audioEngine.requestNotificationPermission();

    EmergencyService.init();

    // Check on initial load
    EmergencyService.getActiveAlert().then((alert) => {
      setActiveAlert(alert);
      if (alert) {
        setDismissed(false);
        triggerAlarmEffects(alert);
      }
    });

    // Realtime subscription + cross-tab/cross-device poller
    const unsubscribe = EmergencyService.subscribe((alert, eventType) => {
      if (eventType === 'RESOLVED') {
        setActiveAlert(null);
        audioEngine.stopSiren();
        audioEngine.stopMobileVibration();
      } else if (alert && (alert.status === 'ACTIVE' || alert.status === 'RESPONDING')) {
        setActiveAlert(alert);
        setDismissed(false);
        if (eventType === 'TRIGGERED' || eventType === 'POLL_SYNC') {
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

    // 2. Audible Sound on Desktop & Mobile (if not on monitor page)
    if (pathname !== '/monitor') {
      audioEngine.playChime();
    }

    // 3. Web Push Notification banner for desktop lockscreens
    const codeName = alert.code_details?.code_name || 'EMERGENCY CODE';
    audioEngine.triggerPushNotification(
      `🚨 ${codeName} - ${alert.location_text}`,
      `Patient: ${alert.patient_details?.patient_name || 'Emergency Patient'}. Respond immediately!`
    );
  };

  const handleQuickRespond = async () => {
    if (!activeAlert) return;
    setIsResponding(true);

    const currentStaff = StaffService.getCurrentStaff();
    try {
      await EmergencyService.addResponder({
        alert_id: activeAlert.id,
        responder_name: currentStaff.name,
        role: currentStaff.is_doctor ? 'Physician' : 'Nurse',
        eta_minutes: 2,
      });
      audioEngine.stopMobileVibration();
      audioEngine.stopSiren();
      setDismissed(true);
      router.push('/responder');
    } catch (e) {
      router.push('/responder');
    } finally {
      setIsResponding(false);
    }
  };

  // Don't show modal if on /monitor page (which already has full TV UI), or if dismissed, or if no active alert
  if (pathname === '/monitor' || !activeAlert || dismissed) {
    return null;
  }

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
            onClick={() => {
              setDismissed(true);
              audioEngine.stopMobileVibration();
            }}
            className="text-white/60 hover:text-white p-1 rounded-xl hover:bg-white/10 transition"
            title="Dismiss alert popup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Location & Patient Info Box */}
        <div className="mt-3.5 p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-white/70 font-semibold">Location:</span>
            <span className="font-mono font-black text-amber-300 text-xs sm:text-sm tracking-wide">
              {activeAlert.location_text}
            </span>
          </div>
          {activeAlert.patient_details && (
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <span className="text-white/70 font-semibold">Patient:</span>
              <span className="font-black text-white font-mono uppercase truncate max-w-[220px]">
                {activeAlert.patient_details.patient_name}
              </span>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-4 flex items-center space-x-2">
          <button
            onClick={handleQuickRespond}
            disabled={isResponding}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-black text-xs uppercase tracking-wider text-center transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
          >
            <Smartphone className="h-4 w-4 shrink-0" />
            <span>{isResponding ? 'Connecting...' : 'I Am Responding'}</span>
          </button>

          <Link 
            href="/monitor"
            className="py-3 px-4 rounded-2xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs text-center transition border border-white/20 whitespace-nowrap flex items-center space-x-1.5"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Open Kiosk</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
