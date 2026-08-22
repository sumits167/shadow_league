import { z } from 'zod';

export const createPlayerSchema = z.object({
    name: z.string().min(2, "Player name is required"),
    sport: z.string().optional().default("cricket"),
    position: z.enum(["BAT", "BOWL", "AR", "WK", "GK", "DEF", "MID", "FWD"]),
    realTeam: z.string().min(1, "Real team is required"),
    price: z.number().positive("Price must be positive"),
    availabilityStatus: z.enum(["available", "injured", "suspended"]).optional().default("available"),
    stats: z.object({
        matches: z.number().optional().default(0),
        runs: z.number().optional().default(0),
        wickets: z.number().optional().default(0),
        goals: z.number().optional().default(0),
        assists: z.number().optional().default(0),
        points: z.number().optional().default(0)
    }).optional()
});

export const updatePlayerStatsSchema = z.object({
    runs: z.number().optional(),
    wickets: z.number().optional(),
    goals: z.number().optional(),
    assists: z.number().optional(),
    fantasyPoints: z.number().optional()
});
