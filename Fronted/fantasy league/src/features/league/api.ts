import { api } from "@/services/api";

export interface CreateLeaguePayload {
    clubId: string;
    name: string;
    matchId?: string;
    playerOwnershipLimit?: number;
    season?: string;
    entryFee?: number;
    settings?: {
        minTeams?: number;
        maxTeams?: number;
        prizePool?: {
            firstPlace?: number;
            secondPlace?: number;
            thirdPlace?: number;
        };
        rosterSize?: number;
        lineupSize?: number;
        draftDate?: string;
        draftType?: "snake" | "auction" | "linear";
    };
}

export interface JoinLeaguePayload {
    teamName: string;
    logoUrl?: string;
}

export const leagueApi = {
    getClubLeagues: (clubId: string) => api.get(`/api/v1/leagues/club/${clubId}`),
    getLeagueById: (leagueId: string) => api.get(`/api/v1/leagues/${leagueId}`),
    createLeague: (payload: CreateLeaguePayload) => api.post("/api/v1/leagues", payload),
    joinLeague: (leagueId: string, payload: JoinLeaguePayload) => api.post(`/api/v1/leagues/${leagueId}/join`, payload),
    updateLeague: (leagueId: string, payload: Partial<CreateLeaguePayload>) => api.patch(`/api/v1/leagues/${leagueId}`, payload),
    deleteLeague: (leagueId: string) => api.delete(`/api/v1/leagues/${leagueId}`),
    completeSeason: (leagueId: string) => api.post(`/api/v1/leagues/${leagueId}/complete`, {}),
};
