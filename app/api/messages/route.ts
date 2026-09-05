import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import { MessageThreadItem } from '@/lib/db/types';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentDbId = searchParams.get('studentDbId');
  const role = searchParams.get('role');

  const db = getDatabase();

  if (role === 'STUDENT') {
    if (!studentDbId) {
      return NextResponse.json({ messages: [] });
    }
    // Student sees only their own messages
    const studentMessages = db.messages.filter(m => m.studentDbId === studentDbId);
    return NextResponse.json({ messages: studentMessages });
  }

  // Owner/Staff: if studentDbId provided, return thread, else return all messages
  if (studentDbId) {
    const thread = db.messages.filter(m => m.studentDbId === studentDbId);
    return NextResponse.json({ messages: thread });
  }

  return NextResponse.json({ messages: db.messages });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentDbId, studentId, studentName, senderRole, senderName, senderUserId, content } = body;

    if (!studentDbId || !content) {
      return NextResponse.json({ success: false, error: 'Student and content are required.' }, { status: 400 });
    }

    const db = getDatabase();
    const newMessage: MessageThreadItem = {
      id: `msg-${Date.now()}`,
      studentDbId,
      studentId: studentId || '',
      studentName: studentName || 'Student',
      senderRole,
      senderName,
      senderUserId,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    db.messages.push(newMessage);
    saveDatabase(db);

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let messageId = searchParams.get('messageId');

    if (!messageId) {
      try {
        const body = await req.json();
        messageId = body?.messageId;
      } catch (_) {}
    }

    if (!messageId) {
      return NextResponse.json({ success: false, error: 'messageId is required to delete a message.' }, { status: 400 });
    }

    const db = getDatabase();
    const targetMsg = db.messages.find(m => m.id === messageId);

    if (!targetMsg) {
      return NextResponse.json({ success: false, error: 'Message not found.' }, { status: 404 });
    }

    db.messages = db.messages.filter(m => m.id !== messageId);
    saveDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully.',
      deletedId: messageId,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
