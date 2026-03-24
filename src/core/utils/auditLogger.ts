/**
 * Data Integrity Audit Logger
 * Records administrative actions and manual data overrides for accountability.
 */

import { logger } from "./logger";

export interface AuditLogEntry {
    action: string;
    operatorId: string;
    targetId: string;
    before: any;
    after: any;
    timestamp: string;
    reason?: string;
}

/**
 * Persists an audit log entry for sensitive data modifications.
 */
export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
    const message = `[AUDIT] Action: ${entry.action} | Operator: ${entry.operatorId} | Target: ${entry.targetId}`;
    console.info(message, { before: entry.before, after: entry.after });
    
    // Trace via standard system logger
    logger.log('INFO', {
        event: 'AUDIT_LOG',
        userId: entry.targetId,
        status: 'RECORDED',
        metadata: { action: entry.action, op: entry.operatorId },
        timestamp: entry.timestamp
    });

    // TODO: Persist to 'audit_logs' collection in Firestore or dedicated audit system
}

export const auditActions = {
    IDENTITY_MERGE_APPROVED: 'IDENTITY_MERGE_APPROVED',
    IDENTITY_MERGE_REJECTED: 'IDENTITY_MERGE_REJECTED',
    PROFILE_OVERRIDE: 'PROFILE_OVERRIDE',
    MANUAL_VERIFICATION: 'MANUAL_VERIFICATION'
};
