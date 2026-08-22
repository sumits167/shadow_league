import { Router } from 'express';
import validate from '../middleware/validate.middleware.js';
import VerifyJwt from '../middleware/auth.middleware.js';
import { checkEmailUnique, checkUserNameUnique, login, logout, refresh_Token, signup, verifyCode } from '../controllers/auth.controller.js';
import { checkEmailUniqueSchema, checkUserNameUniqueSchema, loginSchema, signupSchema, verifyCodeSchema } from '../validators/auth.validator.js';
import ApiResponse from '../utils/ApiResponse.js';

const router = Router();

// Public routes  
router.route("/sign-up").post(validate({ body: signupSchema }), signup);
router.route("/register").post(validate({ body: signupSchema }), signup);
router.route("/login").post(validate({ body: loginSchema }), login);
router.route("/checkUserNameUnique").post(validate({ body: checkUserNameUniqueSchema }), checkUserNameUnique);
router.route("/checkUniqueUserName").post(validate({ body: checkUserNameUniqueSchema }), checkUserNameUnique);
router.route("/checkEmailUnique").post(validate({ body: checkEmailUniqueSchema }), checkEmailUnique);
router.route("/refresh_Token").post(refresh_Token);
router.route("/verifyCode").post(validate({ body: verifyCodeSchema }), verifyCode);

// Protected routes
router.route("/logout").post(VerifyJwt, logout);
router.route("/me").get(VerifyJwt, (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully", true));
});

export default router;