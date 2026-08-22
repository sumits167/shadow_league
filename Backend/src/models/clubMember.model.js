import mongoose, { Schema } from "mongoose";

const clubMemberSchema = new Schema({
    clubId: {
        type: Schema.Types.ObjectId,
        ref: "Club",
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ["admin", "member"],
        default: "member"
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Prevent a user from being added multiple times to the same club
clubMemberSchema.index({ clubId: 1, userId: 1 }, { unique: true });

export const ClubMember = mongoose.models.ClubMember || mongoose.model("ClubMember", clubMemberSchema);
