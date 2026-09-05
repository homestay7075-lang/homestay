'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  Shield,
  UserCheck,
  Plus,
  Lock,
  CheckCircle2,
  XCircle,
  Building,
  KeyRound,
  Sparkles,
  AlertCircle,
  X,
  Loader2,
  Trash2,
  Phone,
  Mail,
  Building2,
  BadgeCheck,
  Edit3,
  Check,
  Sliders,
  Layers,
} from 'lucide-react';
import { User, UserRole, StaffPermissions, Building as BuildingType, Block as BlockType } from '@/lib/db/types';
import { isValidPhoneNumber, PHONE_HTML_PATTERN, PHONE_ERROR_MESSAGE } from '@/lib/utils/phoneValidator';

export default function StaffAndPermissionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Staff form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'WARDEN' | 'MANAGER' | 'STAFF'>('WARDEN');
  const [staffTitle, setStaffTitle] = useState('Assistant Warden');

  // Building & Block assignment state
  const [buildingScope, setBuildingScope] = useState<'ALL' | 'CUSTOM'>('ALL');
  const [assignedBuildingIds, setAssignedBuildingIds] = useState<string[]>([]);
  const [blockScope, setBlockScope] = useState<'ALL' | 'CUSTOM'>('ALL');
  const [assignedBlockIds, setAssignedBlockIds] = useState<string[]>([]);

  const [permissions, setPermissions] = useState<StaffPermissions>({
    students: { view: true, add: true, edit: true, delete: false },
    rooms: { view: true, add: false, edit: true, delete: false },
    payments: { view: true, add: true, edit: false, delete: false },
    dues: { view: true, add: false, edit: false, delete: false },
    expenses: { view: true, add: true, edit: false, delete: false },
    bookings: { view: true, add: true, edit: false, delete: false },
    notifications: { view: true, add: false, edit: false, delete: false },
    messages: { view: true, add: true, edit: false, delete: false },
    reports: { view: false, add: false, edit: false, delete: false },
    assignedBlockIds: ['blk-a'],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, roomsRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/rooms'),
      ]);

      const staffData = await staffRes.json();
      if (staffData.success && staffData.staff) {
        setUsers(staffData.staff);
      }

      const roomsData = await roomsRes.json();
      if (roomsData.buildings) {
        setBuildings(roomsData.buildings);
      }
      if (roomsData.blocks) {
        setBlocks(roomsData.blocks);
      }
    } catch (e) {
      console.error('Failed to load staff or rooms data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open modal for new staff
  const handleOpenAddModal = () => {
    setEditingStaffId(null);
    setFormError(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setRole('WARDEN');
    setStaffTitle('Assistant Warden');
    setBuildingScope('ALL');
    setAssignedBuildingIds(buildings.map((b) => b.id));
    setBlockScope('ALL');
    setAssignedBlockIds(blocks.map((b) => b.id));
    setIsModalOpen(true);
  };

  // Open modal for editing existing staff
  const handleOpenEditModal = (staff: User) => {
    setEditingStaffId(staff.id);
    setFormError(null);
    setFullName(staff.fullName);
    setPhone(staff.phone);
    setEmail(staff.email || '');
    setRole((staff.role as 'WARDEN' | 'MANAGER' | 'STAFF') || 'STAFF');
    setStaffTitle(staff.staffTitle || '');

    // Resolve assigned buildings
    const staffBuildings = staff.assignedBuildingIds || staff.permissions?.assignedBuildingIds || [];
    if (!staffBuildings || staffBuildings.length === 0 || (buildings.length > 0 && staffBuildings.length >= buildings.length)) {
      setBuildingScope('ALL');
      setAssignedBuildingIds(buildings.map((b) => b.id));
    } else {
      setBuildingScope('CUSTOM');
      setAssignedBuildingIds(staffBuildings);
    }

    // Resolve assigned blocks
    const staffBlocks = staff.permissions?.assignedBlockIds || [];
    if (!staffBlocks || staffBlocks.length === 0 || (blocks.length > 0 && staffBlocks.length >= blocks.length)) {
      setBlockScope('ALL');
      setAssignedBlockIds(blocks.map((b) => b.id));
    } else {
      setBlockScope('CUSTOM');
      setAssignedBlockIds(staffBlocks);
    }

    setIsModalOpen(true);
  };

  // Available blocks dynamically filtered by currently selected building(s)
  const availableBlocks = blocks.filter((blk) => {
    if (buildingScope === 'ALL') return true;
    return assignedBuildingIds.includes(blk.buildingId);
  });

  const toggleBuildingSelection = (buildingId: string) => {
    setAssignedBuildingIds((prev) => {
      if (prev.includes(buildingId)) {
        return prev.filter((id) => id !== buildingId);
      } else {
        return [...prev, buildingId];
      }
    });
  };

  const toggleBlockSelection = (blockId: string) => {
    setAssignedBlockIds((prev) => {
      if (prev.includes(blockId)) {
        return prev.filter((id) => id !== blockId);
      } else {
        return [...prev, blockId];
      }
    });
  };

  // Handle Delete Assigned Staff
  const handleDeleteStaff = async (staffUser: User) => {
    if (staffUser.role === 'OWNER') {
      alert('The single Hostel Owner account cannot be deleted.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete assigned staff member "${staffUser.fullName}" (${staffUser.staffTitle || staffUser.role})?\n\nThis will immediately remove them from the system and revoke all their permissions.`
    );
    if (!confirmed) return;

    setDeleteLoadingId(staffUser.id);
    try {
      const res = await fetch(`/api/staff?id=${encodeURIComponent(staffUser.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Assigned staff member "${staffUser.fullName}" has been removed.`);
        fetchData();
      } else {
        alert(data.error || 'Failed to delete staff member.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while deleting staff member.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Handle Submit Staff (Add or Edit)
  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Staff full name is required.');
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      setFormError(PHONE_ERROR_MESSAGE);
      return;
    }

    const resolvedBuildingIds = buildingScope === 'ALL'
      ? buildings.map((b) => b.id)
      : assignedBuildingIds;

    if (resolvedBuildingIds.length === 0) {
      setFormError('Please select at least one building to assign to this staff member.');
      return;
    }

    const validAvailableBlockIds = blocks
      .filter((b) => resolvedBuildingIds.includes(b.buildingId))
      .map((b) => b.id);

    const resolvedBlockIds = blockScope === 'ALL'
      ? validAvailableBlockIds
      : assignedBlockIds.filter((id) => validAvailableBlockIds.includes(id));

    if (resolvedBlockIds.length === 0 && validAvailableBlockIds.length > 0) {
      setFormError('Please select at least one block or choose "All Blocks in Selected Buildings".');
      return;
    }

    setSubmitting(true);
    try {
      if (editingStaffId) {
        // Edit existing staff
        const res = await fetch('/api/staff', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingStaffId,
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            role,
            staffTitle: staffTitle.trim(),
            assignedBuildingIds: resolvedBuildingIds,
            assignedBlockIds: resolvedBlockIds,
            permissions: {
              ...permissions,
              assignedBuildingIds: resolvedBuildingIds,
              assignedBlockIds: resolvedBlockIds,
            },
          }),
        });

        const data = await res.json();
        if (data.success) {
          showToast(`Staff member "${fullName}" updated successfully!`);
          setIsModalOpen(false);
          fetchData();
        } else {
          setFormError(data.error || 'Failed to update staff member.');
        }
      } else {
        // Add new staff
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            role,
            staffTitle: staffTitle.trim(),
            assignedBuildingIds: resolvedBuildingIds,
            assignedBlockIds: resolvedBlockIds,
            permissions: {
              ...permissions,
              assignedBuildingIds: resolvedBuildingIds,
              assignedBlockIds: resolvedBlockIds,
            },
          }),
        });

        const data = await res.json();
        if (data.success) {
          showToast(`Staff member "${fullName}" added successfully!`);
          setIsModalOpen(false);
          fetchData();
        } else {
          setFormError(data.error || 'Failed to add staff member.');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error occurred while saving staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const ownerUser = users.find((u) => u.role === 'OWNER');
  const assignedStaffList = users.filter((u) => u.role !== 'OWNER');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Floating Toast */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header with Add Staff Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              Single-Owner Governance & RBAC
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Staff & Assigned Roles
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              There is exactly ONE Hostel Owner. Assign, configure, and manage staff with multi-building jurisdiction and block permissions.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Assign New Staff
          </button>
        </div>

        {/* Single Owner Principle Alert */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-950">Architectural Governance (Single Hostel Owner):</span>
            <p className="text-amber-800 leading-relaxed">
              There is strictly ONE administrative Hostel Owner account with master privileges. Assigned Wardens, Managers, and Facilities Staff operate under owner-defined building and block restrictions. Owners can add, edit building jurisdictions, or delete assigned staff at any time.
            </p>
          </div>
        </div>

        {/* Staff Members List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Single Hostel Owner (Permanent Master) */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-md border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-base shadow-md shadow-amber-500/20">
                  {ownerUser?.fullName
                    ? ownerUser.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'OW'}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {ownerUser?.fullName || 'Hostel Owner'}
                  </h3>
                  <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider block">
                    {ownerUser?.staffTitle || 'Hostel Owner & Managing Director'}
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
                Master Owner
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email:
                </span>
                <span className="font-semibold text-white">{ownerUser?.email || 'owner@serenityliving.com'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone:
                </span>
                <span className="font-semibold text-white">{ownerUser?.phone || '9876543210'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" /> Building Scope:
                </span>
                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  All Buildings ({buildings.length} Entire Campus)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" /> Block Jurisdiction:
                </span>
                <span className="font-semibold text-white">All Blocks, Wings & Financial Modules</span>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl text-[11px] text-slate-400 border border-slate-700/60">
              *Full control over admissions, room tariffs, payments, financial reports, hostel branding, and security settings. Permanent governance account (cannot be deleted).
            </div>
          </div>

          {/* Dynamically Render All Assigned Staff Members */}
          {assignedStaffList.map((staff) => {
            const isDeleting = deleteLoadingId === staff.id;

            // Resolve Assigned Buildings for this staff
            const staffBuildingIds = staff.assignedBuildingIds || staff.permissions?.assignedBuildingIds || [];
            const isAllBuildings = !staffBuildingIds || staffBuildingIds.length === 0 || (buildings.length > 0 && staffBuildingIds.length >= buildings.length);
            const assignedBuildingNames = buildings
              .filter((b) => staffBuildingIds.includes(b.id))
              .map((b) => b.name);

            // Resolve Assigned Blocks for this staff
            const staffBlockIds = staff.permissions?.assignedBlockIds || [];
            const isAllBlocks = !staffBlockIds || staffBlockIds.length === 0 || (blocks.length > 0 && staffBlockIds.length >= blocks.length);
            const assignedBlockNames = blocks
              .filter((b) => staffBlockIds.includes(b.id))
              .map((b) => b.name);

            return (
              <div
                key={staff.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div className="space-y-4">
                  {/* Top bar with initials and actions */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base ${
                          staff.role === 'WARDEN'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : staff.role === 'MANAGER'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        }`}
                      >
                        {staff.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{staff.fullName}</h3>
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wider block ${
                            staff.role === 'WARDEN'
                              ? 'text-indigo-600'
                              : staff.role === 'MANAGER'
                              ? 'text-purple-600'
                              : 'text-cyan-600'
                          }`}
                        >
                          {staff.staffTitle || staff.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          staff.role === 'WARDEN'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : staff.role === 'MANAGER'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        }`}
                      >
                        {staff.role}
                      </span>

                      {/* Edit Assignment Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(staff)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                        title={`Edit ${staff.fullName}'s assigned buildings & jurisdiction`}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Staff Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staff)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                        title={`Delete assigned staff member ${staff.fullName}`}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone (Login):
                      </span>
                      <span className="font-semibold text-slate-800 font-mono">{staff.phone}</span>
                    </div>

                    {staff.email && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                        </span>
                        <span className="font-semibold text-slate-800">{staff.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Building(s) & Block Jurisdiction Highlight */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    {/* Building jurisdiction */}
                    <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          Assigned Building Scope:
                        </span>
                        {isAllBuildings ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            All Buildings ({buildings.length} Campus-Wide)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {staffBuildingIds.length} of {buildings.length} Building{staffBuildingIds.length > 1 ? 's' : ''} Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 pl-5">
                        {isAllBuildings
                          ? 'Full campus access across all current and future buildings'
                          : assignedBuildingNames.join(', ') || 'No buildings assigned'}
                      </p>
                    </div>

                    {/* Block jurisdiction */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-500" />
                          Assigned Block(s):
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          {isAllBlocks
                            ? `All Blocks in Buildings`
                            : `${staffBlockIds.length} Specific Block${staffBlockIds.length > 1 ? 's' : ''}`}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 pl-5">
                        {isAllBlocks
                          ? 'All rooms and wings within assigned building(s)'
                          : assignedBlockNames.join(', ') || 'None selected'}
                      </p>
                    </div>
                  </div>

                  {/* Active Module Permissions Preview */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                      Active Module Rights:
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {staff.permissions?.students?.view && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                          Students
                        </span>
                      )}
                      {staff.permissions?.rooms?.view && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                          Rooms & Beds
                        </span>
                      )}
                      {staff.permissions?.payments?.view && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                          Payments
                        </span>
                      )}
                      {staff.permissions?.expenses?.view && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                          Expenses
                        </span>
                      )}
                      {staff.permissions?.bookings?.view && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                          Bookings
                        </span>
                      )}
                      {staff.permissions?.messages?.view && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                          Chat/Messages
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 line-through">
                        Financial Settings
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Assigned Staff ID: {staff.id}</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Access
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State if No Assigned Staff */}
        {assignedStaffList.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">No Assigned Staff Members</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All assigned staff have been deleted or none are configured. You can assign wardens, managers, and facilities staff using the button below.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
            >
              + Assign First Staff Member
            </button>
          </div>
        )}

        {/* Modal: Assign or Edit Staff Member */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 my-8 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    {editingStaffId ? <Edit3 className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 font-display">
                      {editingStaffId ? 'Edit Staff & Building Assignment' : 'Assign New Staff Member'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Select how many buildings, blocks, and mobile login credentials for this staff
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 shrink-0">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Content - Scrollable */}
              <form onSubmit={handleSubmitStaff} className="space-y-5 overflow-y-auto pr-1 flex-1">
                {/* 1. Basic Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Suresh Rao"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Staff Role <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={role}
                        onChange={(e) => {
                          const newRole = e.target.value as 'WARDEN' | 'MANAGER' | 'STAFF';
                          setRole(newRole);
                          if (!editingStaffId) {
                            if (newRole === 'WARDEN') setStaffTitle('Chief Warden');
                            if (newRole === 'MANAGER') setStaffTitle('Operations Manager');
                            if (newRole === 'STAFF') setStaffTitle('Facilities Assistant');
                          }
                        }}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      >
                        <option value="WARDEN">Warden (Students, Rooms & Bookings)</option>
                        <option value="MANAGER">Manager (Operations & Records)</option>
                        <option value="STAFF">Staff (Facilities & Maintenance)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Login Mobile Phone <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        pattern={PHONE_HTML_PATTERN}
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10 digits (e.g. 9876543215)"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">10-digit Indian phone (starts with 6-9)</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Designation / Title
                      </label>
                      <input
                        type="text"
                        value={staffTitle}
                        onChange={(e) => setStaffTitle(e.target.value)}
                        placeholder="e.g. Senior Floor Warden"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff.member@serenityliving.com"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* 2. 🏢 Building Jurisdiction (Select How Many Buildings) */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-900">
                          Building Jurisdiction (Select How Many Buildings) <span className="text-rose-500">*</span>
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Choose whether this staff member covers the whole campus or specific buildings
                        </p>
                      </div>
                    </div>

                    {/* Live Counter Badge */}
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0 self-start sm:self-auto">
                      {buildingScope === 'ALL'
                        ? `All ${buildings.length} Buildings Selected`
                        : `${assignedBuildingIds.length} of ${buildings.length} Building${assignedBuildingIds.length === 1 ? '' : 's'} Selected`}
                    </span>
                  </div>

                  {/* Scope Selector: All vs Custom */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBuildingScope('ALL');
                        setAssignedBuildingIds(buildings.map((b) => b.id));
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                        buildingScope === 'ALL'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>All Buildings (Entire Campus)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBuildingScope('CUSTOM');
                        if (assignedBuildingIds.length === 0 && buildings.length > 0) {
                          setAssignedBuildingIds([buildings[0].id]);
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                        buildingScope === 'CUSTOM'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Select Specific Building(s)</span>
                    </button>
                  </div>

                  {/* Specific Building Selector List */}
                  {buildingScope === 'CUSTOM' && (
                    <div className="space-y-2.5 pt-2 border-t border-indigo-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-semibold">
                          Choose buildings ({assignedBuildingIds.length} selected):
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAssignedBuildingIds(buildings.map((b) => b.id))}
                            className="text-[11px] font-bold text-indigo-600 hover:underline"
                          >
                            Select All ({buildings.length})
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (buildings.length > 0) setAssignedBuildingIds([buildings[0].id]);
                            }}
                            className="text-[11px] font-bold text-slate-600 hover:underline"
                          >
                            Single Building
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setAssignedBuildingIds([])}
                            className="text-[11px] font-bold text-rose-600 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Interactive Building Cards */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {buildings.map((bld) => {
                          const isSelected = assignedBuildingIds.includes(bld.id);
                          const buildingBlocks = blocks.filter((blk) => blk.buildingId === bld.id);

                          return (
                            <div
                              key={bld.id}
                              onClick={() => toggleBuildingSelection(bld.id)}
                              className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                                    isSelected
                                      ? 'bg-indigo-600 border-indigo-600 text-white'
                                      : 'border-slate-300 bg-white text-transparent'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">{bld.name}</span>
                                    {bld.genderType && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                        {bld.genderType}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    {buildingBlocks.length} block{buildingBlocks.length === 1 ? '' : 's'}:{' '}
                                    {buildingBlocks.map((b) => b.name).join(', ') || 'No blocks configured'}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {isSelected ? 'Selected' : 'Click to Select'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {assignedBuildingIds.length === 0 && (
                        <p className="text-xs text-rose-600 font-medium">
                          ⚠️ Please select at least one building for this staff member.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. 🧱 Block Jurisdiction (Filtered by Selected Buildings) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-900">
                          Block Jurisdiction (within Selected Buildings)
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Define whether staff manages all blocks or specific wings
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0 self-start sm:self-auto">
                      {blockScope === 'ALL'
                        ? `All ${availableBlocks.length} Blocks`
                        : `${assignedBlockIds.filter((id) => availableBlocks.some((b) => b.id === id)).length} Blocks Selected`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBlockScope('ALL');
                        setAssignedBlockIds(availableBlocks.map((b) => b.id));
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        blockScope === 'ALL'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>All Blocks in Selected Buildings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBlockScope('CUSTOM');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        blockScope === 'CUSTOM'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>Select Specific Block(s) Only</span>
                    </button>
                  </div>

                  {blockScope === 'CUSTOM' && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200 max-h-36 overflow-y-auto pr-1">
                      {availableBlocks.length === 0 ? (
                        <p className="text-xs text-amber-600 italic">Please select at least one building above first.</p>
                      ) : (
                        availableBlocks.map((blk) => {
                          const isSelected = assignedBlockIds.includes(blk.id);
                          return (
                            <label
                              key={blk.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${
                                isSelected
                                  ? 'bg-purple-50 border-purple-300 font-semibold text-purple-950'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleBlockSelection(blk.id)}
                                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                                />
                                <span>{blk.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                {blk.buildingName}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingStaffId ? 'Save Changes' : 'Confirm & Assign Staff'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
