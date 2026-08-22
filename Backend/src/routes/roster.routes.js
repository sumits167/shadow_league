import { Router } from 'express';
import VerifyJwt from '../middleware/auth.middleware.js';
import {
    getTeamRoster,
    getLeagueRosters,
    dropPlayerFromRoster
} from '../controllers/roster.controller.js';

const router = Router();

router.use(VerifyJwt);

router.route('/league/:leagueId')
    .get(getLeagueRosters);

router.route('/team/:teamId')
    .get(getTeamRoster);

router.route('/team/:teamId/player/:playerId')
    .delete(dropPlayerFromRoster);

export default router;
