import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/store';
import { UserRole } from '@/lib/db/types';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetRole = (searchParams.get('role') || 'OWNER').toUpperCase() as UserRole;
  const db = getDatabase();

  const user = db.users.find(u => u.role === targetRole && u.isActive) || db.users.find(u => u.role === 'OWNER');
  
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      staffTitle: user.staffTitle,
      permissions: user.permissions,
    },
  });
}
