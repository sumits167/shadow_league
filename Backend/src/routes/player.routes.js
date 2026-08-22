import { Router } from 'express';
import VerifyJwt from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
    createPlayer,
    getPlayers,
    getPlayerById,
    updatePlayerStats,
    seedSamplePlayers
} from '../controllers/player.controller.js';
import {
    createPlayerSchema,
    updatePlayerStatsSchema
} from '../validators/player.validator.js';

const router = Router();

router.use(VerifyJwt);

router.route('/')
    .get(getPlayers)
    .post(validate({ body: createPlayerSchema }), createPlayer);

router.route('/seed')
    .post(seedSamplePlayers);

router.route('/:playerId')
    .get(getPlayerById)
    .patch(validate({ body: updatePlayerStatsSchema }), updatePlayerStats);

export default router;
