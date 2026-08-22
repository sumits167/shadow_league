import mongoose, { Schema } from "mongoose";

const leagueSchema = new Schema({
    clubId: {
        type: Schema.Types.ObjectId,
        ref: "Club",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    season: {
        type: String,
        required: true,
        default: "2026"
    },
    status: {
        type: String,
        enum: ["Created", "Upcoming", "Draft", "Active", "Completed"],
        default: "Created",
        index: true
    },
    settings: {
        minTeams: {
            type: Number,
            default: 2
        },
        maxTeams: {
            type: Number,
            default: 10
        },
        prizePool: {
            firstPlace: { type: Number, default: 500 },
            secondPlace: { type: Number, default: 300 },
            thirdPlace: { type: Number, default: 150 }
        },
        rosterSize: {
            type: Number,
            default: 15
        },
        lineupSize: {
            type: Number,
            default: 11
        },
        draftDate: {
            type: Date
        },
        draftType: {
            type: String,
            enum: ["snake", "auction", "linear"],
            default: "snake"
        }
    },
    createdById: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    entryFee: {
        type: Number,
        default: 0
    },
    matchId: {
        type: String,
        index: true
    },
    matchDetails: {
        name: String,
        series: String,
        format: String,
        venue: String,
        matchDate: Date,
        lineupLockTime: Date,
        team1: Schema.Types.Mixed,
        team2: Schema.Types.Mixed
    },
    playerOwnershipLimit: {
        type: Number,
        default: 5
    },
    matchPlayerPool: [{
        id: String,
        name: String,
        realTeam: String,
        position: String,
        price: Number,
        ownershipLimit: { type: Number, default: 5 }
    }],
    draftState: {
        scheduledStartTime: Date,
        startedAt: Date,
        turnStartedAt: Date,
        turnExpiresAt: Date,
        currentPick: { type: Number, default: 1 },
        currentRound: { type: Number, default: 1 },
        turnDurationSeconds: { type: Number, default: 30 }
    },
    matchState: {
        status: { type: String, enum: ["Scheduled", "Live", "Completed"], default: "Scheduled" },
        startedAt: Date,
        completedAt: Date,
        currentBallIndex: { type: Number, default: 0 },
        totalBalls: { type: Number, default: 40 },
        simulationSpeed: { type: Number, default: 1 },
        currentScore: {
            team1: { name: String, score: { type: String, default: "0/0" }, overs: { type: String, default: "0.0" }, runs: { type: Number, default: 0 }, wickets: { type: Number, default: 0 } },
            team2: { name: String, score: { type: String, default: "0/0" }, overs: { type: String, default: "0.0" }, runs: { type: Number, default: 0 }, wickets: { type: Number, default: 0 } },
            currentInnings: { type: Number, default: 1 },
            target: Number,
            statusText: String
        },
        currentBatters: [{ name: String, runs: Number, balls: Number, fours: Number, sixes: Number, isStriker: Boolean }],
        currentBowler: { name: String, overs: String, maidens: Number, runs: Number, wickets: Number },
        lastBall: Schema.Types.Mixed,
        recentBalls: [Schema.Types.Mixed],
        playerFantasyPoints: { type: Map, of: Number, default: {} }
    }
}, { timestamps: true });

// Ensure unique slug per season in a club
leagueSchema.index({ clubId: 1, slug: 1, season: 1 }, { unique: true });

export const League = mongoose.models.League || mongoose.model("League", leagueSchema);