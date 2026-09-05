import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import { AuditLog } from '@/lib/db/types';
import { isValidPhoneNumber, normalizePhoneNumber, PHONE_ERROR_MESSAGE } from '@/lib/utils/phoneValidator';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDatabase();
  const owner = db.users.find(u => u.role === 'OWNER') || db.users[0];
  return NextResponse.json({
    user: owner ? {
      id: owner.id,
      role: owner.role,
      fullName: owner.fullName,
      email: owner.email,
      phone: owner.phone,
      staffTitle: owner.staffTitle || 'Owner & Lead Administrator',
      avatarUrl: owner.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop',
    } : null,
  });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = getDatabase();
    const ownerIndex = db.users.findIndex(u => u.role === 'OWNER');

    if (ownerIndex === -1) {
      return NextResponse.json({ success: false, error: 'Owner user not found' }, { status: 404 });
    }

    if (data.phone !== undefined) {
      if (!isValidPhoneNumber(data.phone)) {
        return NextResponse.json({ success: false, error: PHONE_ERROR_MESSAGE }, { status: 400 });
      }
    }

    const currentOwner = db.users[ownerIndex];
    const updatedOwner = {
      ...currentOwner,
      fullName: data.fullName !== undefined ? data.fullName : currentOwner.fullName,
      email: data.email !== undefined ? data.email : currentOwner.email,
      phone: data.phone !== undefined ? normalizePhoneNumber(data.phone) : currentOwner.phone,
      staffTitle: data.staffTitle !== undefined ? data.staffTitle : currentOwner.staffTitle,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : currentOwner.avatarUrl,
      updatedAt: new Date().toISOString(),
    };

    db.users[ownerIndex] = updatedOwner;

    // Log audit
    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: updatedOwner.id,
      userName: updatedOwner.fullName,
      userRole: 'OWNER',
      action: 'OWNER_PROFILE_UPDATED',
      details: `Updated owner profile: name="${updatedOwner.fullName}", title="${updatedOwner.staffTitle}", email="${updatedOwner.email}".`,
    };
    db.auditLogs.unshift(audit);

    saveDatabase(db);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedOwner.id,
        role: updatedOwner.role,
        fullName: updatedOwner.fullName,
        email: updatedOwner.email,
        phone: updatedOwner.phone,
        staffTitle: updatedOwner.staffTitle,
        avatarUrl: updatedOwner.avatarUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
