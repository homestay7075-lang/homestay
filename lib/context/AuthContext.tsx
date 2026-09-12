'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { User, UserRole } from '../db/types';
// 6 Days Inactivity Timeout in milliseconds (6 * 24 * 60 * 60 * 1000)
export const INACTIVITY_TIMEOUT_MS = 6 * 24 * 60 * 60 * 1000; // 518,400,000 ms

/**
 * Robust standalone / "added to home screen" / installed mobile app detection
 */
export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Standard CSS display-mode media queries
  const isStandaloneMedia =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches;

  // 2. iOS Safari standalone flag
  const isIOSStandalone = (window.navigator as any).standalone === true;

  // 3. Android TWA / WebView / Native wrapper environment
  const isAndroidApp =
    document.referrer.startsWith('android-app://') ||
    /wv|WebView/i.test(window.navigator.userAgent) ||
    Boolean((window as any).AndroidApp);

  // 4. URL query parameters indicating installed PWA or APK launch
  const urlParams = window.location.search;
  const isUrlStandalone =
    urlParams.includes('source=pwa') ||
    urlParams.includes('mode=standalone') ||
    urlParams.includes('source=apk') ||
    urlParams.includes('standalone=true');

  // 5. Local storage flag set when user installed or added app to home screen
  const wasAddedToHomeScreen =
    localStorage.getItem('homestay_app_installed') === 'true' ||
    localStorage.getItem('homestay_added_to_homescreen') === 'true';

  return isStandaloneMedia || isIOSStandalone || isAndroidApp || isUrlStandalone || wasAddedToHomeScreen;
}

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole | null;
  isLoading: boolean;
  loginAsUser: (user: User) => void;
  loginWithCredentials: (identifier: string, pass: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: (reason?: string | any) => void;
  switchRoleQuick: (role: UserRole) => void;

  // Phone Lock & Fingerprint (Disabled)
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  isAppLocked: boolean;
  enableBiometrics: () => Promise<{ success: boolean; error?: string }>;
  disableBiometrics: () => void;
  verifyBiometrics: () => Promise<boolean>;
  unlockWithPassword: (password: string) => Promise<boolean>;
  unlockApp: () => void;
  lockApp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserRef = useRef<User | null>(null);
  currentUserRef.current = currentUser;

  // Update activity timestamp in localStorage (throttled to at most once every 30s)
  const lastWriteTimeRef = useRef<number>(Date.now());
  const recordActivity = (force: boolean = false) => {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    if (force || now - lastWriteTimeRef.current > 30000) {
      lastWriteTimeRef.current = now;
      try {
        localStorage.setItem('homestay_last_active', String(now));
      } catch (e) {}
    }
  };

  const checkInactivityExpired = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const lastActiveStr = localStorage.getItem('homestay_last_active');
      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        if (!isNaN(lastActive) && Date.now() - lastActive > INACTIVITY_TIMEOUT_MS) {
          return true;
        }
      }
    } catch (e) {}
    return false;
  };

  // Initialize session & enforce 6-day inactivity limit + phone lock when added
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Check if inactivity has exceeded 6 days
    if (checkInactivityExpired()) {
      console.warn('Session expired: Inactive for > 6 days. Automatically signing out.');
      try {
        localStorage.removeItem('homestay_active_user');
        localStorage.removeItem('homestay_last_active');
      } catch (e) {}
      setCurrentUser(null);
      setIsLoading(false);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?reason=expired';
      }
      return;
    }

    // Restore active session
    const saved = localStorage.getItem('homestay_active_user');
    if (saved) {
      try {
        const user: User = JSON.parse(saved);
        setCurrentUser(user);
        currentUserRef.current = user;

        // Refresh last active timestamp
        recordActivity(true);
      } catch (e) {
        console.error('Failed to parse saved user session', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Global activity listeners & visibility handler (auto-lock on app resume)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserInteraction = () => {
      if (currentUserRef.current) {
        recordActivity();
      }
    };

    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });

    let hiddenStartTime = 0;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenStartTime = Date.now();
      } else if (document.visibilityState === 'visible') {
        // App returned to foreground
        const user = currentUserRef.current;
        if (user) {
          if (checkInactivityExpired()) {
            logout('expired');
            return;
          }
          recordActivity(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loginAsUser = (user: User) => {
    setCurrentUser(user);
    currentUserRef.current = user;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('homestay_active_user', JSON.stringify(user));
        localStorage.setItem('homestay_last_active', String(Date.now()));
      } catch (e) {}

      // Clean up legacy biometric/phone lock keys if present
      try {
        localStorage.removeItem(`homestay_bio_enabled_${user.id}`);
        localStorage.removeItem(`homestay_bio_disabled_${user.id}`);
        localStorage.removeItem(`homestay_bio_cred_${user.id}`);
      } catch (e) {}
    }
  };

  const loginWithCredentials = async (identifier: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        loginAsUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection failed' };
    }
  };

  const logout = (reason?: string | any) => {
    setCurrentUser(null);
    currentUserRef.current = null;
    setIsAppLocked(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('homestay_active_user');
        localStorage.removeItem('homestay_last_active');
        sessionStorage.clear();
      } catch (e) {}
      const reasonStr = typeof reason === 'string' ? reason : undefined;
      window.location.href = reasonStr ? `/login?reason=${encodeURIComponent(reasonStr)}` : '/login';
    }
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  const switchRoleQuick = async (role: UserRole) => {
    try {
      const res = await fetch(`/api/auth/switch-role?role=${role}`);
      const data = await res.json();
      if (data.user) {
        loginAsUser(data.user);
      }
    } catch (err) {
      console.error('Failed to switch role', err);
    }
  };

  // Phone Lock & Fingerprint (Disabled)
  const enableBiometrics = async (): Promise<{ success: boolean; error?: string }> => ({
    success: false,
    error: 'Phone lock is disabled',
  });
  const disableBiometrics = () => {};
  const verifyBiometrics = async (): Promise<boolean> => true;
  const unlockWithPassword = async (_password: string): Promise<boolean> => true;
  const unlockApp = () => {};
  const lockApp = () => {};

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser ? currentUser.role : null,
        isLoading,
        loginAsUser,
        loginWithCredentials,
        logout,
        switchRoleQuick,
        isBiometricSupported: false,
        isBiometricEnabled: false,
        isAppLocked: false,
        enableBiometrics,
        disableBiometrics,
        verifyBiometrics,
        unlockWithPassword,
        unlockApp,
        lockApp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
