import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      versionCode: 3,
      versionName: '1.0.2',
      minSupportedVersion: 1,
      apkUrl: 'https://homestay-homestay7075-langs-projects.vercel.app/downloads/homestay-app.apk',
      githubReleaseUrl: 'https://github.com/homestay7075-lang/homestay/releases/latest',
      releaseNotes: 'Automatic background update support, pull-to-refresh, full-screen native mode, and dark neon theme.',
      forceUpdate: false,
      publishedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
