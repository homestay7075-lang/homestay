import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/store';

export async function GET() {
  const db = getDatabase();
  // Return the Hostel Owner as initial default administrative user
  const owner = db.users.find(u => u.role === 'OWNER');
  return NextResponse.json({
    user: owner ? {
      id: owner.id,
      role: owner.role,
      fullName: owner.fullName,
      phone: owner.phone,
      email: owner.email,
      staffTitle: owner.staffTitle,
    } : null,
  });
}
