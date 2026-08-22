import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leagueApi, type CreateLeaguePayload, type JoinLeaguePayload } from "../api";
import { api } from "@/services/api";

export const useClubLeagues = (clubId: string) => {
  return useQuery({
    queryKey: ["leagues", "club", clubId],
    queryFn: async () => {
      const res = await leagueApi.getClubLeagues(clubId);
      return res?.data || [];
    },
    enabled: !!clubId,
  });
};

export const useLeagueById = (leagueId: string) => {
  return useQuery({
    queryKey: ["leagues", leagueId],
    queryFn: async () => {
      const res = await leagueApi.getLeagueById(leagueId);
      return res?.data;
    },
    enabled: !!leagueId,
  });
};

export const useLeagueLeaderboard = (leagueId: string) => {
  return useQuery({
    queryKey: ["leaderboard", leagueId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/leaderboard/league/${leagueId}`);
      return res?.data;
    },
    enabled: !!leagueId,
  });
};

export const useCreateLeague = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeaguePayload) => leagueApi.createLeague(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leagues", "club", variables.clubId] });
    },
  });
};

export const useJoinLeague = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leagueId, payload }: { leagueId: string; payload: JoinLeaguePayload }) =>
      leagueApi.joinLeague(leagueId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leagues"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["draft"] });
    },
  });
};

export const useUpdateLeague = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leagueId, payload }: { leagueId: string; payload: Partial<CreateLeaguePayload> }) =>
      leagueApi.updateLeague(leagueId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leagues"] });
    },
  });
};

export const useDeleteLeague = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leagueId: string) => leagueApi.deleteLeague(leagueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leagues"] });
    },
  });
};

export const useUserJoinedStandings = (clubId?: string) => {
  return useQuery({
    queryKey: ["leaderboard", "user-standings", clubId],
    queryFn: async () => {
      const url = clubId ? `/api/v1/leaderboard/user/standings?clubId=${clubId}` : `/api/v1/leaderboard/user/standings`;
      const res = await api.get(url);
      return res?.data || [];
    },
  });
};
