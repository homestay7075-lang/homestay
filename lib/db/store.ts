import fs from 'fs';
import path from 'path';
import {
  HostelSettings,
  User,
  Building,
  Block,
  Floor,
  Room,
  Bed,
  Student,
  StudentHistoryRecord,
  BillingCycle,
  Payment,
  Expense,
  Booking,
  NotificationItem,
  MessageThreadItem,
  AuditLog,
  Bill,
  PaymentSubmission,
} from './types';
import {
  initialHostelSettings,
  initialUsers,
  initialBuildings,
  initialBlocks,
  initialFloors,
  initialRooms,
  initialBeds,
  initialStudents,
  initialHistoricalStudents,
  initialPayments,
  initialExpenses,
  initialBookings,
  initialNotifications,
  initialMessages,
  initialAuditLogs,
  initialBills,
} from './initialData';
import { generateNextStudentId } from '../services/studentIdGenerator';
import { reconcileStudentBills } from '../services/billingService';
import { isValidPhoneNumber, normalizePhoneNumber, PHONE_ERROR_MESSAGE } from '../utils/phoneValidator';

export interface DatabaseState {
  settings: HostelSettings;
  users: User[];
  buildings: Building[];
  blocks: Block[];
  floors: Floor[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  studentHistory: StudentHistoryRecord[];
  payments: Payment[];
  expenses: Expense[];
  bookings: Booking[];
  notifications: NotificationItem[];
  messages: MessageThreadItem[];
  auditLogs: AuditLog[];
  bills: Bill[];
  customBills?: any[];
  paymentSubmissions?: PaymentSubmission[];
}

function getDataDir(): string {
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'homestay-data');
  }
  return path.join(process.cwd(), 'data');
}

function getDbFile(): string {
  return path.join(getDataDir(), 'hostel-db.json');
}

function getDefaultState(): DatabaseState {
  return {
    settings: { ...initialHostelSettings },
    users: [...initialUsers],
    buildings: [...initialBuildings],
    blocks: [...initialBlocks],
    floors: [...initialFloors],
    rooms: [...initialRooms],
    beds: [...initialBeds],
    students: [...initialStudents],
    studentHistory: [...initialHistoricalStudents],
    payments: [...initialPayments],
    expenses: [...initialExpenses],
    bookings: [...initialBookings],
    notifications: [...initialNotifications],
    messages: [...initialMessages],
    auditLogs: [...initialAuditLogs],
    bills: [...initialBills],
    customBills: [],
    paymentSubmissions: [],
  };
}

let inMemoryDb: DatabaseState | null = null;
let lastAutoPruneTimestamp = 0;

/**
 * Filter out audit logs older than maxAgeHours (default: 12 hours) from the database state.
 */
export function filterExpiredAuditLogs(db: DatabaseState, maxAgeHours: number = 12): number {
  if (!db || !Array.isArray(db.auditLogs)) return 0;
  const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
  const originalLength = db.auditLogs.length;

  db.auditLogs = db.auditLogs.filter((log) => {
    if (!log || !log.timestamp) return false;
    const logTime = new Date(log.timestamp).getTime();
    return !isNaN(logTime) && logTime >= cutoffTime;
  });

  return originalLength - db.auditLogs.length;
}

/**
 * Prunes audit logs older than the specified retention window in hours (default: 12 hours).
 * Persists changes to disk/storage and returns count of pruned logs and remaining count.
 */
export function pruneAuditLogs(maxAgeHours: number = 12): { prunedCount: number; remainingCount: number } {
  const db = getDatabase();
  const prunedCount = filterExpiredAuditLogs(db, maxAgeHours);
  if (prunedCount > 0) {
    saveDatabase(db);
  }
  return {
    prunedCount,
    remainingCount: db.auditLogs?.length || 0,
  };
}

export function getDatabase(): DatabaseState {
  if (typeof window !== 'undefined') {
    // Client-side execution
    const cached = localStorage.getItem('hostel_db_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        filterExpiredAuditLogs(parsed, 12);
        return parsed;
      } catch (e) {
        console.error('Failed to parse local cached DB', e);
      }
    }
    const def = getDefaultState();
    filterExpiredAuditLogs(def, 12);
    return def;
  }

  if (inMemoryDb) {
    // Periodically auto-purge audit logs older than 12 hours on access
    const now = Date.now();
    if (now - lastAutoPruneTimestamp > 5 * 60 * 1000) {
      lastAutoPruneTimestamp = now;
      const pruned = filterExpiredAuditLogs(inMemoryDb, 12);
      if (pruned > 0) {
        saveDatabase(inMemoryDb);
      }
    }
    return inMemoryDb;
  }

  try {
    const dataDir = getDataDir();
    const dbFile = getDbFile();
    const fallbackFile = path.join('/tmp', 'homestay-data', 'hostel-db.json');
    const targetFile = fs.existsSync(dbFile) ? dbFile : (fs.existsSync(fallbackFile) ? fallbackFile : dbFile);

    if (fs.existsSync(targetFile)) {
      const content = fs.readFileSync(targetFile, 'utf-8');
      inMemoryDb = JSON.parse(content);
      if (!inMemoryDb!.bills || inMemoryDb!.bills.length === 0) {
        inMemoryDb!.bills = inMemoryDb!.customBills && inMemoryDb!.customBills.length > 0
          ? [...inMemoryDb!.customBills]
          : [...initialBills];
      }
      if (!inMemoryDb!.paymentSubmissions) {
        inMemoryDb!.paymentSubmissions = [];
      }
      const pruned = filterExpiredAuditLogs(inMemoryDb!, 12);
      if (pruned > 0) {
        try {
          fs.writeFileSync(targetFile, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
        } catch (e) {
          // ignore
        }
      }
      lastAutoPruneTimestamp = Date.now();
      return inMemoryDb!;
    } else {
      inMemoryDb = getDefaultState();
      filterExpiredAuditLogs(inMemoryDb, 12);
      try {
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(dbFile, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
      } catch (e) {
        try {
          const fallbackDir = path.join('/tmp', 'homestay-data');
          if (!fs.existsSync(fallbackDir)) {
            fs.mkdirSync(fallbackDir, { recursive: true });
          }
          fs.writeFileSync(fallbackFile, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
        } catch (e2) {
          // fallback to memory
        }
      }
      lastAutoPruneTimestamp = Date.now();
      return inMemoryDb;
    }
  } catch (err) {
    console.warn('Filesystem access failed, falling back to memory state:', err);
    inMemoryDb = getDefaultState();
    filterExpiredAuditLogs(inMemoryDb, 12);
    lastAutoPruneTimestamp = Date.now();
    return inMemoryDb;
  }
}

export function saveDatabase(db: DatabaseState): void {
  inMemoryDb = db;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('hostel_db_cache', JSON.stringify(db));
    } catch (e) {
      console.error('Failed to cache DB in localStorage', e);
    }
    return;
  }

  try {
    const dataDir = getDataDir();
    const dbFile = getDbFile();
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    try {
      const fallbackDir = path.join('/tmp', 'homestay-data');
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      fs.writeFileSync(path.join(fallbackDir, 'hostel-db.json'), JSON.stringify(db, null, 2), 'utf-8');
    } catch (fallbackErr) {
      console.warn('Fallback persistence failed, operating in memory:', fallbackErr);
    }
  }
}

// ================= TRANSACTIONAL ACTIONS ================= //

/**
 * Register a new student with atomic Student ID generation, bed allocation, and audit log
 */
export function registerStudentTransaction(data: {
  fullName: string;
  photoUrl: string;
  photoOriginalSizeKb?: number;
  photoCompressedSizeKb?: number;
  gender: 'Male' | 'Female' | 'Other';
  phone?: string;
  email?: string;
  dob?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  idProofType?: any;
  idProofNumber?: string;
  idProofDocumentUrl?: string;
  buildingId: string;
  blockId: string;
  roomId: string;
  bedId: string;
  joiningDate: string;
  monthlyRent: number;
  depositAmount: number;
  otherCharges: number;
  password?: string;
  actorName: string;
  actorRole: any;
  actorId: string;
}): { success: boolean; student?: Student; initialPassword?: string; error?: string } {
  const db = getDatabase();

  // 1. Validate phone number is provided and strictly matches ^[6-9]\d{9}$
  const trimmedPhone = normalizePhoneNumber(data.phone);
  if (!trimmedPhone || !isValidPhoneNumber(trimmedPhone)) {
    return { success: false, error: PHONE_ERROR_MESSAGE };
  }
  const phoneExists = db.students.some(s => s.status === 'Active' && s.phone === trimmedPhone);
  if (phoneExists) {
    return { success: false, error: 'A student with this phone number is already actively registered.' };
  }

  // Validate guardian phone if provided (optional, but must match pattern if entered)
  const trimmedGuardianPhone = normalizePhoneNumber(data.guardianPhone);
  if (trimmedGuardianPhone && !isValidPhoneNumber(trimmedGuardianPhone)) {
    return { success: false, error: `Guardian ${PHONE_ERROR_MESSAGE.toLowerCase()}` };
  }

  // 2. Validate bed availability to prevent double allocation
  const targetBed = db.beds.find(b => b.id === data.bedId);
  if (!targetBed) {
    return { success: false, error: 'Selected bed could not be found.' };
  }
  if (targetBed.status !== 'Available') {
    return { success: false, error: `Bed ${targetBed.bedNumber} in ${targetBed.roomNumber} is currently ${targetBed.status.toLowerCase()} and cannot be allocated.` };
  }

  // 3. Generate Next Sequential Student ID (inspect active & historical)
  const allUsedIds: string[] = [
    ...db.students.map(s => s.studentId),
    ...db.studentHistory.map(h => h.studentId),
  ];
  const newStudentId = generateNextStudentId(data.joiningDate, allUsedIds, {
    blockId: data.blockId,
    bedId: data.bedId,
    blocks: db.blocks,
    floors: db.floors,
    rooms: db.rooms,
    beds: db.beds,
  });

  const studentDbId = `stu-db-${Date.now()}`;
  const userId = `usr-stu-${Date.now()}`;

  const room = db.rooms.find(r => r.id === data.roomId);
  const block = db.blocks.find(b => b.id === data.blockId);

  const newStudent: Student = {
    id: studentDbId,
    studentId: newStudentId,
    userId,
    fullName: data.fullName.trim(),
    photoUrl: data.photoUrl || '',
    photoOriginalSizeKb: data.photoOriginalSizeKb,
    photoCompressedSizeKb: data.photoCompressedSizeKb,
    gender: data.gender,
    phone: trimmedPhone,
    email: data.email?.trim() || '',
    dob: data.dob || '',
    address: (data.address || '').trim(),
    guardianName: (data.guardianName || '').trim(),
    guardianPhone: (data.guardianPhone || '').trim(),
    guardianRelation: data.guardianRelation || 'Parent',
    idProofType: data.idProofType || 'Aadhaar',
    idProofNumber: (data.idProofNumber || '').trim(),
    idProofDocumentUrl: data.idProofDocumentUrl || '',
    buildingId: data.buildingId,
    blockId: data.blockId,
    roomId: data.roomId,
    bedId: data.bedId,
    roomNumber: room ? room.roomNumber : targetBed.roomNumber,
    bedNumber: targetBed.bedNumber,
    blockName: block ? block.name : targetBed.blockName,
    joiningDate: data.joiningDate,
    monthlyRent: data.monthlyRent,
    depositAmount: data.depositAmount,
    otherCharges: data.otherCharges,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 4. Update Bed Status to Occupied
  targetBed.status = 'Occupied';
  targetBed.currentStudentId = newStudentId;
  targetBed.currentStudentName = data.fullName.trim();

  const initialPassword = (data.password && data.password.trim().length >= 4)
    ? data.password.trim()
    : 'student123';

  // 5. Create auth user for student so they can log in via phone
  const studentUser: User = {
    id: userId,
    role: 'STUDENT',
    fullName: data.fullName.trim(),
    phone: trimmedPhone,
    email: data.email?.trim(),
    passwordHash: initialPassword,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 6. Generate Month 1 Admission Bill for the new student
  const admissionBillAmount = data.monthlyRent + (data.depositAmount || 0) + (data.otherCharges || 0);
  const joiningDateObj = new Date(data.joiningDate);
  const cycleEndObj = new Date(joiningDateObj.getTime());
  cycleEndObj.setMonth(cycleEndObj.getMonth() + 1);
  cycleEndObj.setDate(cycleEndObj.getDate() - 1);

  const dueDateObj = new Date(joiningDateObj.getTime());
  dueDateObj.setDate(dueDateObj.getDate() + 5);

  const admissionBill: Bill = {
    id: `bill-${newStudentId}-m1-${Date.now()}`,
    billNumber: `BILL-${newStudentId}-M1`,
    studentDbId: studentDbId,
    studentId: newStudentId,
    studentName: data.fullName.trim(),
    phone: trimmedPhone,
    roomNumber: room ? room.roomNumber : targetBed.roomNumber,
    bedNumber: targetBed.bedNumber,
    blockName: block ? block.name : targetBed.blockName,
    cycleNumber: 1,
    cycleStartDate: data.joiningDate,
    cycleEndDate: cycleEndObj.toISOString().split('T')[0],
    dueDate: dueDateObj.toISOString().split('T')[0],
    amount: admissionBillAmount,
    rentAmount: data.monthlyRent,
    depositAmount: data.depositAmount || 0,
    otherCharges: data.otherCharges || 0,
    description: `Admission Month 1 Rent${data.depositAmount > 0 ? ` + Deposit ₹${data.depositAmount}` : ''}${data.otherCharges > 0 ? ` + Charges ₹${data.otherCharges}` : ''}`,
    createdAt: new Date().toISOString().split('T')[0],
  };

  if (!db.bills) db.bills = [];
  db.bills.push(admissionBill);

  // 7. Record Audit Log
  const audit: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: data.actorId,
    userName: data.actorName,
    userRole: data.actorRole,
    action: 'STUDENT_REGISTERED',
    details: `Registered ${data.fullName} with allocated Bed (${targetBed.bedNumber}, Room ${targetBed.roomNumber}). Generated Student ID: ${newStudentId}. Generated Admission Bill #${admissionBill.billNumber} of ₹${admissionBillAmount.toLocaleString('en-IN')}.`,
  };

  db.students.push(newStudent);
  db.users.push(studentUser);
  db.auditLogs.unshift(audit);

  saveDatabase(db);
  return { success: true, student: newStudent, initialPassword };
}

/**
 * Checkout student: releases bed, records permanent history, updates occupancy
 */
export function checkoutStudentTransaction(params: {
  studentDbId: string;
  checkoutDate: string;
  reason: string;
  notes?: string;
  actorName: string;
  actorRole: any;
  actorId: string;
}): { success: boolean; error?: string } {
  const db = getDatabase();
  const student = db.students.find(s => s.id === params.studentDbId && s.status === 'Active');
  if (!student) {
    return { success: false, error: 'Active student record not found.' };
  }

  // Release bed
  const bed = db.beds.find(b => b.id === student.bedId);
  if (bed) {
    bed.status = 'Available';
    bed.currentStudentId = undefined;
    bed.currentStudentName = undefined;
  }

  // Calculate financial figures for historical summary strictly from actual bills
  const studentBills = (db.bills || []).filter(b => b.studentDbId === student.id || b.studentId === student.studentId);
  const studentPayments = db.payments.filter(p => p.studentId === student.studentId || p.studentDbId === student.id);
  const fin = reconcileStudentBills(studentBills, studentPayments);

  // Create permanent history entry
  const historyItem: StudentHistoryRecord = {
    id: `hist-${Date.now()}`,
    studentDbId: student.id,
    studentId: student.studentId,
    fullName: student.fullName,
    phone: student.phone,
    roomNumber: student.roomNumber,
    bedNumber: student.bedNumber,
    blockName: student.blockName,
    joiningDate: student.joiningDate,
    checkoutDate: params.checkoutDate,
    checkoutReason: params.reason,
    totalBilled: fin.totalBilled,
    totalPaid: fin.totalPaid,
    finalOutstanding: fin.totalOutstanding,
    notes: params.notes,
    createdAt: new Date().toISOString(),
  };

  // Update student status
  student.status = 'CheckedOut';
  student.checkoutDate = params.checkoutDate;
  student.checkoutReason = params.reason;
  student.updatedAt = new Date().toISOString();

  // Audit Log
  const audit: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: params.actorId,
    userName: params.actorName,
    userRole: params.actorRole,
    action: 'STUDENT_CHECKOUT',
    details: `Checked out student ${student.fullName} (${student.studentId}). Released Bed (${student.bedNumber}, Room ${student.roomNumber}). Outstanding balance: ₹${fin.totalOutstanding}.`,
  };

  db.studentHistory.unshift(historyItem);
  db.auditLogs.unshift(audit);

  saveDatabase(db);
  return { success: true };
}

/**
 * Record a payment, issue receipt number, and update audit log
 */
export function recordPaymentTransaction(params: {
  studentDbId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: any;
  billingPeriod: string;
  transactionRef?: string;
  receivedBy: string;
  notes?: string;
  actorId: string;
  actorName: string;
  actorRole: any;
}): { success: boolean; payment?: Payment; error?: string } {
  const db = getDatabase();
  const student = db.students.find(s => s.id === params.studentDbId);
  if (!student) {
    return { success: false, error: 'Student record not found.' };
  }

  // Generate Receipt Number: REC-26-XXX
  const yearShort = String(new Date().getFullYear()).slice(-2);
  const receiptCount = db.payments.length + 1;
  const receiptNumber = `REC-${yearShort}-${String(receiptCount).padStart(3, '0')}`;

  const payment: Payment = {
    id: `pay-${Date.now()}`,
    receiptNumber,
    studentDbId: student.id,
    studentId: student.studentId,
    studentName: student.fullName,
    amount: params.amount,
    paymentDate: params.paymentDate,
    paymentMethod: params.paymentMethod,
    billingPeriod: params.billingPeriod,
    transactionRef: params.transactionRef,
    receivedBy: params.receivedBy,
    notes: params.notes,
    createdAt: new Date().toISOString(),
  };

  const audit: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: params.actorId,
    userName: params.actorName,
    userRole: params.actorRole,
    action: 'PAYMENT_RECORDED',
    details: `Recorded ${params.paymentMethod} payment of ₹${params.amount.toLocaleString('en-IN')} for ${student.fullName} (${student.studentId}). Issued Receipt: ${receiptNumber}.`,
  };

  db.payments.unshift(payment);
  db.auditLogs.unshift(audit);

  saveDatabase(db);
  return { success: true, payment };
}

/**
 * Update an existing student record, sync user login phone and bed resident name, and record audit log
 */
export function updateStudentTransaction(params: {
  studentId: string;
  updates: Partial<Student>;
  actorId?: string;
  actorName?: string;
  actorRole?: any;
}): { success: boolean; student?: Student; error?: string } {
  const db = getDatabase();
  const student = db.students.find(s => s.id === params.studentId || s.studentId === params.studentId);
  if (!student) {
    return { success: false, error: 'Student record not found.' };
  }

  const updates = params.updates;

  // Student mobile number is mandatory and must match ^[6-9]\d{9}$
  if (updates.phone !== undefined) {
    const trimmedPhone = normalizePhoneNumber(updates.phone);
    if (!trimmedPhone || !isValidPhoneNumber(trimmedPhone)) {
      return { success: false, error: PHONE_ERROR_MESSAGE };
    }
    const phoneExists = db.students.some(
      s => s.status === 'Active' && s.id !== student.id && s.phone === trimmedPhone
    );
    if (phoneExists) {
      return { success: false, error: 'Another active resident is already registered with this mobile number.' };
    }
    student.phone = trimmedPhone;

    // Synchronize resident app user login phone if linked
    if (student.userId) {
      const studentUser = db.users.find(u => u.id === student.userId);
      if (studentUser) {
        studentUser.phone = trimmedPhone;
      }
    }
  }

  if (updates.fullName !== undefined) {
    const trimmedName = (updates.fullName || '').trim();
    if (!trimmedName) {
      return { success: false, error: 'Student full name is mandatory.' };
    }
    student.fullName = trimmedName;

    // Synchronize bed current resident name
    if (student.bedId) {
      const bed = db.beds.find(b => b.id === student.bedId);
      if (bed && bed.currentStudentId === student.studentId) {
        bed.currentStudentName = trimmedName;
      }
    }

    // Synchronize resident app user full name
    if (student.userId) {
      const studentUser = db.users.find(u => u.id === student.userId);
      if (studentUser) {
        studentUser.fullName = trimmedName;
      }
    }
  }

  if (updates.gender !== undefined) student.gender = updates.gender;
  if (updates.email !== undefined) {
    student.email = (updates.email || '').trim();
    if (student.userId) {
      const studentUser = db.users.find(u => u.id === student.userId);
      if (studentUser) studentUser.email = student.email;
    }
  }
  if (updates.dob !== undefined) student.dob = updates.dob;
  if (updates.address !== undefined) student.address = (updates.address || '').trim();
  if (updates.guardianName !== undefined) student.guardianName = (updates.guardianName || '').trim();
  if (updates.guardianPhone !== undefined) {
    const trimmedGuardianPhone = normalizePhoneNumber(updates.guardianPhone);
    if (trimmedGuardianPhone && !isValidPhoneNumber(trimmedGuardianPhone)) {
      return { success: false, error: `Guardian ${PHONE_ERROR_MESSAGE.toLowerCase()}` };
    }
    student.guardianPhone = trimmedGuardianPhone;
  }
  if (updates.guardianRelation !== undefined) student.guardianRelation = updates.guardianRelation;
  if (updates.idProofType !== undefined) student.idProofType = updates.idProofType;
  if (updates.idProofNumber !== undefined) student.idProofNumber = (updates.idProofNumber || '').trim();
  if (updates.photoUrl !== undefined) student.photoUrl = updates.photoUrl;
  if (updates.idProofDocumentUrl !== undefined) student.idProofDocumentUrl = updates.idProofDocumentUrl;
  if (updates.monthlyRent !== undefined && !isNaN(Number(updates.monthlyRent)) && Number(updates.monthlyRent) >= 0) {
    student.monthlyRent = Number(updates.monthlyRent);
  }
  if (updates.status !== undefined) student.status = updates.status;

  // Handle student login password update by owner
  const rawPassword = (updates as any).newPassword || (updates as any).password;
  const newPass = typeof rawPassword === 'string' ? rawPassword.trim() : '';
  let isPasswordReset = false;
  if (newPass) {
    if (newPass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    isPasswordReset = true;
    const sNorm = normalizePhoneNumber(student.phone);
    let studentUser = student.userId ? db.users.find(u => u.id === student.userId) : null;
    if (!studentUser) {
      studentUser = db.users.find(
        u => u.role === 'STUDENT' && (u.phone === student.phone || normalizePhoneNumber(u.phone) === sNorm)
      );
    }
    if (studentUser) {
      studentUser.passwordHash = newPass;
      studentUser.updatedAt = new Date().toISOString();
      if (!student.userId) student.userId = studentUser.id;
    } else {
      const newUser: User = {
        id: `usr-stu-${student.id}`,
        role: 'STUDENT',
        fullName: student.fullName,
        phone: student.phone,
        email: student.email || '',
        passwordHash: newPass,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      student.userId = newUser.id;
    }
  }

  student.updatedAt = new Date().toISOString();

  const audit: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: params.actorId || 'usr-owner-1',
    userName: params.actorName || 'Hostel Owner',
    userRole: params.actorRole || 'OWNER',
    action: isPasswordReset ? 'STUDENT_PASSWORD_RESET' : 'UPDATE_STUDENT',
    details: isPasswordReset
      ? `Owner reset login password for student ${student.fullName} (${student.studentId}, Mobile: ${student.phone}).`
      : `Owner updated details for resident ${student.fullName} (${student.studentId}). Mobile: ${student.phone}.`,
  };

  db.auditLogs.unshift(audit);

  saveDatabase(db);
  return { success: true, student };
}
