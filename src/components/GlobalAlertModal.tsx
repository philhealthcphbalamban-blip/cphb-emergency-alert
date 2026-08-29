'use client';

import React, { useEffect, useState } from 'react';
import { EmergencyAlert } from '@/types/emergency';
import { EmergencyService } from '@/lib/supabase';
import { Siren, X, ShieldAlert, Users, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const GlobalAlertModal: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    EmergencyService.init();

    EmergencyService.getActiveAlert().then((alert) => {
      setActiveAlert(alert);
      if (alert) setDismissed(false);
    });

    const unsubscribe = EmergencyService.subscribe((alert, eventType) => {
      if (eventType === 'RESOLVED') {
        setActiveAlert(null);
      } else if (alert && (alert.status === 'ACTIVE' || alert.status === 'RESPONDING')) {
        setActiveAlert(alert);
        setDismissed(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

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
              <Siren className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
                  {code?.code_name || 'EMERGENCY CODE'}
                </span>
                <span className="text-xs text-amber-300 font-bold flex items-center">
                  <span className="h-2 w-2 rounded-full bg-amber-400 mr-1 animate-ping" />
                  {activeAlert.status}
                </span>
              </div>
              <h4 className="text-sm font-black text-white mt-1 leading-tight">
                {code?.title}
              </h4>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            title="Dismiss mini banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/15 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-300 block text-[10px] uppercase font-black tracking-wider">Location</span>
            <span className="font-extrabold text-white">{activeAlert.location_text}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-300 block text-[10px] uppercase font-black tracking-wider">Responders</span>
            <span className="font-bold text-emerald-300 flex items-center justify-end">
              <Users className="h-3 w-3 mr-1" />
              {activeAlert.responders?.length || 0} Team Members
            </span>
          </div>
        </div>

        {activeAlert.patient_details && (
          <div className="mt-2 text-[11px] text-amber-200 font-semibold truncate">
            👤 Patient: <strong>{activeAlert.patient_details.patient_name}</strong>
          </div>
        )}

        <div className="mt-3 flex items-center space-x-2">
          <Link
            href="/responder"
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md transition"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Respond Now</span>
          </Link>
          <Link
            href="/monitor"
            className="flex-1 py-2.5 px-3 rounded-xl bg-white text-slate-900 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md hover:bg-slate-100 transition"
          >
            <Volume2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Open Monitor</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
