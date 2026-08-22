import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMe, useLogout } from "@/features/auth/hooks/useAuth";
import { useMyClubs, useCreateClub, useJoinClub, useGenerateClubInviteCode } from "@/features/club/hooks/useClub";
import { useClubStore, type Club } from "@/store/clubStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ShieldCheckIcon,
  CompassIcon,
  PlusCircleIcon,
  ArrowRightIcon,
  LockIcon,
  GlobeIcon,
  ZapIcon,
  LogOut,
  Loader2,
  UsersIcon,
  TrophyIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function SelectClub() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { data: clubs, isLoading: isLoadingClubs } = useMyClubs();
  const { setActiveClub } = useClubStore();
  const logoutMutation = useLogout();

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
  const userInitials = username.substring(0, 2).toUpperCase();

  const handleSelectClub = (club: Club) => {
    setActiveClub(club);
    toast.success(`Entered ${club.name}`);
    navigate("/Dashboard");
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) {
      toast.error("Please enter a club name");
      return;
    }
    try {
      const newClub = await createClubMutation.mutateAsync({
        name: clubName.trim(),
        description: clubDescription.trim(),
        isPrivate: isPrivateClub,
      });
      toast.success("Club workspace created successfully!");
      setClubName("");
      setClubDescription("");
      setCreateSheetOpen(false);

      if (newClub?.data) {
        setActiveClub(newClub.data);
        navigate("/Dashboard");
      }
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
      const res = await joinClubMutation.mutateAsync({
        slug: joinSlug.trim().toLowerCase(),
        inviteCode: inviteCode.trim().toUpperCase() || undefined,
      });
      toast.success("Joined club workspace successfully!");
      setJoinSlug("");
      setInviteCode("");
      setJoinSheetOpen(false);

      if (res?.data) {
        setActiveClub(res.data);
        navigate("/Dashboard");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to join club");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.success("Logged out");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-none shrink-0">
            <ZapIcon className="size-4 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-wider text-xs text-foreground">SHADOWLEAGUE</span>
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Club Workspaces</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Shadow League Points Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 font-extrabold text-xs">
            <TrophyIcon className="size-3.5 fill-amber-400/20 text-amber-400" />
            <span>{(user as { shadowPoints?: number })?.shadowPoints || 0} SLP</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Avatar className="size-8 border border-border">
              <AvatarImage src={user?.avatarUrl || ""} alt={username} />
              <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-xs font-semibold text-foreground">
              @{username}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 gap-1.5 cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-8 my-auto">
        {/* User Achievements & Points Card */}
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar className="size-12 border-2 border-primary">
              <AvatarImage src={user?.avatarUrl || ""} alt={username} />
              <AvatarFallback className="bg-primary/20 text-sm font-extrabold text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-foreground">@{username}</span>
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary uppercase font-bold">
                  {user?.role || "Manager"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{user?.email || "Fantasy Manager"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-card p-2.5 px-4 rounded-xl border border-amber-500/40">
            <TrophyIcon className="size-5 text-amber-400" />
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Shadow League Points</span>
              <span className="text-base font-mono font-extrabold text-amber-400">
                {(user as { shadowPoints?: number })?.shadowPoints || 0} SLP
              </span>
            </div>
          </div>
        </div>

        {/* Page Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <span>Select Club Workspace</span>
              <span className="text-2xl" role="img" aria-label="stadium">🏟️</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Choose which club workspace you want to manage leagues, rosters, and matchups in.
            </p>
          </div>

          {/* Action Sheets */}
          <div className="flex items-center gap-2">
            {/* Join Club Sheet */}
            <Sheet open={joinSheetOpen} onOpenChange={setJoinSheetOpen}>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-1.5 border-border text-xs hover:bg-secondary cursor-pointer">
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
                    Enter the Club Slug (for public clubs) or the Private Invite Code sent to your email.
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
            </Sheet>

            {/* Create Club Sheet */}
            <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
              <SheetTrigger
                render={
                  <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground text-xs hover:bg-primary/90 cursor-pointer font-semibold shadow-none">
                    <PlusCircleIcon className="size-3.5" />
                    <span>Create Club</span>
                  </Button>
                }
              />
              <SheetContent side="right" className="bg-card border-l border-border p-6 flex flex-col justify-between w-full sm:max-w-md">
                <SheetHeader className="p-0 space-y-1.5">
                  <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <ShieldCheckIcon className="size-5 text-primary" />
                    Create Club Workspace
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    A club is your private community workspace where you can host multiple fantasy leagues and tournaments.
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
                      placeholder="Fantasy workspace for our friend group"
                      value={clubDescription}
                      onChange={(e) => setClubDescription(e.target.value)}
                      className="bg-background border-border text-foreground text-sm"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-semibold text-foreground">Privacy Mode</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPrivateClub(true)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          isPrivateClub
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
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          !isPrivateClub
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
                    className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-10 mt-2 cursor-pointer shadow-none"
                  >
                    {createClubMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Creating Club...
                      </>
                    ) : (
                      "Create Club & Open Workspace"
                    )}
                  </Button>
                </form>

                <SheetFooter className="p-0 pt-4 border-t border-border flex flex-row items-center justify-between">
                  <SheetClose render={<Button variant="ghost" size="sm" className="text-xs">Cancel</Button>} />
                  <span className="text-[11px] text-muted-foreground">Admin privileges assigned</span>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Club Grid / Empty State */}
        {isLoadingClubs ? (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm">Loading your club workspaces...</p>
          </div>
        ) : clubs && clubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {clubs.map((club: Club) => (
              <Card
                key={club._id}
                onClick={() => handleSelectClub(club)}
                className="group border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all rounded-2xl p-6 pb-6 cursor-pointer flex flex-col justify-between min-h-[220px] space-y-4"
              >
                <CardHeader className="p-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                      <ShieldCheckIcon className="size-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/20 uppercase">
                        {club.userRole || "Member"}
                      </Badge>
                      {club.isPrivate && (
                        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                          <LockIcon className="size-2.5 mr-1" /> Private
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {club.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                      {club.description || "Active fantasy sports club workspace."}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardFooter className="p-0 pt-4 mt-auto border-t border-border/60 flex items-center justify-between text-xs gap-2">
                  {!club.isPrivate ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard?.writeText(club.slug);
                        toast.success(`Club slug copied: ${club.slug}`);
                      }}
                      className="h-8 text-[11px] gap-1.5 px-2.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer font-semibold"
                    >
                      <GlobeIcon className="size-3" />
                      <span>Share Club</span>
                    </Button>
                  ) : (club.userRole?.toLowerCase() === "admin" || club.userRole?.toLowerCase() === "owner" || user?.role === "admin") ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={generateInviteMutation.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGeneratePrivateInvite(club._id);
                      }}
                      className="h-8 text-[11px] gap-1.5 px-2.5 border-border text-muted-foreground hover:text-foreground cursor-pointer font-semibold"
                    >
                      {generateInviteMutation.isPending ? (
                        <Loader2 className="size-3 animate-spin text-primary" />
                      ) : (
                        <LockIcon className="size-3" />
                      )}
                      <span>Invite</span>
                    </Button>
                  ) : (
                    <div />
                  )}

                  <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform text-xs">
                    Enter <ArrowRightIcon className="size-3.5" />
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border bg-card p-12 text-center rounded-xl space-y-6 max-w-lg mx-auto shadow-none">
            <div className="size-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <TrophyIcon className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-foreground">No Club Workspaces Found</h2>
              <p className="text-xs text-muted-foreground">
                To start playing fantasy leagues, you need to create your own club or join an existing one using an invite code.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => setCreateSheetOpen(true)}
                className="w-full sm:w-auto bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs gap-1.5 cursor-pointer shadow-none"
              >
                <PlusCircleIcon className="size-3.5" />
                Create Your First Club
              </Button>
              <Button
                variant="outline"
                onClick={() => setJoinSheetOpen(true)}
                className="w-full sm:w-auto text-xs border-border text-foreground hover:bg-secondary gap-1.5 cursor-pointer"
              >
                <CompassIcon className="size-3.5 text-primary" />
                Join with Invite Code
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
