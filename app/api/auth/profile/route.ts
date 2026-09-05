import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import { AuditLog } from '@/lib/db/types';
import { isValidPhoneNumber, normalizePhoneNumber, PHONE_ERROR_MESSAGE } from '@/lib/utils/phoneValidator';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const role = searchParams.get('role');

  const db = getDatabase();
  let targetUser = null;
  if (userId) {
    targetUser = db.users.find(u => u.id === userId);
  }
  if (!targetUser && role) {
    targetUser = db.users.find(u => u.role === role);
  }
  if (!targetUser) {
    targetUser = db.users.find(u => u.role === 'OWNER') || db.users[0];
  }

  return NextResponse.json({
    user: targetUser ? {
      id: targetUser.id,
      role: targetUser.role,
      fullName: targetUser.fullName,
      email: targetUser.email,
      phone: targetUser.phone,
      staffTitle: targetUser.staffTitle || (targetUser.role === 'OWNER' ? 'Owner & Lead Administrator' : targetUser.role),
      avatarUrl: targetUser.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop',
    } : null,
  });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = getDatabase();

    let userIndex = -1;
    if (data.userId) {
      userIndex = db.users.findIndex(u => u.id === data.userId);
    }
    if (userIndex === -1 && data.role && data.role !== 'OWNER') {
      userIndex = db.users.findIndex(u => u.role === data.role);
    }
    if (userIndex === -1) {
      userIndex = db.users.findIndex(u => u.role === 'OWNER');
    }

    if (userIndex === -1) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (data.phone !== undefined) {
      if (!isValidPhoneNumber(data.phone)) {
        return NextResponse.json({ success: false, error: PHONE_ERROR_MESSAGE }, { status: 400 });
      }
    }

    const currentUser = db.users[userIndex];
    const updatedUser = {
      ...currentUser,
      fullName: data.fullName !== undefined ? data.fullName : currentUser.fullName,
      email: data.email !== undefined ? data.email : currentUser.email,
      phone: data.phone !== undefined ? normalizePhoneNumber(data.phone) : currentUser.phone,
      staffTitle: data.staffTitle !== undefined ? data.staffTitle : currentUser.staffTitle,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : currentUser.avatarUrl,
      updatedAt: new Date().toISOString(),
    };

    db.users[userIndex] = updatedUser;

    // Log audit
    const isOwner = updatedUser.role === 'OWNER';
    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: updatedUser.id,
      userName: updatedUser.fullName,
      userRole: updatedUser.role,
      action: isOwner ? 'OWNER_PROFILE_UPDATED' : 'STAFF_PROFILE_UPDATED',
      details: `Updated ${isOwner ? 'owner' : 'staff'} profile: name="${updatedUser.fullName}", title="${updatedUser.staffTitle}", email="${updatedUser.email}".`,
    };
    db.auditLogs.unshift(audit);

    saveDatabase(db);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        staffTitle: updatedUser.staffTitle,
        avatarUrl: updatedUser.avatarUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
