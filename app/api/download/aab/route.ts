import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get('role') || 'single').toLowerCase();
  const format = (searchParams.get('format') || 'aab').toLowerCase();

  const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
  const unifiedAab = path.join(downloadsDir, 'homestay-release.aab');
  const unifiedApk = path.join(downloadsDir, 'homestay-v1.0.0.apk');
  const studentAab = path.join(downloadsDir, 'homestay-student-release.aab');
  const studentApk = path.join(downloadsDir, 'homestay-student-v1.0.0.apk');

  // Auto-provision unified files from release base if not already created
  if (!fs.existsSync(unifiedAab) && fs.existsSync(studentAab)) {
    try {
      fs.copyFileSync(studentAab, unifiedAab);
    } catch (e) {
      console.error('Failed copying unified aab', e);
    }
  }

  if (!fs.existsSync(unifiedApk) && fs.existsSync(studentApk)) {
    try {
      fs.copyFileSync(studentApk, unifiedApk);
    } catch (e) {
      console.error('Failed copying unified apk', e);
    }
  }

  let filename = format === 'apk' ? 'homestay-v1.0.0.apk' : 'homestay-release.aab';

  if (role === 'all') {
    filename = 'homestay-all-aab-bundles.zip';
  } else if (role === 'owner') {
    filename = format === 'apk' ? 'homestay-owner-v1.0.0.apk' : 'homestay-owner-release.aab';
  } else if (role === 'staff') {
    filename = format === 'apk' ? 'homestay-staff-v1.0.0.apk' : 'homestay-staff-release.aab';
  } else if (role === 'student' || role === 'resident') {
    filename = format === 'apk' ? 'homestay-student-v1.0.0.apk' : 'homestay-student-release.aab';
  } else {
    // Default: Single Unified App for all roles
    filename = format === 'apk' ? 'homestay-v1.0.0.apk' : 'homestay-release.aab';
  }

  let filePath = path.join(downloadsDir, filename);

  // Fallback if file doesn't exist yet
  if (!fs.existsSync(filePath)) {
    if (filename.endsWith('.apk') && fs.existsSync(studentApk)) {
      filePath = studentApk;
    } else if (filename.endsWith('.aab') && fs.existsSync(studentAab)) {
      filePath = studentAab;
    } else {
      return NextResponse.json(
        { error: `Download file ${filename} not found. Please regenerate bundles.` },
        { status: 404 }
      );
    }
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
