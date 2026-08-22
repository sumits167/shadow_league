import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { playerApi } from "../api";

export const usePlayers = (params?: { role?: string; team?: string; search?: string }) => {
  return useQuery({
    queryKey: ["players", params],
    queryFn: async () => {
      const res = await playerApi.getPlayers(params);
      return res?.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useSeedPlayers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => playerApi.seedSamplePlayers(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
};
