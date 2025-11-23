const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const { createAuditLog } = require('../../utils/auditLogger');

async function registerOrg(req, res, next) {
  try {
    const { orgName, adminName, adminEmail, password } = req.body;

    if (!orgName || !adminName || !adminEmail || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: 'User already exists with this email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const organization = await prisma.organization.create({
      data: {
        name: orgName,
        users: {
          create: {
            name: adminName,
            email: adminEmail,
            passwordHash,
            role: 'ADMIN'
          }
        }
      },
      include: { users: true }
    });

    const adminUser = organization.users[0];

    await createAuditLog({
      organizationId: organization.id,
      userId: adminUser.id,
      action: 'ORG_REGISTER',
      entityType: 'ORGANIZATION',
      entityId: organization.id,
      message: `Organization "${orgName}" registered with admin ${adminUser.email}`
    });

    const token = jwt.sign(
      {
        id: adminUser.id,
        organizationId: organization.id,
        role: adminUser.role,
        email: adminUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        organizationId: organization.id
      }
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        organizationId: user.organizationId,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      message: `User ${user.email} logged in`
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerOrg, login };
