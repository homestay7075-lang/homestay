import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { SettingsProvider } from '@/lib/context/SettingsContext';
import TopDemoBar from '@/components/layout/TopDemoBar';
import { getDatabase } from '@/lib/db/store';

export const metadata: Metadata = {
  title: 'Home Stay - Hostel & Resident Portal Management System',
  description: 'Production-ready, luxury hostel management platform featuring smart room allocation, joining-date automated billing, real-time dues tracking, and native-grade resident mobile app.',
  keywords: 'homestay, hostel management, student accommodation, PG booking, hostel software, room allocation, student billing',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Home Stay',
  },
  icons: {
    icon: '/logo.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4f46e5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialSettings = null;
  try {
    const db = getDatabase();
    initialSettings = db?.settings || null;
  } catch (err) {
    console.error('Failed to load initial settings in RootLayout:', err);
  }

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        <SettingsProvider initialSettings={initialSettings}>
          <AuthProvider>
            <TopDemoBar />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
