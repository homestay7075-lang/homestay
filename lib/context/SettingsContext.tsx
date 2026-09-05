'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HostelSettings } from '../db/types';

interface SettingsContextType {
  settings: HostelSettings;
  hostelName: string;
  isLoading: boolean;
  updateSettings: (updates: Partial<HostelSettings>) => Promise<{ success: boolean; error?: string }>;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: HostelSettings = {
  id: 'settings-1',
  name: 'Green Palms Elite Hostel',
  tagline: 'Modern, Safe & Premium Living for Students & Professionals',
  description: 'Experience premier student living with smart digital management, biometric security, air-conditioned rooms, hygienic dining, and ultra-high-speed fiber Wi-Fi.',
  address: '142 Residency Road, Tech Park Avenue, Koramangala 4th Block',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560034',
  phone: '+91 98765 43210',
  email: 'contact@serenityliving.com',
  website: 'https://serenityliving.com',
  logoUrl: '',
  defaultMonthlyRent: 8500,
  defaultDeposit: 0,
  currency: 'INR',
  currencySymbol: '₹',
  upiId: '9876543210@upi',
  rulesAndPolicies: '1. Biometric entry after 10:30 PM requires warden pre-approval.\n2. Quiet study hours observed between 11:00 PM and 6:00 AM.\n3. Monthly dues payable within 5 days of cycle date.\n4. Non-transferable bed allocation.',
  updatedAt: '2026-09-04T17:03:58.319Z',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: HostelSettings | null;
}) {
  // Deterministic initial state for both SSR and client hydration
  const [settings, setSettings] = useState<HostelSettings>(() => {
    return initialSettings || DEFAULT_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState(!initialSettings);

  const applySettings = useCallback((newSettings: HostelSettings) => {
    setSettings(newSettings);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hostel_settings_cache', JSON.stringify(newSettings));
        if (newSettings.name) {
          document.title = `${newSettings.name} | Hostel & Resident Portal`;
        }
      } catch (e) {
        console.error('Failed to cache settings in localStorage', e);
      }
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          applySettings(data.settings);
        }
      }
    } catch (err) {
      console.error('Failed to fetch hostel settings', err);
    } finally {
      setIsLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    // Check localStorage cache post-mount on client (safe from SSR hydration mismatch)
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('hostel_settings_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          setSettings(parsed);
          if (parsed.name) {
            document.title = `${parsed.name} | Hostel & Resident Portal`;
          }
        }
      } catch (e) {
        console.error('Failed to parse cached settings', e);
      }
    }

    refreshSettings();

    // Listen to custom cross-component update events
    const handleCustomUpdate = (event: any) => {
      if (event.detail) {
        applySettings(event.detail);
      }
    };

    // Listen to storage events from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hostel_settings_cache' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings(parsed);
          if (parsed.name) {
            document.title = `${parsed.name} | Hostel & Resident Portal`;
          }
        } catch (err) {}
      }
    };

    window.addEventListener('hostel_settings_updated', handleCustomUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('hostel_settings_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshSettings, applySettings]);

  const updateSettings = async (updates: Partial<HostelSettings>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (data.success && data.settings) {
        applySettings(data.settings);

        // Broadcast to other components in this window
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hostel_settings_updated', { detail: data.settings }));
        }

        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to update settings' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        hostelName: settings.name || 'My Hostel',
        isLoading,
        updateSettings,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useHostelSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useHostelSettings must be used within a SettingsProvider');
  }
  return context;
}
