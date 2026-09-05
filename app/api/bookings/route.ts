import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import { Booking, AuditLog } from '@/lib/db/types';
import { isValidPhoneNumber, normalizePhoneNumber, PHONE_ERROR_MESSAGE } from '@/lib/utils/phoneValidator';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDatabase();
  // Filter out any rejected bookings so they never show anywhere
  const activeBookings = (db.bookings || []).filter(b => b.status !== 'Rejected');
  return NextResponse.json({ bookings: activeBookings });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, phone, email, joiningDate, preferredRoomType, address, notes } = body;

    if (!fullName || !phone || !joiningDate || !address) {
      return NextResponse.json({ success: false, error: 'Full name, phone, joining date, and address are required.' }, { status: 400 });
    }

    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json({ success: false, error: PHONE_ERROR_MESSAGE }, { status: 400 });
    }

    const cleanPhone = normalizePhoneNumber(phone);

    const db = getDatabase();
    const newBooking: Booking = {
      id: `bkg-${Date.now()}`,
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email?.trim(),
      joiningDate,
      preferredRoomType: preferredRoomType || undefined,
      address: address.trim(),
      notes: notes?.trim(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    db.bookings.unshift(newBooking);

    // Audit log
    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'public-visitor',
      userName: fullName.trim(),
      userRole: 'STUDENT',
      action: 'BOOKING_REQUEST_SUBMITTED',
      details: `New bed booking request received from website for ${fullName.trim()} (${cleanPhone}). Joining Date: ${joiningDate}.`,
    };
    db.auditLogs.unshift(audit);

    saveDatabase(db);
    return NextResponse.json({ success: true, booking: newBooking });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { bookingId, status, actorName } = await req.json();
    const db = getDatabase();
    const bookingIndex = db.bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex === -1) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const booking = db.bookings[bookingIndex];

    // If rejected, permanently remove from bookings list so it doesn't show anywhere
    if (status === 'Rejected') {
      db.bookings.splice(bookingIndex, 1);

      const audit: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'usr-owner-1',
        userName: actorName || 'Hostel Owner',
        userRole: 'OWNER',
        action: 'BOOKING_REJECTED_REMOVED',
        details: `Rejected and permanently removed bed booking inquiry #${booking.id} for ${booking.fullName} (${booking.phone}).`,
      };
      db.auditLogs.unshift(audit);

      saveDatabase(db);
      return NextResponse.json({ success: true, removed: true });
    }

    booking.status = status;
    
    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr-owner-1',
      userName: actorName || 'Hostel Owner',
      userRole: 'OWNER',
      action: 'BOOKING_STATUS_CHANGED',
      details: `Booking #${booking.id} for ${booking.fullName} status updated to ${status}.`,
    };
    db.auditLogs.unshift(audit);

    saveDatabase(db);
    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 });
    }

    const db = getDatabase();
    const index = db.bookings.findIndex(b => b.id === bookingId);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const removed = db.bookings[index];
    db.bookings.splice(index, 1);

    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr-owner-1',
      userName: 'Hostel Owner',
      userRole: 'OWNER',
      action: 'BOOKING_REJECTED_REMOVED',
      details: `Rejected and permanently removed bed booking request #${removed.id} for ${removed.fullName} (${removed.phone}).`,
    };
    db.auditLogs.unshift(audit);

    saveDatabase(db);
    return NextResponse.json({ success: true, removedId: bookingId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
