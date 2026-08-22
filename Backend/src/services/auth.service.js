import sendVerificationEmail from "../mails/sendVerificationEmail.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

const uniqueUsername = async (username) => {
    const existingUser = await User.findOne({ username, isVerified: true });
    return existingUser;
};

const uniqueEmail = async (email) => {
    const existingUser = await User.findOne({ email, isVerified: true });
    return existingUser;
};

const signupService = async (email, password, username) => {
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        throw new ApiError(400, "Username or email already exists", "USER_ALREADY_EXISTS");
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
        username,
        email,
        password,
        verifyCode: verificationCode,
        verifyCodeExpiry: new Date(Date.now() + 3600000)
    });

    await sendVerificationEmail(email, username, verificationCode)


    return {
        user
    };
};

export {
    uniqueUsername,
    uniqueEmail,
    signupService
};