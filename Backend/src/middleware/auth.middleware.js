import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';

const VerifyJwt = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Invalid token", "Invalid token");
        }

        const decodeData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodeData?._id).select("-password");

        if (!user) {
            throw new ApiError(401, "Invalid token", "Invalid token");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new ApiError(401, "Invalid token", "Invalid token");
        }
        next(error);
    }
});

export default VerifyJwt;