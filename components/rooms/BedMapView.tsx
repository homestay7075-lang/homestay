'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Wrench,
  UserCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  LogOut,
  X,
  Bed as BedIcon,
  Shield,
  Search,
  Filter,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { BedStatus } from '@/lib/db/types';

interface BedMapViewProps {
  buildings: any[];
  blocks: any[];
  floors: any[];
  rooms: any[];
  beds: any[];
  onRefresh: () => void;
  onOpenAddRoom: (floorId?: string, blockId?: string) => void;
  onOpenEditRoom: (room: any) => void;
  onDeleteRoom: (room: any) => void;
  onOpenAddBed: (roomId?: string) => void;
  onOpenEditBed: (bed: any) => void;
  onDeleteBed: (bed: any) => void;
  onOpenAddFloor: (blockId?: string) => void;
  onOpenEditFloor: (floor: any) => void;
  onDeleteFloor: (floor: any) => void;
  showFeedback: (text: string, type?: 'success' | 'error') => void;
}

export default function BedMapView({
  buildings,
  blocks,
  floors,
  rooms,
  beds,
  onRefresh,
  onOpenAddRoom,
  onOpenEditRoom,
  onDeleteRoom,
  onOpenAddBed,
  onOpenEditBed,
  onDeleteBed,
  onOpenAddFloor,
  onOpenEditFloor,
  onDeleteFloor,
  showFeedback,
}: BedMapViewProps) {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected bed for interactive action drawer/modal
  const [activeBedModal, setActiveBedModal] = useState<any | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Quick edit bed inline state
  const [inlineEditingBed, setInlineEditingBed] = useState<boolean>(false);
  const [editBedNumber, setEditBedNumber] = useState<string>('');
  const [editBedRate, setEditBedRate] = useState<number>(0);

  // Calculate live counts for each status
  const counts = {
    total: beds.length,
    Available: beds.filter((b: any) => b.status === 'Available').length,
    Occupied: beds.filter((b: any) => b.status === 'Occupied').length,
    Reserved: beds.filter((b: any) => b.status === 'Reserved').length,
    Maintenance: beds.filter((b: any) => b.status === 'Maintenance').length,
    Vacating: beds.filter((b: any) => b.status === 'Vacating').length,
  };

  // Helper to format currency like in screenshot: ₹4,500.00
  const formatCurrency = (amount: number) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Filter blocks
  const filteredBlocks = blocks.filter((blk: any) =>
    selectedBlockId === 'ALL' ? true : blk.id === selectedBlockId
  );

  // Change bed status via API
  const handleUpdateBedStatus = async (bedId: string, newStatus: BedStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'BED',
          id: bedId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Bed status set to ${newStatus}`);
        onRefresh();
        if (activeBedModal?.id === bedId) {
          setActiveBedModal({ ...activeBedModal, status: newStatus });
        }
      } else {
        showFeedback(data.error || 'Failed to update bed status', 'error');
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Save inline bed changes (bedNumber, monthlyRate)
  const handleSaveBedDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBedModal) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'BED',
          id: activeBedModal.id,
          bedNumber: editBedNumber.trim(),
          monthlyRate: Number(editBedRate),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Bed ${editBedNumber} updated successfully`);
        onRefresh();
        setActiveBedModal({
          ...activeBedModal,
          bedNumber: editBedNumber.trim(),
          monthlyRate: Number(editBedRate),
        });
        setInlineEditingBed(false);
      } else {
        showFeedback(data.error || 'Failed to update bed', 'error');
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Helper to open modal for bed
  const handleOpenBedDetails = (bed: any) => {
    setActiveBedModal(bed);
    setEditBedNumber(bed.bedNumber);
    setEditBedRate(Number(bed.monthlyRate || 0));
    setInlineEditingBed(false);
  };

  // Helper to get floor display label (e.g., F-1, F-2, Floor 3)
  const getFloorDisplayHeading = (flr: any) => {
    if (flr.name && (flr.name.startsWith('F-') || flr.name.startsWith('Floor '))) {
      return flr.name;
    }
    if (flr.floorNumber !== undefined) {
      if (flr.floorNumber === 1) return 'F-1';
      if (flr.floorNumber === 2) return 'F-2';
      return `Floor ${flr.floorNumber}`;
    }
    return flr.name || 'Floor';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ================= 1. DARK TEAL HEADER BAR (MATCHING SCREENSHOT) ================= */}
      <div className="bg-[#0B4A54] text-white rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 flex items-center justify-center"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-wide text-white flex items-center gap-2">
              <span>Bed Map</span>
            </h1>
            <p className="text-[11px] text-teal-100/80">
              Interactive hostel floor plan & real-time allocation grid
            </p>
          </div>
        </div>

        {/* Header Action Buttons (CRUD) */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => onOpenAddFloor()}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition flex items-center gap-1 cursor-pointer active:scale-95"
            title="Add a new floor"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Floor</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAddRoom()}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Add a new room with beds"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Room & Beds</span>
          </button>
        </div>
      </div>

      {/* ================= 2. LEGEND CARD (EXACTLY MATCHING SCREENSHOT) ================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Live Occupancy Legend
          </span>
          {selectedStatusFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedStatusFilter('ALL')}
              className="text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-full"
            >
              Reset Filter (Show All {counts.total})
            </button>
          )}
        </div>

        {/* 5 Status Dots: Available, Occupied, Reserved, Maintenance, Vacating */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs sm:text-sm">
          {/* Cyan: Available */}
          <button
            type="button"
            onClick={() =>
              setSelectedStatusFilter(selectedStatusFilter === 'Available' ? 'ALL' : 'Available')
            }
            className={`flex items-center gap-2.5 p-2 rounded-xl transition text-left cursor-pointer ${
              selectedStatusFilter === 'Available'
                ? 'bg-cyan-50 ring-2 ring-cyan-400 font-bold text-cyan-900'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#06B6D4] shrink-0 shadow-xs"></span>
            <span className="font-serif">Available</span>
            <span className="text-[11px] font-mono text-slate-400 font-bold ml-auto">
              ({counts.Available})
            </span>
          </button>

          {/* Purple: Occupied */}
          <button
            type="button"
            onClick={() =>
              setSelectedStatusFilter(selectedStatusFilter === 'Occupied' ? 'ALL' : 'Occupied')
            }
            className={`flex items-center gap-2.5 p-2 rounded-xl transition text-left cursor-pointer ${
              selectedStatusFilter === 'Occupied'
                ? 'bg-purple-50 ring-2 ring-purple-400 font-bold text-purple-900'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#8B5CF6] shrink-0 shadow-xs"></span>
            <span className="font-serif">Occupied</span>
            <span className="text-[11px] font-mono text-slate-400 font-bold ml-auto">
              ({counts.Occupied})
            </span>
          </button>

          {/* Amber: Reserved */}
          <button
            type="button"
            onClick={() =>
              setSelectedStatusFilter(selectedStatusFilter === 'Reserved' ? 'ALL' : 'Reserved')
            }
            className={`flex items-center gap-2.5 p-2 rounded-xl transition text-left cursor-pointer ${
              selectedStatusFilter === 'Reserved'
                ? 'bg-amber-50 ring-2 ring-amber-400 font-bold text-amber-900'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B] shrink-0 shadow-xs"></span>
            <span className="font-serif">Reserved</span>
            <span className="text-[11px] font-mono text-slate-400 font-bold ml-auto">
              ({counts.Reserved})
            </span>
          </button>

          {/* Gray: Maintenance */}
          <button
            type="button"
            onClick={() =>
              setSelectedStatusFilter(
                selectedStatusFilter === 'Maintenance' ? 'ALL' : 'Maintenance'
              )
            }
            className={`flex items-center gap-2.5 p-2 rounded-xl transition text-left cursor-pointer ${
              selectedStatusFilter === 'Maintenance'
                ? 'bg-slate-100 ring-2 ring-slate-400 font-bold text-slate-900'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#64748B] shrink-0 shadow-xs"></span>
            <span className="font-serif">Maintenance</span>
            <span className="text-[11px] font-mono text-slate-400 font-bold ml-auto">
              ({counts.Maintenance})
            </span>
          </button>

          {/* Deep Orange: Vacating */}
          <button
            type="button"
            onClick={() =>
              setSelectedStatusFilter(selectedStatusFilter === 'Vacating' ? 'ALL' : 'Vacating')
            }
            className={`flex items-center gap-2.5 p-2 rounded-xl transition text-left cursor-pointer ${
              selectedStatusFilter === 'Vacating'
                ? 'bg-orange-50 ring-2 ring-orange-500 font-bold text-orange-900'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#EA580C] shrink-0 shadow-xs"></span>
            <span className="font-serif">Vacating</span>
            <span className="text-[11px] font-mono text-slate-400 font-bold ml-auto">
              ({counts.Vacating})
            </span>
          </button>
        </div>
      </div>

      {/* ================= OPTIONAL WING SELECTOR & SEARCH ================= */}
      {blocks.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="font-bold text-slate-600 shrink-0">Wing / Block:</span>
            <button
              onClick={() => setSelectedBlockId('ALL')}
              className={`px-3 py-1 rounded-xl font-semibold transition shrink-0 ${
                selectedBlockId === 'ALL'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Wings ({counts.total} Beds)
            </button>
            {blocks.map((blk: any) => (
              <button
                key={blk.id}
                onClick={() => setSelectedBlockId(blk.id)}
                className={`px-3 py-1 rounded-xl font-semibold transition shrink-0 ${
                  selectedBlockId === blk.id
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {blk.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Bed / Room #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 outline-none"
            />
          </div>
        </div>
      )}

      {/* ================= 3. FLOORS & ROOM CARDS (EXACTLY MATCHING SCREENSHOT) ================= */}
      <div className="space-y-8">
        {floors
          .filter((flr: any) =>
            selectedBlockId === 'ALL' ? true : flr.blockId === selectedBlockId
          )
          .map((flr: any) => {
            const block = blocks.find((b: any) => b.id === flr.blockId);
            const floorRooms = rooms.filter((r: any) => r.floorId === flr.id);

            // Filter rooms based on search query if present
            const filteredFloorRooms = floorRooms.filter((rm: any) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              const rmMatch = rm.roomNumber?.toLowerCase().includes(q);
              const roomBeds = beds.filter((b: any) => b.roomId === rm.id);
              const bedMatch = roomBeds.some(
                (b: any) =>
                  b.bedNumber?.toLowerCase().includes(q) ||
                  b.currentStudentName?.toLowerCase().includes(q)
              );
              return rmMatch || bedMatch;
            });

            const heading = getFloorDisplayHeading(flr);

            return (
              <div key={flr.id} className="space-y-4">
                {/* Floor Heading e.g., F-1, F-2, Floor 3 */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
                      {heading}
                    </h2>
                    {flr.name && flr.name !== heading && (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {flr.name}
                      </span>
                    )}
                    {block && (
                      <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                        • {block.name}
                      </span>
                    )}
                  </div>

                  {/* Floor CRUD Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenAddRoom(flr.id, flr.blockId)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1 shadow-xs cursor-pointer"
                      title="Add Room to this floor"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span className="hidden sm:inline">Add Room</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenEditFloor(flr)}
                      className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition"
                      title="Edit Floor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteFloor(flr)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      title="Delete Floor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rooms Grid under Floor */}
                {filteredFloorRooms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredFloorRooms.map((rm: any) => {
                      const roomBeds = beds.filter((b: any) => b.roomId === rm.id);
                      const roomFee = Number(rm.baseRateMonthly || 8500);

                      return (
                        <div
                          key={rm.id}
                          className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                          {/* Room Header: Left "Room 101", Right "₹4,500.00" */}
                          <div>
                            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold font-serif text-slate-900 tracking-tight">
                                  {rm.roomNumber.toLowerCase().includes('room')
                                    ? rm.roomNumber
                                    : `Room ${rm.roomNumber}`}
                                </h3>
                                {rm.type && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      rm.type === 'AC'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {rm.type}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <span className="font-mono text-sm sm:text-base font-semibold text-slate-500">
                                    {formatCurrency(roomFee)}
                                  </span>
                                </div>

                                {/* Room Action Buttons */}
                                <div className="flex items-center gap-0.5 ml-1">
                                  <button
                                    type="button"
                                    onClick={() => onOpenAddBed(rm.id)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition"
                                    title="Add Bed to this room"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onOpenEditRoom(rm)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition"
                                    title="Edit Room & Fee"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onDeleteRoom(rm)}
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                                    title="Delete Room"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Bed Pills Layout (Exact styling from screenshot) */}
                            <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-4">
                              {roomBeds.map((bed: any) => {
                                const status = bed.status || 'Available';
                                const isMatch =
                                  selectedStatusFilter === 'ALL' ||
                                  selectedStatusFilter === status;

                                // Colors based on screenshot:
                                // Available: cyan border, cyan text, soft cyan background
                                // Occupied: purple border, purple text, soft purple background
                                // Reserved: amber border, amber text, soft amber background
                                // Maintenance: gray border, gray text, soft gray background
                                // Vacating: orange border, orange text, soft orange background
                                let pillClasses =
                                  'border-cyan-400 bg-cyan-50/50 text-cyan-600 hover:bg-cyan-100/60';
                                if (status === 'Occupied') {
                                  pillClasses =
                                    'border-purple-400 bg-purple-50/50 text-purple-600 hover:bg-purple-100/60';
                                } else if (status === 'Reserved') {
                                  pillClasses =
                                    'border-amber-400 bg-amber-50/50 text-amber-700 hover:bg-amber-100/60';
                                } else if (status === 'Maintenance') {
                                  pillClasses =
                                    'border-slate-400 bg-slate-100/80 text-slate-600 hover:bg-slate-200/80';
                                } else if (status === 'Vacating') {
                                  pillClasses =
                                    'border-orange-500 bg-orange-50/50 text-orange-700 hover:bg-orange-100/60';
                                }

                                return (
                                  <button
                                    key={bed.id}
                                    type="button"
                                    onClick={() => handleOpenBedDetails(bed)}
                                    className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl border-2 font-mono font-bold text-xs sm:text-sm tracking-wider cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95 shadow-xs flex items-center gap-1.5 ${pillClasses} ${
                                      !isMatch ? 'opacity-20 scale-95' : 'opacity-100'
                                    }`}
                                    title={`${bed.bedNumber} - ${status} (${
                                      bed.currentStudentName || 'Unallocated'
                                    })`}
                                  >
                                    <span>{bed.bedNumber}</span>
                                  </button>
                                );
                              })}

                              {roomBeds.length === 0 && (
                                <div className="text-slate-400 text-xs py-2 italic flex items-center gap-2">
                                  <span>No beds configured yet.</span>
                                  <button
                                    type="button"
                                    onClick={() => onOpenAddBed(rm.id)}
                                    className="text-teal-700 font-bold hover:underline"
                                  >
                                    + Add Bed
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-3xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No rooms on {heading} yet.{' '}
                    <button
                      type="button"
                      onClick={() => onOpenAddRoom(flr.id, flr.blockId)}
                      className="text-teal-700 font-bold hover:underline ml-1"
                    >
                      + Click here to add Room & Beds
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* ================= 4. INTERACTIVE BED ACTION & CRUD MODAL ================= */}
      {activeBedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                    activeBedModal.status === 'Available'
                      ? 'bg-cyan-500'
                      : activeBedModal.status === 'Occupied'
                      ? 'bg-purple-600'
                      : activeBedModal.status === 'Reserved'
                      ? 'bg-amber-500'
                      : activeBedModal.status === 'Vacating'
                      ? 'bg-orange-600'
                      : 'bg-slate-600'
                  }`}
                >
                  <BedIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-serif">
                    Bed {activeBedModal.bedNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Room {activeBedModal.roomNumber} • {activeBedModal.blockName || 'Main Block'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveBedModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Quick Status Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    Current Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs ${
                      activeBedModal.status === 'Available'
                        ? 'bg-cyan-100 text-cyan-800'
                        : activeBedModal.status === 'Occupied'
                        ? 'bg-purple-100 text-purple-800'
                        : activeBedModal.status === 'Reserved'
                        ? 'bg-amber-100 text-amber-800'
                        : activeBedModal.status === 'Vacating'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeBedModal.status === 'Available'
                          ? 'bg-cyan-500'
                          : activeBedModal.status === 'Occupied'
                          ? 'bg-purple-600'
                          : activeBedModal.status === 'Reserved'
                          ? 'bg-amber-500'
                          : activeBedModal.status === 'Vacating'
                          ? 'bg-orange-600'
                          : 'bg-slate-500'
                      }`}
                    ></span>
                    {activeBedModal.status}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    Monthly Rent
                  </span>
                  <span className="font-mono text-base font-bold text-slate-800">
                    {formatCurrency(activeBedModal.monthlyRate || 8500)}
                  </span>
                </div>
              </div>

              {/* Occupant Details (if Occupied or Vacating) */}
              {(activeBedModal.status === 'Occupied' || activeBedModal.status === 'Vacating') && (
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 text-xs">
                      Allocated Resident Details
                    </span>
                    <Link
                      href={`/dashboard/students?search=${encodeURIComponent(
                        activeBedModal.currentStudentName || ''
                      )}`}
                      className="text-purple-700 hover:text-purple-900 font-bold text-[11px] flex items-center gap-0.5"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="text-xs space-y-1 text-slate-700">
                    <div className="font-bold text-slate-900 text-sm">
                      {activeBedModal.currentStudentName || 'Resident'}
                    </div>
                    {activeBedModal.currentStudentId && (
                      <div className="font-mono text-purple-700 font-semibold">
                        Student ID: {activeBedModal.currentStudentId}
                      </div>
                    )}
                  </div>

                  {/* Actions for Occupied Bed */}
                  <div className="pt-2 flex items-center gap-2">
                    {activeBedModal.status === 'Occupied' ? (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateBedStatus(activeBedModal.id, 'Vacating')}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Mark as Vacating</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateBedStatus(activeBedModal.id, 'Occupied')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Keep as Occupied</span>
                      </button>
                    )}

                    <Link
                      href={`/dashboard/students`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl transition flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Check Out Resident</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Status Actions for Available / Maintenance / Reserved Beds */}
              {activeBedModal.status !== 'Occupied' && activeBedModal.status !== 'Vacating' && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 text-xs block">
                    Quick Status Toggle:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateBedStatus(activeBedModal.id, 'Available')}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                        activeBedModal.status === 'Available'
                          ? 'bg-cyan-50 border-cyan-400 text-cyan-800 ring-2 ring-cyan-300'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🟢 Available
                    </button>

                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateBedStatus(activeBedModal.id, 'Reserved')}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                        activeBedModal.status === 'Reserved'
                          ? 'bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-300'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🟠 Reserved
                    </button>

                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateBedStatus(activeBedModal.id, 'Maintenance')}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                        activeBedModal.status === 'Maintenance'
                          ? 'bg-slate-100 border-slate-400 text-slate-800 ring-2 ring-slate-300'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ⚙️ Maintenance
                    </button>
                  </div>

                  {activeBedModal.status === 'Available' && (
                    <div className="pt-2">
                      <Link
                        href={`/dashboard/students`}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Admit / Register Resident for this Bed</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Bed Info Section */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Bed Particulars (CRUD)</span>
                  <button
                    type="button"
                    onClick={() => setInlineEditingBed(!inlineEditingBed)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{inlineEditingBed ? 'Cancel Edit' : 'Edit Bed Code & Fee'}</span>
                  </button>
                </div>

                {inlineEditingBed ? (
                  <form
                    onSubmit={handleSaveBedDetails}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Bed Code / Identifier
                      </label>
                      <input
                        type="text"
                        required
                        value={editBedNumber}
                        onChange={(e) => setEditBedNumber(e.target.value)}
                        placeholder="e.g. A-101, Bed 1"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-xl outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Monthly Rent (₹/month)
                      </label>
                      <input
                        type="number"
                        required
                        min={1000}
                        value={editBedRate}
                        onChange={(e) => setEditBedRate(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-xl outline-none font-bold"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setInlineEditingBed(false)}
                        className="px-3 py-1.5 text-slate-500 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingStatus}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                      >
                        {isUpdatingStatus ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Bed Code:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {activeBedModal.bedNumber}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">Monthly Fee:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatCurrency(activeBedModal.monthlyRate || 8500)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  const bedToDelete = activeBedModal;
                  setActiveBedModal(null);
                  onDeleteBed(bedToDelete);
                }}
                disabled={
                  activeBedModal.status === 'Occupied' || activeBedModal.status === 'Vacating'
                }
                className={`text-xs font-bold flex items-center gap-1 ${
                  activeBedModal.status === 'Occupied' || activeBedModal.status === 'Vacating'
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-rose-600 hover:text-rose-700 cursor-pointer'
                }`}
                title={
                  activeBedModal.status === 'Occupied'
                    ? 'Cannot delete occupied bed'
                    : 'Delete Bed'
                }
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Bed</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveBedModal(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
