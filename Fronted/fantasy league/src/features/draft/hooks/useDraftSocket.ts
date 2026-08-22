import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getDraftSocket } from "@/services/socket";
import { useDraftState } from "./useDraft";
import { toast } from "sonner";

export interface DraftPlayer {
  _id?: string;
  id: string;
  name: string;
  realTeam: string;
  position: string;
  price: number;
  ownershipLimit: number;
  currentOwnership: number;
  draftedByMe?: boolean;
  isAvailable: boolean;
}

export interface DraftTeam {
  teamId: string;
  teamName: string;
  username?: string;
  avatarUrl?: string;
  draftSlot: number;
  rosterCount: number;
  playerIds: string[];
  players?: Array<{
    id: string;
    _id?: string;
    name: string;
    position: string;
    realTeam: string;
    price: number;
  }>;
  isCurrentTurn: boolean;
}

export interface DraftFullState {
  leagueId: string;
  leagueName: string;
  leagueStatus: string;
  matchDetails?: {
    name: string;
    series?: string;
    format?: string;
    venue?: string;
    matchDate?: string;
    lineupLockTime?: string;
    team1?: { name: string; shortName?: string };
    team2?: { name: string; shortName?: string };
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
  currentTurnTeam?: {
    teamId: string;
    teamName: string;
    username?: string;
  } | null;
  maxRosterSize: number;
  availablePlayers: DraftPlayer[];
  teams: DraftTeam[];
}

export function useDraftSocket(leagueId: string, myUsername: string) {
  const queryClient = useQueryClient();
  const { data: initialDraftData, isLoading: isLoadingInitial } = useDraftState(leagueId);

  const [draftState, setDraftState] = useState<DraftFullState | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);

  // Server clock offset: serverTime - localNow
  const serverOffsetRef = useRef<number>(0);
  const turnStartedAtRef = useRef<number>(Date.now());
  const turnDurationRef = useRef<number>(30);

  // Sync initial query data
  useEffect(() => {
    if (initialDraftData && !draftState) {
      setDraftState(initialDraftData);
      if (initialDraftData.turnDuration) {
        turnDurationRef.current = initialDraftData.turnDuration;
      }
      if (initialDraftData.turnStartedAt) {
        turnStartedAtRef.current = new Date(initialDraftData.turnStartedAt).getTime();
      }
    }
  }, [initialDraftData, draftState]);

  // Socket connection & event listeners
  useEffect(() => {
    if (!leagueId) return;

    const socket = getDraftSocket();

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("draft:join", { leagueId });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleDraftState = (state: DraftFullState) => {
      setDraftState(state);
      queryClient.setQueryData(["draft", leagueId, "state"], state);

      if (state.serverTime) {
        serverOffsetRef.current = state.serverTime - Date.now();
      }

      if (state.turnDuration) {
        turnDurationRef.current = state.turnDuration;
      }

      if (state.turnStartedAt) {
        turnStartedAtRef.current = new Date(state.turnStartedAt).getTime();
      }
    };

    const handleTurnStarted = (data: {
      currentTurnTeam: { teamId: string; teamName: string; username?: string } | null;
      currentRound: number;
      currentPick: number;
      turnStartedAt?: string;
      turnDuration?: number;
      serverTime?: number;
    }) => {
      if (data.serverTime) {
        serverOffsetRef.current = data.serverTime - Date.now();
      }

      if (data.turnDuration) {
        turnDurationRef.current = data.turnDuration;
      }

      if (data.turnStartedAt) {
        turnStartedAtRef.current = new Date(data.turnStartedAt).getTime();
      } else {
        turnStartedAtRef.current = Date.now() + serverOffsetRef.current;
      }

      setDraftState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentRound: data.currentRound,
          currentPick: data.currentPick,
          currentTurnTeam: data.currentTurnTeam,
          teams: prev.teams.map((t) => ({
            ...t,
            isCurrentTurn: data.currentTurnTeam ? t.teamId === data.currentTurnTeam.teamId : false,
          })),
        };
      });
    };

    const handlePlayerPicked = (data: {
      teamId: string;
      playerId: string;
      currentRound: number;
      currentPick: number;
      isDraftComplete: boolean;
      pickedByUsername?: string;
    }) => {
      setIsSelecting(false);
      if (data.pickedByUsername) {
        const isMe = data.pickedByUsername === myUsername;
        toast.info(isMe ? "You selected your player!" : `@${data.pickedByUsername} made their pick`);
      }
    };

    const handleTurnExpired = (data: {
      teamId: string;
      autoPickedPlayerId?: string;
      round: number;
      pick: number;
    }) => {
      setIsSelecting(false);
      toast.warning("Turn timer expired — auto-pick executed!");
    };

    const handleDraftCompleted = (finalState: DraftFullState) => {
      setDraftState(finalState);
      queryClient.invalidateQueries({ queryKey: ["leagues"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Snake Draft completed! All squads are set.");
    };

    const handleDraftError = (err: { message: string }) => {
      setIsSelecting(false);
      toast.error(err.message || "Draft action failed");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("draft:state", handleDraftState);
    socket.on("draft:turn-started", handleTurnStarted);
    socket.on("draft:player-picked", handlePlayerPicked);
    socket.on("draft:turn-expired", handleTurnExpired);
    socket.on("draft:completed", handleDraftCompleted);
    socket.on("draft:error", handleDraftError);

    // If already connected, join immediately
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("draft:state", handleDraftState);
      socket.off("draft:turn-started", handleTurnStarted);
      socket.off("draft:player-picked", handlePlayerPicked);
      socket.off("draft:turn-expired", handleTurnExpired);
      socket.off("draft:completed", handleDraftCompleted);
      socket.off("draft:error", handleDraftError);
    };
  }, [leagueId, myUsername, queryClient]);

  // Smooth visual countdown loop synced to server timestamp
  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (draftState?.isDraftComplete) {
        setRemainingSeconds(0);
        return;
      }

      const correctedNow = Date.now() + serverOffsetRef.current;
      const turnEnd = turnStartedAtRef.current + turnDurationRef.current * 1000;
      const diffSec = Math.max(0, Math.ceil((turnEnd - correctedNow) / 1000));
      setRemainingSeconds(diffSec);
    }, 200);

    return () => clearInterval(timerInterval);
  }, [draftState?.isDraftComplete]);

  // Select Player Action via Socket
  const selectPlayer = useCallback(
    (playerId: string) => {
      const socket = getDraftSocket();
      setIsSelecting(true);
      socket.emit("draft:select-player", { leagueId, playerId });
    },
    [leagueId]
  );

  const isMyTurn =
    !!draftState?.currentTurnTeam &&
    (draftState.currentTurnTeam.username === myUsername ||
      draftState.teams.some((t) => t.teamId === draftState.currentTurnTeam?.teamId && t.username === myUsername));

  return {
    draftState,
    remainingSeconds,
    isMyTurn,
    isConnected,
    isSelecting,
    isLoading: isLoadingInitial && !draftState,
    selectPlayer,
    isDraftComplete: draftState?.isDraftComplete || false,
  };
}
