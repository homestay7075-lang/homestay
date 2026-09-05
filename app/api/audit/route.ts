import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import {
  runAuditCleanup,
  getAuditCleanupStatus,
  startAuditLogCleanupScheduler,
  AUDIT_RETENTION_HOURS,
} from '@/lib/services/auditLogCleaner';

// Ensure 12-hour background scheduler is running
if (typeof window === 'undefined') {
  startAuditLogCleanupScheduler();
}

/**
 * GET /api/audit
 * Returns active audit logs (automatically pruned to ensure all records are <= 12 hours old).
 */
export async function GET() {
  // Prune any logs older than 12 hours before returning
  const cleanupResult = runAuditCleanup(AUDIT_RETENTION_HOURS);
  const db = getDatabase();
  const status = getAuditCleanupStatus();

  return NextResponse.json({
    auditLogs: db.auditLogs,
    totalLogs: db.auditLogs.length,
    retentionHours: AUDIT_RETENTION_HOURS,
    cleanupSchedule: 'every 12 hours',
    lastCleanedAt: cleanupResult.cleanedAt,
    nextScheduledRunAt: cleanupResult.nextScheduledRunAt,
    lastPrunedCount: cleanupResult.prunedCount,
    schedulerActive: status.isSchedulerActive,
  });
}

/**
 * DELETE /api/audit
 * Trigger immediate cleanup of audit logs older than 12 hours,
 * or purge all logs if ?all=true query parameter is passed.
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const clearAll = searchParams.get('all') === 'true';

  const db = getDatabase();

  if (clearAll) {
    const deletedCount = db.auditLogs.length;
    db.auditLogs = [];
    saveDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'All audit log records cleared successfully.',
      deletedCount,
      remainingCount: 0,
      timestamp: new Date().toISOString(),
    });
  }

  // Prune logs older than 12 hours
  const result = runAuditCleanup(AUDIT_RETENTION_HOURS);

  return NextResponse.json({
    success: true,
    message: `Audit logs older than ${AUDIT_RETENTION_HOURS} hours purged successfully.`,
    deletedCount: result.prunedCount,
    remainingCount: result.remainingCount,
    cleanedAt: result.cleanedAt,
    nextScheduledRunAt: result.nextScheduledRunAt,
    retentionHours: AUDIT_RETENTION_HOURS,
  });
}

/**
 * POST /api/audit
 * Manual trigger endpoint for on-demand 12-hour audit log cleanup.
 */
export async function POST() {
  const result = runAuditCleanup(AUDIT_RETENTION_HOURS);

  return NextResponse.json({
    success: true,
    message: `Audit logs older than ${AUDIT_RETENTION_HOURS} hours purged successfully.`,
    deletedCount: result.prunedCount,
    remainingCount: result.remainingCount,
    cleanedAt: result.cleanedAt,
    nextScheduledRunAt: result.nextScheduledRunAt,
    retentionHours: AUDIT_RETENTION_HOURS,
  });
}
