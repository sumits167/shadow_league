import { z } from 'zod';

export const selectPlayerSchema = z.object({
    playerId: z.string().min(1, "Player ID is required")
});

export const startDraftSchema = z.object({
    leagueId: z.string().min(1, "League ID is required")
});

export const scheduleDraftSchema = z.object({
    scheduledStartTime: z.string().min(1, "Scheduled start time is required")
});
