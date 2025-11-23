const prisma = require('../../config/db');
const { createAuditLog } = require('../../utils/auditLogger');

async function getEmployees(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const employees = await prisma.employee.findMany({
      where: { organizationId: orgId },
      include: {
        teams: {
          include: { team: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    res.json(employees);
  } catch (err) {
    next(err);
  }
}

async function getEmployeeById(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const id = parseInt(req.params.id, 10);

    const employee = await prisma.employee.findFirst({
      where: { id, organizationId: orgId },
      include: {
        teams: {
          include: { team: true }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (err) {
    next(err);
  }
}

async function createEmployee(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const userId = req.user.id;
    const { firstName, lastName, email, position } = req.body;

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        position,
        organizationId: orgId
      }
    });

    await createAuditLog({
      organizationId: orgId,
      userId,
      action: 'EMPLOYEE_CREATE',
      entityType: 'EMPLOYEE',
      entityId: employee.id,
      message: `Employee ${employee.firstName} ${employee.lastName} created`
    });

    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const { firstName, lastName, email, position } = req.body;

    const existing = await prisma.employee.findFirst({
      where: { id, organizationId: orgId }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { firstName, lastName, email, position }
    });

    await createAuditLog({
      organizationId: orgId,
      userId,
      action: 'EMPLOYEE_UPDATE',
      entityType: 'EMPLOYEE',
      entityId: updated.id,
      message: `Employee ${updated.id} updated`
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);

    const existing = await prisma.employee.findFirst({
      where: { id, organizationId: orgId }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await prisma.employeeTeam.deleteMany({
      where: { employeeId: id }
    });

    await prisma.employee.delete({ where: { id } });

    await createAuditLog({
      organizationId: orgId,
      userId,
      action: 'EMPLOYEE_DELETE',
      entityType: 'EMPLOYEE',
      entityId: id,
      message: `Employee ${id} deleted`
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function assignEmployeeTeams(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const userId = req.user.id;
    const employeeId = parseInt(req.params.id, 10);
    const { teamIds } = req.body;

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: orgId }
    });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const validTeams = await prisma.team.findMany({
      where: { id: { in: teamIds || [] }, organizationId: orgId }
    });

    const validTeamIds = validTeams.map((t) => t.id);

    await prisma.employeeTeam.deleteMany({
      where: {
        employeeId,
        team: { organizationId: orgId }
      }
    });

    if (validTeamIds.length > 0) {
      await prisma.employeeTeam.createMany({
        data: validTeamIds.map((teamId) => ({ employeeId, teamId }))
      });
    }

    await createAuditLog({
      organizationId: orgId,
      userId,
      action: 'EMPLOYEE_TEAM_ASSIGN',
      entityType: 'EMPLOYEE',
      entityId: employeeId,
      message: `Employee ${employeeId} assigned to teams [${validTeamIds.join(', ')}]`,
      meta: { teamIds: validTeamIds }
    });

    res.json({ success: true, teamIds: validTeamIds });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  assignEmployeeTeams
};
