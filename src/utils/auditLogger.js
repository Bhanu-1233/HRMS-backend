const prisma = require('../config/db');
const logger = require('../config/logger');

async function createAuditLog({
  organizationId,
  userId,
  action,
  entityType,
  entityId,
  message,
  meta
}) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: organizationId || null,
        userId: userId || null,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        message,
        meta: meta || null
      }
    });
    logger.info(`[AUDIT] ${action} - ${message}`);
  } catch (err) {
    logger.error(`Failed to create audit log: ${err.message}`);
  }
}

module.exports = { createAuditLog };
