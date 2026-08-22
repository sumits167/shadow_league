import mongoose, { Schema } from "mongoose";

const rosterSchema = new Schema({
    teamId: {
        type: Schema.Types.ObjectId,
        ref: "Team",
        required: true,
        unique: true,
        index: true
    },
    leagueId: {
        type: Schema.Types.ObjectId,
        ref: "League",
        required: true,
        index: true
    },
    playerIds: [{
        type: Schema.Types.Mixed
    }],
    isLocked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const Roster = mongoose.models.Roster || mongoose.model("Roster", rosterSchema);
