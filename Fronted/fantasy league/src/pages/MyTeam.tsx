import { useState, useMemo, useEffect } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PlayerCard, type PlayerProps } from "@/components/dashboard/PlayerCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UsersIcon,
  CrownIcon,
  FlameIcon,
  SaveIcon,
  Wand2Icon,
  RotateCcwIcon,
  ClockIcon,
  ShieldCheckIcon,
  ZapIcon,
  Loader2,
} from "lucide-react";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useMyClubs } from "@/features/club/hooks/useClub";
import { useClubLeagues } from "@/features/league/hooks/useLeague";
import { useMyTeamInLeague, useTeamRoster, useSubmitLineup } from "@/features/team/hooks/useTeam";
import { usePlayers } from "@/features/player/hooks/usePlayer";
import { useClubStore } from "@/store/clubStore";
import type { Player } from "@/features/player/api";

// Map backend position codes to frontend role labels
const positionToRole: Record<string, PlayerProps["role"]> = {
  BAT: "Batsman",
  BOWL: "Bowler",
  AR: "All-Rounder",
  WK: "Wicket Keeper",
};

function toPlayerProps(p: Player, isBench = false): PlayerProps {
  return {
    id: p._id,
    name: p.name,
    team: p.realTeam,
    role: positionToRole[p.position] || "Batsman",
    weekPoints: p.fantasyPoints || p.stats?.points || 0,
    seasonPoints: (p.fantasyPoints || 0) * 3, // estimate
    status: p.availabilityStatus === "injured" ? "Injured" : "Playing",
    isBench,
  };
}

// Hardcoded fallback players (same as before) for when no backend data exists
const fallbackPlayingXI: PlayerProps[] = [
  { id: "p1", name: "Virat Kohli", team: "RCB", role: "Batsman", isCaptain: true, status: "Playing", weekPoints: 142, seasonPoints: 820 },
  { id: "p2", name: "Jasprit Bumrah", team: "MI", role: "Bowler", isViceCaptain: true, status: "Playing", weekPoints: 135, seasonPoints: 890 },
  { id: "p3", name: "Rohit Sharma", team: "MI", role: "Batsman", status: "Playing", weekPoints: 98, seasonPoints: 640 },
  { id: "p4", name: "Suryakumar Yadav", team: "MI", role: "Batsman", status: "Playing", weekPoints: 110, seasonPoints: 710 },
  { id: "p5", name: "KL Rahul", team: "LSG", role: "Wicket Keeper", status: "Playing", weekPoints: 85, seasonPoints: 590 },
  { id: "p6", name: "Hardik Pandya", team: "MI", role: "All-Rounder", status: "Playing", weekPoints: 125, seasonPoints: 750 },
  { id: "p7", name: "Ravindra Jadeja", team: "CSK", role: "All-Rounder", status: "Upcoming", weekPoints: 92, seasonPoints: 680 },
  { id: "p8", name: "Rashid Khan", team: "GT", role: "All-Rounder", status: "Playing", weekPoints: 104, seasonPoints: 715 },
  { id: "p9", name: "Mohammed Siraj", team: "RCB", role: "Bowler", status: "Finished", weekPoints: 76, seasonPoints: 510 },
  { id: "p10", name: "Arshdeep Singh", team: "PBKS", role: "Bowler", status: "Upcoming", weekPoints: 68, seasonPoints: 490 },
  { id: "p11", name: "Kuldeep Yadav", team: "DC", role: "Bowler", status: "Finished", weekPoints: 82, seasonPoints: 530 },
];

const fallbackBench: PlayerProps[] = [
  { id: "b1", name: "Shubman Gill", team: "GT", role: "Batsman", status: "Upcoming", weekPoints: 45, seasonPoints: 420, isBench: true },
  { id: "b2", name: "Sanju Samson", team: "RR", role: "Wicket Keeper", status: "Finished", weekPoints: 38, seasonPoints: 380, isBench: true },
  { id: "b3", name: "Axar Patel", team: "DC", role: "All-Rounder", status: "Upcoming", weekPoints: 52, seasonPoints: 410, isBench: true },
  { id: "b4", name: "Yuzvendra Chahal", team: "RR", role: "Bowler", status: "Injured", weekPoints: 0, seasonPoints: 360, isBench: true },
];

export default function MyTeam() {
  const { data: user } = useMe();
  const username = user?.username || "Manager";

  const { data: clubs } = useMyClubs();
  const { activeClub } = useClubStore();
  const currentClubId = activeClub?._id || clubs?.[0]?._id || "";
  const { data: leagues } = useClubLeagues(currentClubId);
  const activeLeagueId = leagues?.[0]?._id || "";

  const { data: myTeam } = useMyTeamInLeague(activeLeagueId);
  const teamId = myTeam?._id || "";
  const { data: rosterData, isLoading: isLoadingRoster } = useTeamRoster(teamId);

  // Fetch all available players from DB to build pool
  const { data: allPlayers } = usePlayers();

  const submitLineupMutation = useSubmitLineup();

  const [playingXI, setPlayingXI] = useState<PlayerProps[]>(fallbackPlayingXI);
  const [bench, setBench] = useState<PlayerProps[]>(fallbackBench);
  const [selectedForSwap, setSelectedForSwap] = useState<PlayerProps | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize squad from backend roster data when available
  useEffect(() => {
    if (isInitialized) return;

    // If we have a roster from the backend, use it
    if (rosterData && Array.isArray(rosterData) && rosterData.length > 0) {
      const rosterPlayers: PlayerProps[] = rosterData.map((entry: { playerId: Player } | Player, idx: number) => {
        const p = 'playerId' in entry && typeof entry.playerId === 'object' ? entry.playerId : (entry as Player);
        return toPlayerProps(p, idx >= 11);
      });

      const xi = rosterPlayers.slice(0, 11).map((p, i) => ({
        ...p,
        isBench: false,
        isCaptain: i === 0,
        isViceCaptain: i === 1,
      }));
      const benchPlayers = rosterPlayers.slice(11).map(p => ({ ...p, isBench: true }));

      if (xi.length > 0) {
        setPlayingXI(xi);
        setBench(benchPlayers);
        setIsInitialized(true);
        return;
      }
    }

    // If no roster but we have players from the global pool, build a default 15-player squad
    if (allPlayers && Array.isArray(allPlayers) && allPlayers.length >= 15) {
      const sorted = [...allPlayers].sort((a: Player, b: Player) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0));
      const xi = sorted.slice(0, 11).map((p: Player, i: number) => ({
        ...toPlayerProps(p, false),
        isCaptain: i === 0,
        isViceCaptain: i === 1,
      }));
      const benchPlayers = sorted.slice(11, 15).map((p: Player) => toPlayerProps(p, true));

      setPlayingXI(xi);
      setBench(benchPlayers);
      setIsInitialized(true);
    }
  }, [rosterData, allPlayers, isInitialized]);

  // Set Captain (2x points)
  const handleSetCaptain = (playerId: string) => {
    setPlayingXI(prev =>
      prev.map(p => ({
        ...p,
        isCaptain: p.id === playerId,
        isViceCaptain: p.id === playerId ? false : p.isViceCaptain,
      }))
    );
    const player = playingXI.find(p => p.id === playerId);
    toast.success(`${player?.name} selected as Captain (2x Points)!`);
  };

  // Set Vice-Captain (1.5x points)
  const handleSetViceCaptain = (playerId: string) => {
    setPlayingXI(prev =>
      prev.map(p => ({
        ...p,
        isViceCaptain: p.id === playerId,
        isCaptain: p.id === playerId ? false : p.isCaptain,
      }))
    );
    const player = playingXI.find(p => p.id === playerId);
    toast.success(`${player?.name} selected as Vice-Captain (1.5x Points)!`);
  };

  // Swap logic between XI and bench
  const handlePlayerAction = (player: PlayerProps) => {
    if (!selectedForSwap) {
      setSelectedForSwap(player);
      toast.info(`Selected ${player.name}. Now click another player to complete the swap.`);
      return;
    }

    if (selectedForSwap.id === player.id) {
      setSelectedForSwap(null);
      toast.info("Selection cancelled.");
      return;
    }

    const isFirstInXI = playingXI.some(p => p.id === selectedForSwap.id);
    const isSecondInXI = playingXI.some(p => p.id === player.id);

    if (isFirstInXI && !isSecondInXI) {
      const newXI = playingXI.map(p => (p.id === selectedForSwap.id ? { ...player, isBench: false } : p));
      const newBench = bench.map(p => (p.id === player.id ? { ...selectedForSwap, isBench: true, isCaptain: false, isViceCaptain: false } : p));
      setPlayingXI(newXI);
      setBench(newBench);
      toast.success(`Swapped ${selectedForSwap.name} with ${player.name}!`);
    } else if (!isFirstInXI && isSecondInXI) {
      const newXI = playingXI.map(p => (p.id === player.id ? { ...selectedForSwap, isBench: false } : p));
      const newBench = bench.map(p => (p.id === selectedForSwap.id ? { ...player, isBench: true, isCaptain: false, isViceCaptain: false } : p));
      setPlayingXI(newXI);
      setBench(newBench);
      toast.success(`Promoted ${selectedForSwap.name} into starting XI for ${player.name}!`);
    } else {
      toast.info("Selected another player.");
      setSelectedForSwap(player);
      return;
    }

    setSelectedForSwap(null);
  };

  // Save lineup to backend
  const handleSaveLineup = async () => {
    if (!teamId) {
      toast.error("No team found. Join a league first to save your lineup.");
      return;
    }

    const captain = playingXI.find(p => p.isCaptain);
    const viceCaptain = playingXI.find(p => p.isViceCaptain);

    if (!captain) {
      toast.error("Please select a Captain (2x) before saving.");
      return;
    }
    if (!viceCaptain) {
      toast.error("Please select a Vice-Captain (1.5x) before saving.");
      return;
    }

    try {
      await submitLineupMutation.mutateAsync({
        teamId,
        matchWeek: 1, // TODO: derive from league current week
        playerIds: playingXI.map(p => p.id),
        captainId: captain.id,
        viceCaptainId: viceCaptain.id,
      });
      toast.success("11-Player Lineup & Multipliers saved to server!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save lineup");
    }
  };

  const handleAutoPick = () => {
    const all = [...playingXI, ...bench];
    const sorted = [...all].sort((a, b) => b.weekPoints - a.weekPoints);
    const newXI = sorted.slice(0, 11).map((p, idx) => ({
      ...p,
      isBench: false,
      isCaptain: idx === 0,
      isViceCaptain: idx === 1,
    }));
    const newBench = sorted.slice(11).map(p => ({
      ...p,
      isBench: true,
      isCaptain: false,
      isViceCaptain: false,
    }));
    setPlayingXI(newXI);
    setBench(newBench);
    toast.success("Auto Pick optimized your highest projected 11-player lineup!");
  };

  const handleResetChanges = () => {
    setIsInitialized(false); // will re-trigger effect to reload from backend
    setSelectedForSwap(null);
    toast.info("Roster reset. Re-loading from server...");
  };

  // Calculate live total points with Captain (2x) and Vice-Captain (1.5x) multipliers
  const totalLineupPoints = useMemo(() => {
    return playingXI.reduce((sum, p) => {
      let mult = 1.0;
      if (p.isCaptain) mult = 2.0;
      else if (p.isViceCaptain) mult = 1.5;
      return sum + p.weekPoints * mult;
    }, 0);
  }, [playingXI]);

  const captain = playingXI.find(p => p.isCaptain);
  const viceCaptain = playingXI.find(p => p.isViceCaptain);
  const playingCount = playingXI.filter(p => p.status === "Playing").length;

  if (isLoadingRoster) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your squad roster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Team Header */}
      <div className="flex flex-col gap-4 pb-6 border-b border-border md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              {username}'s Squad
            </h1>
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 font-bold text-xs uppercase">
              {teamId ? "Roster Active" : "Preview Mode"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
            <ZapIcon className="size-3.5 text-primary" />
            <span className="font-bold text-foreground">{totalLineupPoints.toFixed(0)} Total Match Points</span>
            <span>•</span>
            <ClockIcon className="size-3.5 text-muted-foreground" />
            <span>Lock Deadline: 30 mins before match</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveLineup}
            disabled={submitLineupMutation.isPending}
            className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 gap-2 cursor-pointer shadow-none"
          >
            {submitLineupMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="size-4" />
                Save Lineup
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Active Swap Alert banner if a player is selected */}
      {selectedForSwap && (
        <div className="p-3 rounded-xl border border-primary/50 bg-primary/10 flex items-center justify-between text-xs">
          <span className="text-foreground font-semibold flex items-center gap-2">
            <UsersIcon className="size-4 text-primary" />
            Swapping: <span className="text-primary font-bold">{selectedForSwap.name}</span> ({selectedForSwap.role}). Click another player to swap.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedForSwap(null)}
            className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* 2. Quick Stats (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Squad Size"
          value={`${playingXI.length + bench.length} Players`}
          change={`${playingXI.length} Playing • ${bench.length} Bench`}
          isPositive={true}
          subtitle="Full 15-Player Squad"
          icon={UsersIcon}
        />
        <StatCard
          title="Captain (2x)"
          value={captain ? captain.name : "None selected"}
          change="Double Multiplier"
          isPositive={true}
          subtitle="Earns 2x fantasy points"
          icon={CrownIcon}
        />
        <StatCard
          title="Vice-Captain (1.5x)"
          value={viceCaptain ? viceCaptain.name : "None selected"}
          change="1.5x Multiplier"
          isPositive={true}
          subtitle="Earns 1.5x fantasy points"
          icon={ShieldCheckIcon}
        />
        <StatCard
          title="Active Slate"
          value={`${playingCount} / ${playingXI.length} Playing`}
          change="Live Matchweek"
          isPositive={true}
          subtitle="Players in active matches"
          icon={FlameIcon}
        />
      </div>

      {/* 3. Playing XI Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Starting Lineup (11 Players)</span>
              <Badge variant="outline" className="border-border text-muted-foreground text-xs font-normal">
                {playingXI.length} / 11 Slots Filled
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Select your Captain (2x) and Vice-Captain (1.5x) with one click
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {playingXI.map((player) => (
            <PlayerCard
              key={player.id}
              {...player}
              onAction={() => handlePlayerAction(player)}
              onSetCaptain={() => handleSetCaptain(player.id)}
              onSetViceCaptain={() => handleSetViceCaptain(player.id)}
            />
          ))}
        </div>
      </div>

      {/* 4. Bench Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Bench Substitutes</span>
              <Badge variant="outline" className="border-border text-muted-foreground text-xs font-normal">
                {bench.length} Reserves
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Reserve squad members available to rotate into your weekly playing XI
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bench.map((player) => (
              <PlayerCard
                key={player.id}
                {...player}
                onAction={() => handlePlayerAction(player)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 5. Team Actions Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border bg-card p-6 rounded-xl">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAutoPick} className="gap-2 border-border text-foreground hover:bg-secondary cursor-pointer">
            <Wand2Icon className="size-4 text-primary" />
            Auto Pick Best XI
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetChanges} className="gap-2 border-border text-foreground hover:bg-secondary cursor-pointer">
            <RotateCcwIcon className="size-4 text-muted-foreground" />
            Reset
          </Button>
        </div>

        <Button
          onClick={handleSaveLineup}
          disabled={submitLineupMutation.isPending}
          size="lg"
          className="w-full sm:w-auto bg-primary text-primary-foreground font-bold hover:bg-primary/90 gap-2 px-8 cursor-pointer shadow-none"
        >
          {submitLineupMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving Lineup...
            </>
          ) : (
            <>
              <SaveIcon className="size-4" />
              Save 11-Player Lineup
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
