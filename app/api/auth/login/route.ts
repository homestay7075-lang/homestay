import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/store';

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();
    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Phone number or email is required' }, { status: 400 });
    }

    const db = getDatabase();
    const cleanId = identifier.trim().toLowerCase();

    // 1. Check direct match in db.users by email or phone
    let matchedUser = db.users.find((u) => {
      const matchEmail = u.email?.toLowerCase() === cleanId;
      const matchPhone = u.phone?.toLowerCase() === cleanId;
      return (matchEmail || matchPhone) && u.isActive;
    });

    // 2. If not found, check if identifier is a Student ID or Student Email in db.students
    if (!matchedUser) {
      const studentMatch = db.students.find((s) =>
        s.studentId?.toLowerCase() === cleanId ||
        s.email?.toLowerCase() === cleanId ||
        s.phone === cleanId
      );

      if (studentMatch) {
        matchedUser = db.users.find((u) => u.phone === studentMatch.phone && u.role === 'STUDENT' && u.isActive);
        // If not in db.users table yet, dynamically authorize active student
        if (!matchedUser && studentMatch.status === 'Active') {
          matchedUser = {
            id: `usr-stu-${studentMatch.id}`,
            role: 'STUDENT',
            fullName: studentMatch.fullName,
            phone: studentMatch.phone,
            email: studentMatch.email,
            passwordHash: 'student123',
            isActive: true,
            createdAt: studentMatch.createdAt || new Date().toISOString(),
            updatedAt: studentMatch.updatedAt || new Date().toISOString(),
          };
        }
      }
    }

    if (!matchedUser) {
      return NextResponse.json({ success: false, error: 'User account not found. Please check your credentials or contact management.' }, { status: 404 });
    }

    // Check password
    if (password && matchedUser.passwordHash !== password) {
      return NextResponse.json({ success: false, error: 'Incorrect password entered.' }, { status: 401 });
    }

    // If Student role, ensure student record is active
    if (matchedUser.role === 'STUDENT') {
      const studentRecord = db.students.find(s => s.phone === matchedUser.phone && s.status === 'Active');
      if (!studentRecord) {
        return NextResponse.json({ success: false, error: 'No active student enrolment found for this phone number.' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: matchedUser.id,
        role: matchedUser.role,
        fullName: matchedUser.fullName,
        phone: matchedUser.phone,
        email: matchedUser.email,
        staffTitle: matchedUser.staffTitle,
        permissions: matchedUser.permissions,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
