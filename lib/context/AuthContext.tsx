'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { User, UserRole } from '../db/types';
import PhoneLockOverlay from '@/components/auth/PhoneLockOverlay';

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

  // Phone Lock & Fingerprint / Biometric Security
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
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);

  const biometricEnabledRef = useRef(false);
  biometricEnabledRef.current = isBiometricEnabled;

  const currentUserRef = useRef<User | null>(null);
  currentUserRef.current = currentUser;

  // Check hardware biometric / WebAuthn platform support
  useEffect(() => {
    const checkSupport = async () => {
      if (typeof window === 'undefined') return;
      if ((window as any).AndroidApp?.hasBiometrics) {
        try {
          const hasBio = (window as any).AndroidApp.hasBiometrics();
          setIsBiometricSupported(Boolean(hasBio));
          return;
        } catch {}
      }
      if (
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      ) {
        try {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsBiometricSupported(available);
        } catch {
          setIsBiometricSupported(isRunningStandalone());
        }
      } else {
        setIsBiometricSupported(isRunningStandalone());
      }
    };
    checkSupport();
  }, []);

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

        // Check if biometric is enabled for this user or if app was added to home screen
        const bioKey = `homestay_bio_enabled_${user.id}`;
        const bioDisabledKey = `homestay_bio_disabled_${user.id}`;
        const isBio = localStorage.getItem(bioKey) === 'true';
        const isExplicitlyDisabled = localStorage.getItem(bioDisabledKey) === 'true';
        const isStandalone = isRunningStandalone();

        // When added to home screen / standalone PWA / APK OR if biometric was enabled:
        const shouldEnableLock = (isBio || isStandalone) && !isExplicitlyDisabled;
        if (shouldEnableLock) {
          setIsBiometricEnabled(true);
          biometricEnabledRef.current = true;
          // When opening app when added / enabled, immediately secure with lockscreen
          setIsAppLocked(true);
        }
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

          // If phone lock & fingerprint is active or running in added/standalone mode,
          // immediately lock app upon returning from background (phone locked, app switch, etc.)
          const isStandalone = isRunningStandalone();
          const bioDisabledKey = `homestay_bio_disabled_${user.id}`;
          const isExplicitlyDisabled = localStorage.getItem(bioDisabledKey) === 'true';

          if ((biometricEnabledRef.current || isStandalone) && !isExplicitlyDisabled) {
            if (hiddenStartTime > 0 && Date.now() - hiddenStartTime > 800) {
              setIsAppLocked(true);
            }
          }
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

      // Check biometric preference for this user or if running standalone (when added)
      const isStandalone = isRunningStandalone();
      const bioDisabledKey = `homestay_bio_disabled_${user.id}`;
      const isExplicitlyDisabled = localStorage.getItem(bioDisabledKey) === 'true';
      const isBio = localStorage.getItem(`homestay_bio_enabled_${user.id}`) === 'true';

      const shouldEnable = (isBio || isStandalone) && !isExplicitlyDisabled;
      setIsBiometricEnabled(shouldEnable);
      biometricEnabledRef.current = shouldEnable;
      setIsAppLocked(false);
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

  // Enable Biometrics (WebAuthn Platform or Android Bridge)
  const enableBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    if (typeof window === 'undefined') return { success: false, error: 'Window not available' };
    const user = currentUserRef.current;
    if (!user) return { success: false, error: 'No user session active' };

    try {
      localStorage.setItem(`homestay_bio_enabled_${user.id}`, 'true');
      localStorage.removeItem(`homestay_bio_disabled_${user.id}`);
    } catch (e) {}

    setIsBiometricEnabled(true);
    biometricEnabledRef.current = true;

    // Native Android wrapper bridge check
    if ((window as any).AndroidApp?.authenticateBiometric) {
      try {
        const res = (window as any).AndroidApp.authenticateBiometric();
        if (res === true || res === 'true') {
          return { success: true };
        }
      } catch (e: any) {
        console.warn('AndroidApp biometric note:', e);
      }
    }

    // WebAuthn platform authenticator
    if (window.PublicKeyCredential && typeof navigator.credentials?.create === 'function') {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const userIdBytes = new TextEncoder().encode(user.id || user.phone || 'user');

        const credential = (await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: {
              name: 'Home Stay Hostel',
              id: window.location.hostname,
            },
            user: {
              id: userIdBytes,
              name: user.phone || user.username || 'resident',
              displayName: user.fullName || user.username || user.phone || 'Resident User',
            },
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' }, // ES256
              { alg: -257, type: 'public-key' }, // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
              requireResidentKey: false,
            },
            timeout: 60000,
            attestation: 'none',
          },
        })) as PublicKeyCredential | null;

        if (credential) {
          localStorage.setItem(`homestay_bio_cred_${user.id}`, credential.id);
        }
      } catch (err: any) {
        console.warn('WebAuthn enrollment note:', err);
      }
    }

    return { success: true };
  };

  const disableBiometrics = () => {
    const user = currentUserRef.current;
    if (user && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`homestay_bio_disabled_${user.id}`, 'true');
        localStorage.removeItem(`homestay_bio_enabled_${user.id}`);
        localStorage.removeItem(`homestay_bio_cred_${user.id}`);
      } catch (e) {}
    }
    setIsBiometricEnabled(false);
    biometricEnabledRef.current = false;
    setIsAppLocked(false);
  };

  const verifyBiometrics = async (): Promise<boolean> => {
    const user = currentUserRef.current;
    if (!user || typeof window === 'undefined') return false;

    // 1. Check Android native bridge
    if ((window as any).AndroidApp?.authenticateBiometric) {
      try {
        const res = (window as any).AndroidApp.authenticateBiometric();
        if (res === true || res === 'true') {
          setIsAppLocked(false);
          recordActivity(true);
          return true;
        }
      } catch (err) {
        console.warn('Android native biometric failed:', err);
      }
    }

    // 2. Try WebAuthn platform authenticator
    if (window.PublicKeyCredential && typeof navigator.credentials?.get === 'function') {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const savedCredId = localStorage.getItem(`homestay_bio_cred_${user.id}`);

        const options: CredentialRequestOptions = {
          publicKey: {
            challenge,
            rpId: window.location.hostname,
            userVerification: 'required',
            timeout: 60000,
          },
        };

        if (savedCredId) {
          try {
            const binaryStr = atob(savedCredId.replace(/_/g, '/').replace(/-/g, '+'));
            const len = binaryStr.length;
            const rawIdBytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              rawIdBytes[i] = binaryStr.charCodeAt(i);
            }
            options.publicKey!.allowCredentials = [
              {
                id: rawIdBytes,
                type: 'public-key',
              },
            ];
          } catch {}
        }

        const assertion = await navigator.credentials.get(options);
        if (assertion) {
          setIsAppLocked(false);
          recordActivity(true);
          return true;
        }
      } catch (err: any) {
        console.warn('WebAuthn assertion get note:', err);
        // Fallback: If assertion get failed because credential was not registered, try creating one to prompt fingerprint
        if (typeof navigator.credentials?.create === 'function') {
          try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);
            const userIdBytes = new TextEncoder().encode(user.id || user.phone || 'user');

            const credential = (await navigator.credentials.create({
              publicKey: {
                challenge,
                rp: {
                  name: 'Home Stay Hostel',
                  id: window.location.hostname,
                },
                user: {
                  id: userIdBytes,
                  name: user.phone || user.username || 'resident',
                  displayName: user.fullName || user.username || user.phone || 'Resident User',
                },
                pubKeyCredParams: [
                  { alg: -7, type: 'public-key' },
                  { alg: -257, type: 'public-key' },
                ],
                authenticatorSelection: {
                  authenticatorAttachment: 'platform',
                  userVerification: 'required',
                  requireResidentKey: false,
                },
                timeout: 60000,
                attestation: 'none',
              },
            })) as PublicKeyCredential | null;

            if (credential) {
              localStorage.setItem(`homestay_bio_cred_${user.id}`, credential.id);
              setIsAppLocked(false);
              recordActivity(true);
              return true;
            }
          } catch (createErr) {
            console.warn('WebAuthn create fallback note:', createErr);
          }
        }
      }
    }

    return false;
  };

  const unlockWithPassword = async (password: string): Promise<boolean> => {
    const user = currentUserRef.current;
    if (!user) return false;
    const identifier = user.phone || user.username || user.email || '';
    const res = await loginWithCredentials(identifier, password);
    if (res.success) {
      setIsAppLocked(false);
      recordActivity(true);
      return true;
    }
    return false;
  };

  const unlockApp = () => {
    setIsAppLocked(false);
    recordActivity(true);
  };

  const lockApp = () => {
    setIsAppLocked(true);
  };

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
        isBiometricSupported,
        isBiometricEnabled,
        isAppLocked,
        enableBiometrics,
        disableBiometrics,
        verifyBiometrics,
        unlockWithPassword,
        unlockApp,
        lockApp,
      }}
    >
      <GlobalLockScreenWrapper />
      {children}
    </AuthContext.Provider>
  );
}

function GlobalLockScreenWrapper() {
  const pathname = usePathname();
  const { isAppLocked, currentUser } = useAuth();

  // Don't show lock overlay on public marketing pages or login screen
  if (!isAppLocked || !currentUser || pathname === '/login' || pathname === '/') {
    return null;
  }

  return <PhoneLockOverlay />;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
