import { api } from "@/services/api";

export interface MatchTeam {
  name: string;
  shortName: string;
  code: string;
  logo: string;
}

export interface MatchPlayer {
  id: string;
  name: string;
  realTeam: string;
  position: "BAT" | "BOWL" | "AR" | "WK";
  price: number;
  ownershipLimit: number;
}

export interface Match {
  id: string;
  name: string;
  series: string;
  format: string;
  venue: string;
  matchDate: string;
  lineupLockTime: string;
  status: "Upcoming" | "Live" | "Completed";
  team1: MatchTeam;
  team2: MatchTeam;
  totalEligiblePlayers?: number;
  squad?: MatchPlayer[];
}

export const matchApi = {
  getUpcomingMatches: (): Promise<{ data: Match[] }> =>
    api.get("/api/v1/matches/upcoming"),

  getMatchById: (matchId: string): Promise<{ data: Match }> =>
    api.get(`/api/v1/matches/${matchId}`),

  getMatchPlayers: (matchId: string): Promise<{ data: MatchPlayer[] }> =>
    api.get(`/api/v1/matches/${matchId}/players`),
};
