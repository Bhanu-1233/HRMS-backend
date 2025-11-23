const prisma = require('../../config/db');
const { createAuditLog } = require('../../utils/auditLogger');

async function getTeams(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const teams = await prisma.team.findMany({
      where: { organizationId: orgId },
      include: {
        members: {
          include: { employee: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    res.json(teams);
  } catch (err) {
    next(err);
  }
}

async function getTeamById(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const id = parseInt(req.params.id, 10);

    const team = await prisma.team.findFirst({
      where: { id, organizationId: orgId },
      include: {
        members: {
          include: { employee: true }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (err) {
    next(err);
  }
}

async function createTeam(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const userId = req.user.id;
    const { name, description } = req.body;

    const team = await prisma.team.create({
      data: {
        name,
        description,
        organizationId: orgId
      }
    });

    await createAuditLog({
      organizationId: orgId,
      userId,
      action: 'TEAM_CREATE',
      entityType: 'TEAM',
      entityId: team.id,
      message: `Team "${team.name}" created`
    });

    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
}

async function updateTeam(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const { name, description } = req.body;

    const existing = await prisma.team.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const updated = await prisma.team.update({
      where: { id },
      data: { name, description }
    });

    await createAuditLog({
      organizationId: orgId,
      userId,
      action: 'TEAM_UPDATE',
      entityType: 'TEAM',
      entityId: updated.id,
      message: `Team ${updated.id} updated`
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteTeam(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);

    const existing = await prisma.team.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Team not found' });
    }

    await prisma.employeeTeam.deleteMany({
      where: { teamId: id }
    });

    await prisma.team.delete({ where: { id } });

    await createAuditLog({
      organizationId: orgId,
      userId,
      action: 'TEAM_DELETE',
      entityType: 'TEAM',
      entityId: id,
      message: `Team ${id} deleted`
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam
};
