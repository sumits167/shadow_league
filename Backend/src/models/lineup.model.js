import mongoose, { Schema } from "mongoose";

const lineupSchema = new Schema({
    teamId: {
        type: Schema.Types.ObjectId,
        ref: "Team",
        required: true,
        index: true
    },
    leagueId: {
        type: Schema.Types.ObjectId,
        ref: "League",
        required: true,
        index: true
    },
    matchWeek: {
        type: Number,
        required: true
    },
    playerIds: [{
        type: Schema.Types.Mixed
    }],
    captainId: {
        type: Schema.Types.Mixed,
        required: true
    },
    viceCaptainId: {
        type: Schema.Types.Mixed,
        required: true
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    lockDeadline: {
        type: Date
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// One lineup per team per matchweek
lineupSchema.index({ teamId: 1, matchWeek: 1 }, { unique: true });

export const Lineup = mongoose.models.Lineup || mongoose.model("Lineup", lineupSchema);
