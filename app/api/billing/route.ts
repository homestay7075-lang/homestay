import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import { Bill } from '@/lib/db/types';
import { reconcileStudentBills } from '@/lib/services/billingService';

export async function GET() {
  const db = getDatabase();

  const activeStudents = db.students.filter((s) => s.status === 'Active');
  const allBills: Bill[] = db.bills || [];
  const payments = db.payments || [];

  let totalBilledHostel = 0;
  let totalPaidHostel = 0;
  let totalOutstandingHostel = 0;
  let totalOldBalanceHostel = 0;
  let totalNewBalanceHostel = 0;
  let overdueCount = 0;

  const studentDues: any[] = [];
  const allGeneratedBills: any[] = [];

  activeStudents.forEach((student) => {
    // Strictly ONLY get generated bills for this student from db.bills!
    // No fabricated, ungenerated future or phantom cycles!
    const studentBills = allBills.filter(
      (b) => b.studentDbId === student.id || b.studentId === student.studentId
    );
    const studentPayments = payments.filter(
      (p) => p.studentId === student.studentId || p.studentDbId === student.id
    );

    const fin = reconcileStudentBills(studentBills, studentPayments);

    totalBilledHostel += fin.totalBilled;
    totalPaidHostel += fin.totalPaid;
    totalOutstandingHostel += fin.totalOutstanding;
    totalOldBalanceHostel += fin.oldBalance;
    totalNewBalanceHostel += fin.newBalance;

    if (fin.overallStatus === 'Overdue') {
      overdueCount++;
    }

    const latestBill = fin.reconciledBills[fin.reconciledBills.length - 1];

    // ONLY include in dues ledger if bills have been generated!
    // (Residents with 0 generated bills are excluded from dues ledger)
    if (fin.reconciledBills.length > 0) {
      studentDues.push({
        studentId: student.studentId,
        studentDbId: student.id,
        fullName: student.fullName,
        phone: student.phone,
        roomNumber: student.roomNumber,
        bedNumber: student.bedNumber,
        blockName: student.blockName,
        joiningDate: student.joiningDate,
        monthlyRent: student.monthlyRent,
        totalBilled: fin.totalBilled,
        totalPaid: fin.totalPaid,
        oldBalance: fin.oldBalance,
        newBalance: fin.newBalance,
        totalOutstanding: fin.totalOutstanding,
        dueDate: latestBill ? latestBill.dueDate : 'N/A',
        overallStatus: fin.overallStatus,
        billsCount: fin.reconciledBills.length,
        cycles: fin.reconciledBills, // for backwards compatibility with any component
        bills: fin.reconciledBills,
      });

      // Flatten each generated bill for the bills ledger
      fin.reconciledBills.forEach((c) => {
        allGeneratedBills.push({
          id: c.id,
          billNumber: c.billNumber || `BILL-${student.studentId}-M${c.cycleNumber}`,
          studentDbId: student.id,
          studentId: student.studentId,
          studentName: student.fullName,
          phone: student.phone,
          roomNumber: student.roomNumber,
          bedNumber: student.bedNumber,
          blockName: student.blockName,
          cycleNumber: c.cycleNumber,
          billingPeriod: `${c.cycleStartDate} to ${c.cycleEndDate}`,
          cycleStartDate: c.cycleStartDate,
          cycleEndDate: c.cycleEndDate,
          description: c.description,
          amount: c.amount,
          paidAmount: c.paidAmount,
          balanceAmount: c.balanceAmount,
          dueDate: c.dueDate,
          status: c.status,
          dueCategory: c.dueCategory, // 'OLD_BALANCE' | 'NEW_BALANCE' | 'SETTLED'
          createdAt: c.createdAt,
          monthlyRent: student.monthlyRent,
          totalOutstanding: fin.totalOutstanding,
          studentOldBalance: fin.oldBalance,
          studentNewBalance: fin.newBalance,
        });
      });
    }
  });

  // Sort generated bills: newest first
  allGeneratedBills.sort(
    (a, b) => new Date(b.cycleStartDate).getTime() - new Date(a.cycleStartDate).getTime()
  );

  return NextResponse.json({
    dues: studentDues,
    generatedBills: allGeneratedBills,
    summary: {
      totalBilledHostel,
      totalPaidHostel,
      totalOutstandingHostel,
      totalOldBalanceHostel,
      totalNewBalanceHostel,
      overdueCount,
      totalGeneratedBills: allGeneratedBills.length,
      pendingBillsCount: allGeneratedBills.filter((b) => b.balanceAmount > 0).length,
      paidBillsCount: allGeneratedBills.filter((b) => b.balanceAmount === 0).length,
      collectionEfficiency:
        totalBilledHostel > 0 ? Math.round((totalPaidHostel / totalBilledHostel) * 100) : 100,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      studentDbId,
      cycleStartDate,
      cycleEndDate,
      dueDate,
      rentAmount,
      depositAmount = 0,
      otherCharges = 0,
      description,
    } = body;

    if (!studentDbId || !cycleStartDate || !cycleEndDate || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required bill fields: student, start date, end date, due date' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const student = db.students.find((s) => s.id === studentDbId);

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student resident not found' },
        { status: 404 }
      );
    }

    if (!db.bills) db.bills = [];

    const existingStudentBills = db.bills.filter(
      (b) => b.studentDbId === student.id || b.studentId === student.studentId
    );
    const cycleNumber = existingStudentBills.length + 1;
    const totalAmount =
      Number(rentAmount || student.monthlyRent) + Number(depositAmount) + Number(otherCharges);

    const newBill: Bill = {
      id: `bill-${student.studentId}-m${cycleNumber}-${Date.now()}`,
      billNumber: `BILL-${student.studentId}-M${cycleNumber}`,
      studentDbId: student.id,
      studentId: student.studentId,
      studentName: student.fullName,
      phone: student.phone,
      roomNumber: student.roomNumber,
      bedNumber: student.bedNumber,
      blockName: student.blockName,
      cycleNumber,
      cycleStartDate,
      cycleEndDate,
      dueDate,
      amount: totalAmount,
      rentAmount: Number(rentAmount || student.monthlyRent),
      depositAmount: Number(depositAmount),
      otherCharges: Number(otherCharges),
      description: description || `Monthly Hostel Rent (${cycleStartDate} to ${cycleEndDate})`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    db.bills.push(newBill);

    // Keep customBills in sync for legacy compatibility
    if (!db.customBills) db.customBills = [];
    db.customBills.push(newBill);

    // Audit log
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'BILL_GENERATED',
      userId: 'usr-owner-1',
      userName: 'Hostel Owner',
      userRole: 'OWNER',
      details: `Generated Bill #${newBill.billNumber} of ₹${totalAmount.toLocaleString('en-IN')} for ${student.fullName} (${cycleStartDate} to ${cycleEndDate})`,
    });

    saveDatabase(db);

    return NextResponse.json({
      success: true,
      message: `Bill ${newBill.billNumber} generated successfully for ${student.fullName}`,
      bill: newBill,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate bill' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bill ID is required for deletion' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    if (!db.bills) db.bills = [];

    const billIndex = db.bills.findIndex((b) => b.id === id || b.billNumber === id);
    if (billIndex === -1) {
      return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 });
    }

    const removedBill = db.bills.splice(billIndex, 1)[0];
    if (db.customBills) {
      db.customBills = db.customBills.filter((b) => b.id !== id && b.billNumber !== id);
    }

    // Audit log
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'BILL_DELETED',
      userId: 'usr-owner-1',
      userName: 'Hostel Owner',
      userRole: 'OWNER',
      details: `Deleted generated bill #${removedBill.billNumber} for ${removedBill.studentName}`,
    });

    saveDatabase(db);

    return NextResponse.json({
      success: true,
      message: `Bill #${removedBill.billNumber} deleted successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete bill' },
      { status: 500 }
    );
  }
}
