import prisma from '../config/db';
import logger from './logger';

export interface AuditLogOptions {
  userId?: string;
  action: string;
  module: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  entityId?: string;
  entityType?: string;
}

export async function logActivity(options: AuditLogOptions) {
  try {
    const log = await prisma.activityLog.create({
      data: {
        userId: options.userId || null,
        action: options.action,
        module: options.module,
        details: options.details ? options.details : undefined,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
        entityId: options.entityId || null,
        entityType: options.entityType || null,
      },
    });
    logger.debug(`[AUDIT] Action: ${options.action} on ${options.module} by User: ${options.userId || 'System'}`);
    return log;
  } catch (error) {
    logger.error('Failed to write activity log to database', error);
  }
}
