import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/store';
import { reconcileStudentBills } from '@/lib/services/billingService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDatabase();

  const totalBeds = db.beds.length;
  const occupiedBeds = db.beds.filter(b => b.status === 'Occupied').length;
  const availableBeds = db.beds.filter(b => b.status === 'Available').length;
  const maintenanceBeds = db.beds.filter(b => b.status === 'Maintenance').length;

  const totalPaymentsCollected = db.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netOperatingProfit = totalPaymentsCollected - totalExpenses;

  // Calculate student balances from generated bills
  let totalDuesOutstanding = 0;
  const activeStudents = db.students.filter(s => s.status === 'Active');
  const allBills = db.bills || [];

  activeStudents.forEach(s => {
    const studentBills = allBills.filter(b => b.studentDbId === s.id || b.studentId === s.studentId);
    const payments = db.payments.filter(p => p.studentId === s.studentId || p.studentDbId === s.id);
    const fin = reconcileStudentBills(studentBills, payments);
    totalDuesOutstanding += fin.totalOutstanding;
  });

  return NextResponse.json({
    settings: db.settings,
    kpis: {
      totalStudents: db.students.length,
      activeStudents: activeStudents.length,
      historicalCheckouts: db.studentHistory.length,
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      totalPaymentsCollected,
      totalExpenses,
      netOperatingProfit,
      totalDuesOutstanding,
      pendingDuesAmount: totalDuesOutstanding,
      pendingBookings: db.bookings.filter(b => b.status === 'Pending').length,
    },
    students: db.students,
    studentHistory: db.studentHistory,
    beds: db.beds,
    rooms: db.rooms,
    blocks: db.blocks,
    payments: db.payments,
    expenses: db.expenses,
    bookings: db.bookings,
    auditLogs: db.auditLogs.slice(0, 50),
  });
}
