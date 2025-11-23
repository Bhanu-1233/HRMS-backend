const express = require('express');
const { registerOrg, login } = require('./auth.controller');

const router = express.Router();

router.post('/register-org', registerOrg);
router.post('/login', login);

module.exports = router;
