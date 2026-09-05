'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Forward to the unified Owner Profile & Settings module (Hostel tab)
    router.replace('/dashboard/profile?tab=hostel');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium animate-pulse">Redirecting to Account & Settings...</p>
      </div>
    </div>
  );
}
