import { NextResponse } from 'next/server';
import { getDatabase, checkoutStudentTransaction } from '@/lib/db/store';
import { reconcileStudentBills } from '@/lib/services/billingService';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const db = getDatabase();
  const student = db.students.find(s => s.id === params.id || s.studentId === params.id);

  if (!student) {
    return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
  }

  const allBills = db.bills || [];
  const studentBills = allBills.filter(b => b.studentDbId === student.id || b.studentId === student.studentId);
  const payments = db.payments.filter(p => p.studentId === student.studentId || p.studentDbId === student.id);
  const finances = reconcileStudentBills(studentBills, payments);

  return NextResponse.json({
    student: {
      ...student,
      finances,
      payments,
      bills: finances.reconciledBills,
      cycles: finances.reconciledBills,
    },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { action, checkoutDate, reason, notes, actorName, actorRole, actorId } = body;

    if (action === 'CHECKOUT') {
      const result = checkoutStudentTransaction({
        studentDbId: params.id,
        checkoutDate: checkoutDate || new Date().toISOString().split('T')[0],
        reason: reason || 'Regular checkout',
        notes,
        actorName: actorName || 'Hostel Owner',
        actorRole: actorRole || 'OWNER',
        actorId: actorId || 'usr-owner-1',
      });

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Student checkout completed successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
