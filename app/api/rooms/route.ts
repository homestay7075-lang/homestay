import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import { BedStatus, Building, Block, Floor, Room, Bed, AuditLog } from '@/lib/db/types';

export async function GET() {
  const db = getDatabase();

  const totalBeds = db.beds.length;
  const occupiedBeds = db.beds.filter(b => b.status === 'Occupied').length;
  const availableBeds = db.beds.filter(b => b.status === 'Available').length;
  const maintenanceBeds = db.beds.filter(b => b.status === 'Maintenance').length;
  const totalRooms = db.rooms.length;
  const vacantRooms = db.rooms.filter(r => {
    const roomBeds = db.beds.filter(b => b.roomId === r.id);
    return roomBeds.every(b => b.status === 'Available');
  }).length;

  return NextResponse.json({
    buildings: db.buildings,
    blocks: db.blocks,
    floors: db.floors,
    rooms: db.rooms,
    beds: db.beds,
    stats: {
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      totalRooms,
      vacantRooms,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    },
  });
}

// CREATE: Add Building, Block, Room, or Bed
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { entityType } = body;
    const db = getDatabase();

    if (entityType === 'BUILDING') {
      const { name, description, genderType } = body;
      if (!name) return NextResponse.json({ success: false, error: 'Building name is required' }, { status: 400 });

      const newBuilding: Building = {
        id: `bld-${Date.now()}`,
        name: name.trim(),
        description: description?.trim() || '',
        genderType: genderType || 'Co-Living',
      };
      db.buildings.push(newBuilding);

      const audit: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'usr-owner-1',
        userName: 'Hostel Owner',
        userRole: 'OWNER',
        action: 'BUILDING_CREATED',
        details: `Created new ${newBuilding.genderType} building "${newBuilding.name}".`,
      };
      db.auditLogs.unshift(audit);
      saveDatabase(db);
      return NextResponse.json({ success: true, building: newBuilding });
    }

    if (entityType === 'BLOCK') {
      const { buildingId, name, code } = body;
      if (!buildingId || !name) return NextResponse.json({ success: false, error: 'Building and block name are required' }, { status: 400 });

      const building = db.buildings.find(b => b.id === buildingId);
      const newBlock: Block = {
        id: `blk-${Date.now()}`,
        buildingId,
        buildingName: building?.name || 'Main Campus',
        name: name.trim(),
        code: code?.trim() || name.slice(0, 3).toUpperCase(),
      };
      db.blocks.push(newBlock);

      // Create a default ground floor for this block
      const defaultFloor: Floor = {
        id: `flr-${Date.now()}`,
        blockId: newBlock.id,
        floorNumber: 1,
        name: 'Ground Floor',
      };
      db.floors.push(defaultFloor);

      const audit: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'usr-owner-1',
        userName: 'Hostel Owner',
        userRole: 'OWNER',
        action: 'BLOCK_CREATED',
        details: `Created new block "${newBlock.name}" under ${newBlock.buildingName}.`,
      };
      db.auditLogs.unshift(audit);
      saveDatabase(db);
      return NextResponse.json({ success: true, block: newBlock });
    }

    if (entityType === 'FLOOR') {
      const { blockId, floorNumber, name } = body;
      if (!blockId || !name) return NextResponse.json({ success: false, error: 'Block and Floor Name are required' }, { status: 400 });

      const block = db.blocks.find(b => b.id === blockId);
      const existingFloors = db.floors.filter(f => f.blockId === blockId);
      const num = floorNumber ? Number(floorNumber) : existingFloors.length + 1;

      const newFloor: Floor = {
        id: `flr-${Date.now()}`,
        blockId,
        floorNumber: num,
        name: name.trim(),
      };
      db.floors.push(newFloor);

      const audit: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'usr-owner-1',
        userName: 'Hostel Owner',
        userRole: 'OWNER',
        action: 'FLOOR_CREATED',
        details: `Created new floor "${newFloor.name}" (Floor ${newFloor.floorNumber}) in ${block?.name || 'Block'}.`,
      };
      db.auditLogs.unshift(audit);
      saveDatabase(db);
      return NextResponse.json({ success: true, floor: newFloor });
    }

    if (entityType === 'ROOM') {
      const {
        blockId,
        floorId,
        roomNumber,
        capacity = 2,
        type = 'Non-AC',
        baseRateMonthly = 8500,
        isSplitRoom = false,
        subRooms = [],
      } = body;

      if (!blockId || !roomNumber) {
        return NextResponse.json({ success: false, error: 'Block and Room Number are required' }, { status: 400 });
      }

      const block = db.blocks.find(b => b.id === blockId);
      let floor = floorId ? db.floors.find(f => f.id === floorId) : null;
      if (!floor) {
        floor = db.floors.find(f => f.blockId === blockId) || db.floors[0] || { id: 'flr-1', floorNumber: 1, name: 'First Floor' };
      }

      // ================= CASE A: SPLIT ROOM INTO SUB-ROOMS =================
      if (isSplitRoom && Array.isArray(subRooms) && subRooms.length > 0) {
        // Validate uniqueness of all sub-room numbers first
        for (let i = 0; i < subRooms.length; i++) {
          const sr = subRooms[i];
          const suffix = sr.suffix?.trim() || String.fromCharCode(65 + i);
          const srNum = sr.roomNumber?.trim() || `${roomNumber.trim()}-${suffix}`;
          const existing = db.rooms.find(
            r => r.blockId === blockId && r.roomNumber.toLowerCase() === srNum.toLowerCase()
          );
          if (existing) {
            return NextResponse.json(
              { success: false, error: `Sub-room ${srNum} already exists in this block.` },
              { status: 400 }
            );
          }
        }

        const createdRooms: Room[] = [];
        const allCreatedBeds: Bed[] = [];

        for (let i = 0; i < subRooms.length; i++) {
          const sr = subRooms[i];
          const suffix = sr.suffix?.trim() || String.fromCharCode(65 + i);
          const srNum = sr.roomNumber?.trim() || `${roomNumber.trim()}-${suffix}`;
          const srCapacity = Math.max(1, Number(sr.capacity || 1));
          const srType = sr.type || type || 'AC';
          const srRate = Number(sr.baseRateMonthly || baseRateMonthly || 8500);
          const srLabel = sr.label?.trim() || `Sub-Room ${suffix}`;

          const newRoom: Room = {
            id: `rm-${Date.now()}-${i}`,
            floorId: floor.id,
            blockId,
            buildingId: block?.buildingId || 'bld-1',
            roomNumber: srNum,
            capacity: srCapacity,
            type: srType,
            baseRateMonthly: srRate,
            status: 'Available',
            isSubRoom: true,
            parentRoomNumber: roomNumber.trim(),
            subRoomLabel: srLabel,
          };
          db.rooms.push(newRoom);
          createdRooms.push(newRoom);

          // Automatically generate beds for this sub-room
          for (let b = 1; b <= srCapacity; b++) {
            const bed: Bed = {
              id: `bed-${Date.now()}-${i}-${b}`,
              roomId: newRoom.id,
              roomNumber: newRoom.roomNumber,
              blockId: newRoom.blockId,
              blockName: block?.name || 'Main Block',
              buildingName: block?.buildingName || 'Main Tower',
              bedNumber: `Bed ${b}`,
              status: 'Available',
              monthlyRate: srRate,
            };
            allCreatedBeds.push(bed);
            db.beds.push(bed);
          }
        }

        const audit: AuditLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: 'usr-owner-1',
          userName: 'Hostel Owner',
          userRole: 'OWNER',
          action: 'ROOM_CREATED',
          details: `Added Room ${roomNumber.trim()} split into ${createdRooms.length} sub-rooms (${createdRooms.map(r => r.roomNumber).join(', ')}) with ${allCreatedBeds.length} total beds.`,
        };
        db.auditLogs.unshift(audit);
        saveDatabase(db);
        return NextResponse.json({ success: true, rooms: createdRooms, beds: allCreatedBeds });
      }

      // ================= CASE B: STANDARD SINGLE ROOM =================
      const existing = db.rooms.find(r => r.blockId === blockId && r.roomNumber.toLowerCase() === roomNumber.trim().toLowerCase());
      if (existing) {
        return NextResponse.json({ success: false, error: `Room ${roomNumber} already exists in this block.` }, { status: 400 });
      }

      const newRoom: Room = {
        id: `rm-${Date.now()}`,
        floorId: floor.id,
        blockId,
        buildingId: block?.buildingId || 'bld-1',
        roomNumber: roomNumber.trim(),
        capacity: Number(capacity),
        type,
        baseRateMonthly: Number(baseRateMonthly),
        status: 'Available',
      };
      db.rooms.push(newRoom);

      // Automatically generate beds for this room based on capacity
      const newBeds: Bed[] = [];
      for (let i = 1; i <= Number(capacity); i++) {
        const bed: Bed = {
          id: `bed-${Date.now()}-${i}`,
          roomId: newRoom.id,
          roomNumber: newRoom.roomNumber,
          blockId: newRoom.blockId,
          blockName: block?.name || 'Main Block',
          buildingName: block?.buildingName || 'Main Tower',
          bedNumber: `Bed ${i}`,
          status: 'Available',
          monthlyRate: Number(baseRateMonthly),
        };
        newBeds.push(bed);
        db.beds.push(bed);
      }

      const audit: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'usr-owner-1',
        userName: 'Hostel Owner',
        userRole: 'OWNER',
        action: 'ROOM_CREATED',
        details: `Added Room ${newRoom.roomNumber} (${newRoom.type}, Capacity: ${newRoom.capacity}) with ${newBeds.length} new beds.`,
      };
      db.auditLogs.unshift(audit);
      saveDatabase(db);
      return NextResponse.json({ success: true, room: newRoom, beds: newBeds });
    }

    if (entityType === 'BED') {
      const { roomId, bedNumber, monthlyRate } = body;
      if (!roomId || !bedNumber) return NextResponse.json({ success: false, error: 'Room and Bed Number are required' }, { status: 400 });

      const room = db.rooms.find(r => r.id === roomId);
      if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });

      const block = db.blocks.find(b => b.id === room.blockId);

      const newBed: Bed = {
        id: `bed-${Date.now()}`,
        roomId,
        roomNumber: room.roomNumber,
        blockId: room.blockId,
        blockName: block?.name || 'Main Block',
        buildingName: block?.buildingName || 'Main Tower',
        bedNumber: bedNumber.trim(),
        status: 'Available',
        monthlyRate: Number(monthlyRate || room.baseRateMonthly),
      };
      db.beds.push(newBed);

      // Update room capacity
      room.capacity = db.beds.filter(b => b.roomId === roomId).length;

      const audit: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'usr-owner-1',
        userName: 'Hostel Owner',
        userRole: 'OWNER',
        action: 'BED_CREATED',
        details: `Added ${newBed.bedNumber} to Room ${room.roomNumber}.`,
      };
      db.auditLogs.unshift(audit);
      saveDatabase(db);
      return NextResponse.json({ success: true, bed: newBed });
    }

    return NextResponse.json({ success: false, error: 'Invalid entityType specified' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// UPDATE: Edit Building, Block, Room, or Bed
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { entityType } = body;
    const db = getDatabase();

    // Standard single bed status toggle (backward compatibility)
    if (!entityType && body.bedId) {
      const bed = db.beds.find(b => b.id === body.bedId);
      if (!bed) return NextResponse.json({ success: false, error: 'Bed not found' }, { status: 404 });

      if (bed.status === 'Occupied' && body.status !== 'Occupied') {
        return NextResponse.json({
          success: false,
          error: `Bed ${bed.bedNumber} is currently occupied by ${bed.currentStudentName}. Please check out the resident before changing bed status.`,
        }, { status: 400 });
      }

      bed.status = body.status as BedStatus;
      saveDatabase(db);
      return NextResponse.json({ success: true, bed });
    }

    if (entityType === 'BUILDING') {
      const { id, name, description, genderType } = body;
      const bld = db.buildings.find(b => b.id === id);
      if (!bld) return NextResponse.json({ success: false, error: 'Building not found' }, { status: 404 });

      if (name) bld.name = name.trim();
      if (description !== undefined) bld.description = description.trim();
      if (genderType) bld.genderType = genderType;

      // Sync buildingName across blocks and beds
      db.blocks.filter(b => b.buildingId === id).forEach(b => { b.buildingName = bld.name; });
      saveDatabase(db);
      return NextResponse.json({ success: true, building: bld });
    }

    if (entityType === 'BLOCK') {
      const { id, name, code } = body;
      const blk = db.blocks.find(b => b.id === id);
      if (!blk) return NextResponse.json({ success: false, error: 'Block not found' }, { status: 404 });

      blk.name = name.trim();
      if (code) blk.code = code.trim();

      // Sync blockName across beds
      db.beds.filter(b => b.blockId === id).forEach(b => { b.blockName = blk.name; });
      saveDatabase(db);
      return NextResponse.json({ success: true, block: blk });
    }

    if (entityType === 'FLOOR') {
      const { id, name, floorNumber } = body;
      const flr = db.floors.find(f => f.id === id);
      if (!flr) return NextResponse.json({ success: false, error: 'Floor not found' }, { status: 404 });

      if (name) flr.name = name.trim();
      if (floorNumber !== undefined) flr.floorNumber = Number(floorNumber);
      saveDatabase(db);
      return NextResponse.json({ success: true, floor: flr });
    }

    if (entityType === 'ROOM') {
      const { id, roomNumber, type, baseRateMonthly, floorId } = body;
      const room = db.rooms.find(r => r.id === id);
      if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });

      if (roomNumber) room.roomNumber = roomNumber.trim();
      if (type) room.type = type;
      if (floorId) room.floorId = floorId;
      if (baseRateMonthly !== undefined) room.baseRateMonthly = Number(baseRateMonthly);

      // Sync roomNumber and room fee across its beds and active students
      db.beds.filter(b => b.roomId === id).forEach(b => {
        b.roomNumber = room.roomNumber;
        if (baseRateMonthly && b.status !== 'Occupied') b.monthlyRate = Number(baseRateMonthly);
      });
      db.students.filter(s => s.roomId === id).forEach(s => {
        s.roomNumber = room.roomNumber;
      });

      saveDatabase(db);
      return NextResponse.json({ success: true, room });
    }

    if (entityType === 'BED') {
      const { id, bedNumber, monthlyRate, status } = body;
      const bed = db.beds.find(b => b.id === id);
      if (!bed) return NextResponse.json({ success: false, error: 'Bed not found' }, { status: 404 });

      if (bed.status === 'Occupied' && status && status !== 'Occupied') {
        return NextResponse.json({
          success: false,
          error: `Bed ${bed.bedNumber} is currently occupied by ${bed.currentStudentName}. Check out the student first.`,
        }, { status: 400 });
      }

      if (bedNumber) bed.bedNumber = bedNumber.trim();
      if (monthlyRate !== undefined) bed.monthlyRate = Number(monthlyRate);
      if (status) bed.status = status as BedStatus;

      // Sync bedNumber to active student if occupied
      if (bed.currentStudentId) {
        const student = db.students.find(s => s.studentId === bed.currentStudentId && s.status === 'Active');
        if (student) student.bedNumber = bed.bedNumber;
      }

      saveDatabase(db);
      return NextResponse.json({ success: true, bed });
    }

    return NextResponse.json({ success: false, error: 'Invalid entityType' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete Building, Block, Room, or Bed
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const id = searchParams.get('id');

    if (!entityType || !id) {
      return NextResponse.json({ success: false, error: 'entityType and id are required' }, { status: 400 });
    }

    const db = getDatabase();

    if (entityType === 'BUILDING') {
      const hasBlocks = db.blocks.some(b => b.buildingId === id);
      if (hasBlocks) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete building with active blocks. Please remove or reassign the blocks first.',
        }, { status: 400 });
      }
      db.buildings = db.buildings.filter(b => b.id !== id);
      saveDatabase(db);
      return NextResponse.json({ success: true, message: 'Building deleted successfully' });
    }

    if (entityType === 'BLOCK') {
      const hasOccupiedBeds = db.beds.some(b => b.blockId === id && b.status === 'Occupied');
      if (hasOccupiedBeds) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete block with currently occupied beds. Please check out residents first.',
        }, { status: 400 });
      }

      // Remove rooms and beds in this block
      db.beds = db.beds.filter(b => b.blockId !== id);
      db.rooms = db.rooms.filter(r => r.blockId !== id);
      db.floors = db.floors.filter(f => f.blockId !== id);
      db.blocks = db.blocks.filter(b => b.id !== id);
      saveDatabase(db);
      return NextResponse.json({ success: true, message: 'Block and all its rooms deleted successfully' });
    }

    if (entityType === 'FLOOR') {
      const hasOccupiedRooms = db.rooms.some(r => {
        if (r.floorId !== id) return false;
        const roomBeds = db.beds.filter(b => b.roomId === r.id);
        return roomBeds.some(b => b.status === 'Occupied');
      });
      if (hasOccupiedRooms) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete floor with occupied beds. Please check out residents first.',
        }, { status: 400 });
      }

      // Remove rooms and beds on this floor
      const floorRoomIds = db.rooms.filter(r => r.floorId === id).map(r => r.id);
      db.beds = db.beds.filter(b => !floorRoomIds.includes(b.roomId));
      db.rooms = db.rooms.filter(r => r.floorId !== id);
      db.floors = db.floors.filter(f => f.id !== id);
      saveDatabase(db);
      return NextResponse.json({ success: true, message: 'Floor and vacant rooms deleted successfully' });
    }

    if (entityType === 'ROOM') {
      const roomBeds = db.beds.filter(b => b.roomId === id);
      const isOccupied = roomBeds.some(b => b.status === 'Occupied');
      if (isOccupied) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete room containing actively occupied beds. Please check out residents first.',
        }, { status: 400 });
      }

      // Delete room and its beds
      db.beds = db.beds.filter(b => b.roomId !== id);
      db.rooms = db.rooms.filter(r => r.id !== id);
      saveDatabase(db);
      return NextResponse.json({ success: true, message: 'Room and its beds deleted successfully' });
    }

    if (entityType === 'BED') {
      const bed = db.beds.find(b => b.id === id);
      if (!bed) return NextResponse.json({ success: false, error: 'Bed not found' }, { status: 404 });

      if (bed.status === 'Occupied') {
        return NextResponse.json({
          success: false,
          error: `Cannot delete Bed ${bed.bedNumber} because it is occupied by ${bed.currentStudentName}.`,
        }, { status: 400 });
      }

      const roomId = bed.roomId;
      db.beds = db.beds.filter(b => b.id !== id);

      // Update room capacity
      const room = db.rooms.find(r => r.id === roomId);
      if (room) {
        room.capacity = db.beds.filter(b => b.roomId === roomId).length;
      }

      saveDatabase(db);
      return NextResponse.json({ success: true, message: 'Bed deleted successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid entityType' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
