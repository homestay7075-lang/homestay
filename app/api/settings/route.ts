import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import { AuditLog } from '@/lib/db/types';
import { isValidPhoneNumber, normalizePhoneNumber, PHONE_ERROR_MESSAGE } from '@/lib/utils/phoneValidator';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDatabase();
  return NextResponse.json({ settings: db.settings });
}

export async function POST(req: Request) {
  try {
    const updates = await req.json();
    const db = getDatabase();

    if (updates.phone !== undefined) {
      if (!isValidPhoneNumber(updates.phone)) {
        return NextResponse.json({ success: false, error: PHONE_ERROR_MESSAGE }, { status: 400 });
      }
      updates.phone = normalizePhoneNumber(updates.phone);
    }

    db.settings = {
      ...db.settings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Record audit log
    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: updates.actorId || 'usr-owner-1',
      userName: updates.actorName || 'Rajesh Kumar (Owner)',
      userRole: 'OWNER',
      action: 'HOSTEL_SETTINGS_UPDATED',
      details: `Updated hostel profile: name="${db.settings.name}", phone="${db.settings.phone}", email="${db.settings.email}", address="${db.settings.address}".`,
    };
    db.auditLogs.unshift(audit);

    saveDatabase(db);
    return NextResponse.json({ success: true, settings: db.settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
