import { Router } from 'express';
import VerifyJwt from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
    startDraft,
    scheduleDraft,
    getDraftState,
    selectDraftPlayer
} from '../controllers/draft.controller.js';
import { selectPlayerSchema, scheduleDraftSchema } from '../validators/draft.validator.js';

const router = Router();

router.use(VerifyJwt);

router.route('/:leagueId/start')
    .post(startDraft);

router.route('/:leagueId/schedule')
    .post(validate({ body: scheduleDraftSchema }), scheduleDraft);

router.route('/:leagueId/state')
    .get(getDraftState);

router.route('/:leagueId/select')
    .post(validate({ body: selectPlayerSchema }), selectDraftPlayer);

export default router;
