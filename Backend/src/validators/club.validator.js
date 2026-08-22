import { z } from 'zod';

export const createClubSchema = z.object({
    name: z.string().min(2, "Club name must be at least 2 characters").max(50, "Club name max 50 characters"),
    description: z.string().max(300).optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    isPrivate: z.boolean().optional(),
    settings: z.object({
        maxLeagues: z.number().int().positive().optional(),
        allowPublicJoin: z.boolean().optional()
    }).optional()
});

export const updateClubSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().max(300).optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    isPrivate: z.boolean().optional(),
    settings: z.object({
        maxLeagues: z.number().int().positive().optional(),
        allowPublicJoin: z.boolean().optional()
    }).optional()
});

export const joinClubSchema = z.object({
    inviteCode: z.string().optional()
});
