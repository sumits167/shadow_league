import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["LEAGUE_INVITE", "DRAFT_REMINDER", "DRAFT_EVENT", "DEADLINE_REMINDER", "LEAGUE_UPDATE", "SEASON_COMPLETION", "SYSTEM"],
        default: "SYSTEM"
    },
    read: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
