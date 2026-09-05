import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import { NotificationItem, AuditLog } from '@/lib/db/types';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const audience = searchParams.get('audience'); // 'STUDENT', 'ALL', etc.
  const studentBlockId = searchParams.get('blockId');
  const studentId = searchParams.get('studentId');
  const forOwner = searchParams.get('forOwner') === 'true';

  const db = getDatabase();

  if (forOwner) {
    // Owner sees all notifications (both enabled and disabled)
    return NextResponse.json({ notifications: db.notifications });
  }

  // Strictly filter for non-owner: only Owner-ENABLED notifications are shown!
  const enabledNotifs = db.notifications.filter(n => n.isEnabled);

  const relevant = enabledNotifs.filter(n => {
    if (n.targetAudience === 'ALL') return true;
    if (n.targetAudience === 'BLOCK' && studentBlockId && n.targetBlockId === studentBlockId) return true;
    if (n.targetAudience === 'STUDENT' && studentId && n.targetStudentId === studentId) return true;
    return false;
  });

  return NextResponse.json({ notifications: relevant });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, message, type, targetAudience, targetBlockId, targetStudentId, actorName, actorRole } = body;

    if (!title || !message || !type) {
      return NextResponse.json({ success: false, error: 'Title, message, and type are required.' }, { status: 400 });
    }

    const db = getDatabase();
    const newNotification: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      type,
      targetAudience: targetAudience || 'ALL',
      targetBlockId,
      targetStudentId,
      isEnabled: true,
      createdBy: actorName || 'Hostel Owner',
      createdAt: new Date().toISOString(),
    };

    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr-owner-1',
      userName: actorName || 'Hostel Owner',
      userRole: actorRole || 'OWNER',
      action: 'NOTIFICATION_DISPATCHED',
      details: `Created notice "${title}" targeted to ${targetAudience}.`,
    };

    db.notifications.unshift(newNotification);
    db.auditLogs.unshift(audit);
    saveDatabase(db);

    return NextResponse.json({ success: true, notification: newNotification });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, isEnabled, action } = await req.json();
    const db = getDatabase();

    if (action === 'DELETE') {
      db.notifications = db.notifications.filter(n => n.id !== id);
      saveDatabase(db);
      return NextResponse.json({ success: true, message: 'Notification deleted' });
    }

    const notif = db.notifications.find(n => n.id === id);
    if (!notif) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    notif.isEnabled = isEnabled;
    saveDatabase(db);
    return NextResponse.json({ success: true, notification: notif });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
