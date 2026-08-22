import { Router } from 'express';
import VerifyJwt from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
    createClub,
    getMyClubs,
    getClubBySlug,
    joinClub,
    getClubMembers,
    removeClubMember,
    updateClubMemberRole,
    updateClub,
    generateClubInviteCode
} from '../controllers/club.controller.js';
import {
    createClubSchema,
    updateClubSchema,
    joinClubSchema
} from '../validators/club.validator.js';

const router = Router();

// All club routes require JWT authentication
router.use(VerifyJwt);

router.route('/')
    .get(getMyClubs)
    .post(validate({ body: createClubSchema }), createClub);

router.route('/:slug')
    .get(getClubBySlug);

router.route('/:slug/join')
    .post(validate({ body: joinClubSchema }), joinClub);

router.route('/:clubId')
    .patch(validate({ body: updateClubSchema }), updateClub);

router.route('/:clubId/invite-code')
    .post(generateClubInviteCode);

router.route('/:clubId/members')
    .get(getClubMembers);

router.route('/:clubId/members/:targetUserId')
    .patch(updateClubMemberRole)
    .delete(removeClubMember);

export default router;
