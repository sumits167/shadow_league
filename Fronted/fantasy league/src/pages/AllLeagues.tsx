import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  PlusCircleIcon,
  SearchIcon,
  UsersIcon,
  ClockIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  Loader2,
  CalendarIcon,
  SparklesIcon,
  ZapIcon,
  Settings2Icon,
} from "lucide-react";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useMyClubs } from "@/features/club/hooks/useClub";
import { useClubLeagues, useCreateLeague, useJoinLeague } from "@/features/league/hooks/useLeague";
import { useUpcomingMatches } from "@/features/match/hooks/useMatch";
import { LeagueSettingsModal, type LeagueSettingsData } from "@/components/league/LeagueSettingsModal";
import { useClubStore } from "@/store/clubStore";
import { payWithRazorpay } from "@/utils/pay";
import { toast } from "sonner";

export default function AllLeague() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { data: clubs } = useMyClubs();
  const { activeClub } = useClubStore();
  const username = user?.username || "Manager";

  const currentClubId = activeClub?._id || clubs?.[0]?._id || "";
  const { data: leagues, isLoading: isLoadingLeagues, refetch: refetchLeagues } = useClubLeagues(currentClubId);
  const { data: upcomingMatches } = useUpcomingMatches();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const isClubAdmin =
    user?.role === "admin" ||
    activeClub?.userRole?.toLowerCase() === "admin" ||
    activeClub?.userRole?.toLowerCase() === "owner";

  const [createLeagueOpen, setCreateLeagueOpen] = useState(false);
  const [leagueSettingsOpen, setLeagueSettingsOpen] = useState(false);
  const [selectedSettingsLeague, setSelectedSettingsLeague] = useState<LeagueSettingsData | null>(null);

  const [leagueName, setLeagueName] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [season, setSeason] = useState("2026");
  const [entryFee, setEntryFee] = useState("0");
  const [draftType, setDraftType] = useState<"snake" | "linear" | "auction">("snake");

  // Join League Sheet State
  const [joinLeagueOpen, setJoinLeagueOpen] = useState(false);
  const [joiningLeagueId, setJoiningLeagueId] = useState("");
  const [teamName, setTeamName] = useState(`${username}'s Squad`);
  const [isPaying, setIsPaying] = useState(false);

  const createLeagueMutation = useCreateLeague();
  const joinLeagueMutation = useJoinLeague();

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
        matchId: selectedMatchId || undefined,
        entryFee: Number(entryFee) || 0,
        settings: {
          maxTeams: 10,
          rosterSize: 15,
          lineupSize: 11,
          draftType: draftType,
        },
      });
      toast.success("Fantasy League created for selected match!");
      setLeagueName("");
      setSelectedMatchId("");
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
    const effectiveTeamName = teamName?.trim() || `${username}'s Squad`;

    const targetLeague = (leagues as Array<{ _id: string; entryFee?: number }> || []).find(
      (l) => l._id === joiningLeagueId
    );
    const fee = targetLeague?.entryFee || 0;

    const executeJoin = async () => {
      try {
        await joinLeagueMutation.mutateAsync({
          leagueId: joiningLeagueId,
          payload: { teamName: effectiveTeamName },
        });
        toast.success("Joined fantasy league successfully!");
        setJoinLeagueOpen(false);
        setTeamName(`${username}'s Squad`);
        await refetchLeagues();

        if (joiningLeagueId) {
          navigate(`/Dashboard/League/${joiningLeagueId}`);
        }
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

  // Filter leagues
  const filteredLeagues = (leagues || []).filter((league: { name: string; status?: string; matchDetails?: { name?: string } }) => {
    const matchesSearch =
      league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      league.matchDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || league.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });




  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <span>All Fantasy Leagues</span>
              <span className="text-2xl" role="img" aria-label="trophy">🏆</span>
            </h1>
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-xs font-bold">
              {activeClub?.name || "Club Workspace"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Browse and join single-match fantasy leagues or create a new competition for an upcoming cricket match.
          </p>
        </div>

        {/* Create League Sheet Trigger (Admin Only) */}
        {isClubAdmin && (
          <Sheet open={createLeagueOpen} onOpenChange={setCreateLeagueOpen}>
            <SheetTrigger
              render={
                <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs shadow-none cursor-pointer">
                  <PlusCircleIcon className="size-4" />
                  <span>Create League</span>
                </Button>
              }
            />
            <SheetContent side="right" className="bg-card border-l border-border p-6 flex flex-col justify-between w-full sm:max-w-md overflow-y-auto">
              <SheetHeader className="p-0 space-y-1.5">
                <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <TrophyIcon className="size-5 text-primary" />
                  Create Match League
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Associate this league with one specific upcoming cricket match.
                </SheetDescription>
              </SheetHeader>

              <form onSubmit={handleCreateLeague} className="space-y-4 my-auto">
                <div className="space-y-1.5">
                  <Label htmlFor="sheet-leagueName" className="text-xs font-semibold text-foreground">
                    League Name
                  </Label>
                  <Input
                    id="sheet-leagueName"
                    placeholder="e.g. India vs Australia Super Fantasy"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    required
                    className="bg-background border-border text-foreground text-sm"
                  />
                </div>

                {/* Select Real Match */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5 text-primary" />
                    Select Upcoming Cricket Match
                  </Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(upcomingMatches || []).map((match) => (
                      <div
                        key={match.id}
                        onClick={() => {
                          setSelectedMatchId(match.id);
                          if (!leagueName) setLeagueName(`${match.name} Fantasy`);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${selectedMatchId === match.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-border/80"
                          }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-foreground">
                          <span>{match.name}</span>
                          <Badge variant="outline" className="text-[9px] uppercase border-primary/30 text-primary">
                            {match.format}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{match.venue}</p>
                        <p className="text-[10px] text-primary font-mono mt-1">
                          {match.totalEligiblePlayers || 24} Eligible Players for Draft
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sheet-season" className="text-xs font-semibold text-foreground">
                      Season / Year
                    </Label>
                    <Input
                      id="sheet-season"
                      value={season}
                      onChange={(e) => setSeason(e.target.value)}
                      required
                      className="bg-background border-border text-foreground text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sheet-fee" className="text-xs font-semibold text-foreground">
                      Entry Fee (₹)
                    </Label>
                    <Input
                      id="sheet-fee"
                      type="number"
                      min="0"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      className="bg-background border-border text-foreground text-sm"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-1 text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheckIcon className="size-3.5 text-primary" /> Core Rules (Fixed)
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    • 15-player squad draft roster<br />
                    • 11-player match starting lineup<br />
                    • Captain (2x) & Vice-Captain (1.5x) multipliers<br />
                    • Limited player ownership per league
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={createLeagueMutation.isPending}
                  className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-10 mt-2 cursor-pointer shadow-none"
                >
                  {createLeagueMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Creating League...
                    </>
                  ) : (
                    "Create Fantasy League"
                  )}
                </Button>
              </form>

              <SheetFooter className="p-0 pt-4 border-t border-border flex flex-row items-center justify-between">
                <SheetClose render={<Button variant="ghost" size="sm" className="text-xs">Cancel</Button>} />
                <span className="text-[11px] text-muted-foreground">Max 10 Teams</span>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search leagues by name or cricket match..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-card p-1 rounded-lg border border-border">
          {["all", "created", "active", "completed"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded text-xs font-semibold uppercase transition-all cursor-pointer ${statusFilter === st
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Leagues Grid */}
      {isLoadingLeagues ? (
        <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs">Loading leagues...</p>
        </div>
      ) : filteredLeagues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {filteredLeagues.map((league: {
            _id: string;
            name: string;
            status?: string;
            entryFee?: number;
            teamCount?: number;
            hasJoined?: boolean;
            matchDetails?: { name?: string; format?: string; venue?: string };
            settings?: { maxTeams?: number; draftType?: string };
          }) => (
            <Card
              key={league._id}
              className="border-border bg-card hover:border-primary/40 transition-all rounded-2xl p-6 pb-6 flex flex-col justify-between shadow-none space-y-5 min-h-[220px]"
            >
              <CardHeader className="p-0 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-green-500/40 text-green-400 bg-green-500/10 text-[10px] font-bold uppercase">
                    {league.status || "Upcoming"}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-primary">
                      {league.entryFee ? `₹${league.entryFee} Entry` : "Free Entry"}
                    </span>
                    {isClubAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSettingsLeague(league);
                          setLeagueSettingsOpen(true);
                        }}
                        title="Edit League Settings"
                        className="size-6 text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                      >
                        <Settings2Icon className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    {league.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 leading-relaxed">
                    <span role="img" aria-label="cricket">🏏</span>
                    <span>{league.matchDetails?.name || "Single Match Fantasy"}</span>
                    {league.matchDetails?.format && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-border">
                        {league.matchDetails.format}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-0 space-y-2.5 text-xs text-muted-foreground border-t border-border/50 pt-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UsersIcon className="size-3.5 text-primary" />
                    <span>Teams Joined:</span>
                  </span>
                  <span className="font-bold text-foreground">
                    {league.teamCount || 1} / {league.settings?.maxTeams || 10}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ZapIcon className="size-3.5 text-muted-foreground" />
                    <span>Draft Format:</span>
                  </span>
                  <span className="font-mono capitalize text-foreground">
                    {league.settings?.draftType || "Snake Draft"}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="p-0 pt-4 mt-auto border-t border-border/50 flex items-center gap-2">
                {league.hasJoined ? (
                  <Link to={`/Dashboard/League/${league._id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer h-9">
                      <span>View League</span>
                      <ArrowRightIcon className="size-3.5" />
                    </Button>
                  </Link>
                ) : league.status && league.status !== "Created" ? (
                  <Button
                    size="sm"
                    disabled
                    className="flex-1 bg-secondary text-muted-foreground font-semibold text-xs cursor-not-allowed border border-border h-9"
                  >
                    Registration Closed
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setJoiningLeagueId(league._id);
                      setJoinLeagueOpen(true);
                    }}
                    className="flex-1 bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs cursor-pointer shadow-none h-9"
                  >
                    Join League
                  </Button>
                )}

                {isClubAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSettingsLeague(league);
                      setLeagueSettingsOpen(true);
                    }}
                    title="Configure League Rules, Schedule & Settings"
                    className="text-xs font-semibold gap-1.5 border-border hover:bg-secondary cursor-pointer shrink-0 h-9"
                  >
                    <Settings2Icon className="size-3.5 text-muted-foreground" />
                    <span>Settings</span>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-card p-12 text-center rounded-xl space-y-4 max-w-md mx-auto shadow-none">
          <div className="size-12 mx-auto rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <TrophyIcon className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Leagues Found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `No leagues matching "${searchQuery}". Try a different search term.`
                : "No leagues created in this club yet. Create the first one to start drafting!"}
            </p>
          </div>
          {isClubAdmin ? (
            <Button
              onClick={() => setCreateLeagueOpen(true)}
              className="bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 gap-1.5 cursor-pointer shadow-none"
            >
              <PlusCircleIcon className="size-3.5" />
              Create Match League
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No leagues have been created in this club yet. Ask your club admin to create one.
            </p>
          )}
        </Card>
      )}

      {/* Join League Sheet */}
      <Sheet open={joinLeagueOpen} onOpenChange={setJoinLeagueOpen}>
        <SheetContent side="right" className="bg-card border-l border-border p-6 flex flex-col justify-between w-full sm:max-w-md">
          <SheetHeader className="p-0 space-y-1.5">
            <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <TrophyIcon className="size-5 text-primary" />
              Join Fantasy League
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Create your fantasy team to participate in the snake draft. Rule: 1 Team per manager per league.
            </SheetDescription>
          </SheetHeader>

          {(() => {
            const joiningLeague = (leagues as Array<{ _id: string; name: string; entryFee?: number }> || []).find(
              (l) => l._id === joiningLeagueId
            );

            return (
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

                {joiningLeague?.entryFee && joiningLeague.entryFee > 0 ? (
                  <div className="p-3.5 rounded-xl border border-primary/40 bg-primary/10 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">Required Entry Fee:</span>
                    <span className="text-base font-extrabold text-primary font-mono">₹{joiningLeague.entryFee}</span>
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
                  ) : joiningLeague?.entryFee && joiningLeague.entryFee > 0 ? (
                    `Pay ₹${joiningLeague.entryFee} & Join League`
                  ) : (
                    "Confirm & Join League (Free)"
                  )}
                </Button>
              </form>
            );
          })()}

          <SheetFooter className="p-0 pt-4 border-t border-border flex flex-row items-center justify-between">
            <SheetClose render={<Button variant="ghost" size="sm" className="text-xs">Cancel</Button>} />
            <span className="text-[11px] text-muted-foreground">1 Team / League</span>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* League Settings Modal */}
      {selectedSettingsLeague && (
        <LeagueSettingsModal
          open={leagueSettingsOpen}
          onOpenChange={setLeagueSettingsOpen}
          league={selectedSettingsLeague}
          onSuccess={() => refetchLeagues()}
        />
      )}
    </div>
  );
}