import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get('role') || 'student').toLowerCase();
  const format = (searchParams.get('format') || 'aab').toLowerCase();

  let filename = 'homestay-student-release.aab';

  if (role === 'all') {
    filename = 'homestay-all-aab-bundles.zip';
  } else if (role === 'owner') {
    filename = format === 'apk' ? 'homestay-owner-v1.0.0.apk' : 'homestay-owner-release.aab';
  } else if (role === 'staff') {
    filename = format === 'apk' ? 'homestay-staff-v1.0.0.apk' : 'homestay-staff-release.aab';
  } else {
    // Default student / resident
    filename = format === 'apk' ? 'homestay-student-v1.0.0.apk' : 'homestay-student-release.aab';
  }

  const filePath = path.join(process.cwd(), 'public', 'downloads', filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: `Download file ${filename} not found. Please regenerate bundles.` },
      { status: 404 }
    );
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
