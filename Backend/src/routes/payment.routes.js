import { Router } from 'express';
import VerifyJwt from '../middleware/auth.middleware.js';
import {
    createOrder,
    veriFyPayment
} from '../controllers/payment.controller.js';

const router = Router();

router.use(VerifyJwt);

router.route('/createOrder')
    .post(createOrder);

router.route('/veriFyPayment')
    .post(veriFyPayment);

export default router;
