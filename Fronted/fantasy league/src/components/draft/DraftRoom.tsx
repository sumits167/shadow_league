import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDraftSocket, type DraftPlayer, type DraftTeam } from "@/features/draft/hooks/useDraftSocket";
import {
  SearchIcon,
  UsersIcon,
  ArrowLeftRightIcon,
  Loader2,
  CheckCircle2Icon,
  LockIcon,
  CrownIcon,
  ArrowRightIcon,
  RadioIcon,
  SparklesIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  EyeIcon,
} from "lucide-react";
import { toast } from "sonner";

interface DraftRoomProps {
  leagueId: string;
  myUsername?: string;
  onDraftComplete?: () => void;
}

export function DraftRoom({ leagueId, myUsername = "Manager", onDraftComplete }: DraftRoomProps) {
  const {
    draftState,
    remainingSeconds,
    isMyTurn,
    isConnected,
    isSelecting,
    isLoading,
    selectPlayer,
    isDraftComplete,
  } = useDraftSocket(leagueId, myUsername);

  const [positionFilter, setPositionFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideDraftedByMe, setHideDraftedByMe] = useState(false);
  const [selectedSquadTeamId, setSelectedSquadTeamId] = useState<string>("");

  const currentTurnTeam = draftState?.currentTurnTeam;
  const myTeam = draftState?.teams?.find((t) => t.username === myUsername);
  const myRosterCount = myTeam?.rosterCount || 0;
  const maxRosterSize = draftState?.maxRosterSize || 15;

  const matchDetails = draftState?.matchDetails || {
    name: "India vs Australia",
    series: "T20 Super Series 2026",
    format: "T20",
    venue: "Wankhede Stadium, Mumbai",
    matchDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    lineupLockTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 30).toISOString(),
  };

  // Match Countdown Timer
  const [matchTimeRemaining, setMatchTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!matchDetails.matchDate) return;
    const updateCountdown = () => {
      const matchTime = new Date(matchDetails.matchDate!).getTime();
      const now = Date.now();
      const diffMs = matchTime - now;

      if (diffMs <= 0) {
        setMatchTimeRemaining("MATCH LIVE NOW 🔴");
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setMatchTimeRemaining(
        days > 0
          ? `${days}d ${hours}h ${minutes}m ${seconds}s`
          : `${hours}h ${minutes}m ${seconds}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [matchDetails.matchDate]);

  // Set default selected team for squad preview
  useEffect(() => {
    if (draftState?.teams && draftState.teams.length > 0 && !selectedSquadTeamId) {
      const defaultTeam = myTeam || draftState.teams[0];
      setSelectedSquadTeamId(defaultTeam.teamId);
    }
  }, [draftState?.teams, myTeam, selectedSquadTeamId]);

  if (isLoading) {
    return (
      <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Connecting to live Snake Draft Room...</p>
      </div>
    );
  }

  const myTeamPlayerIds = (myTeam?.playerIds || []).map((id: unknown) => {
    if (typeof id === "object" && id !== null) {
      const record = id as { _id?: { toString: () => string }; id?: { toString: () => string } };
      return record._id ? record._id.toString() : record.id ? record.id.toString() : "";
    }
    return String(id);
  });

  const handleSelectPlayer = (player: DraftPlayer) => {
    if (!isMyTurn) {
      toast.error(`It's currently @${currentTurnTeam?.username || "another manager"}'s turn to pick!`);
      return;
    }
    const isDraftedByMyTeam = myTeamPlayerIds.includes(player.id) || (player._id ? myTeamPlayerIds.includes(player._id) : false);
    if (isDraftedByMyTeam) {
      toast.error(`You have already drafted ${player.name} in a previous round!`);
      return;
    }
    const ownershipLimit = player.ownershipLimit || 5;
    const currentOwnership = player.currentOwnership || 0;
    if (currentOwnership >= ownershipLimit) {
      toast.error(`${player.name} has reached the maximum ownership limit of ${ownershipLimit} teams!`);
      return;
    }

    selectPlayer(player._id || player.id);
  };

  const filteredPlayers = (draftState?.availablePlayers || []).filter((p) => {
    const isDraftedByMyTeam = myTeamPlayerIds.includes(p.id) || (p._id ? myTeamPlayerIds.includes(p._id) : false);
    if (hideDraftedByMe && isDraftedByMyTeam) return false;

    const matchesPos = positionFilter === "ALL" || p.position === positionFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.realTeam.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPos && matchesSearch;
  });

  const selectedTeamData = (draftState?.teams || []).find((t) => t.teamId === selectedSquadTeamId) || myTeam || draftState?.teams?.[0];
  const selectedTeamPlayers = selectedTeamData?.players || [];

  return (
    <div className="space-y-6">
      {/* 1. Post-Draft Scheduled Match Banner (Shows when draft is complete) */}
      {isDraftComplete ? (
        <Card className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-secondary/30 p-6 shadow-none space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-green-500 text-white font-bold text-xs gap-1">
                  <CheckCircle2Icon className="size-3.5" /> Draft Completed
                </Badge>
                <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 font-bold text-xs">
                  {matchDetails.series || "Fantasy Match"}
                </Badge>
                <Badge variant="outline" className="text-xs uppercase font-mono border-border text-muted-foreground">
                  {matchDetails.format || "T20"}
                </Badge>
              </div>

              <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <span>{matchDetails.name}</span>
                <span className="text-xl" role="img" aria-label="cricket">🏏</span>
              </h2>

              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  <CalendarIcon className="size-3.5 text-primary" />
                  <span>{new Date(matchDetails.matchDate || "").toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="size-3.5 text-primary" />
                  <span>{matchDetails.venue}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <ClockIcon className="size-3.5" />
                  <span>Lineups lock 30m before match</span>
                </span>
              </div>
            </div>

            {/* Live Match Countdown Card */}
            <div className="flex flex-col sm:flex-row items-center gap-3 self-stretch lg:self-auto bg-card/80 p-4 rounded-xl border border-border">
              <div className="text-center sm:text-right space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Match Countdown
                </span>
                <span className="text-xl font-extrabold font-mono text-primary tracking-tight">
                  {matchTimeRemaining}
                </span>
              </div>

              <Link to="/Dashboard/MyTeam">
                <Button className="w-full sm:w-auto bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs gap-1.5 shadow-none cursor-pointer">
                  <span>Set Starting 11 Lineup</span>
                  <ArrowRightIcon className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        /* Live Turn Banner during active draft */
        <Card
          className={`rounded-xl border p-5 shadow-none transition-all ${
            isMyTurn
              ? "border-primary bg-primary/10 animate-pulse"
              : "border-border bg-card"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`size-12 rounded-xl border flex items-center justify-center font-bold shrink-0 ${
                  isMyTurn
                    ? "border-primary/40 bg-primary/20 text-primary"
                    : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                <ArrowLeftRightIcon className="size-6 text-primary" />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                    {isMyTurn
                      ? "YOUR TURN TO PICK!"
                      : `@${currentTurnTeam?.username || "Manager"}'s Turn to Pick`}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-bold ${
                      isMyTurn
                        ? "border-primary text-primary bg-primary/20"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    Pick #{draftState?.currentPick || 1}
                  </Badge>
                  {isConnected ? (
                    <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-400 bg-green-500/10 gap-1 font-semibold">
                      <RadioIcon className="size-2.5 animate-pulse" /> Live Socket
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400 bg-amber-500/10">
                      Connecting...
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {isMyTurn
                    ? "Select any eligible cricket star from the pool below to add to your 15-player roster."
                    : `Waiting for ${currentTurnTeam?.teamName || "opponent"} to make their pick.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Server Timer</span>
                <span
                  className={`text-xl font-extrabold font-mono ${
                    remainingSeconds <= 10 ? "text-rose-500 animate-pulse" : "text-primary"
                  }`}
                >
                  00:{remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 2. Draft Progress Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[10px] uppercase text-muted-foreground font-bold">Current Round</span>
          <p className="text-base font-extrabold text-foreground mt-0.5">
            Round {draftState?.currentRound || 1} / {maxRosterSize}
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[10px] uppercase text-muted-foreground font-bold">Overall Pick</span>
          <p className="text-base font-extrabold text-foreground mt-0.5">
            #{draftState?.currentPick || 1} / {draftState?.totalDraftPicks || 60}
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[10px] uppercase text-muted-foreground font-bold">My Squad Drafted</span>
          <p className="text-base font-extrabold text-primary mt-0.5">
            {myRosterCount} / {maxRosterSize} Players
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card">
          <span className="text-[10px] uppercase text-muted-foreground font-bold">Ownership Rule</span>
          <p className="text-base font-extrabold text-foreground mt-0.5">
            Max 5 Teams / Player
          </p>
        </div>
      </div>

      {/* 3. Main Draft Area (Player Pool + My Squad / Draft Board) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Available Match Player Pool (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Available Player Pool</span>
                <Badge variant="outline" className="text-[10px] border-border">
                  {filteredPlayers.length} Players
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                {isDraftComplete
                  ? "Final player ownership distribution for this match league."
                  : "Click Draft to add a player to your 15-player squad when it's your turn."}
              </p>
            </div>

            {/* Position & Squad Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setHideDraftedByMe(!hideDraftedByMe)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  hideDraftedByMe
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Hide My Players
              </button>

              <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border">
                {["ALL", "BAT", "BOWL", "AR", "WK"].map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setPositionFilter(pos)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      positionFilter === pos
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by player name or team (e.g. Virat, IND, Bumrah)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border text-xs h-9"
            />
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredPlayers.map((player) => {
              const pId = player._id || player.id;
              const ownershipLimit = player.ownershipLimit || 5;
              const currentOwnership = player.currentOwnership || 0;
              const isLocked = currentOwnership >= ownershipLimit;
              const isDraftedByMyTeam = myTeamPlayerIds.includes(player.id) || (player._id ? myTeamPlayerIds.includes(player._id) : false);

              return (
                <div
                  key={pId}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                    isDraftedByMyTeam
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : isLocked
                      ? "border-border/40 bg-secondary/10 opacity-50"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                        {player.realTeam}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-foreground leading-tight">{player.name}</h4>
                          {isDraftedByMyTeam && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-bold">
                              In Your Squad
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-semibold text-primary">{player.position}</span>
                          <span>•</span>
                          <span>₹{player.price} Cr</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${
                          isLocked
                            ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {currentOwnership}/{ownershipLimit} Teams
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground">
                      {isDraftedByMyTeam
                        ? "Selected by you in squad"
                        : isLocked
                        ? "Limit Reached (5/5 Teams)"
                        : `${ownershipLimit - currentOwnership} slots remaining`}
                    </span>

                    <Button
                      size="sm"
                      disabled={!isMyTurn || isLocked || isDraftComplete || isSelecting || isDraftedByMyTeam}
                      onClick={() => handleSelectPlayer(player)}
                      className={`h-7 px-3 text-xs font-bold shadow-none ${
                        isDraftedByMyTeam
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed opacity-80"
                          : isLocked
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-not-allowed opacity-60"
                          : isMyTurn && !isDraftComplete
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                          : "bg-secondary text-muted-foreground cursor-not-allowed opacity-50"
                      }`}
                    >
                      {isSelecting ? (
                        <>
                          <Loader2 className="size-3 animate-spin mr-1" /> Drafting
                        </>
                      ) : isDraftedByMyTeam ? (
                        <>
                          <CheckCircle2Icon className="size-3 mr-1 text-emerald-400" /> Drafted
                        </>
                      ) : isLocked ? (
                        <>
                          <LockIcon className="size-3 mr-1 text-rose-400" /> Limit Reached
                        </>
                      ) : isMyTurn ? (
                        <>
                          <SparklesIcon className="size-3 mr-1" /> Draft Player
                        </>
                      ) : (
                        "Waiting"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Draft Order & Roster Side Board (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <UsersIcon className="size-4 text-primary" />
              <span>Draft Order & Squads</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Snake format: Order reverses on even rounds.
            </p>
          </div>

          <div className="space-y-2.5">
            {(draftState?.teams || []).map((team: DraftTeam, index: number) => {
              const isCurrent = draftState?.currentTurnTeam?.teamId === team.teamId && !isDraftComplete;
              const isMe = team.username === myUsername;

              return (
                <div
                  key={team.teamId || index}
                  onClick={() => setSelectedSquadTeamId(team.teamId)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedSquadTeamId === team.teamId
                      ? "border-primary bg-primary/10 shadow-sm"
                      : isCurrent
                      ? "border-primary/50 bg-secondary/30"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-muted-foreground">
                      <span>#{team.draftSlot}</span>
                    </div>

                    <Avatar className="size-8 border border-border">
                      <AvatarImage src={team.avatarUrl || ""} alt={team.username} />
                      <AvatarFallback className="text-[10px] font-bold bg-primary/20 text-primary">
                        {(team.teamName || "T").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-foreground leading-tight">
                          {team.teamName}
                        </h4>
                        {isMe && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/40 text-primary">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">@{team.username || "Manager"}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {isCurrent ? (
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-bold gap-1 animate-pulse">
                        <CrownIcon className="size-3" /> Picking
                      </Badge>
                    ) : (
                      <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                        {team.rosterCount || 0} / {maxRosterSize}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Complete Teams Selected Squads Section */}
      <Card className="rounded-xl border border-border bg-card p-5 shadow-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-primary" />
              <span>Team Squad Preview: {selectedTeamData?.teamName || "Selected Team"}</span>
              <Badge variant="outline" className="text-xs font-mono border-primary/30 text-primary bg-primary/10">
                {selectedTeamPlayers.length} / {maxRosterSize} Players
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manager: <strong>@{selectedTeamData?.username || "Manager"}</strong> • Draft Slot #{selectedTeamData?.draftSlot || 1}
            </p>
          </div>

          {/* Team Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {(draftState?.teams || []).map((t) => (
              <button
                key={t.teamId}
                type="button"
                onClick={() => setSelectedSquadTeamId(t.teamId)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedSquadTeamId === t.teamId
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.teamName} {t.username === myUsername ? "(You)" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Squad Players Grid */}
        {selectedTeamPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {selectedTeamPlayers.map((p, idx) => (
              <div
                key={p.id || idx}
                className="p-3 rounded-xl border border-border bg-secondary/20 flex flex-col justify-between space-y-2 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-muted-foreground">#{idx + 1}</span>
                  <Badge variant="outline" className="text-[9px] font-bold border-primary/30 text-primary bg-primary/5">
                    {p.position}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-foreground leading-tight">{p.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.realTeam} • ₹{p.price} Cr</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground text-xs italic">
            No players have been drafted into this squad yet.
          </div>
        )}
      </Card>
    </div>
  );
}
