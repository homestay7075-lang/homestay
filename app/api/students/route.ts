import { NextResponse } from 'next/server';
import { getDatabase, registerStudentTransaction, updateStudentTransaction } from '@/lib/db/store';
import { reconcileStudentBills } from '@/lib/services/billingService';
import { isValidPhoneNumber, PHONE_ERROR_MESSAGE } from '@/lib/utils/phoneValidator';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase();
  const blockId = searchParams.get('blockId');
  const status = searchParams.get('status'); // 'Active' or 'CheckedOut' or 'All'

  const db = getDatabase();
  let students = [...db.students];

  if (status && status !== 'All') {
    students = students.filter(s => s.status === status);
  }

  if (blockId) {
    students = students.filter(s => s.blockId === blockId);
  }

  if (search) {
    students = students.filter(s =>
      s.fullName.toLowerCase().includes(search) ||
      s.studentId.toLowerCase().includes(search) ||
      s.phone.includes(search) ||
      s.roomNumber.toLowerCase().includes(search) ||
      s.bedNumber.toLowerCase().includes(search)
    );
  }

  // Attach reconciled financial summaries to each student from generated bills
  const allBills = db.bills || [];
  const enhancedStudents = students.map(student => {
    const studentBills = allBills.filter(b => b.studentDbId === student.id || b.studentId === student.studentId);
    const payments = db.payments.filter(p => p.studentId === student.studentId || p.studentDbId === student.id);
    const finances = reconcileStudentBills(studentBills, payments);

    return {
      ...student,
      finances,
      payments,
      bills: finances.reconciledBills,
      cycles: finances.reconciledBills,
    };
  });

  return NextResponse.json({
    students: enhancedStudents,
    studentHistory: db.studentHistory,
    historicalCount: db.studentHistory.length,
    activeCount: db.students.filter(s => s.status === 'Active').length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Required field validation - student name, phone (used for login), and bed allocation are strictly mandatory
    const required = ['fullName', 'phone', 'buildingId', 'blockId', 'roomId', 'bedId', 'joiningDate'];
    for (const field of required) {
      if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
        return NextResponse.json({ success: false, error: `Missing mandatory field: ${field}` }, { status: 400 });
      }
    }

    // Phone pattern validation: r"^[6-9]\d{9}$"
    if (!isValidPhoneNumber(body.phone)) {
      return NextResponse.json({ success: false, error: PHONE_ERROR_MESSAGE }, { status: 400 });
    }
    if (body.guardianPhone && !isValidPhoneNumber(body.guardianPhone)) {
      return NextResponse.json({ success: false, error: `Guardian ${PHONE_ERROR_MESSAGE.toLowerCase()}` }, { status: 400 });
    }

    const result = registerStudentTransaction({
      fullName: body.fullName,
      photoUrl: body.photoUrl || '',
      photoOriginalSizeKb: body.photoOriginalSizeKb,
      photoCompressedSizeKb: body.photoCompressedSizeKb,
      gender: body.gender || 'Male',
      phone: body.phone,
      email: body.email || '',
      dob: body.dob || '',
      address: body.address || '',
      guardianName: body.guardianName || '',
      guardianPhone: body.guardianPhone || '',
      guardianRelation: body.guardianRelation || 'Parent',
      idProofType: body.idProofType || 'Aadhaar',
      idProofNumber: body.idProofNumber || '',
      buildingId: body.buildingId,
      blockId: body.blockId,
      roomId: body.roomId,
      bedId: body.bedId,
      joiningDate: body.joiningDate,
      monthlyRent: Number(body.monthlyRent || 0),
      depositAmount: Number(body.depositAmount || 0),
      otherCharges: Number(body.otherCharges || 0),
      actorName: body.actorName || 'Hostel Owner',
      actorRole: body.actorRole || 'OWNER',
      actorId: body.actorId || 'usr-owner-1',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, student: result.student });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, studentId, ...updates } = body;
    const targetId = id || studentId;

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'Student ID is required.' }, { status: 400 });
    }

    if (updates.phone !== undefined) {
      if (!updates.phone.trim() || !isValidPhoneNumber(updates.phone)) {
        return NextResponse.json({ success: false, error: PHONE_ERROR_MESSAGE }, { status: 400 });
      }
    }

    if (updates.guardianPhone && !isValidPhoneNumber(updates.guardianPhone)) {
      return NextResponse.json({ success: false, error: `Guardian ${PHONE_ERROR_MESSAGE.toLowerCase()}` }, { status: 400 });
    }

    if (updates.fullName !== undefined && !updates.fullName.trim()) {
      return NextResponse.json({ success: false, error: 'Student full name is mandatory.' }, { status: 400 });
    }

    const result = updateStudentTransaction({
      studentId: targetId,
      updates,
      actorId: body.actorId || 'usr-owner-1',
      actorName: body.actorName || 'Hostel Owner',
      actorRole: body.actorRole || 'OWNER',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, student: result.student });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
