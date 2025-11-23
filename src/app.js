const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./modules/auth/auth.routes');
const employeeRoutes = require('./modules/employees/employee.routes');
const teamRoutes = require('./modules/teams/team.routes');
const logRoutes = require('./modules/logs/log.routes');
const authMiddleware = require('./middleware/auth');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ message: 'HRMS API running' });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/employees', authMiddleware, employeeRoutes);
app.use('/api/teams', authMiddleware, teamRoutes);
app.use('/api/logs', authMiddleware, logRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;
