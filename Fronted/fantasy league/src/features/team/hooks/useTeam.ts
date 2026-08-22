import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi, type SubmitLineupPayload } from "../api";

export const useMyTeamInLeague = (leagueId: string) => {
  return useQuery({
    queryKey: ["teams", "my-team", leagueId],
    queryFn: async () => {
      const res = await teamApi.getMyTeamInLeague(leagueId);
      return res?.data;
    },
    enabled: !!leagueId,
  });
};

export const useTeamById = (teamId: string) => {
  return useQuery({
    queryKey: ["teams", teamId],
    queryFn: async () => {
      const res = await teamApi.getTeamById(teamId);
      return res?.data;
    },
    enabled: !!teamId,
  });
};

export const useTeamRoster = (teamId: string) => {
  return useQuery({
    queryKey: ["roster", teamId],
    queryFn: async () => {
      const res = await teamApi.getTeamRoster(teamId);
      return res?.data;
    },
    enabled: !!teamId,
  });
};

export const useSubmitLineup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitLineupPayload) => teamApi.submitLineup(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lineups", variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams", variables.teamId] });
    },
  });
};
