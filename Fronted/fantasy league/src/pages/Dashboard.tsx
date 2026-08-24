import { useState } from "react";
import { Link } from "react-router-dom";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActiveLeagueCard, type ActiveLeagueProps } from "@/components/dashboard/ActiveLeagueCard";
import { WeeklyActivityChart } from "@/components/dashboard/WeeklyActivityChart";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
  UsersIcon,
  ClockIcon,
  ArrowRightIcon,
  CalendarIcon,
  PlusCircleIcon,
  CompassIcon,
  ShieldCheckIcon,
  Loader2,
  LockIcon,
  GlobeIcon
} from "lucide-react";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useMyClubs, useCreateClub, useJoinClub, useGenerateClubInviteCode } from "@/features/club/hooks/useClub";
import { useClubLeagues, useUserJoinedStandings } from "@/features/league/hooks/useLeague";
import { type DailyPointPoint } from "@/components/dashboard/WeeklyActivityChart";
import { useClubStore } from "@/store/clubStore";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: user } = useMe();
  const { data: clubs, isLoading: isLoadingClubs } = useMyClubs();
  const { activeClub, setActiveClub } = useClubStore();

  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [joinSheetOpen, setJoinSheetOpen] = useState(false);

  const [clubName, setClubName] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [isPrivateClub, setIsPrivateClub] = useState(true);

  const [joinSlug, setJoinSlug] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const createClubMutation = useCreateClub();
  const joinClubMutation = useJoinClub();
  const generateInviteMutation = useGenerateClubInviteCode();

  const handleGeneratePrivateInvite = async (clubId: string) => {
    try {
      const res = await generateInviteMutation.mutateAsync({ clubId, expiresInHours: 24 });
      const inviteData = res?.data;
      if (inviteData?.code) {
        await navigator.clipboard?.writeText(inviteData.code);
        toast.success(`Single-use code copied: ${inviteData.code} (Expires in 24 hours)`);
      } else {
        toast.error("Failed to generate invite code");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate invite code");
    }
  };

  const username = user?.username || "Manager";
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentClubId = activeClub?._id || clubs?.[0]?._id || "";
  const { data: leagues, isLoading: isLoadingLeagues } = useClubLeagues(currentClubId);
  const { data: userStandingsData } = useUserJoinedStandings(currentClubId);

  const totalClubs = clubs?.length || 0;
  const totalLeagues = leagues?.length || 0;

  // Derive real database user fantasy scoring dataset for the performance chart
  const realDailyData: DailyPointPoint[] = (userStandingsData || []).map((item: {
    league: { name: string; matchDetails?: { name?: string } };
    myTeam: { name: string; totalPoints: number; rank: number };
    standings: Array<{ totalPoints: number }>;
  }) => {
    const totalLeaguePoints = item.standings?.reduce((sum: number, s: { totalPoints: number }) => sum + (s.totalPoints || 0), 0) || 0;
    const avg = item.standings?.length ? Math.round(totalLeaguePoints / item.standings.length) : 0;
    const matchName = item.league?.matchDetails?.name || item.league?.name || "Match";
    const shortLabel = matchName.length > 14 ? matchName.substring(0, 12) + ".." : matchName;

    return {
      label: shortLabel,
      points: Math.round(item.myTeam?.totalPoints || 0),
      avg,
      highlight: item.myTeam?.rank ? `Rank #${item.myTeam.rank}` : undefined,
    };
  });

  const realWeeklyData: DailyPointPoint[] = (userStandingsData || []).map((item: {
    league: { name: string };
    myTeam: { totalPoints: number };
    standings: Array<{ totalPoints: number }>;
  }, idx: number) => {
    const totalLeaguePoints = item.standings?.reduce((sum: number, s: { totalPoints: number }) => sum + (s.totalPoints || 0), 0) || 0;
    const avg = item.standings?.length ? Math.round(totalLeaguePoints / item.standings.length) : 0;

    return {
      label: `Tourn ${idx + 1}`,
      points: Math.round(item.myTeam?.totalPoints || 0),
      avg,
    };
  });

  const totalScoredPoints = userStandingsData?.reduce(
    (sum: number, item: { myTeam?: { totalPoints?: number } }) => sum + (item.myTeam?.totalPoints || 0),
    0
  ) || (user as { shadowPoints?: number })?.shadowPoints || 0;

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) {
      toast.error("Please enter a club name");
      return;
    }
    try {
      await createClubMutation.mutateAsync({
        name: clubName.trim(),
        description: clubDescription.trim(),
        isPrivate: isPrivateClub,
      });
      toast.success("Fantasy club created successfully!");
      setClubName("");
      setClubDescription("");
      setCreateSheetOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create club");
    }
  };

  const handleJoinClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinSlug.trim()) {
      toast.error("Please enter a club slug or invite link");
      return;
    }
    try {
      await joinClubMutation.mutateAsync({
        slug: joinSlug.trim().toLowerCase(),
        inviteCode: inviteCode.trim().toUpperCase() || undefined,
      });
      toast.success("Joined club successfully!");
      setJoinSlug("");
      setInviteCode("");
      setJoinSheetOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to join club");
    }
  };

  // Map backend leagues to card format with accurate real-time statuses (Limit to 4 latest leagues)
  const displayLeagues: ActiveLeagueProps[] = leagues && leagues.length > 0
    ? [...leagues]
      .slice(0, 4)
      .map((league: { _id: string; name: string; season?: string; status?: string; settings?: { maxTeams?: number }; draftState?: { scheduledStartTime?: string } }, index: number) => {
        const rawStatus = (league.status || "Upcoming").toUpperCase();
        let displayStatus: "LIVE" | "UPCOMING" | "DRAFT" | "COMPLETED" = "UPCOMING";
        if (rawStatus === "ACTIVE" || rawStatus === "LIVE") {
          displayStatus = "LIVE";
        } else if (rawStatus === "DRAFT") {
          displayStatus = "DRAFT";
        } else if (rawStatus === "COMPLETED") {
          displayStatus = "COMPLETED";
        } else {
          displayStatus = "UPCOMING";
        }

        const deadline =
          displayStatus === "LIVE"
            ? "Matchday Live"
            : displayStatus === "DRAFT"
              ? "Snake Draft In Progress"
              : league.draftState?.scheduledStartTime
                ? `Draft: ${new Date(league.draftState.scheduledStartTime).toLocaleDateString()}`
                : "Pre-Draft Lobby";

        const userTeam = (league as { userTeam?: { rank?: number; totalPoints?: number } }).userTeam;
        return {
          id: league._id,
          name: league.name,
          rank: userTeam?.rank || index + 1,
          totalMembers: league.settings?.maxTeams || 10,
          totalPoints: userTeam?.totalPoints || 0,
          deadline,
          status: displayStatus,
          hasJoined: !!(league as { hasJoined?: boolean }).hasJoined,
        };
      })
    : [];

  return (
    <div className="space-y-8">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col gap-3 pb-6 border-b border-border md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Hey {username} 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="size-3.5 text-primary" />
            <span>{currentDate}</span>
            <span>•</span>
            <span>Welcome to your ShadowLeague fantasy sports command center.</span>
          </p>
        </div>

        {/* Action Buttons using shadcn Sheet Triggers */}
        {/* <div className="flex items-center gap-2">
          {/* Join Club Sheet */}
        {/* <Sheet open={joinSheetOpen} onOpenChange={setJoinSheetOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-border text-xs hover:bg-secondary cursor-pointer"
                >
                  <CompassIcon className="size-3.5 text-primary" />
                  <span>Join Club</span>
                </Button>
              }
            />
            <SheetContent side="right" className="bg-card border-l border-border p-6 flex flex-col justify-between w-full sm:max-w-md">
              <SheetHeader className="p-0 space-y-1.5">
                <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <CompassIcon className="size-5 text-primary" />
                  Join Club Workspace
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Enter the Club Slug (for public clubs) or the Private Invite Code.
                </SheetDescription>
              </SheetHeader>

              <form onSubmit={handleJoinClub} className="space-y-4 my-auto">
                <div className="space-y-1.5">
                  <Label htmlFor="sheet-joinSlug" className="text-xs font-semibold text-foreground">
                    Club Slug or Invite Code
                  </Label>
                  <Input
                    id="sheet-joinSlug"
                    placeholder="e.g. friends-cricket or AB12CD34"
                    value={joinSlug}
                    onChange={(e) => setJoinSlug(e.target.value)}
                    required
                    className="bg-background border-border text-foreground text-sm"
                  />
                </div>

                <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <GlobeIcon className="size-3.5 text-primary" /> Public Clubs
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Paste the club slug (e.g. <span className="font-mono text-foreground">friends-cricket</span>). Anyone can join public clubs without an invitation.
                  </p>

                  <div className="font-semibold text-foreground flex items-center gap-1.5 pt-1">
                    <LockIcon className="size-3.5 text-amber-400" /> Private Clubs
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Enter the 8-character invite code from your email invitation.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={joinClubMutation.isPending}
                  className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-10 mt-2 cursor-pointer shadow-none"
                >
                  {joinClubMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Joining Club...
                    </>
                  ) : (
                    "Confirm & Join Club"
                  )}
                </Button>
              </form>

              <SheetFooter className="p-0 pt-4 border-t border-border flex flex-row items-center justify-between">
                <SheetClose render={<Button variant="ghost" size="sm" className="text-xs">Cancel</Button>} />
                <span className="text-[11px] text-muted-foreground">ShadowLeague Clubs</span>
              </SheetFooter>
            </SheetContent>
          </Sheet> */}

        {/* Create Club Sheet */}
        {/* <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
            <SheetTrigger
              render={
                <Button
                  size="sm"
                  className="gap-1.5 bg-primary text-primary-foreground text-xs hover:bg-primary/90 cursor-pointer font-semibold shadow-none"
                >
                  <PlusCircleIcon className="size-3.5" />
                  <span>Create Club</span>
                </Button>
              }
            />
            <SheetContent side="right" className="bg-card border-l border-border p-6 flex flex-col justify-between w-full sm:max-w-md">
              <SheetHeader className="p-0 space-y-1.5">
                <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <ShieldCheckIcon className="size-5 text-primary" />
                  Create Private Club
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  A club is your private community where you can host multiple fantasy leagues and competitions.
                </SheetDescription>
              </SheetHeader>

              <form onSubmit={handleCreateClub} className="space-y-4 my-auto">
                <div className="space-y-1.5">
                  <Label htmlFor="sheet-clubName" className="text-xs font-semibold text-foreground">
                    Club Name
                  </Label>
                  <Input
                    id="sheet-clubName"
                    placeholder="e.g. Apex Premier Club"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    required
                    className="bg-background border-border text-foreground text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sheet-clubDesc" className="text-xs font-semibold text-foreground">
                    Club Description
                  </Label>
                  <Input
                    id="sheet-clubDesc"
                    placeholder="Fantasy competition hub for our circle"
                    value={clubDescription}
                    onChange={(e) => setClubDescription(e.target.value)}
                    className="bg-background border-border text-foreground text-sm"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold text-foreground">Club Privacy</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrivateClub(true)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${isPrivateClub
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-border/80"
                        }`}
                    >
                      <LockIcon className="size-4 mb-1" />
                      <div className="text-xs font-bold">Private</div>
                      <div className="text-[10px]">Invite code required</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPrivateClub(false)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${!isPrivateClub
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-border/80"
                        }`}
                    >
                      <GlobeIcon className="size-4 mb-1" />
                      <div className="text-xs font-bold">Public</div>
                      <div className="text-[10px]">Anyone can join</div>
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createClubMutation.isPending}
                  className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-10 mt-2 cursor-pointer"
                >
                  {createClubMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Creating Club...
                    </>
                  ) : (
                    "Create Club & Generate Invite Link"
                  )}
                </Button>
              </form>

              <SheetFooter className="p-0 pt-4 border-t border-border flex flex-row items-center justify-between">
                <SheetClose render={<Button variant="ghost" size="sm" className="text-xs">Cancel</Button>} />
                <span className="text-[11px] text-muted-foreground">Admin privileges assigned</span>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div> */}
      </div>

      {/* Active Club Workspace Context Banner */}
      {activeClub && (
        <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-none">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 font-bold">
              <ShieldCheckIcon className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">{activeClub.name}</span>
                {!activeClub.isPrivate ? (
                  <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-[10px] font-bold gap-1">
                    <GlobeIcon className="size-3" /> Public Club
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-border text-muted-foreground text-[10px] gap-1">
                    <LockIcon className="size-3" /> Private Club
                  </Badge>
                )}
                {activeClub.userRole && (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-border">
                    {activeClub.userRole}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {activeClub.description || "Active Club Workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* If Public Club: show Share Club (Copy Slug). If Private Club: show Invite Members only to Admins/Owners */}
            {!activeClub.isPrivate ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(activeClub.slug);
                  toast.success(`Club slug copied: ${activeClub.slug}`);
                }}
                className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer font-bold"
              >
                <GlobeIcon className="size-3.5" />
                <span>Share Club (Copy Slug)</span>
              </Button>
            ) : (activeClub.userRole?.toLowerCase() === "admin" || activeClub.userRole?.toLowerCase() === "owner" || user?.role === "admin") ? (
              <Button
                variant="outline"
                size="sm"
                disabled={generateInviteMutation.isPending}
                onClick={() => handleGeneratePrivateInvite(activeClub._id)}
                className="h-8 text-xs gap-1.5 border-border text-muted-foreground hover:text-foreground cursor-pointer font-semibold"
              >
                {generateInviteMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                ) : (
                  <LockIcon className="size-3.5" />
                )}
                <span>Invite Members</span>
              </Button>
            ) : null}

            <Link to="/select-club">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                Switch Club
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 2. KPI Cards - 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Leagues"
          value={isLoadingLeagues ? "..." : String(totalLeagues)}
          change={totalLeagues > 0 ? `${totalLeagues} Tournament${totalLeagues > 1 ? "s" : ""}` : "Create a league"}
          isPositive={totalLeagues > 0}
          subtitle="Tournaments in workspace"
          icon={TrophyIcon}
        />

        <StatCard
          title="Shadow League Points"
          value={user ? `${(user as { shadowPoints?: number })?.shadowPoints || 0} SLP` : "0 SLP"}
          change="+500 1st Prize"
          isPositive={true}
          subtitle="Career manager achievements"
          icon={ZapIcon}
        />

        <StatCard
          title="Club Workspaces"
          value={isLoadingClubs ? "..." : String(totalClubs)}
          change={activeClub?.userRole ? `${activeClub.userRole.toUpperCase()}` : "Active Club"}
          isPositive={true}
          subtitle={activeClub?.name || "Joined communities"}
          icon={ShieldCheckIcon}
        />

        <StatCard
          title="Lock Deadline"
          value="30 mins"
          change="Auto-Lock"
          isPositive={false}
          subtitle="Roster locks before toss"
          icon={ClockIcon}
        />
      </div>

      {/* 3. Your Clubs Section */}
      {/* {clubs && clubs.length > 0 && (
        <div className="space-y-4">
          <SectionHeader
            title="Your Clubs"
            description="Private communities managing fantasy tournaments & leagues"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map((club: { _id: string; name: string; slug: string; userRole?: string; description?: string; inviteCode?: string }) => (
              <Card key={club._id} className="border-border bg-card hover:border-primary/40 transition-all rounded-xl p-5 space-y-3 shadow-none">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-base tracking-tight">{club.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                    {club.userRole || "Member"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {club.description || "Active fantasy club on ShadowLeague."}
                </p>
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-[11px] font-mono">
                    Code: {club.inviteCode || "PUBLIC"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveClub(club);
                      toast.success(`Switched active workspace to ${club.name}`);
                    }}
                    className="text-primary font-semibold flex items-center gap-1 hover:underline text-xs cursor-pointer"
                  >
                    Enter Workspace <ArrowRightIcon className="size-3" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )} */}

      {/* 4. Active Leagues Section */}
      <div className="space-y-4">
        <SectionHeader
          title="Active Fantasy Leagues"
          description="Overview of your current fantasy standings, multiplier points, and matchweeks"
          action={
            <Link to="/Dashboard/AllLeagues">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border hover:bg-secondary cursor-pointer">
                <span>View Full Leagues</span>
                <ArrowRightIcon className="size-3.5" />
              </Button>
            </Link>
          }
        />

        {displayLeagues?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {displayLeagues.map((league) => (
              <ActiveLeagueCard key={league.id} {...league} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground p-6 text-center border border-border rounded-xl bg-card">
            No active leagues found in this club.
          </p>
        )}
      </div>

      {/* 5. Bottom Section (Weekly Activity Chart + Upcoming Deadlines) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyActivityChart
            data={realDailyData.length > 0 ? realDailyData : undefined}
            weeklyData={realWeeklyData.length > 0 ? realWeeklyData : undefined}
            totalPoints={Math.round(totalScoredPoints)}
          />
        </div>
        <div className="lg:col-span-1">
          <UpcomingDeadlines
            deadlines={
              leagues && leagues.length > 0
                ? leagues.map((l: { _id: string; name: string }, idx: number) => ({
                  id: l._id,
                  leagueName: l.name,
                  date: "Matchweek Live",
                  time: "30 mins before match",
                  timeRemaining: idx === 0 ? "In 4 hrs" : "Upcoming",
                  isUrgent: idx === 0,
                }))
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}



























