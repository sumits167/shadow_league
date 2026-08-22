import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { draftApi } from "../api";

export interface DraftPlayer {
  _id: string;
  id: string;
  name: string;
  realTeam: string;
  position: "BAT" | "BOWL" | "AR" | "WK";
  price: number;
  ownershipLimit: number;
  currentOwnership: number;
  isAvailable: boolean;
}

export interface DraftTeam {
  teamId: string;
  teamName: string;
  username: string;
  avatarUrl?: string;
  draftSlot: number;
  rosterCount: number;
  playerIds: string[];
  isCurrentTurn: boolean;
}

export interface DraftStateResponse {
  leagueId: string;
  leagueName: string;
  leagueStatus: string;
  matchDetails?: {
    name: string;
    series?: string;
    format?: string;
    venue?: string;
    matchDate?: string;
  };
  currentRound: number;
  currentPick: number;
  totalDraftPicks: number;
  isDraftComplete: boolean;
  timeRemaining?: number;
  turnStartedAt?: string;
  turnDuration?: number;
  turnExpiresAt?: string;
  serverTime?: number;
  scheduledStartTime?: string;
  currentTurnTeam: {
    teamId: string;
    teamName: string;
    username: string;
  } | null;
  maxRosterSize: number;
  availablePlayers: DraftPlayer[];
  teams: DraftTeam[];
}

export const useDraftState = (leagueId: string, enabled = true) => {
  return useQuery({
    queryKey: ["draft", leagueId],
    queryFn: async () => {
      const res = await draftApi.getDraftState(leagueId);
      return res?.data as DraftStateResponse;
    },
    enabled: !!leagueId && enabled,
    refetchInterval: 3000, // Poll every 3s during active draft
  });
};

export const useStartDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leagueId: string) => draftApi.startDraft(leagueId),
    onSuccess: (_, leagueId) => {
      queryClient.invalidateQueries({ queryKey: ["draft", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["leagues"] });
    },
  });
};

export const useScheduleDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leagueId, scheduledStartTime }: { leagueId: string; scheduledStartTime: string }) =>
      draftApi.scheduleDraft(leagueId, scheduledStartTime),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["draft", variables.leagueId] });
      queryClient.invalidateQueries({ queryKey: ["leagues"] });
    },
  });
};

export const useSelectDraftPlayer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leagueId, playerId }: { leagueId: string; playerId: string }) =>
      draftApi.selectDraftPlayer(leagueId, playerId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["draft", variables.leagueId] });
      queryClient.invalidateQueries({ queryKey: ["roster"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["leagues"] });
    },
  });
};
