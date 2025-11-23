const express = require('express');
const {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam
} = require('./team.controller');

const router = express.Router();

router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

module.exports = router;
