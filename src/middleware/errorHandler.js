const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  logger.error(err.stack || err.message);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
