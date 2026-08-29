'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellRing, Smartphone, Check, X, ShieldAlert } from 'lucide-react';
import { audioEngine } from '@/lib/audioEngine';

export const ServiceWorkerRegister: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check Notification support
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }

    // Register Service Worker for PWA & Background Alerts
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('CPHB Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration skipped:', err);
        });
    }

    // Catch PWA Install Prompt for Android / iPhone
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('This mobile browser does not support Web Notifications.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        audioEngine.playChime();
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'NOTIFICATIONS_ENABLED' });
        }
        new Notification('🔔 CPHB Emergency Alerts Activated', {
          body: 'You will now receive instant emergency alarms, sirens, and vibrations even when your phone is in background!',
          icon: '/icon.svg',
        });
      }
    } catch (e) {
      console.warn('Could not request notification permission:', e);
    }
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  // If already granted and install dismissed, don't show floating banner
  if (dismissed || (permission === 'granted' && !showInstallBanner)) {
    return null;
  }

  return (
    <div className="fixed top-18 right-4 left-4 sm:left-auto sm:w-96 z-40 animate-fade-in">
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white border border-blue-400/40 shadow-xl backdrop-blur-md">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 animate-pulse">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-200">
                Doctor / Nurse Mobile Alerts
              </h4>
              <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
                Receive instant sirens & vibration alarms even when your phone is locked or in your pocket!
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
          {permission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md flex items-center justify-center space-x-1.5"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Allow Alarm Push 🔔</span>
            </button>
          )}

          {showInstallBanner && deferredPrompt && (
            <button
              onClick={handleInstallApp}
              className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-1.5"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Install App 📲</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
