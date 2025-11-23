const prisma = require('../../config/db');

async function getLogs(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const { limit = 50, action } = req.query;

    const where = {
      organizationId: orgId
    };

    if (action) {
      where.action = action;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit) || 50,
      include: {
        user: true
      }
    });

    res.json(logs);
  } catch (err) {
    next(err);
  }
}

module.exports = { getLogs };
