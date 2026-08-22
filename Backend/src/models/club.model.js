import mongoose, { Schema } from "mongoose";

const clubSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        default: ""
    },
    logoUrl: {
        type: String,
        default: ""
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    isPrivate: {
        type: Boolean,
        default: true
    },
    inviteCode: {
        type: String,
        unique: true,
        sparse: true
    },
    settings: {
        maxLeagues: {
            type: Number,
            default: 10
        },
        allowPublicJoin: {
            type: Boolean,
            default: false
        }
    }
}, { timestamps: true });

export const Club = mongoose.models.Club || mongoose.model("Club", clubSchema);
