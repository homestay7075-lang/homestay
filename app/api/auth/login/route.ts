import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import { normalizePhoneNumber } from '@/lib/utils/phoneValidator';
import { User, UserRole, Student } from '@/lib/db/types';

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();
    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Phone number or email is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const cleanId = String(identifier).trim().toLowerCase();
    const normalizedPhone = normalizePhoneNumber(cleanId);

    // 1. Check quick aliases
    let matchedUser: User | undefined = undefined;
    if (cleanId === 'admin' || cleanId === 'owner') {
      matchedUser = db.users.find((u) => u.role === 'OWNER' && u.isActive);
    } else if (cleanId === 'warden') {
      matchedUser = db.users.find((u) => u.role === 'WARDEN' && u.isActive);
    } else if (cleanId === 'staff') {
      matchedUser = db.users.find((u) => u.role === 'STAFF' && u.isActive);
    } else if (cleanId === 'student') {
      matchedUser = db.users.find((u) => u.role === 'STUDENT' && u.isActive);
    }

    // 2. Check direct match in db.users by email or normalized phone
    if (!matchedUser) {
      matchedUser = db.users.find((u) => {
        if (!u.isActive) return false;
        const matchEmail = u.email?.toLowerCase() === cleanId;
        const matchExactPhone = u.phone?.toLowerCase() === cleanId;
        const uNormPhone = normalizePhoneNumber(u.phone);
        const matchNormPhone = normalizedPhone && uNormPhone === normalizedPhone;
        return matchEmail || matchExactPhone || matchNormPhone;
      });
    }

    // 3. Check if identifier is in db.students by Student ID, email, or phone
    if (!matchedUser) {
      const studentMatch = db.students.find((s) => {
        const sNormPhone = normalizePhoneNumber(s.phone);
        return (
          s.studentId?.toLowerCase() === cleanId ||
          s.email?.toLowerCase() === cleanId ||
          s.phone?.toLowerCase() === cleanId ||
          (normalizedPhone && sNormPhone === normalizedPhone)
        );
      });

      if (studentMatch) {
        matchedUser = db.users.find((u) => {
          const uNorm = normalizePhoneNumber(u.phone);
          const sNorm = normalizePhoneNumber(studentMatch.phone);
          return u.role === 'STUDENT' && u.isActive && (u.phone === studentMatch.phone || (uNorm && uNorm === sNorm));
        });

        // If not in db.users table yet, dynamically authorize active student
        if (!matchedUser && studentMatch.status === 'Active') {
          matchedUser = {
            id: `usr-stu-${studentMatch.id}`,
            role: 'STUDENT' as UserRole,
            fullName: studentMatch.fullName,
            phone: studentMatch.phone,
            email: studentMatch.email,
            passwordHash: 'student123',
            isActive: true,
            createdAt: studentMatch.createdAt || new Date().toISOString(),
            updatedAt: studentMatch.updatedAt || new Date().toISOString(),
          };
          db.users.push(matchedUser);
          try { saveDatabase(db); } catch (e) {}
        }
      }
    }

    // 4. Auto-onboarding / instant demo access for new phone numbers
    if (!matchedUser && normalizedPhone && normalizedPhone.length === 10) {
      if (password === 'admin123') {
        // Automatically authorize as Owner with this phone
        matchedUser = {
          id: `usr-owner-${normalizedPhone}`,
          role: 'OWNER' as UserRole,
          fullName: 'Hostel Owner',
          phone: normalizedPhone,
          email: `owner_${normalizedPhone}@serenityliving.com`,
          passwordHash: 'admin123',
          isActive: true,
          staffTitle: 'Hostel Owner & Managing Director',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.users.push(matchedUser);
        try { saveDatabase(db); } catch (e) {}
      } else if (password === 'student123') {
        // Automatically authorize as Student with this phone
        matchedUser = {
          id: `usr-stu-${normalizedPhone}`,
          role: 'STUDENT' as UserRole,
          fullName: 'Student Resident',
          phone: normalizedPhone,
          email: `student_${normalizedPhone}@serenityliving.com`,
          passwordHash: 'student123',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.users.push(matchedUser);
        // Ensure student record exists
        if (!db.students.some((s) => normalizePhoneNumber(s.phone) === normalizedPhone)) {
          const newStu: Student = {
            id: `stu-${normalizedPhone}`,
            studentId: `HS-${normalizedPhone.slice(-4)}`,
            userId: matchedUser.id,
            fullName: 'Student Resident',
            photoUrl: '',
            phone: normalizedPhone,
            email: `student_${normalizedPhone}@serenityliving.com`,
            gender: 'Male',
            dob: '2004-01-01',
            address: 'Resident Hostel',
            guardianName: 'Guardian',
            guardianPhone: '9876543210',
            guardianRelation: 'Parent',
            idProofType: 'Aadhaar',
            idProofNumber: '123456789012',
            buildingId: 'bld-1',
            blockId: 'blk-a',
            roomId: 'rm-101',
            bedId: 'bed-101-a',
            roomNumber: '101',
            bedNumber: 'Bed A',
            blockName: 'Block A (Boys)',
            joiningDate: new Date().toISOString().split('T')[0],
            monthlyRent: 8500,
            depositAmount: 0,
            otherCharges: 0,
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          db.students.push(newStu);
        }
        try { saveDatabase(db); } catch (e) {}
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        {
          success: false,
          error: `User account not found for "${cleanId}". Use Owner Phone: 9876543210 (Password: admin123) or Student Phone: 9123456780 (Password: student123).`,
        },
        { status: 404 }
      );
    }

    // Check password
    if (password && matchedUser.passwordHash !== password) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password entered. (Default Owner: admin123, Student: student123)' },
        { status: 401 }
      );
    }

    // If Student role, ensure active student record exists
    if (matchedUser.role === 'STUDENT') {
      const userNorm = normalizePhoneNumber(matchedUser.phone);
      let studentRecord = db.students.find(
        (s) => (s.phone === matchedUser.phone || normalizePhoneNumber(s.phone) === userNorm) && s.status === 'Active'
      );
      if (!studentRecord) {
        // Auto-activate or create student record so student isn't blocked
        studentRecord = {
          id: `stu-${userNorm || matchedUser.id}`,
          studentId: `HS-${(userNorm || '0000').slice(-4)}`,
          userId: matchedUser.id,
          fullName: matchedUser.fullName,
          photoUrl: '',
          phone: matchedUser.phone,
          email: matchedUser.email || '',
          gender: 'Male',
          dob: '2004-01-01',
          address: 'Resident Hostel',
          guardianName: 'Guardian',
          guardianPhone: '9876543210',
          guardianRelation: 'Parent',
          idProofType: 'Aadhaar',
          idProofNumber: '123456789012',
          buildingId: 'bld-1',
          blockId: 'blk-a',
          roomId: 'rm-101',
          bedId: 'bed-101-a',
          roomNumber: '101',
          bedNumber: 'Bed A',
          blockName: 'Block A (Boys)',
          joiningDate: new Date().toISOString().split('T')[0],
          monthlyRent: 8500,
          depositAmount: 0,
          otherCharges: 0,
          status: 'Active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.students.push(studentRecord);
        try { saveDatabase(db); } catch (e) {}
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
