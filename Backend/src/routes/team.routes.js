import { Router } from 'express';
import VerifyJwt from '../middleware/auth.middleware.js';
import {
    getTeamById,
    getUserTeamInLeague,
    getLeagueTeams,
    updateTeam
} from '../controllers/team.controller.js';

const router = Router();

router.use(VerifyJwt);

router.route('/league/:leagueId')
    .get(getLeagueTeams);

router.route('/league/:leagueId/my-team')
    .get(getUserTeamInLeague);

router.route('/:teamId')
    .get(getTeamById)
    .patch(updateTeam);

export default router;
