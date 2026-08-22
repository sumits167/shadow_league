import mongoose, { Schema } from "mongoose";

const teamSchema = new Schema({
    leagueId: {
        type: Schema.Types.ObjectId,
        ref: "League",
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    logoUrl: {
        type: String,
        default: ""
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    rank: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Crucial Rule: One user = one team per league
teamSchema.index({ leagueId: 1, userId: 1 }, { unique: true });

export const Team = mongoose.models.Team || mongoose.model("Team", teamSchema);
