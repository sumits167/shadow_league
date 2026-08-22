import mongoose, { Schema } from "mongoose";

const clubInviteSchema = new Schema({
    clubId: {
        type: Schema.Types.ObjectId,
        ref: "Club",
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    usedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    isUsed: {
        type: Boolean,
        default: false,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    usedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Auto-delete expired codes via MongoDB TTL index
clubInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ClubInvite = mongoose.models.ClubInvite || mongoose.model("ClubInvite", clubInviteSchema);
