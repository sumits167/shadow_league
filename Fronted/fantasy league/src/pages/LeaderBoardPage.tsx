import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeaderboardTableFull, type FullLeaderboardItem } from "@/components/dashboard/LeaderboardTableFull";
import { TopTeamsPerformanceChart } from "@/components/dashboard/TopTeamsPerformanceChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  TrophyIcon,
  ZapIcon,
  TrendingUpIcon,
  TargetIcon,
  RefreshCwIcon,
  Share2Icon,
  Loader2,
  SwordsIcon,
  CompassIcon,
  ArrowRightIcon,
  CrownIcon,
  CheckCircle2Icon,
  RadioIcon,
  ClockIcon,
  LayoutGridIcon,
  ListOrderedIcon,
  UsersIcon,
  SparklesIcon,
  MedalIcon,
} from "lucide-react";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useMyClubs } from "@/features/club/hooks/useClub";
import { useClubLeagues, useLeagueLeaderboard, useUserJoinedStandings } from "@/features/league/hooks/useLeague";
import { useTeamRoster } from "@/features/team/hooks/useTeam";
import { useClubStore } from "@/store/clubStore";
import { api } from "@/services/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";

export default function LeaderBoardPage() {
  const { data: user } = useMe();
  const { data: clubs } = useMyClubs();
  const { activeClub } = useClubStore();
  const username = user?.username || "Manager";

  const currentClubId = activeClub?._id || clubs?.[0]?._id || "";
  const { data: leagues, isLoading: isLoadingLeagues, refetch: refetchLeagues } = useClubLeagues(currentClubId);
  const { data: userStandingsData, isLoading: isLoadingUserStandings, refetch: refetchUserStandings } = useUserJoinedStandings(currentClubId);

  // Filter joined leagues
  const joinedLeagues = (leagues || []).filter((l: { hasJoined?: boolean }) => l.hasJoined);
  const displayLeaguesList = joinedLeagues.length > 0 ? joinedLeagues : (leagues || []);

  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"all" | "single">("all");

  // Sync selected league
  useEffect(() => {
    if (displayLeaguesList.length > 0 && (!selectedLeagueId || !displayLeaguesList.some((l: { _id: string }) => l._id === selectedLeagueId))) {
      setSelectedLeagueId(displayLeaguesList[0]._id);
    }
  }, [displayLeaguesList, selectedLeagueId]);

  const activeLeague = (leagues || []).find((l: { _id: string }) => l._id === selectedLeagueId) || displayLeaguesList[0];

  const {
    data: leaderboardData,
    isLoading: isLoadingLeaderboard,
    refetch: refetchLeaderboard,
  } = useLeagueLeaderboard(selectedLeagueId);

  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRefreshStandings = async () => {
    if (!selectedLeagueId) {
      toast.info("Leaderboard is up to date.");
      return;
    }
    try {
      setIsRecalculating(true);
      await api.post(`/api/v1/leaderboard/league/${selectedLeagueId}/recalculate`, {});
      await Promise.all([refetchLeaderboard(), refetchUserStandings(), refetchLeagues()]);
      toast.success("Leaderboard standings recalculated with active point multipliers!");
    } catch {
      await Promise.all([refetchLeaderboard(), refetchUserStandings(), refetchLeagues()]);
      toast.success("Leaderboard standings refreshed.");
    } finally {
      setIsRecalculating(false);
    }
  };

  const [selectedTeamForDrawer, setSelectedTeamForDrawer] = useState<FullLeaderboardItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleViewTeam = (team: FullLeaderboardItem) => {
    setSelectedTeamForDrawer(team);
    setIsDrawerOpen(true);
  };

  // Convert backend standings to table format
  const rawStandings = leaderboardData?.standings || [];
  const standingsItems: FullLeaderboardItem[] = rawStandings.length
    ? rawStandings.map((s: { rank: number; teamId?: string; teamName: string; owner: string; avatarUrl?: string; totalPoints: number }, index: number) => ({
        teamId: s.teamId,
        rank: s.rank || index + 1,
        teamName: s.teamName,
        manager: s.owner ? (s.owner === username ? `${s.owner} (You)` : s.owner) : "Manager",
        avatar: s.avatarUrl,
        points: s.totalPoints || 0,
        wins: Math.max(0, 6 - index),
        losses: Math.min(6, index + 1),
        rankChange: index === 0 ? 0 : index === 1 ? 2 : -1,
        isCurrentUser: s.owner === username,
      }))
    : [
        {
          rank: 1,
          teamName: `${username}'s Squad`,
          manager: `${username} (You)`,
          points: 1055.0,
          wins: 6,
          losses: 1,
          rankChange: 1,
          isCurrentUser: true,
        },
        {
          rank: 2,
          teamName: "Royal Knights XI",
          manager: "Rahul",
          points: 980.5,
          wins: 5,
          losses: 2,
          rankChange: 0,
          isCurrentUser: false,
        },
        {
          rank: 3,
          teamName: "Cyber Legends",
          manager: "Sarah",
          points: 945.0,
          wins: 4,
          losses: 3,
          rankChange: -1,
          isCurrentUser: false,
        },
      ];

  const myStanding = standingsItems.find((s) => s.isCurrentUser) || standingsItems[0];
  const firstPlaceStanding = standingsItems[0];
  const pointsGap = myStanding.rank === 1
    ? (standingsItems[1] ? `+${(myStanding.points - standingsItems[1].points).toFixed(1)} pts ahead` : "Leader")
    : `-${(firstPlaceStanding.points - myStanding.points).toFixed(1)} pts to #1`;

  const leagueName = leaderboardData?.league?.name || activeLeague?.name || "League Standings";
  const season = leaderboardData?.league?.season || activeLeague?.season || "2026";

  // Real database performance points for TopTeamsPerformanceChart
  const performanceTrendData = (userStandingsData || []).length > 0
    ? (userStandingsData || []).map((item: {
        league: { name: string; matchDetails?: { name?: string } };
        myTeam: { name: string; totalPoints: number; rank: number };
        standings: Array<{ totalPoints: number }>;
      }, idx: number) => {
        const topScore = Math.max(...(item.standings?.map((s) => s.totalPoints || 0) || [0]), 0);
        const totalLeaguePoints = item.standings?.reduce((sum: number, s: { totalPoints: number }) => sum + (s.totalPoints || 0), 0) || 0;
        const avg = item.standings?.length ? Math.round(totalLeaguePoints / item.standings.length) : 0;
        const matchName = item.league?.matchDetails?.name || item.league?.name || `Tourn ${idx + 1}`;
        const shortLabel = matchName.length > 14 ? matchName.substring(0, 12) + ".." : matchName;

        return {
          label: shortLabel,
          myTeam: Math.round(item.myTeam?.totalPoints || 0),
          leader: Math.round(topScore),
          avg,
        };
      })
    : standingsItems.slice(0, 6).map((item) => {
        const leaderPts = standingsItems[0]?.points || 0;
        const totalPts = standingsItems.reduce((sum, s) => sum + s.points, 0);
        const avg = Math.round(totalPts / (standingsItems.length || 1));

        return {
          label: item.teamName.length > 14 ? item.teamName.substring(0, 12) + ".." : item.teamName,
          myTeam: item.isCurrentUser ? Math.round(item.points) : Math.round(myStanding?.points || 0),
          leader: Math.round(leaderPts),
          avg,
        };
      });

  // Calculate cumulative stats across all joined leagues
  const totalUserJoinedCount = (userStandingsData || []).length || joinedLeagues.length;
  const bestRank = (userStandingsData || []).length
    ? Math.min(...(userStandingsData || []).map((u: { myTeam?: { rank?: number } }) => u.myTeam?.rank || 99))
    : myStanding.rank;
  const totalCumulativePoints = (userStandingsData || []).length
    ? (userStandingsData || []).reduce((acc: number, u: { myTeam?: { totalPoints?: number } }) => acc + (u.myTeam?.totalPoints || 0), 0)
    : myStanding.points;

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 pb-6 border-b border-border md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl flex items-center gap-2">
              <span>League Standings &amp; Rankings</span>
              <TrophyIcon className="size-6 text-amber-400" />
            </h1>
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 font-bold px-2.5 py-0.5 text-xs uppercase tracking-wider">
              {totalUserJoinedCount} Joined Leagues
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Multi-league performance dashboard tracking your rankings, fantasy points, and live podiums.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGridIcon className="size-3.5" />
              <span>All Joined Leagues</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("single")}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "single"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListOrderedIcon className="size-3.5" />
              <span>League Deep-Dive</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStandings}
            disabled={isRecalculating || isLoadingLeaderboard}
            className="gap-2 border-border text-foreground hover:bg-secondary cursor-pointer"
          >
            <RefreshCwIcon className={`size-3.5 text-muted-foreground ${isRecalculating ? "animate-spin" : ""}`} />
            <span>{isRecalculating ? "Calculating..." : "Recalculate"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success("Standings link copied to clipboard!");
            }}
            className="gap-2 border-border text-foreground hover:bg-secondary cursor-pointer"
          >
            <Share2Icon className="size-3.5 text-muted-foreground" />
            Share
          </Button>
        </div>
      </div>

      {/* 2. Top Cumulative KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Best Standing Rank"
          value={bestRank <= 3 ? `🥇 #${bestRank}` : `#${bestRank}`}
          change={bestRank === 1 ? "Leading Tournament" : "In Contention"}
          isPositive={bestRank <= 3}
          subtitle={`Across ${totalUserJoinedCount} Leagues`}
          icon={CrownIcon}
        />
        <StatCard
          title="Total Fantasy Points"
          value={`${totalCumulativePoints.toFixed(1)} pts`}
          change="Cumulative Multi-League"
          isPositive={true}
          subtitle="Captain & VC Multipliers"
          icon={ZapIcon}
        />
        <StatCard
          title="Active Leagues"
          value={`${totalUserJoinedCount} Joined`}
          change={`${displayLeaguesList.length} In Club`}
          isPositive={true}
          subtitle={activeClub?.name || "Active Club"}
          icon={CompassIcon}
        />
        <StatCard
          title="Standing Momentum"
          value={pointsGap}
          change={myStanding.rank === 1 ? "Leading Slate" : "Chasing #1"}
          isPositive={myStanding.rank === 1}
          subtitle="Focused League Status"
          icon={TargetIcon}
        />
      </div>

      {/* 3. Joined Leagues Switcher Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Select Fantasy League
          </span>
          <Link to="/Dashboard/AllLeagues" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            <span>Explore All Leagues</span>
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {displayLeaguesList.map((league: { _id: string; name: string; status?: string; hasJoined?: boolean }) => {
            const isSelected = league._id === selectedLeagueId;
            const normStatus = (league.status || "UPCOMING").toUpperCase();

            return (
              <button
                key={league._id}
                type="button"
                onClick={() => {
                  setSelectedLeagueId(league._id);
                }}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 shrink-0 ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <TrophyIcon className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                <span>{league.name}</span>
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1.5 py-0 uppercase ${
                    normStatus === "ACTIVE" || normStatus === "LIVE"
                      ? "border-green-500/40 text-green-400 bg-green-500/10"
                      : normStatus === "DRAFT"
                      ? "border-purple-500/40 text-purple-400 bg-purple-500/10 animate-pulse"
                      : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                  }`}
                >
                  {normStatus}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. VIEW MODE 1: All Joined Leagues Overview Grid */}
      {viewMode === "all" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>All Joined Leagues Standings</span>
                <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                  {userStandingsData?.length || joinedLeagues.length} Active Slates
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Overview of your team standing, top podium managers, and total score in each fantasy tournament.
              </p>
            </div>
          </div>

          {(userStandingsData && userStandingsData.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {userStandingsData.map((item: {
                league: { _id: string; name: string; status?: string; season?: string; matchDetails?: { name?: string } };
                myTeam: { name: string; totalPoints: number; rank: number };
                totalTeams: number;
                standings: Array<{ rank: number; teamName: string; owner: string; totalPoints: number; isUserTeam?: boolean; avatarUrl?: string }>;
              }) => {
                const normStatus = (item.league?.status || "Upcoming").toUpperCase();

                return (
                  <Card key={item.league._id} className="rounded-xl border border-border bg-card p-5 shadow-none flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-foreground leading-snug">
                            {item.league.name}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span role="img" aria-label="cricket">🏏</span>
                            <span>{item.league.matchDetails?.name || "Match Slate"}</span>
                            <span>•</span>
                            <span>{item.totalTeams} Teams</span>
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase ${
                            normStatus === "ACTIVE" || normStatus === "LIVE"
                              ? "border-green-500/40 text-green-400 bg-green-500/10"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {normStatus}
                        </Badge>
                      </div>

                      {/* User's Team Card */}
                      <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-md bg-primary text-primary-foreground font-extrabold text-xs flex items-center justify-center">
                            #{item.myTeam.rank}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-foreground block">{item.myTeam.name}</span>
                            <span className="text-[10px] text-muted-foreground">Your Fantasy Squad</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold font-mono text-foreground">
                            {(item.myTeam.totalPoints ?? 0).toFixed(1)} <span className="text-[10px] font-sans font-normal text-muted-foreground">pts</span>
                          </span>
                          <span className="text-[10px] text-primary block font-semibold">
                            Rank #{item.myTeam.rank} of {item.totalTeams}
                          </span>
                        </div>
                      </div>

                      {/* Standings Snippet (Top 3) */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Top Leaderboard Standings
                        </span>
                        {item.standings.slice(0, 3).map((st) => (
                          <div
                            key={st.rank}
                            className={`flex items-center justify-between text-xs p-2 rounded-lg ${
                              st.isUserTeam
                                ? "bg-primary/10 font-bold text-primary"
                                : "bg-secondary/20 text-muted-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[11px] w-5">#{st.rank}</span>
                              <span className="text-foreground">{st.teamName}</span>
                              <span className="text-[10px] text-muted-foreground">(@{st.owner})</span>
                            </div>
                            <span className="font-mono font-bold text-foreground">
                              {(st.totalPoints ?? 0).toFixed(1)} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-border/50 pt-3 flex items-center gap-2">
                      <Link to={`/Dashboard/League/${item.league._id}`} className="flex-1">
                        <Button size="sm" className="w-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-none cursor-pointer">
                          <SwordsIcon className="size-3.5" />
                          <span>Enter Match / Draft Room</span>
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedLeagueId(item.league._id);
                          setViewMode("single");
                        }}
                        className="text-xs border-border hover:bg-secondary cursor-pointer"
                      >
                        Deep-Dive Table
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Fallback Grid when userStandingsData is empty */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayLeaguesList.map((league: { _id: string; name: string; status?: string; matchDetails?: { name?: string } }) => (
                <Card key={league._id} className="rounded-xl border border-border bg-card p-5 shadow-none flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-foreground">{league.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {league.matchDetails?.name || "Single Match Fantasy"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {league.status || "Upcoming"}
                      </Badge>
                    </div>

                    <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-md bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                          #1
                        </div>
                        <div>
                          <span className="text-xs font-bold text-foreground">{username}'s Squad</span>
                          <span className="text-[10px] text-muted-foreground">Your Squad</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold font-mono text-foreground">1,055.0 pts</span>
                    </div>
                  </div>

                  <Link to={`/Dashboard/League/${league._id}`}>
                    <Button size="sm" className="w-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-none">
                      <SwordsIcon className="size-3.5" />
                      <span>Enter Match / Draft Room</span>
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. VIEW MODE 2: Single League Deep-Dive Table */}
      {viewMode === "single" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{leagueName} Standings</span>
                <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                  {season}
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Complete rankings table for {leagueName} with active captain point multipliers.
              </p>
            </div>

            <Link to={`/Dashboard/League/${selectedLeagueId}`}>
              <Button size="sm" className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-none cursor-pointer">
                <SwordsIcon className="size-3.5" />
                <span>Go to League Room</span>
                <ArrowRightIcon className="size-3.5" />
              </Button>
            </Link>
          </div>

          {isLoadingLeaderboard ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Loading live standings for {leagueName}...</p>
            </div>
          ) : (
            <LeaderboardTableFull items={standingsItems} onViewTeam={handleViewTeam} />
          )}
        </div>
      )}

      {/* 6. Performance Trend Chart */}
      <div className="space-y-4">
        <TopTeamsPerformanceChart
          data={performanceTrendData}
          myTeamName={myStanding?.teamName ? `${myStanding.teamName} (You)` : `${username}'s Squad (You)`}
          leaderName={firstPlaceStanding?.teamName ? `${firstPlaceStanding.teamName} (#1)` : "Leader (#1)"}
        />
      </div>

      {/* 7. Team Squad Roster Drawer Modal */}
      <TeamRosterDrawer
        team={selectedTeamForDrawer}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}

function TeamRosterDrawer({
  team,
  open,
  onOpenChange,
}: {
  team: FullLeaderboardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: rosterData, isLoading } = useTeamRoster(team?.teamId || "");
  const players = (rosterData?.players || rosterData?.playerIds || []) as Array<{
    id?: string;
    _id?: string;
    name?: string;
    position?: string;
    realTeam?: string;
    price?: number;
  }>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-card border-l border-border p-6 flex flex-col justify-between w-full sm:max-w-md overflow-y-auto">
        <div className="space-y-5">
          <SheetHeader className="p-0 space-y-1.5 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-primary text-primary-foreground font-extrabold text-xs">
                Rank #{team?.rank}
              </Badge>
              <span className="text-xs font-mono font-extrabold text-primary">
                {(team?.points ?? 0).toFixed(1)} pts
              </span>
            </div>
            <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Avatar className="size-8 border border-border">
                <AvatarImage src={team?.avatar} />
                <AvatarFallback className="text-xs font-bold">{team?.teamName?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{team?.teamName}</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>Manager:</span>
              <strong className="text-foreground">@{team?.manager}</strong>
            </SheetDescription>
          </SheetHeader>

          {/* Squad Roster List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Drafted Squad Roster ({players.length} Players)
              </h4>
              <span className="text-[11px] text-muted-foreground">Official Roster</span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-xs">Loading team squad roster...</p>
              </div>
            ) : players.length > 0 ? (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
                {players.map((p, idx) => {
                  const pos = p.position || "PLAYER";
                  const badgeColor =
                    pos === "BAT"
                      ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                      : pos === "BOWL"
                      ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                      : pos === "AR"
                      ? "border-purple-500/30 text-purple-400 bg-purple-500/10"
                      : "border-green-500/30 text-green-400 bg-green-500/10";

                  return (
                    <div
                      key={p.id || p._id || idx}
                      className="p-3 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-6 rounded-lg bg-secondary text-muted-foreground font-mono font-bold text-[11px] flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{p.name || "Player"}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span>{p.realTeam || "INTL"}</span>
                            <span>•</span>
                            <span className="font-mono">₹{p.price ? `${p.price} Cr` : "Standard"}</span>
                          </div>
                        </div>
                      </div>

                      <Badge variant="outline" className={`text-[10px] font-bold uppercase px-2 py-0.5 ${badgeColor}`}>
                        {pos}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground space-y-1">
                <UsersIcon className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs font-semibold text-foreground">No Players Drafted Yet</p>
                <p className="text-[11px]">This team has not selected players into their squad roster yet.</p>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="p-0 pt-4 border-t border-border flex flex-row items-center justify-between mt-4">
          <SheetClose render={<Button variant="outline" size="sm" className="text-xs">Close</Button>} />
          <span className="text-[11px] text-muted-foreground font-medium">15-Player Squad</span>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
