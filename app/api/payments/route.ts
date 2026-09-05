import { NextResponse } from 'next/server';
import { getDatabase, recordPaymentTransaction } from '@/lib/db/store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const db = getDatabase();

  let payments = [...db.payments];
  if (studentId) {
    payments = payments.filter(p => p.studentId === studentId);
  }

  return NextResponse.json({ payments });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      studentDbId,
      amount,
      paymentDate,
      paymentMethod,
      billingPeriod,
      transactionRef,
      receivedBy,
      notes,
      actorId,
      actorName,
      actorRole,
    } = body;

    if (!studentDbId || !amount || !paymentMethod) {
      return NextResponse.json({ success: false, error: 'Student, amount, and payment method are required.' }, { status: 400 });
    }

    const result = recordPaymentTransaction({
      studentDbId,
      amount: Number(amount),
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod,
      billingPeriod: billingPeriod || 'Current Due Period',
      transactionRef,
      receivedBy: receivedBy || 'Hostel Management',
      notes,
      actorId: actorId || 'usr-owner-1',
      actorName: actorName || 'Hostel Owner',
      actorRole: actorRole || 'OWNER',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, payment: result.payment });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
