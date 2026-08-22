import { Router } from 'express';
import VerifyJwt from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
    createLeague,
    getClubLeagues,
    getLeagueById,
    joinLeague,
    updateLeague,
    completeSeason,
    deleteLeague
} from '../controllers/league.controller.js';
import {
    createLeagueSchema,
    updateLeagueSchema,
    joinLeagueSchema
} from '../validators/league.validator.js';

const router = Router();

router.use(VerifyJwt);

router.route('/')
    .post(validate({ body: createLeagueSchema }), createLeague);

router.route('/club/:clubId')
    .get(getClubLeagues);

router.route('/:leagueId')
    .get(getLeagueById)
    .patch(validate({ body: updateLeagueSchema }), updateLeague)
    .delete(deleteLeague);

router.route('/:leagueId/join')
    .post(validate({ body: joinLeagueSchema }), joinLeague);

router.route('/:leagueId/complete')
    .post(completeSeason);

export default router;
