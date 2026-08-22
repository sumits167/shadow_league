import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['manager', 'admin'],
        default: 'manager'
    },
    avatarUrl: {
        type: String,
        default: ""
    },
    refreshToken: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifyCode: {
        type: String,
    },
    verifyCodeExpiry: {
        type: Date,
    },
    shadowPoints: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

userSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        delete ret.password;
        delete ret.refreshToken;
        delete ret.verifyCode;
        delete ret.verifyCodeExpiry;
        return ret;
    }
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return;
    // if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    // next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '30m' }
    );
};

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
