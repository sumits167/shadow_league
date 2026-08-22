import { api } from "@/services/api";

export interface SubmitLineupPayload {
    teamId: string;
    matchWeek: number;
    playerIds: string[];
    captainId: string;
    viceCaptainId: string;
    lockDeadline?: string;
}

export const teamApi = {
    getLeagueTeams: (leagueId: string) => api.get(`/api/v1/teams/league/${leagueId}`),
    getMyTeamInLeague: (leagueId: string) => api.get(`/api/v1/teams/league/${leagueId}/my-team`),
    getTeamById: (teamId: string) => api.get(`/api/v1/teams/${teamId}`),
    updateTeam: (teamId: string, payload: { name?: string; logoUrl?: string }) => api.patch(`/api/v1/teams/${teamId}`, payload),
    getTeamRoster: (teamId: string) => api.get(`/api/v1/rosters/team/${teamId}`),
    dropPlayer: (teamId: string, playerId: string) => api.delete(`/api/v1/rosters/team/${teamId}/player/${playerId}`),
    submitLineup: (payload: SubmitLineupPayload) => api.post("/api/v1/lineups", payload),
    getLineup: (teamId: string, matchWeek: number) => api.get(`/api/v1/lineups/team/${teamId}/week/${matchWeek}`),
};
