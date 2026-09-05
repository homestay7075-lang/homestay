import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import { User } from '@/lib/db/types';
import { isValidPhoneNumber, normalizePhoneNumber, PHONE_ERROR_MESSAGE } from '@/lib/utils/phoneValidator';

export async function GET() {
  try {
    const db = getDatabase();
    // Return staff users (excluding students, stripping passwords)
    const staffMembers = db.users
      .filter((u) => u.role !== 'STUDENT')
      .map(({ passwordHash, ...safeUser }) => safeUser);

    return NextResponse.json({
      success: true,
      staff: staffMembers,
      total: staffMembers.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch staff members' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDatabase();

    const { fullName, email, phone, role, staffTitle, permissions, assignedBlockIds, assignedBuildingIds } = body;

    if (!fullName || !phone || !role) {
      return NextResponse.json(
        { success: false, error: 'Full name, phone, and role are required' },
        { status: 400 }
      );
    }

    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { success: false, error: PHONE_ERROR_MESSAGE },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhoneNumber(phone);

    const existingUser = db.users.find((u) => u.phone === cleanPhone);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A staff member with this phone number already exists' },
        { status: 400 }
      );
    }

    const resolvedBuildingIds = Array.isArray(assignedBuildingIds) ? assignedBuildingIds : [];
    const resolvedBlockIds = Array.isArray(assignedBlockIds) ? assignedBlockIds : [];

    const newStaff: User = {
      id: `usr-staff-${Date.now()}`,
      role: role || 'STAFF',
      fullName,
      email: email || '',
      phone: cleanPhone,
      passwordHash: 'pass123',
      isActive: true,
      staffTitle: staffTitle || 'Staff Member',
      assignedBuildingIds: resolvedBuildingIds,
      permissions: permissions
        ? {
            ...permissions,
            assignedBuildingIds: resolvedBuildingIds,
            assignedBlockIds: resolvedBlockIds,
          }
        : {
            students: { view: true, add: false, edit: false, delete: false },
            rooms: { view: true, add: false, edit: false, delete: false },
            payments: { view: true, add: false, edit: false, delete: false },
            dues: { view: true, add: false, edit: false, delete: false },
            expenses: { view: false, add: false, edit: false, delete: false },
            bookings: { view: true, add: false, edit: false, delete: false },
            notifications: { view: true, add: false, edit: false, delete: false },
            messages: { view: true, add: true, edit: false, delete: false },
            reports: { view: false, add: false, edit: false, delete: false },
            assignedBuildingIds: resolvedBuildingIds,
            assignedBlockIds: resolvedBlockIds,
          },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newStaff);

    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr-owner-1',
      userName: 'Hostel Owner',
      userRole: 'OWNER',
      action: 'STAFF_ADDED',
      details: `Added new staff member ${fullName} (${role} - ${staffTitle || ''}) with ${resolvedBuildingIds.length} assigned building(s)`,
    });

    saveDatabase(db);

    const { passwordHash, ...safeStaff } = newStaff;

    return NextResponse.json({
      success: true,
      message: 'Staff member added successfully',
      staff: safeStaff,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add staff member' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const db = getDatabase();

    const { id, fullName, email, phone, role, staffTitle, permissions, assignedBlockIds, assignedBuildingIds, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Staff user ID is required for update' },
        { status: 400 }
      );
    }

    const targetUser = db.users.find((u) => u.id === id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    if (targetUser.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify the master Hostel Owner account via staff API' },
        { status: 403 }
      );
    }

    if (fullName !== undefined) targetUser.fullName = fullName.trim();
    if (role !== undefined) targetUser.role = role;
    if (staffTitle !== undefined) targetUser.staffTitle = staffTitle.trim();
    if (email !== undefined) targetUser.email = email.trim();
    if (isActive !== undefined) targetUser.isActive = Boolean(isActive);

    if (phone !== undefined && phone !== targetUser.phone) {
      if (!isValidPhoneNumber(phone)) {
        return NextResponse.json(
          { success: false, error: PHONE_ERROR_MESSAGE },
          { status: 400 }
        );
      }
      const cleanPhone = normalizePhoneNumber(phone);
      const existingUser = db.users.find((u) => u.phone === cleanPhone && u.id !== id);
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Another user already has this phone number' },
          { status: 400 }
        );
      }
      targetUser.phone = cleanPhone;
    }

    if (assignedBuildingIds !== undefined) {
      targetUser.assignedBuildingIds = Array.isArray(assignedBuildingIds) ? assignedBuildingIds : [];
      if (!targetUser.permissions) {
        targetUser.permissions = {
          students: { view: true, add: false, edit: false, delete: false },
          rooms: { view: true, add: false, edit: false, delete: false },
          payments: { view: true, add: false, edit: false, delete: false },
          dues: { view: true, add: false, edit: false, delete: false },
          expenses: { view: false, add: false, edit: false, delete: false },
          bookings: { view: true, add: false, edit: false, delete: false },
          notifications: { view: true, add: false, edit: false, delete: false },
          messages: { view: true, add: true, edit: false, delete: false },
          reports: { view: false, add: false, edit: false, delete: false },
          assignedBuildingIds: targetUser.assignedBuildingIds,
          assignedBlockIds: assignedBlockIds || ['blk-a'],
        };
      } else {
        targetUser.permissions.assignedBuildingIds = targetUser.assignedBuildingIds;
      }
    }

    if (assignedBlockIds !== undefined) {
      const blockArray = Array.isArray(assignedBlockIds) ? assignedBlockIds : [];
      if (targetUser.permissions) {
        targetUser.permissions.assignedBlockIds = blockArray;
      }
    }

    if (permissions !== undefined) {
      targetUser.permissions = {
        ...targetUser.permissions,
        ...permissions,
        assignedBuildingIds: assignedBuildingIds !== undefined ? assignedBuildingIds : targetUser.permissions?.assignedBuildingIds,
        assignedBlockIds: assignedBlockIds !== undefined ? assignedBlockIds : targetUser.permissions?.assignedBlockIds,
      };
    }

    targetUser.updatedAt = new Date().toISOString();

    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr-owner-1',
      userName: 'Hostel Owner',
      userRole: 'OWNER',
      action: 'STAFF_UPDATED',
      details: `Updated staff member ${targetUser.fullName} (${targetUser.role} - ${targetUser.staffTitle || ''}) building & block assignments`,
    });

    saveDatabase(db);

    const { passwordHash, ...safeStaff } = targetUser;

    return NextResponse.json({
      success: true,
      message: `Staff member ${targetUser.fullName} updated successfully`,
      staff: safeStaff,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Staff user ID is required for deletion' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const targetUser = db.users.find((u) => u.id === id);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Architectural Rule: Exactly ONE owner, cannot delete the owner
    if (targetUser.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the single Hostel Owner account' },
        { status: 403 }
      );
    }

    // Remove staff member from users list
    db.users = db.users.filter((u) => u.id !== id);

    // Audit log
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'usr-owner-1',
      userName: 'Hostel Owner',
      userRole: 'OWNER',
      action: 'STAFF_DELETED',
      details: `Deleted assigned staff member ${targetUser.fullName} (${targetUser.role} - ${targetUser.staffTitle || ''}, Phone: ${targetUser.phone})`,
    });

    saveDatabase(db);

    return NextResponse.json({
      success: true,
      message: `Assigned staff member ${targetUser.fullName} deleted successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}

