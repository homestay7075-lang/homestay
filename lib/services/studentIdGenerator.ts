/**
 * Student ID Generator
 *
 * Rules:
 * - Prefix: STU + last two digits of joining year (e.g. STU26 for 2026).
 * - Block series:
 *   - Block 1 (or Block A): 100 series (starts at 101 up to beds capacity, e.g. STUyy101 - STUyy120).
 *   - Block 2 (or Block B): 200 series (starts at 201 up to beds capacity, e.g. STUyy201 - STUyy230).
 *   - Block 3 (or Block C): 300 series (starts at 301 up to beds capacity).
 *   - Block N: N*100 series (starts at N01 up to beds capacity).
 * - Ordering: Beds within each block are strictly ordered by:
 *   1. Floor (floorNumber ascending)
 *   2. Room (roomNumber natural numeric sort ascending)
 *   3. Bed (bedNumber natural numeric sort ascending)
 */

export interface HierarchyBed {
  id: string;
  roomId?: string;
  roomNumber?: string;
  blockId?: string;
  bedNumber?: string;
  status?: string;
}

export interface HierarchyRoom {
  id: string;
  floorId?: string;
  blockId?: string;
  roomNumber?: string;
}

export interface HierarchyFloor {
  id: string;
  blockId?: string;
  floorNumber?: number;
}

export interface HierarchyBlock {
  id: string;
  code?: string;
  name?: string;
}

export interface StudentIdContext {
  blockId?: string;
  bedId?: string;
  blocks?: HierarchyBlock[];
  floors?: HierarchyFloor[];
  rooms?: HierarchyRoom[];
  beds?: HierarchyBed[];
}

/**
 * Determine the 1-based block number for any block entity.
 * Handles numeric patterns ("Block 1", "Block-1", "BLK-1", "Block 2", "Block-02"),
 * letter patterns ("Block A" -> 1, "Block B" -> 2),
 * and fallback to index in blocks list.
 */
export function getBlockNumber(
  block?: HierarchyBlock | null,
  allBlocks?: HierarchyBlock[]
): number {
  if (!block && allBlocks && allBlocks.length > 0) {
    block = allBlocks[0];
  }
  if (!block) return 1;

  const text = `${block.code || ''} ${block.name || ''} ${block.id || ''}`;

  // 1. Explicit block number, e.g. "Block 1", "Block-1", "BLK-1", "Block 2", "Block-02"
  const numMatch =
    text.match(/(?:block|blk)\s*[-_]?\s*(\d+)/i) ||
    text.match(/\bblock\s*(\d+)\b/i);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (!isNaN(n) && n > 0) return n;
  }

  // 2. Trailing digit in code or id like "BLK1", "blk-1", "bld-1-blk-2"
  const digitMatch =
    (block.code || '').match(/\d+/) ||
    (block.id || '').match(/[-_](\d+)(?:$|[-_])/);
  if (digitMatch) {
    const n = parseInt(digitMatch[0].replace(/\D/g, ''), 10);
    if (!isNaN(n) && n > 0) return n;
  }

  // 3. Letter pattern: "Block A" / "BLK-A" -> 1, "Block B" / "BLK-B" -> 2, "Block C" -> 3
  const letterMatch = text.match(/(?:block|blk)\s*[-_]?\s*([A-Za-z])\b/i);
  if (letterMatch) {
    const charCode = letterMatch[1].toUpperCase().charCodeAt(0);
    if (charCode >= 65 && charCode <= 90) {
      return charCode - 64; // A=1, B=2, C=3, D=4...
    }
  }

  // 4. Position in allBlocks list (1-based index)
  if (allBlocks && allBlocks.length > 0) {
    const idx = allBlocks.findIndex((b) => b.id === block!.id);
    if (idx !== -1) {
      return idx + 1;
    }
  }

  return 1;
}

/**
 * Sorts beds within a block in strict order: floor -> room -> bed
 */
export function sortBedsByHierarchy<T extends HierarchyBed>(
  beds: T[],
  rooms: HierarchyRoom[] = [],
  floors: HierarchyFloor[] = []
): T[] {
  const floorMap = new Map<string, number>();
  for (const fl of floors) {
    floorMap.set(fl.id, fl.floorNumber ?? 0);
  }

  const roomMap = new Map<
    string,
    { roomNumber: string; floorNumber: number }
  >();
  for (const rm of rooms) {
    const floorNum = rm.floorId ? floorMap.get(rm.floorId) ?? 0 : 0;
    roomMap.set(rm.id, {
      roomNumber: rm.roomNumber || '',
      floorNumber: floorNum,
    });
  }

  return [...beds].sort((a, b) => {
    const roomA = a.roomId ? roomMap.get(a.roomId) : undefined;
    const roomB = b.roomId ? roomMap.get(b.roomId) : undefined;

    // 1. Order by Floor number ascending
    const floorA = roomA?.floorNumber ?? 0;
    const floorB = roomB?.floorNumber ?? 0;
    if (floorA !== floorB) {
      return floorA - floorB;
    }

    // 2. Order by Room number ascending (natural numeric sort: 101 < 102 < 201)
    const rNumA = roomA?.roomNumber || a.roomNumber || '';
    const rNumB = roomB?.roomNumber || b.roomNumber || '';
    const roomCmp = rNumA.localeCompare(rNumB, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    if (roomCmp !== 0) {
      return roomCmp;
    }

    // 3. Order by Bed number ascending (natural numeric sort: Bed 1 < Bed 2 < Bed 3)
    const bNumA = a.bedNumber || '';
    const bNumB = b.bedNumber || '';
    return bNumA.localeCompare(bNumB, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
}

/**
 * Generates the student ID following the format:
 * STU + yy + block series in order floor, room, bed (e.g. STU26101..STU26120 for Block 1, STU26201..STU26230 for Block 2).
 */
export function generateNextStudentId(
  joiningDateStr: string,
  existingIds: string[] = [],
  context?: StudentIdContext
): string {
  const joiningDate = new Date(joiningDateStr);
  const fullYear = isNaN(joiningDate.getFullYear())
    ? new Date().getFullYear()
    : joiningDate.getFullYear();
  const yearShort = String(fullYear).slice(-2); // e.g. "26"

  const blocks = context?.blocks || [];
  const floors = context?.floors || [];
  const rooms = context?.rooms || [];
  const beds = context?.beds || [];

  // Determine target block
  let targetBlock: HierarchyBlock | undefined;
  if (context?.blockId) {
    targetBlock = blocks.find((b) => b.id === context.blockId);
  }
  if (!targetBlock && context?.bedId) {
    const targetBed = beds.find((b) => b.id === context.bedId);
    if (targetBed?.blockId) {
      targetBlock = blocks.find((b) => b.id === targetBed.blockId);
    }
  }
  if (!targetBlock && blocks.length > 0) {
    targetBlock = blocks[0];
  }

  const blockNumber = getBlockNumber(targetBlock, blocks);

  // If hierarchy beds are provided, order beds for this block by (floor, room, bed)
  const blockBeds = targetBlock
    ? beds.filter((b) => b.blockId === targetBlock!.id)
    : beds;

  if (blockBeds.length > 0) {
    const sortedBeds = sortBedsByHierarchy(blockBeds, rooms, floors);

    let bedIndex = -1;
    if (context?.bedId) {
      bedIndex = sortedBeds.findIndex((b) => b.id === context.bedId);
    }

    // If bedId not found or not given, pick the first available bed, or 1st bed
    if (bedIndex === -1) {
      const availIdx = sortedBeds.findIndex(
        (b) => b.status === 'Available' || !b.status
      );
      bedIndex = availIdx !== -1 ? availIdx : 0;
    }

    const bedSlotNumber = bedIndex + 1; // 1-based index (e.g. 1, 2, ... 20)
    const sequenceNumber = blockNumber * 100 + bedSlotNumber; // e.g. Block 1 -> 101..120; Block 2 -> 201..230
    const candidateId = `STU${yearShort}${sequenceNumber}`;

    // If candidateId is not in existingIds, return it directly
    if (!existingIds.includes(candidateId)) {
      return candidateId;
    }

    // If candidateId is already taken (e.g. checkout re-admission in same year), find next available number in that block
    let nextSeq = sequenceNumber;
    while (existingIds.includes(`STU${yearShort}${nextSeq}`)) {
      nextSeq++;
    }
    return `STU${yearShort}${nextSeq}`;
  }

  // Fallback when beds array not provided: use block-based sequential sequence
  const startSeq = blockNumber * 100;
  let maxSeq = startSeq;
  const idRegex = new RegExp(`^STU${yearShort}(\\d+)$`);

  for (const id of existingIds) {
    const match = id.trim().match(idRegex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      // Check if it belongs to this block's range (e.g. 101-199 for block 1, 201-299 for block 2)
      if (!isNaN(num) && num > startSeq && num < (blockNumber + 1) * 100) {
        if (num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `STU${yearShort}${nextSeq}`;
}
