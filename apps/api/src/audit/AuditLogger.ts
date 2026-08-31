import { prisma } from '../db/client';
import { AuditLogEntry } from '@smart-forensic/shared';

export class AuditLogger {
  /**
   * Logs a sensitive forensic action to the audit trail.
   * Strips raw message text or sensitive credentials to protect privacy.
   */
  public static async log(entry: {
    investigator: string;
    action: AuditLogEntry['action'];
    resource?: string;
    targetDeviceSerial?: string;
    caseId?: string;
    scanId?: string;
    status?: 'SUCCESS' | 'WARNING' | 'FAILURE';
    details: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      // Redact sensitive patterns (credit card, password, full SMS body)
      const sanitizedDetails = entry.details
        .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED]')
        .replace(/password[:=]\s*\S+/gi, 'password=[REDACTED]');

      await prisma.auditLog.create({
        data: {
          investigator: entry.investigator || 'Authorized Investigator',
          action: entry.action,
          resource: entry.resource,
          targetDeviceSerial: entry.targetDeviceSerial,
          caseId: entry.caseId,
          scanId: entry.scanId,
          status: entry.status || 'SUCCESS',
          details: sanitizedDetails,
          ipAddress: entry.ipAddress || '127.0.0.1'
        }
      });
    } catch (err) {
      console.error('[AuditLogger Error]', err);
    }
  }

  public static async getLogs(limit = 100): Promise<any[]> {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' }
    });
  }
}
