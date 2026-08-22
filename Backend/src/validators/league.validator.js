import { z } from 'zod';

export const createLeagueSchema = z.object({
    clubId: z.string().min(1, "Club ID is required"),
    name: z.string().min(2, "League name must be at least 2 characters").max(50),
    season: z.string().optional().default("2026"),
    entryFee: z.number().nonnegative().optional().default(0),
    matchId: z.string().optional(),
    playerOwnershipLimit: z.number().int().positive().optional().default(5),
    settings: z.object({
        maxTeams: z.number().int().positive().optional().default(10),
        rosterSize: z.number().int().positive().optional().default(15),
        lineupSize: z.number().int().positive().optional().default(11),
        draftDate: z.string().datetime({ offset: true }).or(z.string()).optional(),
        draftType: z.enum(["snake", "auction", "linear"]).optional().default("snake")
    }).optional()
});

export const updateLeagueSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    status: z.enum(["Created", "Upcoming", "Draft", "Active", "Completed"]).optional(),
    settings: z.object({
        minTeams: z.number().int().min(2).max(50).optional(),
        maxTeams: z.number().int().min(2).max(50).optional(),
        prizePool: z.object({
            firstPlace: z.number().nonnegative().optional(),
            secondPlace: z.number().nonnegative().optional(),
            thirdPlace: z.number().nonnegative().optional(),
        }).optional(),
        rosterSize: z.number().int().positive().optional(),
        lineupSize: z.number().int().positive().optional(),
        draftDate: z.string().datetime({ offset: true }).or(z.string()).optional(),
        draftType: z.enum(["snake", "auction", "linear"]).optional()
    }).optional()
});

export const joinLeagueSchema = z.object({
    teamName: z.string().min(2, "Team name must be at least 2 characters").max(50),
    logoUrl: z.string().url().optional().or(z.literal(''))
});
