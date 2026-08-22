import { useQuery } from "@tanstack/react-query";
import { matchApi } from "../api";

export const useUpcomingMatches = () => {
  return useQuery({
    queryKey: ["matches", "upcoming"],
    queryFn: async () => {
      const res = await matchApi.getUpcomingMatches();
      return res?.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useMatchById = (matchId: string) => {
  return useQuery({
    queryKey: ["matches", matchId],
    queryFn: async () => {
      const res = await matchApi.getMatchById(matchId);
      return res?.data;
    },
    enabled: !!matchId,
  });
};

export const useMatchPlayers = (matchId: string) => {
  return useQuery({
    queryKey: ["matches", matchId, "players"],
    queryFn: async () => {
      const res = await matchApi.getMatchPlayers(matchId);
      return res?.data || [];
    },
    enabled: !!matchId,
  });
};
