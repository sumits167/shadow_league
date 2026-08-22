import { User } from "../models/user.model.js";
import { signupService, uniqueUsername, uniqueEmail } from "../services/auth.service.js";
import AccessTokenOptions from "../utils/AccessTokenOptions.js";
import RefreshTokenOptions from "../utils/RefreshTokenOption.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import createAccessTokenAndRefreshToken from "../utils/createAccessTokenAndRefreshToken.js";
import jwt from 'jsonwebtoken';

const signup = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;

    const { user } = await signupService(email, password, username);

    const userObj = user.toJSON();

    return res
        .status(201)
        .json(new ApiResponse(201, { user: userObj }, "User created successfully. Please verify your email.", true));
});

const login = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    const user = await User.findOne({
        $or: [
            { email: identifier },
            { username: identifier }
        ]
    });

    if (!user) {
        throw new ApiError(401, "Invalid email/username or password", "INVALID_CREDENTIALS");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email/username or password", "INVALID_CREDENTIALS");
    }

    const { accessToken, refreshToken } = await createAccessTokenAndRefreshToken(user);

    const userObj = user.toJSON();

    return res
        .status(200)
        .cookie("accessToken", accessToken, AccessTokenOptions)
        .cookie("refreshToken", refreshToken, RefreshTokenOptions)
        .json(new ApiResponse(200, { user: userObj, accessToken, refreshToken }, "User logged in successfully", true));
});

const checkUserNameUnique = asyncHandler(async (req, res) => {
    const { username } = req.body;
    const user = await uniqueUsername(username);

    if (user) {
        return res.status(400).json(new ApiResponse(400, { isAvailable: false }, "Username is already taken", false));
    }

    return res.status(200).json(new ApiResponse(200, { isAvailable: true }, "Username is available", true));
});

const checkEmailUnique = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await uniqueEmail(email);

    if (user) {
        return res.status(400).json(new ApiResponse(400, { isAvailable: false }, "Email is already taken", false));
    }

    return res.status(200).json(new ApiResponse(200, { isAvailable: true }, "Email is available", true));
});

const verifyCode = asyncHandler(async (req, res) => {
    const { username, code } = req.body;
    const decodedUserName = decodeURIComponent(username);

    const user = await User.findOne({ username: decodedUserName });

    if (!user) {
        throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    const isCodeValid = user.verifyCode === code;
    const isCodeNotExpired = user.verifyCodeExpiry && new Date(user.verifyCodeExpiry) > new Date();

    if (isCodeValid && isCodeNotExpired) {
        user.isVerified = true;
        user.verifyCode = undefined;
        user.verifyCodeExpiry = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json(new ApiResponse(200, {}, "Account verified successfully", true));
    } else if (!isCodeNotExpired) {
        throw new ApiError(400, "Verification code has expired. Please request a new code.", "CODE_EXPIRED");
    } else {
        throw new ApiError(400, "Invalid verification code", "INVALID_CODE");
    }
});

const refresh_Token = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is missing. Please log in.", "NO_REFRESH_TOKEN");
    }

    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        throw new ApiError(401, "Invalid or expired refresh token. Please log in.", "INVALID_REFRESH_TOKEN");
    }

    const user = await User.findById(decoded?._id);

    if (!user) {
        throw new ApiError(401, "User not found", "USER_NOT_FOUND");
    }

    if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh token mismatch or revoked", "UNAUTHORIZED");
    }

    const { accessToken, refreshToken } = await createAccessTokenAndRefreshToken(user);
    const userObj = user.toJSON();

    return res
        .status(200)
        .cookie("accessToken", accessToken, AccessTokenOptions)
        .cookie("refreshToken", refreshToken, RefreshTokenOptions)
        .json(new ApiResponse(200, { user: userObj, accessToken, refreshToken }, "Token refreshed successfully", true));
});

const logout = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (userId) {
        await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    }

    return res
        .status(200)
        .clearCookie("accessToken", AccessTokenOptions)
        .clearCookie("refreshToken", RefreshTokenOptions)
        .json(new ApiResponse(200, {}, "Logged out successfully", true));
});





export {
    signup,
    login,
    logout,
    checkUserNameUnique,
    checkEmailUnique,
    refresh_Token,
    verifyCode
};