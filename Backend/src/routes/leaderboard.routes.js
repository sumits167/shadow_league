import { Router } from 'express';
import VerifyJwt from '../middleware/auth.middleware.js';
import {
    getLeagueLeaderboard,
    recalculateLeaderboard,
    getLineupScore,
    getUserJoinedStandings
} from '../controllers/leaderboard.controller.js';

const router = Router();

router.use(VerifyJwt);

router.route('/user/standings')
    .get(getUserJoinedStandings);

router.route('/league/:leagueId')
    .get(getLeagueLeaderboard);

router.route('/league/:leagueId/recalculate')
    .post(recalculateLeaderboard);

router.route('/team/:teamId/week/:matchWeek')
    .get(getLineupScore);

export default router;
