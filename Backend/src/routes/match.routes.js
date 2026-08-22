import { Router } from 'express';
import VerifyJwt from '../middleware/auth.middleware.js';
import {
  getUpcomingMatches,
  getMatchById,
  getMatchPlayers
} from '../controllers/match.controller.js';

const router = Router();

router.use(VerifyJwt);

router.route('/upcoming')
  .get(getUpcomingMatches);

router.route('/:matchId')
  .get(getMatchById);

router.route('/:matchId/players')
  .get(getMatchPlayers);

export default router;
