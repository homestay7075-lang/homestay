import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  const downloadsDir = path.join(process.cwd(), 'public', 'downloads');

  // Candidate APK files that exist on disk
  const candidates = [
    path.join(downloadsDir, 'homestay-app.apk'),
    path.join(downloadsDir, 'homestay-v1.0.0.apk'),
    path.join(downloadsDir, 'homestay-student-v1.0.0.apk'),
    path.join(downloadsDir, 'homestay-owner-v1.0.0.apk'),
  ];

  let filePath = candidates.find((p) => fs.existsSync(p));

  if (!filePath) {
    return NextResponse.redirect(new URL('/downloads/homestay-app.apk', req.url));
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="homestay-app.apk"',
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    return NextResponse.redirect(new URL('/downloads/homestay-app.apk', req.url));
  }
}
