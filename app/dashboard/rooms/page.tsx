'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  Bed as BedIcon,
  Building,
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Sparkles,
  Search,
  X,
  Loader2,
  Settings2,
  PlusCircle,
  DollarSign,
  Users,
  LayoutGrid,
  Filter,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { BedStatus } from '@/lib/db/types';
import BedMapView from '@/components/rooms/BedMapView';

export default function RoomsAndBedsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('All');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'BED_MAP' | 'FLOOR_GROUPED' | 'GRID' | 'STRUCTURE'>('BED_MAP');

  // Modals state
  const [buildingModal, setBuildingModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; buildingData?: any }>({
    isOpen: false,
    mode: 'ADD',
  });
  const [floorModal, setFloorModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; floorData?: any; defaultBlockId?: string }>({
    isOpen: false,
    mode: 'ADD',
  });
  const [roomModal, setRoomModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; roomData?: any; defaultFloorId?: string; defaultBlockId?: string }>({
    isOpen: false,
    mode: 'ADD',
  });
  const [bedModal, setBedModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; bedData?: any; roomId?: string }>({
    isOpen: false,
    mode: 'ADD',
  });
  const [blockModal, setBlockModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; blockData?: any }>({
    isOpen: false,
    mode: 'ADD',
  });

  // Action status message
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load rooms', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Toggle Maintenance on a bed
  const handleToggleBedMaintenance = async (bedId: string, currentStatus: BedStatus) => {
    if (currentStatus === 'Occupied') {
      showFeedback('Cannot change status of an occupied bed. Check out resident first.', 'error');
      return;
    }
    const newStatus: BedStatus = currentStatus === 'Maintenance' ? 'Available' : 'Maintenance';
    try {
      const res = await fetch('/api/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedId, status: newStatus }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        showFeedback(`Bed status updated to ${newStatus}`);
        fetchRooms();
      } else {
        showFeedback(resJson.error || 'Failed to update bed status', 'error');
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Delete Room
  const handleDeleteRoom = async (room: any) => {
    const roomBeds = (data?.beds || []).filter((b: any) => b.roomId === room.id);
    const hasOccupied = roomBeds.some((b: any) => b.status === 'Occupied');
    if (hasOccupied) {
      alert(`Cannot delete Room ${room.roomNumber} because it currently contains occupied beds. Please check out residents first.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete Room ${room.roomNumber} and its ${roomBeds.length} bed(s)?`)) return;

    try {
      const res = await fetch(`/api/rooms?entityType=ROOM&id=${room.id}`, { method: 'DELETE' });
      const resJson = await res.json();
      if (resJson.success) {
        showFeedback(`Room ${room.roomNumber} deleted successfully.`);
        fetchRooms();
      } else {
        showFeedback(resJson.error || 'Delete failed', 'error');
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Delete Floor
  const handleDeleteFloor = async (floor: any) => {
    const floorRooms = (data?.rooms || []).filter((r: any) => r.floorId === floor.id);
    const floorRoomIds = floorRooms.map((r: any) => r.id);
    const floorBeds = (data?.beds || []).filter((b: any) => floorRoomIds.includes(b.roomId));
    const hasOccupied = floorBeds.some((b: any) => b.status === 'Occupied');

    if (hasOccupied) {
      alert(`Cannot delete ${floor.name} because it contains actively occupied beds. Please check out residents first.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete "${floor.name}" along with its ${floorRooms.length} room(s)?`)) return;

    try {
      const res = await fetch(`/api/rooms?entityType=FLOOR&id=${floor.id}`, { method: 'DELETE' });
      const resJson = await res.json();
      if (resJson.success) {
        showFeedback(`Floor "${floor.name}" deleted.`);
        fetchRooms();
      } else {
        showFeedback(resJson.error || 'Delete failed', 'error');
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Delete Bed
  const handleDeleteBed = async (bed: any) => {
    if (bed.status === 'Occupied') {
      alert(`Cannot delete Bed ${bed.bedNumber} because it is occupied by ${bed.currentStudentName}.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete ${bed.bedNumber} from Room ${bed.roomNumber}?`)) return;

    try {
      const res = await fetch(`/api/rooms?entityType=BED&id=${bed.id}`, { method: 'DELETE' });
      const resJson = await res.json();
      if (resJson.success) {
        showFeedback(`${bed.bedNumber} deleted successfully.`);
        fetchRooms();
      } else {
        showFeedback(resJson.error || 'Delete failed', 'error');
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Delete Block
  const handleDeleteBlock = async (block: any) => {
    if (!confirm(`Are you sure you want to delete ${block.name}? All rooms and vacant beds inside will also be removed.`)) return;

    try {
      const res = await fetch(`/api/rooms?entityType=BLOCK&id=${block.id}`, { method: 'DELETE' });
      const resJson = await res.json();
      if (resJson.success) {
        showFeedback(`Block "${block.name}" deleted.`);
        fetchRooms();
      } else {
        showFeedback(resJson.error || 'Delete failed', 'error');
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  // Delete Building
  const handleDeleteBuilding = async (building: any) => {
    if (!confirm(`Delete building "${building.name}"?`)) return;

    try {
      const res = await fetch(`/api/rooms?entityType=BUILDING&id=${building.id}`, { method: 'DELETE' });
      const resJson = await res.json();
      if (resJson.success) {
        showFeedback(`Building "${building.name}" deleted.`);
        fetchRooms();
      } else {
        showFeedback(resJson.error || 'Delete failed', 'error');
      }
    } catch (e: any) {
      showFeedback(e.message, 'error');
    }
  };

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Loading Campus Structure & Rooms...</p>
        </div>
      </DashboardLayout>
    );
  }

  const { buildings, blocks, floors, rooms, beds, stats } = data;

  // Calculate average room fee
  const averageRoomFee = rooms.length > 0
    ? Math.round(rooms.reduce((acc: number, r: any) => acc + Number(r.baseRateMonthly || 0), 0) / rooms.length)
    : 0;

  // Filtered rooms
  const filteredRooms = rooms.filter((r: any) => {
    if (selectedBlockId !== 'All' && r.blockId !== selectedBlockId) return false;
    if (selectedFloorId !== 'All' && r.floorId !== selectedFloorId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesRoom =
        r.roomNumber.toLowerCase().includes(q) ||
        (r.parentRoomNumber && r.parentRoomNumber.toLowerCase().includes(q));
      const roomBeds = beds.filter((b: any) => b.roomId === r.id);
      const matchesBeds = roomBeds.some((b: any) =>
        b.bedNumber.toLowerCase().includes(q) ||
        b.currentStudentName?.toLowerCase().includes(q) ||
        b.currentStudentId?.toLowerCase().includes(q)
      );
      return matchesRoom || matchesBeds;
    }
    return true;
  });

  // Available floors for filter based on selectedBlockId
  const availableFloorsForFilter = selectedBlockId === 'All'
    ? floors
    : floors.filter((f: any) => f.blockId === selectedBlockId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ================= TOP HEADER & QUICK ACTION BUTTONS ================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Campus Hierarchy: Building ➔ Floor ➔ Room ➔ Beds
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Rooms & Beds Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Add buildings, floors, and rooms. Room fees determine monthly rent across all beds.
            </p>
          </div>

          {/* Direct Add Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setBuildingModal({ isOpen: true, mode: 'ADD' })}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Building className="w-4 h-4 text-indigo-300" />
              + Add Building
            </button>

            <button
              onClick={() => setFloorModal({ isOpen: true, mode: 'ADD', defaultBlockId: blocks[0]?.id })}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              + Add Floor
            </button>

            <button
              onClick={() => setRoomModal({ isOpen: true, mode: 'ADD', defaultBlockId: blocks[0]?.id })}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              + Add Room & Fee
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* ================= PRIMARY VIEW SWITCHER TABS ================= */}
        <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('BED_MAP')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'BED_MAP'
                  ? 'bg-[#0B4A54] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BedIcon className="w-3.5 h-3.5" />
              <span>🗺️ Visual Bed Map</span>
            </button>

            <button
              onClick={() => setViewMode('FLOOR_GROUPED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'FLOOR_GROUPED'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Floor-by-Floor Cards</span>
            </button>

            <button
              onClick={() => setViewMode('GRID')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Rooms Grid</span>
            </button>

            <button
              onClick={() => setViewMode('STRUCTURE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'STRUCTURE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Manage Buildings & Floors</span>
            </button>
          </div>
        </div>

        {/* ================= VIEW 0: BED MAP VIEW (EXACT MATCH TO SCREENSHOT) ================= */}
        {viewMode === 'BED_MAP' && (
          <BedMapView
            buildings={buildings}
            blocks={blocks}
            floors={floors}
            rooms={rooms}
            beds={beds}
            onRefresh={fetchRooms}
            onOpenAddRoom={(floorId, blockId) =>
              setRoomModal({
                isOpen: true,
                mode: 'ADD',
                defaultFloorId: floorId,
                defaultBlockId: blockId,
              })
            }
            onOpenEditRoom={(room) =>
              setRoomModal({ isOpen: true, mode: 'EDIT', roomData: room })
            }
            onDeleteRoom={handleDeleteRoom}
            onOpenAddBed={(roomId) => setBedModal({ isOpen: true, mode: 'ADD', roomId })}
            onOpenEditBed={(bed) =>
              setBedModal({ isOpen: true, mode: 'EDIT', bedData: bed })
            }
            onDeleteBed={handleDeleteBed}
            onOpenAddFloor={(blockId) =>
              setFloorModal({
                isOpen: true,
                mode: 'ADD',
                defaultBlockId: blockId || blocks[0]?.id,
              })
            }
            onOpenEditFloor={(floor) =>
              setFloorModal({ isOpen: true, mode: 'EDIT', floorData: floor })
            }
            onDeleteFloor={handleDeleteFloor}
            showFeedback={showFeedback}
          />
        )}

        {viewMode !== 'BED_MAP' && (
          <>
            {/* ================= STATS OVERVIEW CARDS ================= */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Buildings & Wings</span>
              <Building className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-display">
              {buildings.length} / {blocks.length}
            </div>
            <span className="text-[11px] text-slate-400">Total physical wings</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Configured Floors</span>
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-purple-700 font-display">{floors.length}</div>
            <span className="text-[11px] text-slate-400">Across all blocks</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Rooms</span>
              <BedIcon className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-display">{stats.totalRooms}</div>
            <span className="text-[11px] text-emerald-600 font-semibold">{stats.vacantRooms} fully vacant</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Bed Availability</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 font-display">{stats.availableBeds}</div>
            <span className="text-[11px] text-slate-400">of {stats.totalBeds} total beds</span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-900 to-slate-900 text-white shadow-xs space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-medium">
              <span>Avg. Room Fee</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-display">
              ₹{averageRoomFee.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-indigo-200">Per room monthly fee</span>
          </div>
        </div>

        {/* ================= VIEW SELECTOR & FILTERS ================= */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* View Mode Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setViewMode('FLOOR_GROUPED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'FLOOR_GROUPED'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Floor-by-Floor View</span>
              </button>

              <button
                onClick={() => setViewMode('GRID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'GRID'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>All Rooms Grid</span>
              </button>

              <button
                onClick={() => setViewMode('STRUCTURE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'STRUCTURE'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Manage Buildings & Floors</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search Room #, Bed #, Resident..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Block & Floor Filter Pills */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            {/* Block Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                Wing:
              </span>
              <button
                onClick={() => {
                  setSelectedBlockId('All');
                  setSelectedFloorId('All');
                }}
                className={`px-3 py-1 rounded-xl font-semibold transition ${
                  selectedBlockId === 'All'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Wings ({rooms.length})
              </button>
              {blocks.map((blk: any) => {
                const count = rooms.filter((r: any) => r.blockId === blk.id).length;
                return (
                  <button
                    key={blk.id}
                    onClick={() => {
                      setSelectedBlockId(blk.id);
                      setSelectedFloorId('All');
                    }}
                    className={`px-3 py-1 rounded-xl font-semibold transition ${
                      selectedBlockId === blk.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {blk.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Floor Dropdown Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-bold text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Floor:
              </span>
              <select
                value={selectedFloorId}
                onChange={(e) => setSelectedFloorId(e.target.value)}
                className="px-3 py-1 border border-slate-200 rounded-xl bg-white text-slate-700 font-semibold outline-none focus:border-indigo-500"
              >
                <option value="All">All Floors</option>
                {availableFloorsForFilter.map((f: any) => {
                  const block = blocks.find((b: any) => b.id === f.blockId);
                  return (
                    <option key={f.id} value={f.id}>
                      {f.name} {selectedBlockId === 'All' && block ? `(${block.name})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* ================= VIEW 1: FLOOR GROUPED VIEW ================= */}
        {viewMode === 'FLOOR_GROUPED' && (
          <div className="space-y-8">
            {availableFloorsForFilter
              .filter((flr: any) => selectedFloorId === 'All' || flr.id === selectedFloorId)
              .map((flr: any) => {
                const block = blocks.find((b: any) => b.id === flr.blockId);
                const building = buildings.find((b: any) => b.id === block?.buildingId);
                const floorRooms = filteredRooms.filter((r: any) => r.floorId === flr.id);
                const floorRoomIds = floorRooms.map((r: any) => r.id);
                const floorBeds = beds.filter((b: any) => floorRoomIds.includes(b.roomId));
                const availableFloorBeds = floorBeds.filter((b: any) => b.status === 'Available').length;

                return (
                  <div key={flr.id} className="space-y-4">
                    {/* Floor Header Bar */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-base">
                          <Layers className="w-5 h-5 text-indigo-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold font-display text-white">{flr.name}</h2>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-indigo-200">
                              Floor {flr.floorNumber}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">
                            🏢 {building?.name || 'Main Campus'} • 📍 {block?.name || 'Main Block'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-right text-xs">
                          <span className="font-bold text-white">{floorRooms.length} Rooms</span>
                          <span className="text-slate-400"> • </span>
                          <span className="font-bold text-emerald-400">{availableFloorBeds} Beds Free</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setRoomModal({
                            isOpen: true,
                            mode: 'ADD',
                            defaultFloorId: flr.id,
                            defaultBlockId: flr.blockId,
                          })}
                          className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Room to Floor</span>
                        </button>
                      </div>
                    </div>

                    {/* Rooms on this floor */}
                    {floorRooms.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {floorRooms.map((rm: any) => renderRoomCard(rm, block, flr))}
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        No rooms configured on {flr.name} yet. Click "+ Add Room to Floor" above to add the first room.
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* ================= VIEW 2: ALL ROOMS GRID ================= */}
        {viewMode === 'GRID' && (
          <div>
            {filteredRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRooms.map((rm: any) => {
                  const block = blocks.find((b: any) => b.id === rm.blockId);
                  const flr = floors.find((f: any) => f.id === rm.floorId);
                  return renderRoomCard(rm, block, flr);
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                No rooms matching your search criteria.
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 3: MANAGE BUILDINGS & FLOORS TABLE ================= */}
        {viewMode === 'STRUCTURE' && (
          <div className="space-y-6">
            {/* Buildings Management */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base text-slate-900 font-display">Campus Buildings ({buildings.length})</h3>
                </div>
                <button
                  onClick={() => setBuildingModal({ isOpen: true, mode: 'ADD' })}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Building</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {buildings.map((bld: any) => {
                  const bldBlocks = blocks.filter((b: any) => b.buildingId === bld.id);
                  return (
                    <div key={bld.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{bld.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            bld.genderType === 'Boys'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : bld.genderType === 'Girls'
                              ? 'bg-pink-50 text-pink-800 border-pink-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}>
                            {bld.genderType === 'Boys' ? '👦 Boys Hostel' : bld.genderType === 'Girls' ? '👧 Girls Hostel' : '👥 Co-Living'}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5">{bld.description || 'No description provided'}</p>
                        <div className="text-[11px] font-semibold text-indigo-600 mt-1">
                          {bldBlocks.length} Wings / Blocks attached
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setBuildingModal({ isOpen: true, mode: 'EDIT', buildingData: bld })}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition"
                          title="Edit Building"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBuilding(bld)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                          title="Delete Building"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floors Management Table */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-base text-slate-900 font-display">Configured Floors ({floors.length})</h3>
                </div>
                <button
                  onClick={() => setFloorModal({ isOpen: true, mode: 'ADD', defaultBlockId: blocks[0]?.id })}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Floor</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Floor Name</th>
                      <th className="p-3">Floor Number</th>
                      <th className="p-3">Parent Wing / Block</th>
                      <th className="p-3">Rooms on Floor</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {floors.map((flr: any) => {
                      const block = blocks.find((b: any) => b.id === flr.blockId);
                      const flrRooms = rooms.filter((r: any) => r.floorId === flr.id);
                      return (
                        <tr key={flr.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">{flr.name}</td>
                          <td className="p-3 font-mono">Floor {flr.floorNumber}</td>
                          <td className="p-3 text-slate-600">{block?.name || 'Unassigned'}</td>
                          <td className="p-3 font-semibold text-indigo-600">{flrRooms.length} Rooms</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setFloorModal({ isOpen: true, mode: 'EDIT', floorData: flr })}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition"
                                title="Edit Floor"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFloor(flr)}
                                className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                                title="Delete Floor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* ================= MODAL 1: ADD / EDIT BUILDING ================= */}
      {buildingModal.isOpen && (
        <BuildingFormModal
          mode={buildingModal.mode}
          buildingData={buildingModal.buildingData}
          onClose={() => setBuildingModal({ isOpen: false, mode: 'ADD' })}
          onSuccess={() => {
            setBuildingModal({ isOpen: false, mode: 'ADD' });
            fetchRooms();
            showFeedback('Building saved successfully!');
          }}
        />
      )}

      {/* ================= MODAL 2: ADD / EDIT FLOOR ================= */}
      {floorModal.isOpen && (
        <FloorFormModal
          mode={floorModal.mode}
          floorData={floorModal.floorData}
          blocks={blocks}
          defaultBlockId={floorModal.defaultBlockId}
          onClose={() => setFloorModal({ isOpen: false, mode: 'ADD' })}
          onSuccess={() => {
            setFloorModal({ isOpen: false, mode: 'ADD' });
            fetchRooms();
            showFeedback('Floor saved successfully!');
          }}
        />
      )}

      {/* ================= MODAL 3: ADD / EDIT ROOM (FEE IS BASED ON ROOM) ================= */}
      {roomModal.isOpen && (
        <RoomFormModal
          mode={roomModal.mode}
          roomData={roomModal.roomData}
          blocks={blocks}
          floors={floors}
          defaultFloorId={roomModal.defaultFloorId}
          defaultBlockId={roomModal.defaultBlockId}
          onClose={() => setRoomModal({ isOpen: false, mode: 'ADD' })}
          onSuccess={() => {
            setRoomModal({ isOpen: false, mode: 'ADD' });
            fetchRooms();
            showFeedback(roomModal.mode === 'ADD' ? 'Room and beds created successfully!' : 'Room fee and details updated!');
          }}
          onOpenAddFloor={(blockId: string) => {
            setRoomModal({ isOpen: false, mode: 'ADD' });
            setFloorModal({ isOpen: true, mode: 'ADD', defaultBlockId: blockId });
          }}
        />
      )}

      {/* ================= MODAL 4: ADD / EDIT BED ================= */}
      {bedModal.isOpen && (
        <BedFormModal
          mode={bedModal.mode}
          bedData={bedModal.bedData}
          roomId={bedModal.roomId}
          rooms={rooms}
          onClose={() => setBedModal({ isOpen: false, mode: 'ADD' })}
          onSuccess={() => {
            setBedModal({ isOpen: false, mode: 'ADD' });
            fetchRooms();
            showFeedback(bedModal.mode === 'ADD' ? 'Bed added successfully!' : 'Bed updated successfully!');
          }}
        />
      )}
    </DashboardLayout>
  );

  // Helper function to render a clear, easy-to-understand Room Card
  function renderRoomCard(rm: any, block: any, flr: any) {
    const roomBeds = beds.filter((b: any) => b.roomId === rm.id);
    const occupiedCount = roomBeds.filter((b: any) => b.status === 'Occupied').length;
    const availableCount = roomBeds.filter((b: any) => b.status === 'Available').length;
    const hasOccupied = occupiedCount > 0;
    const roomFee = Number(rm.baseRateMonthly || 8500);

    return (
      <div
        key={rm.id}
        className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
      >
        <div className="space-y-3.5">
          {/* Room Header & Badges */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 font-display">
                  Room {rm.roomNumber}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    rm.type === 'AC'
                      ? 'bg-blue-100 text-blue-800'
                      : rm.type === 'Deluxe'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {rm.type}
                </span>
                {rm.isSubRoom && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                    <LayoutGrid className="w-3 h-3 text-indigo-500" />
                    Sub-Room of {rm.parentRoomNumber}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>{flr?.name || 'Floor'}</span>
                <span>•</span>
                <span>{block?.name || 'Block'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRoomModal({ isOpen: true, mode: 'EDIT', roomData: rm })}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition"
                title="Edit Room & Fee"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleDeleteRoom(rm)}
                className={`p-1.5 rounded-lg transition ${
                  hasOccupied
                    ? 'text-slate-300 hover:text-slate-400 cursor-not-allowed'
                    : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                }`}
                title={hasOccupied ? 'Cannot delete room with active residents' : 'Delete Room'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ================= PROMINENT ROOM FEE BADGE (FEE BASED ON ROOM) ================= */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Room Fee (Per Bed)
              </span>
              <span className="text-base font-black text-emerald-700 font-display">
                ₹{roomFee.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium"> / month</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-600 block">
                {availableCount} of {roomBeds.length} Free
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                  occupiedCount === roomBeds.length
                    ? 'bg-rose-100 text-rose-800'
                    : occupiedCount > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {occupiedCount === roomBeds.length ? 'Full' : occupiedCount > 0 ? 'Partially Full' : 'Vacant'}
              </span>
            </div>
          </div>

          {/* Beds List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700">Bed Allocations ({roomBeds.length} Beds)</span>
              <button
                type="button"
                onClick={() => setBedModal({ isOpen: true, mode: 'ADD', roomId: rm.id })}
                className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Add Bed</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {roomBeds.map((bed: any) => {
                const isOccupied = bed.status === 'Occupied';
                const isMaintenance = bed.status === 'Maintenance';
                const bedRate = Number(bed.monthlyRate || roomFee);

                return (
                  <div
                    key={bed.id}
                    className={`p-2.5 rounded-xl text-xs flex items-center justify-between border transition ${
                      isOccupied
                        ? 'bg-indigo-50/70 border-indigo-200'
                        : isMaintenance
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BedIcon
                        className={`w-3.5 h-3.5 ${
                          isOccupied ? 'text-indigo-600' : isMaintenance ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      />
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{bed.bedNumber}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            (₹{bedRate.toLocaleString('en-IN')}/mo)
                          </span>
                        </div>
                        {isOccupied ? (
                          <div className="text-[11px] text-indigo-700 font-medium">
                            {bed.currentStudentName} • <span className="font-mono">{bed.currentStudentId}</span>
                          </div>
                        ) : (
                          <span
                            className={`text-[10px] font-semibold ${
                              isMaintenance ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {isMaintenance ? 'Under Maintenance' : 'Available for Admission'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isOccupied && (
                        <button
                          type="button"
                          onClick={() => handleToggleBedMaintenance(bed.id, bed.status)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
                            isMaintenance
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                          }`}
                        >
                          {isMaintenance ? 'Clear' : 'Lock'}
                        </button>
                      )}

                      {!isOccupied && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBed(bed)}
                          className="p-1 rounded-md hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                          title="Delete Bed"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// ================= SUB-COMPONENT: BUILDING FORM MODAL =================
function BuildingFormModal({ mode, buildingData, onClose, onSuccess }: any) {
  const [name, setName] = useState(buildingData?.name || '');
  const [description, setDescription] = useState(buildingData?.description || '');
  const [genderType, setGenderType] = useState<string>(buildingData?.genderType || 'Co-Living');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = mode === 'ADD' ? 'POST' : 'PATCH';
      const body = {
        entityType: 'BUILDING',
        id: buildingData?.id,
        name,
        description,
        genderType,
      };
      const res = await fetch('/api/rooms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setErrorMsg(data.error || 'Failed to save building');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-base text-slate-900 font-display">
            {mode === 'ADD' ? 'Add New Building' : `Edit ${buildingData?.name}`}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Building Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Main Campus Tower or Annex Block"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hostel Residence Gender Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Boys', label: '👦 Boys', desc: 'Men Only', active: 'border-blue-500 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-400' },
                { id: 'Girls', label: '👧 Girls', desc: 'Women Only', active: 'border-pink-500 bg-pink-50 text-pink-900 font-bold ring-2 ring-pink-400' },
                { id: 'Co-Living', label: '👥 Co-Living', desc: 'Mixed Stay', active: 'border-purple-500 bg-purple-50 text-purple-900 font-bold ring-2 ring-purple-400' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGenderType(g.id)}
                  className={`p-2.5 rounded-xl border-2 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                    genderType === g.id
                      ? g.active
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs">{g.label}</span>
                  <span className="text-[10px] opacity-75">{g.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. 4-storey residential hostel"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
            >
              {loading ? 'Saving...' : 'Save Building'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= SUB-COMPONENT: FLOOR FORM MODAL =================
function FloorFormModal({ mode, floorData, blocks, defaultBlockId, onClose, onSuccess }: any) {
  const [blockId, setBlockId] = useState(floorData?.blockId || defaultBlockId || blocks[0]?.id || '');
  const [name, setName] = useState(floorData?.name || '');
  const [floorNumber, setFloorNumber] = useState(floorData?.floorNumber || 1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = mode === 'ADD' ? 'POST' : 'PATCH';
      const body = {
        entityType: 'FLOOR',
        id: floorData?.id,
        blockId,
        name: name.trim(),
        floorNumber: Number(floorNumber),
      };
      const res = await fetch('/api/rooms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setErrorMsg(data.error || 'Failed to save floor');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-base text-slate-900 font-display">
            {mode === 'ADD' ? 'Add New Floor' : `Edit ${floorData?.name}`}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hostel Wing / Block</label>
            <select
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white font-medium"
            >
              {blocks.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.buildingName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Floor Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ground Floor, 1st Floor, 2nd Floor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Floor Number (Order)</label>
            <input
              type="number"
              min={0}
              max={20}
              required
              value={floorNumber}
              onChange={(e) => setFloorNumber(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-semibold"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              {loading ? 'Saving...' : 'Save Floor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= SUB-COMPONENT: ROOM FORM MODAL (FEE IS BASED ON ROOM) =================
function RoomFormModal({
  mode,
  roomData,
  blocks,
  floors,
  defaultFloorId,
  defaultBlockId,
  onClose,
  onSuccess,
  onOpenAddFloor,
}: any) {
  const [blockId, setBlockId] = useState(roomData?.blockId || defaultBlockId || blocks[0]?.id || '');
  const availableFloors = floors.filter((f: any) => f.blockId === blockId);
  const [floorId, setFloorId] = useState(
    roomData?.floorId || defaultFloorId || availableFloors[0]?.id || ''
  );
  const [roomNumber, setRoomNumber] = useState(roomData?.roomNumber || '');
  const [type, setType] = useState(roomData?.type || 'AC');
  const [baseRateMonthly, setBaseRateMonthly] = useState(roomData?.baseRateMonthly || 9000);
  const [capacity, setCapacity] = useState(roomData?.capacity || 2);

  // Split into sub-rooms state
  const [isSplitRoom, setIsSplitRoom] = useState(false);
  const [subRooms, setSubRooms] = useState<
    { id: string; suffix: string; type: 'AC' | 'Non-AC' | 'Deluxe'; capacity: number; baseRateMonthly: number }[]
  >([
    { id: '1', suffix: 'A', type: 'AC', capacity: 2, baseRateMonthly: 9000 },
    { id: '2', suffix: 'B', type: 'Non-AC', capacity: 1, baseRateMonthly: 7500 },
  ]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync floorId when blockId changes
  useEffect(() => {
    if (!roomData?.floorId) {
      const floorsInBlock = floors.filter((f: any) => f.blockId === blockId);
      if (floorsInBlock.length > 0) {
        setFloorId(floorsInBlock[0].id);
      } else {
        setFloorId('');
      }
    }
  }, [blockId, floors, roomData]);

  // Sub-room handlers
  const handleAddSubRoom = () => {
    const nextSuffix = String.fromCharCode(65 + subRooms.length);
    const newSr = {
      id: `sr-${Date.now()}-${subRooms.length}`,
      suffix: nextSuffix,
      type: (type as 'AC' | 'Non-AC' | 'Deluxe') || 'AC',
      capacity: 2,
      baseRateMonthly: Number(baseRateMonthly) || 8500,
    };
    setSubRooms([...subRooms, newSr]);
  };

  const handleRemoveSubRoom = (id: string) => {
    if (subRooms.length <= 1) return;
    setSubRooms(subRooms.filter((s) => s.id !== id));
  };

  const handleUpdateSubRoom = (id: string, field: string, value: any) => {
    setSubRooms(subRooms.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const totalSplitBeds = subRooms.reduce((acc, s) => acc + Number(s.capacity || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const method = mode === 'ADD' ? 'POST' : 'PATCH';
      const body: any = {
        entityType: 'ROOM',
        id: roomData?.id,
        blockId,
        floorId,
        roomNumber: roomNumber.trim(),
      };

      if (mode === 'ADD' && isSplitRoom) {
        body.isSplitRoom = true;
        body.subRooms = subRooms.map((sr) => ({
          suffix: sr.suffix.trim(),
          roomNumber: `${roomNumber.trim()}-${sr.suffix.trim()}`,
          type: sr.type,
          capacity: Number(sr.capacity),
          baseRateMonthly: Number(sr.baseRateMonthly),
          label: `Sub-Room ${sr.suffix.trim()}`,
        }));
      } else {
        body.type = type;
        body.baseRateMonthly = Number(baseRateMonthly);
        body.capacity = Number(capacity);
      }

      const res = await fetch('/api/rooms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setErrorMsg(data.error || 'Operation failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h3 className="font-bold text-base text-slate-900 font-display">
              {mode === 'ADD'
                ? isSplitRoom
                  ? 'Add Unit & Split into Sub-Rooms'
                  : 'Add New Room'
                : `Edit Room ${roomData?.roomNumber}`}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isSplitRoom && mode === 'ADD'
                ? 'Create a main room/flat and define independent sub-rooms with custom beds and rates.'
                : 'Configure room location, room fee, and bed capacity.'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
                {errorMsg}
              </div>
            )}

            {/* Split Mode Switch (Only when adding a room) */}
            {mode === 'ADD' && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        Split Room into Sub-Rooms
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Create unit with sub-rooms (e.g., {roomNumber || '101'}-A, {roomNumber || '101'}-B)
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isSplitRoom}
                      onChange={(e) => setIsSplitRoom(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Wing / Block Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hostel Wing / Block</label>
              <select
                value={blockId}
                onChange={(e) => setBlockId(e.target.value)}
                disabled={mode === 'EDIT'}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white font-medium"
              >
                {blocks.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.buildingName})
                  </option>
                ))}
              </select>
            </div>

            {/* Floor Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Select Floor</label>
                {mode === 'ADD' && onOpenAddFloor && (
                  <button
                    type="button"
                    onClick={() => onOpenAddFloor(blockId)}
                    className="text-indigo-600 hover:text-indigo-700 font-bold text-[11px] flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    + Create New Floor
                  </button>
                )}
              </div>
              {availableFloors.length > 0 ? (
                <select
                  value={floorId}
                  onChange={(e) => setFloorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white font-medium"
                >
                  {availableFloors.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Floor {f.floorNumber})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
                  <span>No floors found in this block.</span>
                  <button
                    type="button"
                    onClick={() => onOpenAddFloor(blockId)}
                    className="font-bold underline text-indigo-700"
                  >
                    Create Floor First
                  </button>
                </div>
              )}
            </div>

            {/* Room Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isSplitRoom ? 'Main Room / Unit Number' : 'Room Number'}
              </label>
              <input
                type="text"
                required
                placeholder={isSplitRoom ? 'e.g. 101, 204, Flat-A' : 'e.g. 101, 102, A-201'}
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-sm font-bold"
              />
              {isSplitRoom && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Sub-rooms will be automatically named as {roomNumber || '101'}-A, {roomNumber || '101'}-B, etc.
                </p>
              )}
            </div>

            {/* ================= IF SPLIT ROOM MODE: SUB-ROOMS LIST ================= */}
            {mode === 'ADD' && isSplitRoom ? (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Sub-Rooms Breakdown ({subRooms.length})
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-700">
                    {totalSplitBeds} Total Beds
                  </span>
                </div>

                <div className="space-y-2.5">
                  {subRooms.map((sr, idx) => (
                    <div
                      key={sr.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 hover:border-indigo-200 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-black text-[11px]">
                            {roomNumber ? `${roomNumber.trim()}-${sr.suffix}` : `Sub-Room ${sr.suffix}`}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({sr.capacity} Bed{sr.capacity > 1 ? 's' : ''} • ₹{Number(sr.baseRateMonthly).toLocaleString('en-IN')}/mo)
                          </span>
                        </div>
                        {subRooms.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubRoom(sr.id)}
                            className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                            title="Remove this sub-room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Suffix
                          </label>
                          <input
                            type="text"
                            required
                            value={sr.suffix}
                            onChange={(e) => handleUpdateSubRoom(sr.id, 'suffix', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center uppercase bg-white"
                            placeholder="A"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Type
                          </label>
                          <select
                            value={sr.type}
                            onChange={(e) => handleUpdateSubRoom(sr.id, 'type', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white"
                          >
                            <option value="AC">AC</option>
                            <option value="Non-AC">Non-AC</option>
                            <option value="Deluxe">Deluxe</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Fee (₹/mo)
                          </label>
                          <input
                            type="number"
                            required
                            min={1000}
                            max={100000}
                            value={sr.baseRateMonthly}
                            onChange={(e) =>
                              handleUpdateSubRoom(sr.id, 'baseRateMonthly', Number(e.target.value))
                            }
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50/40"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Beds
                          </label>
                          <select
                            value={sr.capacity}
                            onChange={(e) =>
                              handleUpdateSubRoom(sr.id, 'capacity', Number(e.target.value))
                            }
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                          >
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                              <option key={num} value={num}>
                                {num} Bed{num > 1 ? 's' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* + Add Sub Room Button */}
                <button
                  type="button"
                  onClick={handleAddSubRoom}
                  className="w-full py-2.5 px-3 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-2xl text-indigo-700 bg-indigo-50/40 hover:bg-indigo-50/80 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  + Add Sub Room
                </button>

                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between">
                  <span>
                    Summary: <strong>{subRooms.length} Sub-Rooms</strong> ({subRooms.map((s) => `${roomNumber ? roomNumber.trim() : 'Room'}-${s.suffix}`).join(', ')})
                  </span>
                  <span className="font-bold text-emerald-700">
                    {totalSplitBeds} Total Beds
                  </span>
                </div>
              </div>
            ) : (
              /* ================= STANDARD SINGLE ROOM FIELDS ================= */
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Room Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white font-medium"
                    >
                      <option value="AC">AC Room</option>
                      <option value="Non-AC">Non-AC Room</option>
                      <option value="Deluxe">Deluxe Suite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Room Fee (₹/month)
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      max={100000}
                      value={baseRateMonthly}
                      onChange={(e) => setBaseRateMonthly(Number(e.target.value))}
                      className="w-full px-3 py-2 border-2 border-emerald-500 rounded-xl outline-none font-black text-emerald-700 text-sm bg-emerald-50/30"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-[11px] flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Fee is based on the room:</strong> Every bed created in this room inherits this monthly fee (₹{Number(baseRateMonthly).toLocaleString('en-IN')}/mo). When students are admitted to this room, their monthly bill is calculated using this room fee.
                  </span>
                </div>

                {mode === 'ADD' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bed Capacity (Auto-generates beds)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-semibold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Automatically generates Bed 1, Bed 2... with the room fee.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              {loading
                ? 'Saving...'
                : mode === 'ADD'
                ? isSplitRoom
                  ? `Create ${subRooms.length} Sub-Rooms (${totalSplitBeds} Beds)`
                  : 'Create Room & Beds'
                : 'Save Room & Fee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= SUB-COMPONENT: BED FORM MODAL =================
function BedFormModal({ mode, bedData, roomId, rooms, onClose, onSuccess }: any) {
  const targetRoomId = bedData?.roomId || roomId || rooms[0]?.id || '';
  const room = rooms.find((r: any) => r.id === targetRoomId);

  const [bedNumber, setBedNumber] = useState(bedData?.bedNumber || 'Bed 1');
  const [monthlyRate, setMonthlyRate] = useState(bedData?.monthlyRate || room?.baseRateMonthly || 9000);
  const [status, setStatus] = useState(bedData?.status || 'Available');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const method = mode === 'ADD' ? 'POST' : 'PATCH';
      const body = {
        entityType: 'BED',
        id: bedData?.id,
        roomId: targetRoomId,
        bedNumber,
        monthlyRate: Number(monthlyRate),
        status,
      };

      const res = await fetch('/api/rooms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setErrorMsg(data.error || 'Operation failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-base text-slate-900 font-display">
            {mode === 'ADD' ? `Add Bed to Room ${room?.roomNumber}` : `Edit ${bedData?.bedNumber}`}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bed Identifier / Number</label>
            <input
              type="text"
              required
              placeholder="e.g. Bed 3 or Bed C"
              value={bedNumber}
              onChange={(e) => setBedNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Monthly Fee (₹/mo)</label>
            <input
              type="number"
              required
              value={monthlyRate}
              onChange={(e) => setMonthlyRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-bold"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Inherited from Room {room?.roomNumber} fee (₹{room?.baseRateMonthly?.toLocaleString('en-IN')}/mo).
            </p>
          </div>

          {mode === 'EDIT' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bed Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={bedData?.status === 'Occupied'}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white font-medium"
              >
                <option value="Available">Available</option>
                <option value="Maintenance">Maintenance</option>
                {bedData?.status === 'Occupied' && <option value="Occupied">Occupied (Resident Active)</option>}
              </select>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
            >
              {loading ? 'Saving...' : mode === 'ADD' ? 'Add Bed' : 'Update Bed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
