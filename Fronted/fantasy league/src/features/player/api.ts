import { api } from "@/services/api";

// Matches the actual MongoDB Player schema from the backend
export interface Player {
  _id: string;
  name: string;
  sport: string;
  position: "BAT" | "BOWL" | "AR" | "WK" | "GK" | "DEF" | "MID" | "FWD";
  realTeam: string;
  price: number;
  availabilityStatus: "available" | "injured" | "suspended";
  stats: {
    matches: number;
    runs: number;
    wickets: number;
    goals: number;
    assists: number;
    points: number;
  };
  fantasyPoints: number;
  createdAt?: string;
  updatedAt?: string;
}

export const playerApi = {
  getPlayers: (params?: { position?: string; realTeam?: string; search?: string }): Promise<{ data: Player[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.position) searchParams.set("position", params.position);
    if (params?.realTeam) searchParams.set("realTeam", params.realTeam);
    if (params?.search) searchParams.set("search", params.search);
    const qs = searchParams.toString();
    return api.get(`/api/v1/players${qs ? `?${qs}` : ""}`);
  },

  getPlayerById: (playerId: string): Promise<{ data: Player }> =>
    api.get(`/api/v1/players/${playerId}`),

  seedSamplePlayers: (): Promise<{ data: { message: string; count?: number } }> =>
    api.post("/api/v1/players/seed", {}),
};
