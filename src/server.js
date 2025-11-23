const app = require('./app');
const logger = require('./config/logger');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`HRMS backend listening on port ${PORT}`);
});
