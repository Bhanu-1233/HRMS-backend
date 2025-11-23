const express = require('express');
const { getLogs } = require('./log.controller');

const router = express.Router();

router.get('/', getLogs);

module.exports = router;
