import { NextResponse } from 'next/server';
import { changeStudentPassword } from '@/lib/db/store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, studentId, userId, newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 4 characters long.' },
        { status: 400 }
      );
    }

    const result = changeStudentPassword({
      phone,
      studentId,
      userId,
      newPassword: newPassword.trim(),
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
      updatedPassword: result.updatedPassword,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
