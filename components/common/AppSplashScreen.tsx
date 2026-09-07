'use client';

import React, { useState, useEffect } from 'react';
import { useHostelSettings } from '@/lib/context/SettingsContext';

export default function AppSplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const { hostelName, settings } = useHostelSettings();

  useEffect(() => {
    // Only display splash screen once per browser/app session on opening
    try {
      const hasShown = sessionStorage.getItem('homestay_splash_shown');
      if (!hasShown) {
        setVisible(true);
        sessionStorage.setItem('homestay_splash_shown', 'true');

        const fadeTimer = setTimeout(() => {
          setFading(true);
        }, 1300);

        const removeTimer = setTimeout(() => {
          setVisible(false);
        }, 1800);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(removeTimer);
        };
      }
    } catch {
      // Ignore sessionStorage errors in strict private browsing
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#070a18] text-white transition-opacity duration-500 ease-out select-none cursor-pointer ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="App Splash Screen"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-gradient-to-tr from-indigo-600/25 via-purple-600/20 to-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm animate-in fade-in zoom-in-95 duration-500">
        {/* App Logo with glowing aura */}
        <div className="relative mb-5">
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-indigo-500/40 via-cyan-400/30 to-purple-500/40 blur-xl animate-pulse" />
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-b from-cyan-400/60 via-indigo-500/30 to-purple-500/60 border border-white/20 shadow-2xl relative z-10 overflow-hidden flex items-center justify-center backdrop-blur-md">
            <img
              src="/logo.png"
              alt={hostelName || 'Home Stay App Logo'}
              className="w-full h-full object-cover rounded-[22px] shadow-inner"
            />
          </div>
        </div>

        {/* Hostel / App Name */}
        <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white drop-shadow-md">
          {hostelName || 'Home Stay'}
        </h1>
        <p className="text-[10px] sm:text-[11px] font-bold text-indigo-300/90 uppercase tracking-[0.22em] mt-1 font-mono">
          {settings?.tagline || 'PREMIUM ACCOMMODATION STAY'}
        </p>

        {/* Animated Loading Bar */}
        <div className="w-36 h-1 bg-slate-800/90 rounded-full overflow-hidden mt-8 relative border border-slate-700/60">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-500 rounded-full w-1/2 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
