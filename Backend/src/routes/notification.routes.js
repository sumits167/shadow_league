import { Router } from 'express';
import VerifyJwt from '../middleware/auth.middleware.js';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from '../controllers/notification.controller.js';

const router = Router();

router.use(VerifyJwt);

router.route('/')
    .get(getUserNotifications);

router.route('/read-all')
    .patch(markAllNotificationsAsRead);

router.route('/:notificationId/read')
    .patch(markNotificationAsRead);

export default router;
