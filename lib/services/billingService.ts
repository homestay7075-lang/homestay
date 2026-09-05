import { Bill, BillingCycle, Payment, PaymentStatus } from '../db/types';

/**
 * Calculates a future date by adding `monthsToAdd` months to `baseDate`,
 * safely clamping days to the last valid day of the target month.
 * (e.g., Jan 31 + 1 month -> Feb 28/29)
 */
export function addMonthsSafe(baseDate: Date, monthsToAdd: number): Date {
  const result = new Date(baseDate.getTime());
  const originalDay = baseDate.getDate();
  
  result.setMonth(result.getMonth() + monthsToAdd);
  
  // If the day changed due to overflow into next month, clamp to the last day of target month
  if (result.getDate() !== originalDay) {
    result.setDate(0); // Sets to last day of the previous month
  }
  return result;
}

export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type ReconciledBill = Bill & {
  paidAmount: number;
  balanceAmount: number;
  status: PaymentStatus;
  dueCategory: 'OLD_BALANCE' | 'NEW_BALANCE' | 'SETTLED';
};

/**
 * Reconciles student payments against generated bills in chronological order.
 * Calculates exact Old Balance (arrears from previous cycles) and New Balance (current cycle dues).
 */
export function reconcileStudentBills(
  bills: Bill[],
  payments: Payment[]
): {
  reconciledBills: ReconciledBill[];
  totalBilled: number;
  totalPaid: number;
  oldBalance: number; // Previous dues from older cycles
  newBalance: number; // Current cycle dues
  totalOutstanding: number; // Exact total dues (oldBalance + newBalance)
  overallStatus: PaymentStatus;
} {
  // Sort bills chronologically ascending
  const sortedBills = [...bills].sort(
    (a, b) => new Date(a.cycleStartDate).getTime() - new Date(b.cycleStartDate).getTime()
  );

  // Sort payments chronologically ascending (FIFO allocation)
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );
  const totalPaid = sortedPayments.reduce((acc, p) => acc + p.amount, 0);

  let remainingPaymentPool = totalPaid;
  let totalBilled = 0;
  const tempReconciled: (Bill & { paidAmount: number; balanceAmount: number; status: PaymentStatus })[] = [];

  for (let i = 0; i < sortedBills.length; i++) {
    const b = { ...sortedBills[i] };
    totalBilled += b.amount;

    if (remainingPaymentPool >= b.amount) {
      const paid = b.amount;
      remainingPaymentPool -= b.amount;
      tempReconciled.push({
        ...b,
        paidAmount: paid,
        balanceAmount: 0,
        status: 'Paid',
      });
    } else if (remainingPaymentPool > 0) {
      const paid = remainingPaymentPool;
      const bal = b.amount - remainingPaymentPool;
      remainingPaymentPool = 0;
      tempReconciled.push({
        ...b,
        paidAmount: paid,
        balanceAmount: bal,
        status: 'Partially Paid',
      });
    } else {
      const bal = b.amount;
      const dueDateObj = new Date(b.dueDate);
      const isOverdue = new Date() > dueDateObj;
      tempReconciled.push({
        ...b,
        paidAmount: 0,
        balanceAmount: bal,
        status: isOverdue ? 'Overdue' : 'Pending',
      });
    }
  }

  // Calculate Old Balance vs New Balance
  // Old Balance = Sum of balances of all bills before the latest generated bill
  // New Balance = Balance of the latest generated bill
  let oldBalance = 0;
  let newBalance = 0;

  if (tempReconciled.length > 1) {
    for (let i = 0; i < tempReconciled.length - 1; i++) {
      oldBalance += tempReconciled[i].balanceAmount;
    }
    newBalance = tempReconciled[tempReconciled.length - 1].balanceAmount;
  } else if (tempReconciled.length === 1) {
    newBalance = tempReconciled[0].balanceAmount;
  }

  const totalOutstanding = Math.max(0, totalBilled - totalPaid);

  // Annotate dueCategory for each bill
  const reconciledBills: ReconciledBill[] = tempReconciled.map((b, idx) => {
    let dueCategory: 'OLD_BALANCE' | 'NEW_BALANCE' | 'SETTLED' = 'SETTLED';
    if (b.balanceAmount > 0) {
      if (idx === tempReconciled.length - 1) {
        dueCategory = 'NEW_BALANCE';
      } else {
        dueCategory = 'OLD_BALANCE';
      }
    }
    return {
      ...b,
      dueCategory,
    };
  });

  let overallStatus: PaymentStatus = 'Paid';
  if (totalOutstanding === 0) {
    overallStatus = 'Paid';
  } else if (totalPaid > 0) {
    overallStatus = 'Partially Paid';
  } else {
    const hasOverdue = reconciledBills.some((b) => b.status === 'Overdue');
    overallStatus = hasOverdue ? 'Overdue' : 'Pending';
  }

  return {
    reconciledBills,
    totalBilled,
    totalPaid,
    oldBalance,
    newBalance,
    totalOutstanding,
    overallStatus,
  };
}

/**
 * Reconciles student payments with billing cycles in chronological order (Legacy compatibility)
 */
export function reconcileStudentFinances(
  cycles: BillingCycle[],
  payments: Payment[]
): {
  reconciledCycles: BillingCycle[];
  totalBilled: number;
  totalPaid: number;
  currentDue: number;
  previousDue: number;
  oldBalance: number;
  newBalance: number;
  totalOutstanding: number;
  overallStatus: PaymentStatus;
} {
  // Sort payments by date ascending
  const sortedPayments = [...payments].sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
  const totalPaid = sortedPayments.reduce((acc, p) => acc + p.amount, 0);

  let remainingPaymentPool = totalPaid;
  const reconciledCycles: BillingCycle[] = [];
  let totalBilled = 0;

  for (let i = 0; i < cycles.length; i++) {
    const cycle = { ...cycles[i] };
    totalBilled += cycle.amount;

    if (remainingPaymentPool >= cycle.amount) {
      cycle.paidAmount = cycle.amount;
      cycle.balanceAmount = 0;
      cycle.status = 'Paid';
      remainingPaymentPool -= cycle.amount;
    } else if (remainingPaymentPool > 0) {
      cycle.paidAmount = remainingPaymentPool;
      cycle.balanceAmount = cycle.amount - remainingPaymentPool;
      cycle.status = 'Partially Paid';
      remainingPaymentPool = 0;
    } else {
      cycle.paidAmount = 0;
      cycle.balanceAmount = cycle.amount;
      
      // Determine if overdue
      const dueDate = new Date(cycle.dueDate);
      const now = new Date();
      cycle.status = now > dueDate ? 'Overdue' : 'Pending';
    }

    reconciledCycles.push(cycle);
  }

  const totalOutstanding = Math.max(0, totalBilled - totalPaid);
  
  // Previous due (Old Balance) = sum of balances from cycles prior to the latest active cycle
  let previousDue = 0;
  let currentDue = 0;

  if (reconciledCycles.length > 1) {
    for (let i = 0; i < reconciledCycles.length - 1; i++) {
      previousDue += reconciledCycles[i].balanceAmount;
    }
    currentDue = reconciledCycles[reconciledCycles.length - 1].balanceAmount;
  } else if (reconciledCycles.length === 1) {
    currentDue = reconciledCycles[0].balanceAmount;
  }

  let overallStatus: PaymentStatus = 'Paid';
  if (totalOutstanding === 0) {
    overallStatus = 'Paid';
  } else if (totalPaid > 0) {
    overallStatus = 'Partially Paid';
  } else {
    const hasOverdue = reconciledCycles.some(c => c.status === 'Overdue');
    overallStatus = hasOverdue ? 'Overdue' : 'Pending';
  }

  return {
    reconciledCycles,
    totalBilled,
    totalPaid,
    currentDue,
    previousDue,
    oldBalance: previousDue,
    newBalance: currentDue,
    totalOutstanding,
    overallStatus,
  };
}
