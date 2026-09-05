'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../db/types';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole | null;
  isLoading: boolean;
  loginAsUser: (user: User) => void;
  loginWithCredentials: (identifier: string, pass: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check saved session in localStorage
    const saved = localStorage.getItem('homestay_active_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
      } catch (e) {
        console.error('Failed to parse saved user session', e);
      }
    }
    setIsLoading(false);
  }, []);

  const loginAsUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('homestay_active_user', JSON.stringify(user));
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

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('homestay_active_user');
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
