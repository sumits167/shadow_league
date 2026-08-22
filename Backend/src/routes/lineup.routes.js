import { Router } from 'express';
import VerifyJwt from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
    submitLineup,
    getLineup,
    lockLineup
} from '../controllers/lineup.controller.js';
import { submitLineupSchema } from '../validators/lineup.validator.js';

const router = Router();

router.use(VerifyJwt);

router.route('/')
    .post(validate({ body: submitLineupSchema }), submitLineup);

router.route('/team/:teamId/week/:matchWeek')
    .get(getLineup);

router.route('/team/:teamId/week/:matchWeek/lock')
    .patch(lockLineup);

export default router;
