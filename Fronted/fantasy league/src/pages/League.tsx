import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeagueEventsTimeline, type LeagueEvent } from "@/components/dashboard/LeagueEventsTimeline";
import { DraftRoom } from "@/components/draft/DraftRoom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  TrophyIcon,
  ZapIcon,
  FlameIcon,
  ClockIcon,
  Share2Icon,
  PlusCircleIcon,
  Loader2,
  UsersIcon,
  SwordsIcon,
  ShieldAlertIcon,
  ArrowLeftRightIcon,
  PlayCircleIcon,
  SparklesIcon,
  CheckCircle2Icon,
  CalendarIcon,
  ShieldCheckIcon,
  EyeIcon,
  AlertTriangleIcon,
  Settings2Icon,
  RadioIcon,
  LockIcon,
} from "lucide-react";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useMyClubs } from "@/features/club/hooks/useClub";
import { useClubLeagues, useLeagueById, useLeagueLeaderboard, useCreateLeague, useJoinLeague } from "@/features/league/hooks/useLeague";
import { useDraftState, useStartDraft, useScheduleDraft } from "@/features/draft/hooks/useDraft";
import { useMyTeamInLeague, useTeamRoster } from "@/features/team/hooks/useTeam";
import { useClubStore } from "@/store/clubStore";
import { getDraftSocket } from "@/services/socket";
import { LineupModal, type LineupPlayer } from "@/components/lineup/LineupModal";
import { LiveMatchCenter } from "@/components/match/LiveMatchCenter";
import { LeagueSettingsModal } from "@/components/league/LeagueSettingsModal";
import { payWithRazorpay } from "@/utils/pay";
import { toast } from "sonner";

export default function League() {
  const navigate = useNavigate();
  const { leagueId: routeLeagueId } = useParams<{ leagueId?: string }>();
  const [searchParams] = useSearchParams();
  const targetLeagueId = routeLeagueId || searchParams.get("id") || "";

  const { data: user } = useMe();
  const { data: clubs } = useMyClubs();
  const { activeClub } = useClubStore();
  const username = user?.username || "Manager";

  const currentClubId = activeClub?._id || clubs?.[0]?._id || "";
  const { data: leagues, isLoading: isLoadingLeagues, refetch: refetchLeagues } = useClubLeagues(currentClubId);
  const { data: specificLeagueData, isLoading: isLoadingSpecific } = useLeagueById(targetLeagueId);

  const activeLeague = (targetLeagueId ? (leagues?.find((l: { _id: string }) => l._id === targetLeagueId) || specificLeagueData) : null) || leagues?.[0];
  const activeLeagueId = activeLeague?._id || "";

  const isMatchLiveOrCompleted =
    activeLeague?.matchState?.status === "Live" ||
    activeLeague?.matchState?.status === "Completed";

  const scheduledDraftTime =
    activeLeague?.draftState?.scheduledStartTime ||
    activeLeague?.settings?.draftDate;

  const isDraftScheduled =
    Boolean(scheduledDraftTime) &&
    new Date(scheduledDraftTime).getTime() > Date.now() &&
    activeLeague?.status !== "Draft" &&
    activeLeague?.status !== "Completed";

  const { data: leaderboardData, refetch: refetchLeaderboard } = useLeagueLeaderboard(activeLeagueId);
  const { data: myTeam, refetch: refetchMyTeam } = useMyTeamInLeague(activeLeagueId);
  const { data: draftState, refetch: refetchDraftState } = useDraftState(activeLeagueId);

  const startDraftMutation = useStartDraft();
  const scheduleDraftMutation = useScheduleDraft();

  const [createLeagueOpen, setCreateLeagueOpen] = useState(false);
  const [joinLeagueOpen, setJoinLeagueOpen] = useState(false);
  const [draftControlOpen, setDraftControlOpen] = useState(false);
  const [lineupModalOpen, setLineupModalOpen] = useState(false);
  const [leagueSettingsOpen, setLeagueSettingsOpen] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const { data: teamRosterData, refetch: refetchRoster } = useTeamRoster(myTeam?._id || "");

  const [teamNameInput, setTeamNameInput] = useState(`${username}'s Squad`);

  const [leagueName, setLeagueName] = useState("");
  const [season, setSeason] = useState("2026");
  const [entryFee, setEntryFee] = useState("0");
  const [draftType, setDraftType] = useState<"snake" | "linear" | "auction">("snake");

  const createLeagueMutation = useCreateLeague();
  const joinLeagueMutation = useJoinLeague();

  // Real-time socket listener to transition immediately when draft starts
  useEffect(() => {
    if (!activeLeagueId) return;
    const socket = getDraftSocket();
    socket.emit("draft:join", { leagueId: activeLeagueId });

    const handleDraftStarted = () => {
      refetchLeagues();
      refetchDraftState();
    };

    socket.on("draft:turn-started", handleDraftStarted);
    socket.on("draft:state", handleDraftStarted);

    return () => {
      socket.off("draft:turn-started", handleDraftStarted);
      socket.off("draft:state", handleDraftStarted);
    };
  }, [activeLeagueId, refetchLeagues, refetchDraftState]);

  // Scheduled Draft Countdown
  const scheduledStartTime = draftState?.scheduledStartTime || activeLeague?.draftState?.scheduledStartTime || activeLeague?.settings?.draftDate;
  const [draftCountdown, setDraftCountdown] = useState<string>("");

  useEffect(() => {
    if (!scheduledStartTime) {
      setDraftCountdown("");
      return;
    }

    const updateCountdown = () => {
      const targetTime = new Date(scheduledStartTime).getTime();
      const now = Date.now();
      const diffMs = targetTime - now;

      if (diffMs <= 0) {
        setDraftCountdown("DRAFT STARTING NOW 🔴");
        refetchLeagues();
        refetchDraftState();
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const formatted =
        days > 0
          ? `${days}d ${hours < 10 ? "0" + hours : hours}h ${minutes < 10 ? "0" + minutes : minutes}m ${seconds < 10 ? "0" + seconds : seconds}s`
          : `${hours < 10 ? "0" + hours : hours}h ${minutes < 10 ? "0" + minutes : minutes}m ${seconds < 10 ? "0" + seconds : seconds}s`;

      setDraftCountdown(formatted);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [scheduledStartTime, refetchLeagues, refetchDraftState]);

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim()) {
      toast.error("Please enter a league name");
      return;
    }

    if (!currentClubId) {
      toast.error("Please create or join a Club before creating a League.");
      return;
    }

    try {
      const res = await createLeagueMutation.mutateAsync({
        clubId: currentClubId,
        name: leagueName.trim(),
        season: season.trim(),
        entryFee: Number(entryFee) || 0,
        settings: {
          draftType,
          rosterSize: 15,
          lineupSize: 11,
          maxTeams: 10,
        },
      });
      toast.success("Fantasy League created successfully!");
      setLeagueName("");
      setCreateLeagueOpen(false);
      await refetchLeagues();

      const newLeagueId = res?.data?._id || res?._id;
      if (newLeagueId) {
        navigate(`/Dashboard/League/${newLeagueId}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create league");
    }
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreatedOrUpcoming) {
      toast.error(`Registration is closed for this league (${leagueStatus}). You can only join leagues during the initial Created / Upcoming state.`);
      setJoinLeagueOpen(false);
      return;
    }

    const effectiveTeamName = `${username}'s Squad`;
    const fee = activeLeague?.entryFee || 0;

    const executeJoin = async () => {
      try {
        await joinLeagueMutation.mutateAsync({
          leagueId: activeLeagueId,
          payload: { teamName: effectiveTeamName },
        });
        toast.success(`Joined ${activeLeague?.name} as ${effectiveTeamName}!`);
        setJoinLeagueOpen(false);
        await refetchLeagues();
        refetchMyTeam();
        refetchLeaderboard();
        refetchDraftState();
        navigate(`/Dashboard/League/${activeLeagueId}`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to join league");
      } finally {
        setIsPaying(false);
      }
    };

    if (fee > 0) {
      setIsPaying(true);
      await payWithRazorpay(
        fee,
        () => {
          executeJoin();
        },
        () => {
          setIsPaying(false);
        }
      );
    } else {
      await executeJoin();
    }
  };

  // Derive league metadata
  const currentLeagueName = activeLeague?.name || leaderboardData?.league?.name || "Match Fantasy League";
  const currentSeason = activeLeague?.season || leaderboardData?.league?.season || "2026";
  const leagueStatus = draftState?.leagueStatus || activeLeague?.status || leaderboardData?.league?.status || "Created";
  const isCreatedOrUpcoming = leagueStatus === "Created" || leagueStatus === "Upcoming";
  const isDrafting = leagueStatus === "Draft";
  const isActive = leagueStatus === "Active";

  const joinedTeamsList = draftState?.teams && draftState.teams.length > 0
    ? draftState.teams
    : leaderboardData?.standings?.map((s: { teamName?: string; name?: string; owner?: string; username?: string }, i: number) => ({
        teamId: `t_${i}`,
        teamName: s.teamName || s.name || "Squad",
        username: s.owner || s.username || "Manager",
        draftSlot: i + 1,
        rosterCount: 0,
        playerIds: [],
        isCurrentTurn: false,
      })) || [];

  const totalTeams = joinedTeamsList.length || activeLeague?.teamCount || 1;
  const maxTeams = activeLeague?.settings?.maxTeams || 10;
  const matchDetails = activeLeague?.matchDetails || draftState?.matchDetails || {
    name: activeLeague?.name || "Cricket Match",
    series: "T20 Super Series 2026",
    format: "T20",
    venue: "Main Stadium",
    matchDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    lineupLockTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 30).toISOString(),
  };

  // Check if current user is admin/owner of club
  const isClubAdmin =
    user?.role === "admin" ||
    activeClub?.userRole?.toLowerCase() === "admin" ||
    activeClub?.userRole?.toLowerCase() === "owner";
  const hasJoinedLeague = !!myTeam || activeLeague?.hasJoined || joinedTeamsList.some((t: { username?: string }) => t.username === username);

  // Fallback scout player pool
  const scoutPlayers = draftState?.availablePlayers && draftState.availablePlayers.length > 0
    ? draftState.availablePlayers
    : activeLeague?.matchPlayerPool && activeLeague.matchPlayerPool.length > 0
    ? activeLeague.matchPlayerPool
    : [
        { id: "p1", name: "Virat Kohli", realTeam: "IND", position: "BAT", price: 12.0, ownershipLimit: 5, currentOwnership: 0 },
        { id: "p2", name: "Jasprit Bumrah", realTeam: "IND", position: "BOWL", price: 12.0, ownershipLimit: 5, currentOwnership: 0 },
        { id: "p3", name: "Rohit Sharma", realTeam: "IND", position: "BAT", price: 11.5, ownershipLimit: 5, currentOwnership: 0 },
        { id: "p4", name: "Steve Smith", realTeam: "AUS", position: "BAT", price: 11.0, ownershipLimit: 5, currentOwnership: 0 },
        { id: "p5", name: "Pat Cummins", realTeam: "AUS", position: "BOWL", price: 11.5, ownershipLimit: 5, currentOwnership: 0 },
        { id: "p6", name: "Hardik Pandya", realTeam: "IND", position: "AR", price: 11.0, ownershipLimit: 5, currentOwnership: 0 },
        { id: "p7", name: "Glenn Maxwell", realTeam: "AUS", position: "AR", price: 11.0, ownershipLimit: 5, currentOwnership: 0 },
        { id: "p8", name: "Mitchell Starc", realTeam: "AUS", position: "BOWL", price: 11.0, ownershipLimit: 5, currentOwnership: 0 },
        { id: "p9", name: "Rishabh Pant", realTeam: "IND", position: "WK", price: 10.5, ownershipLimit: 5, currentOwnership: 0 },
        { id: "p10", name: "Travis Head", realTeam: "AUS", position: "BAT", price: 11.5, ownershipLimit: 5, currentOwnership: 0 },
        { id: "p11", name: "Ravindra Jadeja", realTeam: "IND", position: "AR", price: 10.5, ownershipLimit: 5, currentOwnership: 0 },
        { id: "p12", name: "Josh Hazlewood", realTeam: "AUS", position: "BOWL", price: 10.5, ownershipLimit: 5, currentOwnership: 0 },
      ];

  const minRequiredTeams = activeLeague?.settings?.minTeams || 2;

  // Draft Start Handler with Validation
  const handleStartDraftNow = async () => {
    if (!activeLeagueId) return;

    if (isDraftScheduled) {
      toast.error(`Draft is locked to its scheduled time (${new Date(scheduledDraftTime).toLocaleString()}) and cannot be started manually.`);
      return;
    }

    if (totalTeams < minRequiredTeams) {
      toast.error(`Cannot start draft: At least ${minRequiredTeams} teams are required (currently ${totalTeams} team joined). Invite more members to proceed.`);
      return;
    }

    try {
      await startDraftMutation.mutateAsync(activeLeagueId);
      toast.success("Draft Room opened! Snake Draft is now live.");
      setDraftControlOpen(false);
      refetchLeagues();
      refetchDraftState();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start draft");
    }
  };

  // Draft Schedule Handler
  const handleScheduleDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDraftScheduled) {
      toast.error("Draft schedule is already set and locked. It cannot be modified once scheduled.");
      return;
    }

    if (!scheduledDateTime) {
      toast.error("Please pick a scheduled start date and time");
      return;
    }

    if (totalTeams < minRequiredTeams) {
      toast.error(`Cannot schedule draft: At least ${minRequiredTeams} teams are required (currently ${totalTeams} team joined).`);
      return;
    }

    try {
      await scheduleDraftMutation.mutateAsync({
        leagueId: activeLeagueId,
        scheduledStartTime: new Date(scheduledDateTime).toISOString(),
      });
      toast.success("Draft successfully scheduled and locked!");
      setDraftControlOpen(false);
      refetchLeagues();
      refetchDraftState();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule draft");
    }
  };

  // Dynamic upcoming league events
  const dynamicEvents: LeagueEvent[] = [
    {
      id: "e1",
      leagueName: currentLeagueName,
      title: "Lineup Lock Window",
      date: "Matchday Live",
      time: "30 mins before match",
      statusBadge: "Active",
      badgeVariant: "amber",
      icon: ShieldAlertIcon,
    },
    {
      id: "e2",
      leagueName: currentLeagueName,
      title: `${matchDetails.name} (${matchDetails.format})`,
      date: "Match Starts",
      time: "7:30 PM IST",
      statusBadge: "Upcoming",
      badgeVariant: "green",
      icon: SwordsIcon,
    },
    {
      id: "e3",
      leagueName: currentLeagueName,
      title: "Snake Draft Window",
      date: draftState?.scheduledStartTime ? new Date(draftState.scheduledStartTime).toLocaleDateString() : "Pre-Match",
      time: draftState?.scheduledStartTime ? new Date(draftState.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Scheduled by Admin",
      statusBadge: isDrafting ? "Live Now" : "Pending",
      badgeVariant: isDrafting ? "green" : "muted",
      icon: ArrowLeftRightIcon,
    },
    {
      id: "e4",
      leagueName: currentLeagueName,
      title: "Live Fantasy Scoring & Standings",
      date: "Match Progress",
      time: "Real-Time Updates",
      statusBadge: "Automated",
      badgeVariant: "muted",
      icon: ClockIcon,
    },
  ];

  if (isLoadingLeagues) {
    return (
      <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Loading league details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. League Header */}
      <div className="flex flex-col gap-3 pb-4 border-b border-border md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl flex items-center gap-2">
              <span>{currentLeagueName}</span>
              <span className="text-2xl" role="img" aria-label="cricket">🏏</span>
            </h1>
            <Badge
              variant="outline"
              className={`font-bold px-2.5 py-0.5 text-xs uppercase tracking-wider ${
                isCreatedOrUpcoming
                  ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                  : isDrafting
                  ? "border-purple-500/40 text-purple-400 bg-purple-500/10 animate-pulse"
                  : "border-green-500/40 text-green-400 bg-green-500/10"
              }`}
            >
              {leagueStatus}
            </Badge>
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 font-semibold text-xs">
              {currentSeason}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span>Match: <strong className="text-foreground">{matchDetails.name}</strong> ({matchDetails.format})</span>
            <span>•</span>
            <span>{matchDetails.venue}</span>
            <span>•</span>
            <span>Manager: <strong className="text-foreground">@{username}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* League Switcher if club has multiple leagues */}
          {leagues && leagues.length > 1 && (
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1">
              <TrophyIcon className="size-3.5 text-primary shrink-0" />
              <select
                value={activeLeagueId}
                onChange={(e) => navigate(`/Dashboard/League/${e.target.value}`)}
                className="bg-transparent text-foreground text-xs font-bold focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                {leagues.map((l: { _id: string; name: string }) => (
                  <option key={l._id} value={l._id} className="bg-card text-foreground">
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Join League Sheet only if not joined yet and league is in Created / Upcoming state */}
          {!hasJoinedLeague && isCreatedOrUpcoming && (
            <Sheet open={joinLeagueOpen} onOpenChange={setJoinLeagueOpen}>
              <SheetTrigger
                render={
                  <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground text-xs hover:bg-primary/90 cursor-pointer font-bold shadow-none">
                    <SparklesIcon className="size-3.5" />
                    <span>Join League</span>
                  </Button>
                }
              />
              <SheetContent side="right" className="bg-card border-l border-border p-6 flex flex-col justify-between w-full sm:max-w-md">
                <SheetHeader className="p-0 space-y-1.5">
                  <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <TrophyIcon className="size-5 text-primary" />
                    Join {currentLeagueName}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    Create your fantasy team to participate in the snake draft. Rule: 1 Team per manager per league.
                  </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleJoinLeague} className="space-y-4 my-auto">
                  <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Manager</span>
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500 inline-block"></span>
                        @{username}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground font-medium">Fantasy Team</span>
                      <span className="text-xs font-extrabold text-primary">{username}'s Squad</span>
                    </div>
                  </div>

                  {activeLeague?.entryFee && activeLeague.entryFee > 0 ? (
                    <div className="p-3.5 rounded-xl border border-primary/40 bg-primary/10 flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Required Entry Fee:</span>
                      <span className="text-base font-extrabold text-primary font-mono">₹{activeLeague.entryFee}</span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 text-xs flex items-center gap-1.5 font-bold">
                      <SparklesIcon className="size-3.5" /> Free League Entry
                    </div>
                  )}

                  <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-1 text-xs">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <SparklesIcon className="size-3.5 text-primary" /> Ready for Draft
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Once joined, you will enter the Snake Draft room when scheduled by the club admin.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={joinLeagueMutation.isPending || isPaying}
                    className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-10 mt-2 cursor-pointer shadow-none gap-2"
                  >
                    {isPaying || joinLeagueMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>{isPaying ? "Opening Payment..." : "Joining League..."}</span>
                      </>
                    ) : activeLeague?.entryFee && activeLeague.entryFee > 0 ? (
                      `Pay ₹${activeLeague.entryFee} & Join League`
                    ) : (
                      "Confirm & Join League (Free)"
                    )}
                  </Button>
                </form>

                <SheetFooter className="p-0 pt-4 border-t border-border flex flex-row items-center justify-between">
                  <SheetClose render={<Button variant="ghost" size="sm" className="text-xs">Cancel</Button>} />
                  <span className="text-[11px] text-muted-foreground">1 Team / League</span>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}

          {/* Admin Draft Options: Start Now OR Schedule Draft */}
          {isClubAdmin && isCreatedOrUpcoming && (
            <Sheet open={draftControlOpen} onOpenChange={setDraftControlOpen}>
              <SheetTrigger
                render={
                  isDraftScheduled ? (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-secondary text-foreground border border-purple-500/40 font-bold hover:bg-secondary/80 text-xs shadow-none cursor-pointer"
                    >
                      <LockIcon className="size-3.5 text-purple-400" />
                      <span>Draft Scheduled (Locked)</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:opacity-90 text-xs shadow-none cursor-pointer"
                    >
                      <PlayCircleIcon className="size-3.5" />
                      <span>Start / Schedule Draft</span>
                    </Button>
                  )
                }
              />
              <SheetContent side="right" className="bg-card border-l border-border p-6 flex flex-col justify-between w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="p-0 space-y-1.5">
                  <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Settings2Icon className="size-5 text-primary" />
                    Draft Control Center
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    {isDraftScheduled
                      ? "The draft time is locked and will start automatically when the countdown arrives."
                      : "Launch the live Snake Draft immediately or schedule a countdown for participants."}
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 my-auto">
                  {isDraftScheduled ? (
                    <div className="p-4 rounded-xl border border-purple-500/40 bg-purple-500/10 space-y-3">
                      <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                        <LockIcon className="size-4 text-purple-400" />
                        <span>Draft Schedule is Locked</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The Snake Draft has been locked and officially scheduled to start at:
                      </p>
                      <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-200 font-mono font-bold text-xs flex items-center gap-2">
                        <CalendarIcon className="size-4 text-purple-400" />
                        <span>{new Date(scheduledDraftTime).toLocaleString()}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-background/60 border border-border text-[11px] text-muted-foreground space-y-1.5">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <ClockIcon className="size-3.5 text-primary" /> Automatic Start Enforced
                        </div>
                        <p>
                          Once a draft time is scheduled, it cannot be modified, rescheduled, or started manually before the appointed time. The draft room will open automatically at the exact scheduled countdown.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Validation Notice if < minRequiredTeams */}
                      {totalTeams < (activeLeague?.settings?.minTeams || 2) ? (
                        <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <AlertTriangleIcon className="size-4 text-amber-400" />
                            Minimum {activeLeague?.settings?.minTeams || 2} Teams Required
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Currently only <strong>{totalTeams} team(s)</strong> registered. Minimum <strong>{activeLeague?.settings?.minTeams || 2} teams</strong> required to launch or schedule the draft.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl border border-green-500/40 bg-green-500/10 text-green-300 text-xs flex items-center gap-2">
                          <CheckCircle2Icon className="size-4 text-green-400 shrink-0" />
                          <span>Ready to draft! <strong>{totalTeams} teams</strong> registered.</span>
                        </div>
                      )}

                      {/* Option 1: Start Immediately */}
                      <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <PlayCircleIcon className="size-4 text-primary" /> Option 1: Start Draft Immediately
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            Opens the Snake Draft room right now with 30s pick timers for each turn.
                          </p>
                        </div>

                        <Button
                          onClick={handleStartDraftNow}
                          disabled={totalTeams < (activeLeague?.settings?.minTeams || 2) || startDraftMutation.isPending}
                          className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs h-9 cursor-pointer shadow-none"
                        >
                          {startDraftMutation.isPending ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin mr-1.5" />
                              Starting Draft...
                            </>
                          ) : (
                            "Launch Draft Now"
                          )}
                        </Button>
                      </div>

                      {/* Option 2: Schedule Draft */}
                      <form onSubmit={handleScheduleDraftSubmit} className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <CalendarIcon className="size-4 text-primary" /> Option 2: Schedule for Later
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            Set a scheduled date & time for draft countdown.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="schedule-time" className="text-xs font-semibold text-foreground">
                            Draft Start Date & Time
                          </Label>
                          <Input
                            id="schedule-time"
                            type="datetime-local"
                            value={scheduledDateTime}
                            onChange={(e) => setScheduledDateTime(e.target.value)}
                            className="bg-background border-border text-foreground text-xs"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={totalTeams < (activeLeague?.settings?.minTeams || 2) || scheduleDraftMutation.isPending}
                          variant="outline"
                          className="w-full text-xs font-bold h-9 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
                        >
                          {scheduleDraftMutation.isPending ? "Scheduling..." : "Save Scheduled Time"}
                        </Button>
                      </form>
                    </>
                  )}
                </div>

                <SheetFooter className="p-0 pt-4 border-t border-border flex flex-row items-center justify-between">
                  <SheetClose render={<Button variant="ghost" size="sm" className="text-xs">Close</Button>} />
                  <span className="text-[11px] text-muted-foreground">Snake Draft Format</span>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}

          {/* Active League Starting 11 Lineup Button (only before match starts) */}
          {!isCreatedOrUpcoming && !isDrafting && hasJoinedLeague && !isMatchLiveOrCompleted && (
            <Button
              size="sm"
              onClick={() => setLineupModalOpen(true)}
              className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:opacity-90 text-xs shadow-none cursor-pointer"
            >
              <ShieldCheckIcon className="size-3.5" />
              <span>Set Starting 11</span>
            </Button>
          )}

          {/* League Settings (Admin Only) */}
          {isClubAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLeagueSettingsOpen(true)}
              className="gap-1.5 text-xs border-border hover:bg-secondary cursor-pointer"
              title="Configure League Settings & Minimum Teams"
            >
              <Settings2Icon className="size-3.5 text-muted-foreground" />
              <span>Settings</span>
            </Button>
          )}

          {/* View All Leagues button */}
          <Link to="/Dashboard/AllLeagues">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border hover:bg-secondary cursor-pointer">
              <EyeIcon className="size-3.5 text-muted-foreground" />
              <span>All Leagues</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success("League link copied to clipboard!");
            }}
            className="gap-2 border-border text-foreground hover:bg-secondary cursor-pointer"
          >
            <Share2Icon className="size-3.5 text-muted-foreground" />
            Share
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NON-ENROLLED USER IN STARTED / DRAFT / ACTIVE / COMPLETED LEAGUE          */}
      {/* ========================================================================= */}
      {!isCreatedOrUpcoming && !hasJoinedLeague && !isClubAdmin && (
        <Card className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center max-w-xl mx-auto shadow-none space-y-5 my-8">
          <div className="size-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <LockIcon className="size-8" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs font-bold uppercase">
                {isDrafting ? "Draft In Progress" : isActive ? "Match Live" : "Registration Closed"}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Registration Closed for this League
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              You are not enrolled in <strong>{currentLeagueName}</strong>. This league has already progressed past the registration phase. Teams can only join during the initial <strong>Created / Upcoming</strong> stage before the Snake Draft begins.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/Dashboard/AllLeagues" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs gap-2 h-9 shadow-none cursor-pointer">
                <TrophyIcon className="size-4" />
                <span>Browse Available Leagues</span>
              </Button>
            </Link>
            <Link to="/Dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto text-xs font-semibold border-border hover:bg-secondary h-9 cursor-pointer">
                <span>Back to Dashboard</span>
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 1. DRAFT STATE: LIVE SNAKE DRAFT ROOM                                    */}
      {/* ========================================================================= */}
      {isDrafting && (hasJoinedLeague || isClubAdmin) && (
        <DraftRoom
          leagueId={activeLeagueId}
          myUsername={username}
          onDraftComplete={() => {
            refetchLeagues();
            refetchDraftState();
            navigate("/Dashboard/MyTeam");
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. CREATED / UPCOMING STATE: PRE-DRAFT LOBBY & SCOUT BOARD               */}
      {/* ========================================================================= */}
      {isCreatedOrUpcoming && (
        <>
          {/* Scheduled Draft Live Countdown Banner */}
          {scheduledStartTime && draftCountdown && (
            <Card className="rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-primary/10 p-5 shadow-none space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <CalendarIcon className="size-6 animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-foreground tracking-tight">
                        Snake Draft Scheduled
                      </h3>
                      <Badge variant="outline" className="border-purple-500/40 text-purple-400 bg-purple-500/10 text-[10px] font-bold uppercase">
                        Countdown Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scheduled for <strong>{new Date(scheduledStartTime).toLocaleString()}</strong>. The draft will launch automatically for all participants.
                    </p>
                  </div>
                </div>

                <div className="bg-card/90 border border-border px-4 py-2.5 rounded-xl text-center sm:text-right shrink-0">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Draft Starts In
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold font-mono text-primary tracking-tight">
                    {draftCountdown}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Pre-Draft Lobby Alert Banner */}
          <Card className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-none space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <ClockIcon className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-foreground">
                    Pre-Draft Lobby — Waiting for Draft
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {hasJoinedLeague
                      ? `You are registered as ${myTeam?.name || username + "'s Squad"}. The snake draft will begin once launched by the admin or when scheduled countdown expires.`
                      : `Join now with your fantasy team to participate in the 15-player snake draft for ${matchDetails.name}.`}
                  </p>
                  {scheduledStartTime && (
                    <p className="text-xs font-semibold text-primary mt-1 flex items-center gap-1">
                      <CalendarIcon className="size-3.5" />
                      <span>Scheduled Draft: {new Date(scheduledStartTime).toLocaleString()}</span>
                    </p>
                  )}
                </div>
              </div>

              {hasJoinedLeague ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-green-500/40 text-green-400 bg-green-500/10 text-xs font-bold gap-1">
                    <CheckCircle2Icon className="size-3.5" /> Registered ({myTeam?.name || "My Team"})
                  </Badge>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setJoinLeagueOpen(true)}
                  className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs cursor-pointer shadow-none"
                >
                  Join League Now
                </Button>
              )}
            </div>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Teams Joined"
              value={`${totalTeams} / ${maxTeams}`}
              change={totalTeams < minRequiredTeams ? `Needs min ${minRequiredTeams} teams` : "Ready for draft"}
              isPositive={totalTeams >= minRequiredTeams}
              subtitle={`Capacity: ${maxTeams} Teams`}
              icon={UsersIcon}
            />
            <StatCard
              title="Draft Format"
              value="Snake Draft"
              change="15 Picks / Team"
              isPositive={true}
              subtitle="Reversing Pick Order"
              icon={ArrowLeftRightIcon}
            />
            <StatCard
              title="Eligible Players"
              value={`${scoutPlayers.length} Players`}
              change="Max 5 Teams / Player"
              isPositive={true}
              subtitle="Limited Ownership Pool"
              icon={SparklesIcon}
            />
            <StatCard
              title="Lineup Lock"
              value="30 mins"
              change="Before Match"
              isPositive={false}
              subtitle="Locks automatically"
              icon={ClockIcon}
            />
          </div>

          {/* Scout Board & Joined Teams */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Scout Board */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span>Match Eligible Player Pool ({scoutPlayers.length})</span>
                  <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                    {matchDetails.name}
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Scout eligible cricket stars before the Snake Draft begins. Maximum 5 teams can own any player.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {scoutPlayers.map((player: { id?: string; _id?: string; name: string; position: string; realTeam: string; price: number; ownershipLimit?: number; currentOwnership?: number }) => (
                  <div
                    key={player._id || player.id}
                    className="p-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                        {player.realTeam}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-tight">{player.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-semibold text-primary">{player.position}</span>
                          <span>•</span>
                          <span>{player.realTeam}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                        {player.currentOwnership || 0}/{player.ownershipLimit || 5} Owned
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">₹{player.price} Cr</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Joined Teams & Timeline */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="rounded-xl border border-border bg-card shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <UsersIcon className="size-4 text-primary" />
                    Joined Fantasy Teams ({totalTeams})
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Managers participating in the upcoming Snake Draft
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-2.5">
                  {joinedTeamsList.map((team: { rank?: number; draftSlot?: number; teamName?: string; name?: string; owner?: string; username?: string }, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-muted-foreground text-[11px]">#{team.draftSlot || idx + 1}</span>
                        <Avatar className="size-6 border border-border">
                          <AvatarFallback className="text-[9px] font-bold bg-primary/20 text-primary">
                            {(team.teamName || team.name || "T").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground leading-tight">{team.teamName || team.name || "Manager Squad"}</p>
                          <p className="text-[10px] text-muted-foreground">@{team.owner || team.username || username}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                        Draft Slot #{team.draftSlot || idx + 1}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <LeagueEventsTimeline events={dynamicEvents} />
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. ACTIVE / COMPLETED STATE: LIVE MATCH SIMULATION & LEADERBOARD         */}
      {/* ========================================================================= */}
      {!isCreatedOrUpcoming && !isDrafting && (hasJoinedLeague || isClubAdmin) && (
        <div className="space-y-6">
          <LiveMatchCenter
            leagueId={activeLeagueId}
            myUsername={username}
            isClubAdmin={isClubAdmin}
          />
        </div>
      )}

      {/* Lineup Modal */}
      {hasJoinedLeague && (
        <LineupModal
          open={lineupModalOpen}
          onOpenChange={setLineupModalOpen}
          teamId={myTeam?._id || ""}
          leagueId={activeLeagueId}
          isMatchStarted={isMatchLiveOrCompleted}
          draftedPlayers={
            (((draftState?.teams?.find((t: { teamId: string; username: string }) => t.username === username || (myTeam && t.teamId === myTeam._id)) as unknown as { players?: LineupPlayer[] })?.players || []).length > 0
              ? ((draftState?.teams?.find((t: { teamId: string; username: string }) => t.username === username || (myTeam && t.teamId === myTeam._id)) as unknown as { players?: LineupPlayer[] })?.players || [])
              : (teamRosterData?.playerIds || scoutPlayers)
            ).slice(0, 15)
          }
          onSuccess={() => {
            refetchMyTeam();
            refetchRoster();
            refetchLeagues();
          }}
        />
      )}

      {/* League Settings Modal */}
      {activeLeague && (
        <LeagueSettingsModal
          open={leagueSettingsOpen}
          onOpenChange={setLeagueSettingsOpen}
          league={activeLeague}
          onSuccess={() => {
            refetchLeagues();
            refetchDraftState();
          }}
        />
      )}
    </div>
  );
}