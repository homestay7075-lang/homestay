export type UserRole = 'OWNER' | 'WARDEN' | 'MANAGER' | 'STAFF' | 'STUDENT';

export type BedStatus = 'Available' | 'Occupied' | 'Reserved' | 'Maintenance' | 'Blocked' | 'Vacating';

export type PaymentMethod = 'Cash' | 'UPI' | 'UPI/Online' | 'Bank Transfer' | 'Card';

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue';

export type ExpenseCategory = 
  | 'Grocery'
  | 'Market'
  | 'Rice'
  | 'Mineral Water'
  | 'Salaries'
  | 'Building Rent'
  | 'Electricity'
  | 'Internet'
  | 'Maintenance'
  | 'Others'
  | 'Water'
  | 'Staff Salary'
  | 'Gas'
  | 'Other';

export interface ModulePermission {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface StaffPermissions {
  students: ModulePermission;
  rooms: ModulePermission;
  payments: ModulePermission;
  dues: ModulePermission;
  expenses: ModulePermission;
  bookings: ModulePermission;
  notifications: ModulePermission;
  messages: ModulePermission;
  reports: ModulePermission;
  assignedBuildingIds?: string[]; // empty or undefined means all buildings, or restricted to specific building IDs
  assignedBlockIds: string[]; // empty means all blocks, or restricted to specific block IDs
}

export interface HostelSettings {
  id: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string;
  // Billing defaults
  defaultMonthlyRent: number;
  defaultDeposit: number;
  currency: string;
  currencySymbol: string;
  upiId?: string; // Owner UPI VPA (e.g. 9876543210@upi)
  rulesAndPolicies: string;
  // Operations, Notifications & Security
  systemId?: string; // e.g. "HS-8492"
  whatsappAlerts?: boolean;
  smsAlerts?: boolean;
  lateEntryAlerts?: boolean;
  automatedFeeReminders?: boolean;
  twoFactorEnabled?: boolean;
  pinLockEnabled?: boolean;
  updatedAt: string;
}

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  username?: string; // Optional custom login username (e.g. "admin" or "rajesh")
  email?: string;
  phone: string; // Used for student login & owner/staff login
  passwordHash: string;
  avatarUrl?: string;
  isActive: boolean;
  staffTitle?: string; // e.g. "Chief Warden", "Night Supervisor"
  assignedBuildingIds?: string[]; // Building IDs assigned to this staff member
  permissions?: StaffPermissions; // null/undefined for Owner (unrestricted) or Student
  createdAt: string;
  updatedAt: string;
}

export type BuildingGender = 'Boys' | 'Girls' | 'Co-Living';

export interface Building {
  id: string;
  name: string; // e.g., "Main Tower", "East Wing"
  description?: string;
  genderType?: BuildingGender; // 'Boys' | 'Girls' | 'Co-Living'
}

export interface Block {
  id: string;
  buildingId: string;
  buildingName: string;
  name: string; // e.g. "Block A (Boys)", "Block B (Girls)"
  code: string; // e.g. "BLK-A"
}

export interface Floor {
  id: string;
  blockId: string;
  floorNumber: number; // 1, 2, 3...
  name: string; // "First Floor"
}

export interface Room {
  id: string;
  floorId: string;
  blockId: string;
  buildingId: string;
  roomNumber: string; // e.g., "101", "102", "101-A"
  capacity: number; // total beds (e.g. 2, 3, 4)
  type: 'AC' | 'Non-AC' | 'Deluxe';
  baseRateMonthly: number;
  status: 'Available' | 'Occupied' | 'Maintenance';
  isSubRoom?: boolean;
  parentRoomNumber?: string;
  subRoomLabel?: string;
}

export interface Bed {
  id: string;
  roomId: string;
  roomNumber: string;
  blockId: string;
  blockName: string;
  buildingName: string;
  bedNumber: string; // e.g., "Bed A", "Bed 1"
  status: BedStatus;
  currentStudentId?: string;
  currentStudentName?: string;
  monthlyRate: number;
}

export interface Student {
  id: string; // Internal UUID
  studentId: string; // Generated: e.g. "STU26101"
  userId: string; // Links to auth user
  fullName: string;
  photoUrl: string;
  photoOriginalSizeKb?: number;
  photoCompressedSizeKb?: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  dob?: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  idProofType: 'Aadhaar' | 'Passport' | 'Driving License' | 'Voter ID' | 'College ID';
  idProofNumber: string;
  idProofDocumentUrl?: string;
  portalPassword?: string;
  
  // Allocation Details
  buildingId: string;
  blockId: string;
  roomId: string;
  bedId: string;
  roomNumber: string;
  bedNumber: string;
  blockName: string;
  
  // Joining and financial terms
  joiningDate: string; // ISO date: e.g. "2026-09-09"
  monthlyRent: number;
  depositAmount: number;
  otherCharges: number;
  
  status: 'Active' | 'CheckedOut';
  checkoutDate?: string;
  checkoutReason?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface StudentHistoryRecord {
  id: string;
  studentDbId: string;
  studentId: string;
  fullName: string;
  phone: string;
  roomNumber: string;
  bedNumber: string;
  blockName: string;
  joiningDate: string;
  checkoutDate: string;
  checkoutReason?: string;
  totalBilled: number;
  totalPaid: number;
  finalOutstanding: number;
  notes?: string;
  createdAt: string;
}

export interface Bill {
  id: string;
  billNumber: string; // e.g. "BILL-26-001" or "BILL-STU26102-M1"
  studentDbId: string;
  studentId: string;
  studentName: string;
  phone?: string;
  roomNumber?: string;
  bedNumber?: string;
  blockName?: string;
  cycleNumber: number; // Month 1, Month 2...
  cycleStartDate: string; // e.g. "2026-09-09"
  cycleEndDate: string; // e.g. "2026-10-08"
  dueDate: string; // e.g. "2026-09-14"
  amount: number;
  rentAmount: number;
  depositAmount?: number;
  otherCharges?: number;
  description?: string;
  createdAt: string;
}

export interface BillingCycle {
  id: string;
  studentDbId: string;
  studentId: string;
  studentName: string;
  cycleNumber: number; // Month 1, Month 2...
  cycleStartDate: string; // e.g. 2026-09-09
  cycleEndDate: string; // e.g. 2026-10-08
  dueDate: string; // e.g. 2026-09-14 (5-7 days grace period from cycle start)
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  status: PaymentStatus;
  description: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  receiptNumber: string; // e.g. "REC-26-001"
  studentDbId: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  billingCycleId?: string;
  billingPeriod: string; // e.g. "09/09/2026 - 08/10/2026"
  transactionRef?: string;
  receivedBy: string; // "Hostel Owner" or staff name
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-26-001"
  studentDbId: string;
  studentId: string;
  studentName: string;
  roomBed: string;
  billingPeriod: string;
  subtotal: number;
  deposit: number;
  otherCharges: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
  issueDate: string;
  status: PaymentStatus;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  description?: string;
  paymentMethod: PaymentMethod;
  buildingId?: string;
  buildingName?: string;
  receiptDocUrl?: string;
  addedBy: string; // Staff or Owner name
  createdAt: string;
}

export interface Booking {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  joiningDate: string;
  preferredRoomType?: string;
  address: string;
  notes?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Allocated';
  assignedBedId?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'Payment Reminder' | 'Due Reminder' | 'Hostel Announcement' | 'Maintenance Notice' | 'Booking Confirmation';
  targetAudience: 'ALL' | 'BLOCK' | 'STUDENT';
  targetBlockId?: string;
  targetStudentId?: string;
  isEnabled: boolean;
  scheduledDate?: string;
  createdBy: string;
  createdAt: string;
}

export interface MessageThreadItem {
  id: string;
  studentDbId: string;
  studentId: string;
  studentName: string;
  senderRole: UserRole;
  senderName: string;
  senderUserId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // e.g. "STUDENT_REGISTERED", "PAYMENT_RECORDED", "CHECKOUT_COMPLETED"
  details: string;
  ipAddress?: string;
}

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PaymentSubmission {
  id: string;
  studentDbId: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  roomNumber: string;
  bedNumber?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string; // 'UPI'
  upiApp: string; // 'PhonePe' | 'Google Pay' | 'Paytm' | 'BHIM' | 'CRED' | 'Other'
  transactionRef: string; // UTR or Reference Number
  receiptImageUrl?: string;
  notes?: string;
  status: SubmissionStatus;
  rejectionReason?: string;
  receiptNumber?: string; // Generated on approval (e.g. REC-26-005)
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}
