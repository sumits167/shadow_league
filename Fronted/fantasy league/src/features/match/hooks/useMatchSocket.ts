import { useState, useEffect, useCallback } from "react";
import { getDraftSocket } from "@/services/socket";
import { toast } from "sonner";

export interface BallEvent {
  over: number;
  ball: number;
  runs: number | string;
  type: string;
  commentary: string;
  batsman: { id?: string; name: string };
  bowler: { id?: string; name: string };
}

export interface LiveScore {
  team1: { name: string; score: string; overs: string; runs: number; wickets: number };
  team2: { name: string; score: string; overs: string; runs: number; wickets: number };
  currentInnings: number;
  target?: number;
  statusText: string;
}

export interface LiveLeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  manager: string;
  avatarUrl?: string;
  totalPoints: number;
  players?: Array<{
    playerId: string;
    name: string;
    role: string;
    multiplier: number;
    basePoints: number;
    effectivePoints: number;
  }>;
}

export function useMatchSocket(leagueId: string) {
  const [matchStatus, setMatchStatus] = useState<"Scheduled" | "Live" | "Completed">("Scheduled");
  const [score, setScore] = useState<LiveScore | null>(null);
  const [currentBatters, setCurrentBatters] = useState<Array<{ name: string; runs: number; balls: number; fours: number; sixes: number }>>([]);
  const [currentBowler, setCurrentBowler] = useState<{ name: string; overs: string; maidens: number; runs: number; wickets: number } | null>(null);
  const [recentBalls, setRecentBalls] = useState<BallEvent[]>([]);
  const [latestBall, setLatestBall] = useState<BallEvent | null>(null);
  const [leaderboard, setLeaderboard] = useState<LiveLeaderboardEntry[]>([]);
  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>({});
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!leagueId) return;

    const socket = getDraftSocket();
    setIsConnected(socket.connected);

    socket.emit("match:join", { leagueId });

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("match:join", { leagueId });
    };

    const handleState = (state: {
      status?: "Created" | "Upcoming" | "Draft" | "Active" | "Completed";
      matchState?: { status: "Scheduled" | "Live" | "Completed"; currentScore?: LiveScore; simulationSpeed?: number };
      standings?: LiveLeaderboardEntry[];
    }) => {
      const derivedStatus =
        state?.matchState?.status ||
        (state?.status === "Completed" ? "Completed" : state?.status === "Active" ? "Live" : "Scheduled");

      setMatchStatus(derivedStatus as "Scheduled" | "Live" | "Completed");
      if (state?.matchState?.currentScore) setScore(state.matchState.currentScore);
      if (state?.matchState?.simulationSpeed) setSimulationSpeed(state.matchState.simulationSpeed);
      if (state?.standings && state.standings.length > 0) {
        setLeaderboard(state.standings);
      }
    };

    const handleBallUpdate = (data: {
      ball: BallEvent;
      matchScore: LiveScore;
      currentBatters: Array<{ name: string; runs: number; balls: number; fours: number; sixes: number }>;
      currentBowler: { name: string; overs: string; maidens: number; runs: number; wickets: number };
      leaderboard: LiveLeaderboardEntry[];
      playerPoints: Record<string, number>;
    }) => {
      setMatchStatus("Live");
      setLatestBall(data.ball);
      setRecentBalls((prev) => [data.ball, ...prev.slice(0, 19)]);
      if (data.matchScore) setScore(data.matchScore);
      if (data.currentBatters) setCurrentBatters(data.currentBatters);
      if (data.currentBowler) setCurrentBowler(data.currentBowler);
      if (data.leaderboard && data.leaderboard.length > 0) setLeaderboard(data.leaderboard);
      if (data.playerPoints) setPlayerPoints(data.playerPoints);
    };

    const handleCompleted = (data: { finalScore: LiveScore; leaderboard: LiveLeaderboardEntry[] }) => {
      setMatchStatus("Completed");
      if (data.finalScore) setScore(data.finalScore);
      if (data.leaderboard && data.leaderboard.length > 0) setLeaderboard(data.leaderboard);
      toast.success("Match Finished! Final Fantasy Leaderboard calculated.");
    };

    socket.on("connect", handleConnect);
    socket.on("match:state", handleState);
    socket.on("match:ball-update", handleBallUpdate);
    socket.on("match:completed", handleCompleted);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("match:state", handleState);
      socket.off("match:ball-update", handleBallUpdate);
      socket.off("match:completed", handleCompleted);
      socket.emit("match:leave", { leagueId });
    };
  }, [leagueId]);

  const startMatch = useCallback(() => {
    if (!leagueId) return;
    const socket = getDraftSocket();
    socket.emit("match:start", { leagueId });
    toast.info("Launching Live Match Simulation...");
  }, [leagueId]);

  const setSpeed = useCallback((speed: number) => {
    if (!leagueId) return;
    const socket = getDraftSocket();
    setSimulationSpeed(speed);
    socket.emit("match:set-speed", { leagueId, speed });
    toast.info(`Match simulation speed set to ${speed}x`);
  }, [leagueId]);

  const fastForward = useCallback((speedOrInstant: "instant" | number = "instant") => {
    if (!leagueId) return;
    const socket = getDraftSocket();
    socket.emit("match:fast-forward", { leagueId, speedOrInstant });
    toast.info("Fast-forwarding match to completion...");
  }, [leagueId]);

  return {
    isConnected,
    matchStatus,
    score,
    currentBatters,
    currentBowler,
    recentBalls,
    latestBall,
    leaderboard,
    playerPoints,
    simulationSpeed,
    startMatch,
    setSpeed,
    fastForward,
  };
}
