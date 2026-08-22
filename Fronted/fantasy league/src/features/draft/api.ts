import { api } from "@/services/api";

export const draftApi = {
    startDraft: (leagueId: string) => api.post(`/api/v1/draft/${leagueId}/start`, {}),
    scheduleDraft: (leagueId: string, scheduledStartTime: string) =>
        api.post(`/api/v1/draft/${leagueId}/schedule`, { scheduledStartTime }),
    getDraftState: (leagueId: string) => api.get(`/api/v1/draft/${leagueId}/state`),
    selectDraftPlayer: (leagueId: string, playerId: string) => api.post(`/api/v1/draft/${leagueId}/select`, { playerId }),
    getPlayers: (params?: Record<string, string>) => {
        const queryString = params ? `?${new URLSearchParams(params).toString()}` : "";
        return api.get(`/api/v1/players${queryString}`);
    },
};
