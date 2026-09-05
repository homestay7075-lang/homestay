import { pruneAuditLogs } from '../db/store';

// 12 Hours in milliseconds
export const AUDIT_RETENTION_HOURS = 12;
export const AUDIT_CLEANUP_INTERVAL_MS = AUDIT_RETENTION_HOURS * 60 * 60 * 1000; // 43,200,000 ms

export interface AuditCleanupStatus {
  isSchedulerActive: boolean;
  retentionHours: number;
  intervalHours: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastPrunedCount: number;
  totalPurgesPerformed: number;
}

// Global symbols to maintain singleton scheduler across Next.js HMR reloads
const SCHEDULER_TIMER_KEY = Symbol.for('homestay.audit_cleaner_timer');
const SCHEDULER_STATUS_KEY = Symbol.for('homestay.audit_cleaner_status');

const globalScope = globalThis as unknown as {
  [SCHEDULER_TIMER_KEY]?: NodeJS.Timeout;
  [SCHEDULER_STATUS_KEY]?: AuditCleanupStatus;
};

// Initialize status tracking
if (!globalScope[SCHEDULER_STATUS_KEY]) {
  globalScope[SCHEDULER_STATUS_KEY] = {
    isSchedulerActive: false,
    retentionHours: AUDIT_RETENTION_HOURS,
    intervalHours: AUDIT_RETENTION_HOURS,
    lastRunAt: null,
    nextRunAt: null,
    lastPrunedCount: 0,
    totalPurgesPerformed: 0,
  };
}

/**
 * Execute audit log cleanup immediately:
 * Purges any audit logs with timestamps older than retentionHours (default: 12h).
 */
export function runAuditCleanup(retentionHours: number = AUDIT_RETENTION_HOURS): {
  prunedCount: number;
  remainingCount: number;
  cleanedAt: string;
  nextScheduledRunAt: string | null;
} {
  const result = pruneAuditLogs(retentionHours);
  const now = new Date();
  const nextRun = new Date(now.getTime() + AUDIT_CLEANUP_INTERVAL_MS);

  const status = globalScope[SCHEDULER_STATUS_KEY]!;
  status.lastRunAt = now.toISOString();
  status.nextRunAt = nextRun.toISOString();
  status.lastPrunedCount = result.prunedCount;
  status.totalPurgesPerformed += 1;
  status.retentionHours = retentionHours;

  console.log(
    `[Audit Cleaner] Completed 12-hour audit log purge at ${now.toISOString()}. ` +
    `Purged: ${result.prunedCount} records. Remaining: ${result.remainingCount}. ` +
    `Next run scheduled: ${nextRun.toISOString()}`
  );

  return {
    prunedCount: result.prunedCount,
    remainingCount: result.remainingCount,
    cleanedAt: now.toISOString(),
    nextScheduledRunAt: status.nextRunAt,
  };
}

/**
 * Start recurring background scheduler that triggers cleanup every 12 hours.
 * Safe for Next.js hot module reloading (HMR) and multi-imports.
 */
export function startAuditLogCleanupScheduler(): void {
  if (typeof window !== 'undefined') {
    return; // Do not run on client
  }

  const status = globalScope[SCHEDULER_STATUS_KEY]!;

  if (globalScope[SCHEDULER_TIMER_KEY]) {
    status.isSchedulerActive = true;
    return;
  }

  console.log('[Audit Cleaner] Starting 12-hour audit log cleanup background scheduler...');

  // Run initial cleanup immediately
  try {
    runAuditCleanup(AUDIT_RETENTION_HOURS);
  } catch (err) {
    console.error('[Audit Cleaner] Error during initial startup cleanup:', err);
  }

  // Schedule recurring interval every 12 hours (12 * 60 * 60 * 1000 ms)
  const timer = setInterval(() => {
    try {
      runAuditCleanup(AUDIT_RETENTION_HOURS);
    } catch (err) {
      console.error('[Audit Cleaner] Error during scheduled 12-hour cleanup:', err);
    }
  }, AUDIT_CLEANUP_INTERVAL_MS);

  // Unref timer so Node process can exit gracefully if needed
  if (timer.unref) {
    timer.unref();
  }

  globalScope[SCHEDULER_TIMER_KEY] = timer;
  status.isSchedulerActive = true;
}

/**
 * Stop the background scheduler (useful for testing or shutdown)
 */
export function stopAuditLogCleanupScheduler(): void {
  if (globalScope[SCHEDULER_TIMER_KEY]) {
    clearInterval(globalScope[SCHEDULER_TIMER_KEY]);
    delete globalScope[SCHEDULER_TIMER_KEY];
  }
  if (globalScope[SCHEDULER_STATUS_KEY]) {
    globalScope[SCHEDULER_STATUS_KEY]!.isSchedulerActive = false;
  }
}

/**
 * Get current status of the 12-hour audit cleanup service
 */
export function getAuditCleanupStatus(): AuditCleanupStatus {
  return globalScope[SCHEDULER_STATUS_KEY]!;
}

// Automatically start scheduler when loaded in Node.js server environment
if (typeof window === 'undefined') {
  startAuditLogCleanupScheduler();
}
