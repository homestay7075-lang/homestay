'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle2, Share2, PlusSquare, X } from 'lucide-react';

interface InstallPwaButtonProps {
  label?: string;
  className?: string;
  variant?: 'button' | 'compact' | 'card';
}

export default function InstallPwaButton({
  label = 'Install App',
  className = '',
  variant = 'button',
}: InstallPwaButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if running in standalone PWA, APK, TWA, or installed mode
    const checkIsInstalled = () => {
      if (typeof window === 'undefined') return false;

      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches;

      const isIOSStandalone = (window.navigator as any).standalone === true;

      const isAppEnvironment =
        document.referrer.startsWith('android-app://') ||
        /wv|WebView/i.test(window.navigator.userAgent) ||
        window.location.search.includes('source=pwa') ||
        window.location.search.includes('mode=standalone') ||
        window.location.search.includes('source=apk');

      return isStandaloneMode || isIOSStandalone || isAppEnvironment;
    };

    if (checkIsInstalled()) {
      setIsStandalone(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture standard PWA beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsStandalone(true);
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayChange);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback for browsers without direct prompt
      alert(
        'To install this app on your device:\n1. Open your browser menu (⋮ or Share)\n2. Select "Install app" or "Add to Home Screen"'
      );
    }
  };

  // Only show install option in website view. If installed / standalone / APK, do not show anything.
  if (!mounted || isStandalone) {
    return null;
  }

  return (
    <>
      {variant === 'card' ? (
        <div className={`p-5 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-850 to-slate-900 text-white shadow-xl space-y-4 border border-indigo-500/30 ${className}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Home Stay Logo"
                className="w-12 h-12 rounded-2xl shadow-lg border border-white/20 object-cover shrink-0"
              />
              <div>
                <h4 className="font-bold text-base text-white font-display">Home Stay</h4>
                <p className="text-xs text-indigo-200">
                  Official Hostel & Resident App
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install Home Stay App</span>
          </button>
        </div>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-2 transition ${className}`}
          title="Download and install Home Stay to home screen"
        >
          <img src="/logo.png" alt="Logo" className="w-4 h-4 rounded-md object-cover" />
          <span>{label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition ${className}`}
        >
          <img src="/logo.png" alt="Logo" className="w-4 h-4 rounded-md object-cover" />
          <span>{label}</span>
        </button>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Home Stay Logo"
                  className="w-9 h-9 rounded-xl shadow-xs border border-slate-200 object-cover"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight font-display">
                    Home Stay
                  </h3>
                  <p className="text-[10px] text-slate-500">Install on iPhone / iPad</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="text-xs space-y-2.5 text-slate-600 leading-relaxed list-decimal list-inside bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <li>
                Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-1 text-indigo-600" /> at the bottom of Safari.
              </li>
              <li>
                Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-indigo-600" />.
              </li>
              <li>
                Tap <strong>Add</strong> in the top-right corner to place the app on your home screen.
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
