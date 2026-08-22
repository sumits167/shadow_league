import mongoose, { Schema } from "mongoose";

const playerSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    sport: {
        type: String,
        default: "cricket"
    },
    position: {
        type: String,
        enum: ["BAT", "BOWL", "AR", "WK", "GK", "DEF", "MID", "FWD"],
        required: true,
        index: true
    },
    realTeam: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    availabilityStatus: {
        type: String,
        enum: ["available", "injured", "suspended"],
        default: "available"
    },
    stats: {
        matches: { type: Number, default: 0 },
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        goals: { type: Number, default: 0 },
        assists: { type: Number, default: 0 },
        points: { type: Number, default: 0 }
    },
    fantasyPoints: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export const Player = mongoose.models.Player || mongoose.model("Player", playerSchema);
