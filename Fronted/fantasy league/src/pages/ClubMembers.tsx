import { useState } from "react";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useMyClubs, useClubMembers, useRemoveClubMember, useUpdateClubMemberRole } from "@/features/club/hooks/useClub";
import { useClubStore } from "@/store/clubStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UsersIcon,
  ShieldCheckIcon,
  SearchIcon,
  UserMinusIcon,
  UserCheckIcon,
  CrownIcon,
  LockIcon,
  GlobeIcon,
  Loader2,
  CalendarIcon,
  MailIcon,
  MoreVerticalIcon,
  AlertTriangleIcon
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function ClubMembers() {
  const { data: user } = useMe();
  const { data: clubs, isLoading: isLoadingClubs } = useMyClubs();
  const { activeClub } = useClubStore();

  const currentClub = activeClub || clubs?.[0];
  const currentClubId = currentClub?._id || "";

  const { data: members, isLoading: isLoadingMembers, refetch: refetchMembers } = useClubMembers(currentClubId);
  const removeMemberMutation = useRemoveClubMember();
  const updateRoleMutation = useUpdateClubMemberRole();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">("all");

  // State for member action confirmation drawer
  const [selectedMember, setSelectedMember] = useState<{
    _id: string;
    userId: { _id: string; username: string; email: string; avatarUrl?: string; role?: string };
    role: "admin" | "member";
    createdAt?: string;
  } | null>(null);

  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);

  // Check if current logged-in user is an admin or owner of the club
  const isClubAdmin =
    user?.role === "admin" ||
    currentClub?.userRole?.toLowerCase() === "admin" ||
    currentClub?.userRole?.toLowerCase() === "owner";

  const memberList = (members as Array<{
    _id: string;
    userId: { _id: string; username: string; email: string; avatarUrl?: string; role?: string };
    role: "admin" | "member";
    createdAt?: string;
  }>) || [];

  const totalMembers = memberList.length;
  const totalAdmins = memberList.filter((m) => m.role === "admin").length;

  const filteredMembers = memberList.filter((m) => {
    const username = m.userId?.username?.toLowerCase() || "";
    const email = m.userId?.email?.toLowerCase() || "";
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch = !query || username.includes(query) || email.includes(query);
    const matchesRole = roleFilter === "all" || m.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleUpdateRole = async (targetUserId: string, newRole: "admin" | "member") => {
    if (!currentClubId) return;
    try {
      await updateRoleMutation.mutateAsync({
        clubId: currentClubId,
        targetUserId,
        role: newRole,
      });
      toast.success(`Role updated to ${newRole.toUpperCase()}`);
      setActionDrawerOpen(false);
      refetchMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update member role");
    }
  };

  const handleRemoveMember = async (targetUserId: string, memberName: string) => {
    if (!currentClubId) return;
    try {
      await removeMemberMutation.mutateAsync({
        clubId: currentClubId,
        targetUserId,
      });
      toast.success(`@${memberName} has been removed from the club`);
      setActionDrawerOpen(false);
      refetchMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Workspace Banner */}
      <div className="flex flex-col gap-3 pb-6 border-b border-border md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <span>Club Members</span>
              <span className="text-2xl" role="img" aria-label="shield">🛡️</span>
            </h1>
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-xs font-bold gap-1">
              {currentClub?.name || "Active Workspace"}
            </Badge>
            {!currentClub?.isPrivate ? (
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 gap-1 font-semibold">
                <GlobeIcon className="size-3" /> Public Club
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground gap-1">
                <LockIcon className="size-3" /> Private Club
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your club workspace members, assign administrative privileges, or share join credentials.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {!currentClub?.isPrivate ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentClub?.slug) {
                  navigator.clipboard?.writeText(currentClub.slug);
                  toast.success(`Club slug copied: ${currentClub.slug}`);
                }
              }}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 text-xs cursor-pointer font-bold"
            >
              <GlobeIcon className="size-3.5" />
              <span>Share Club (Copy Slug)</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentClub?.inviteCode) {
                  navigator.clipboard?.writeText(currentClub.inviteCode);
                  toast.success(`Private invite code copied: ${currentClub.inviteCode}`);
                } else {
                  toast.info("Invite code available in Club Settings.");
                }
              }}
              className="gap-1.5 border-border text-muted-foreground hover:text-foreground text-xs cursor-pointer"
            >
              <LockIcon className="size-3.5" />
              <span>Copy Invite Code</span>
            </Button>
          )}

          <Link to="/select-club">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
              Switch Club
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border border-border bg-card p-4 shadow-none flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Total Members</p>
            <h3 className="text-2xl font-extrabold text-foreground mt-1">
              {isLoadingMembers ? "..." : totalMembers}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active managers in workspace</p>
          </div>
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <UsersIcon className="size-5" />
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-4 shadow-none flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Club Administrators</p>
            <h3 className="text-2xl font-extrabold text-foreground mt-1">
              {isLoadingMembers ? "..." : totalAdmins}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Full draft & league privileges</p>
          </div>
          <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <CrownIcon className="size-5" />
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-4 shadow-none flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Your Privilege</p>
            <h3 className="text-2xl font-extrabold text-primary capitalize mt-1">
              {currentClub?.userRole || (isClubAdmin ? "Admin" : "Member")}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isClubAdmin ? "Can manage members & roles" : "View-only access"}
            </p>
          </div>
          <div className="size-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <ShieldCheckIcon className="size-5" />
          </div>
        </Card>
      </div>

      {/* 3. Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border text-foreground text-xs h-9 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-lg self-stretch sm:self-auto">
          {(["all", "admin", "member"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize ${
                roleFilter === r
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Members List */}
      {isLoadingMembers || isLoadingClubs ? (
        <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm">Loading club members...</p>
        </div>
      ) : filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const memberUsername = member.userId?.username || "Manager";
            const memberEmail = member.userId?.email || "";
            const isCurrentUser = member.userId?._id === user?._id;

            return (
              <Card
                key={member._id}
                className="rounded-xl border border-border bg-card p-4 shadow-none hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <CardHeader className="p-0 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border border-border">
                        <AvatarImage src={member.userId?.avatarUrl || ""} alt={memberUsername} />
                        <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                          {memberUsername.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-foreground leading-tight">
                            @{memberUsername}
                          </h4>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/40 text-primary font-bold">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MailIcon className="size-3" />
                          <span className="truncate max-w-[160px]">{memberEmail}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {member.role === "admin" ? (
                        <Badge variant="outline" className="border-purple-500/40 text-purple-400 bg-purple-500/10 text-[10px] font-bold gap-1 uppercase">
                          <CrownIcon className="size-3" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-border text-muted-foreground text-[10px] font-semibold uppercase">
                          Member
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CalendarIcon className="size-3 text-muted-foreground" />
                    <span>Member since {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "2026"}</span>
                  </span>

                  {/* Actions for Admin on other members */}
                  {isClubAdmin && !isCurrentUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(member);
                        setActionDrawerOpen(true);
                      }}
                      className="h-7 text-xs px-2 text-primary hover:bg-primary/10 font-bold gap-1 cursor-pointer"
                    >
                      <span>Manage</span>
                      <MoreVerticalIcon className="size-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-xl border border-border bg-card p-12 text-center shadow-none space-y-4 max-w-md mx-auto">
          <div className="size-12 mx-auto rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <UsersIcon className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Members Found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? "No members match your search criteria." : "No other members have joined this club workspace yet."}
            </p>
          </div>
        </Card>
      )}

      {/* 5. Member Management Sheet / Drawer */}
      <Sheet open={actionDrawerOpen} onOpenChange={setActionDrawerOpen}>
        <SheetContent side="right" className="bg-card border-l border-border p-6 flex flex-col justify-between w-full sm:max-w-md">
          <SheetHeader className="p-0 space-y-1.5">
            <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheckIcon className="size-5 text-primary" />
              Manage Member Privileges
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Update role privileges or remove member from @{currentClub?.name || "Club"}.
            </SheetDescription>
          </SheetHeader>

          {selectedMember && (
            <div className="space-y-6 my-auto">
              {/* Member Profile Card */}
              <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-center gap-3">
                <Avatar className="size-12 border border-border">
                  <AvatarImage src={selectedMember.userId?.avatarUrl || ""} alt={selectedMember.userId?.username} />
                  <AvatarFallback className="bg-primary/20 text-sm font-bold text-primary">
                    {selectedMember.userId?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-bold text-foreground">@{selectedMember.userId?.username}</h4>
                  <p className="text-xs text-muted-foreground">{selectedMember.userId?.email}</p>
                  <Badge variant="outline" className="text-[10px] mt-1.5 uppercase font-bold border-border">
                    Current Role: {selectedMember.role}
                  </Badge>
                </div>
              </div>

              {/* Action 1: Change Role */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <UserCheckIcon className="size-4 text-primary" /> Update Role
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Admins can create leagues, start snake drafts, and manage club members.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={selectedMember.role === "admin" ? "default" : "outline"}
                    size="sm"
                    disabled={updateRoleMutation.isPending}
                    onClick={() => handleUpdateRole(selectedMember.userId._id, "admin")}
                    className="text-xs h-9 font-bold cursor-pointer"
                  >
                    <CrownIcon className="size-3.5 mr-1" />
                    Admin
                  </Button>

                  <Button
                    type="button"
                    variant={selectedMember.role === "member" ? "default" : "outline"}
                    size="sm"
                    disabled={updateRoleMutation.isPending}
                    onClick={() => handleUpdateRole(selectedMember.userId._id, "member")}
                    className="text-xs h-9 font-bold cursor-pointer"
                  >
                    <UsersIcon className="size-3.5 mr-1" />
                    Member
                  </Button>
                </div>
              </div>

              {/* Action 2: Remove Member */}
              <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-destructive flex items-center gap-1.5">
                    <AlertTriangleIcon className="size-4" /> Danger Zone
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Removing this member revokes their access to all leagues and drafts in this club.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={removeMemberMutation.isPending}
                  onClick={() => handleRemoveMember(selectedMember.userId._id, selectedMember.userId.username)}
                  className="w-full text-xs font-bold h-9 cursor-pointer gap-1.5 shadow-none"
                >
                  {removeMemberMutation.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <UserMinusIcon className="size-3.5" />
                      Remove from Club
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <SheetFooter className="p-0 pt-4 border-t border-border flex flex-row items-center justify-between">
            <SheetClose render={<Button variant="ghost" size="sm" className="text-xs">Cancel</Button>} />
            <span className="text-[11px] text-muted-foreground">Admin Access Controls</span>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
