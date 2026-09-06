import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import { Expense, AuditLog } from '@/lib/db/types';

export async function GET() {
  const db = getDatabase();

  const totalExpense = db.expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory: Record<string, number> = {};
  
  db.expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  return NextResponse.json({
    expenses: db.expenses,
    buildings: db.buildings,
    totalExpense,
    byCategory,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, amount, expenseDate, description, paymentMethod, buildingId, addedBy, actorId, actorRole } = body;

    if (!category || !amount) {
      return NextResponse.json({ success: false, error: 'Category and amount are required.' }, { status: 400 });
    }

    const db = getDatabase();
    const building = buildingId ? db.buildings.find(b => b.id === buildingId) : null;

    const trimmedDesc = typeof description === 'string' && description.trim() ? description.trim() : undefined;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      category,
      amount: Number(amount),
      expenseDate: expenseDate || new Date().toISOString().split('T')[0],
      description: trimmedDesc,
      paymentMethod: paymentMethod || 'UPI',
      buildingId: buildingId || undefined,
      buildingName: building ? building.name : undefined,
      addedBy: addedBy || 'Hostel Staff',
      createdAt: new Date().toISOString(),
    };

    const buildingDetail = building ? ` [Building: ${building.name}]` : '';
    const descDetail = trimmedDesc ? `: "${trimmedDesc}"` : '';
    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: actorId || 'usr-owner-1',
      userName: addedBy || 'Hostel Owner',
      userRole: actorRole || 'OWNER',
      action: 'EXPENSE_RECORDED',
      details: `Recorded ${category} expense of ₹${Number(amount).toLocaleString('en-IN')}${buildingDetail}${descDetail}.`,
    };

    db.expenses.unshift(newExpense);
    db.auditLogs.unshift(audit);
    saveDatabase(db);

    return NextResponse.json({ success: true, expense: newExpense });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
