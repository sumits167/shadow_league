import { z } from 'zod';

export const submitLineupSchema = z.object({
    teamId: z.string().min(1, "Team ID is required"),
    matchWeek: z.number().int().positive("Match week must be a positive integer"),
    playerIds: z.array(z.string()).length(11, "Lineup must contain exactly 11 players"),
    captainId: z.string().min(1, "Captain selection is required"),
    viceCaptainId: z.string().min(1, "Vice-Captain selection is required"),
    lockDeadline: z.string().datetime({ offset: true }).or(z.string()).optional()
}).refine(data => data.captainId !== data.viceCaptainId, {
    message: "Captain and Vice-Captain cannot be the same player",
    path: ["viceCaptainId"]
}).refine(data => data.playerIds.includes(data.captainId), {
    message: "Captain must be in the selected 11-player lineup",
    path: ["captainId"]
}).refine(data => data.playerIds.includes(data.viceCaptainId), {
    message: "Vice-Captain must be in the selected 11-player lineup",
    path: ["viceCaptainId"]
});
