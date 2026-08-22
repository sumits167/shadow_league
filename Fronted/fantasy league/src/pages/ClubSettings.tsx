import { useState, useEffect, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  SettingsIcon,
  ShieldCheckIcon,
  GlobeIcon,
  LockIcon,
  Trash2Icon,
  SaveIcon,
  Loader2,
  SparklesIcon,
  Share2Icon,
  AlertTriangleIcon,
  CrownIcon,
  UsersIcon,
} from "lucide-react";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useMyClubs, useUpdateClub, useGenerateClubInviteCode } from "@/features/club/hooks/useClub";
import { useClubStore } from "@/store/clubStore";

export default function ClubSettings() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { data: clubs, isLoading: isLoadingClubs } = useMyClubs();
  const { activeClub, setActiveClub } = useClubStore();

  const currentClub = activeClub || clubs?.[0];
  const isClubAdmin =
    user?.role === "admin" ||
    currentClub?.userRole?.toLowerCase() === "admin" ||
    currentClub?.userRole?.toLowerCase() === "owner";

  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxLeagues, setMaxLeagues] = useState("10");

  const updateClubMutation = useUpdateClub();
  const generateInviteMutation = useGenerateClubInviteCode();

  useEffect(() => {
    if (currentClub) {
      setClubName(currentClub.name || "");
      setDescription(currentClub.description || "");
      setLogoUrl(currentClub.logoUrl || "");
      setIsPrivate(!!currentClub.isPrivate);
      setMaxLeagues(String(currentClub.settings?.maxLeagues || 10));
    }
  }, [currentClub]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClub?._id) return;
    if (!isClubAdmin) {
      toast.error("Only club administrators or owners can edit club settings.");
      return;
    }
    if (!clubName.trim()) {
      toast.error("Club name cannot be empty.");
      return;
    }

    try {
      const res = await updateClubMutation.mutateAsync({
        clubId: currentClub._id,
        payload: {
          name: clubName.trim(),
          description: description.trim(),
          logoUrl: logoUrl.trim(),
          isPrivate,
          settings: {
            maxLeagues: Number(maxLeagues) || 10,
          },
        },
      });

      if (res?.data) {
        setActiveClub({ ...currentClub, ...res.data });
      }
      toast.success("Club settings updated successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update club settings");
    }
  };

  if (isLoadingClubs) {
    return (
      <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Loading club settings...</p>
      </div>
    );
  }

  if (!currentClub) {
    return (
      <div className="p-12 text-center text-muted-foreground space-y-4">
        <AlertTriangleIcon className="size-8 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">No Active Club Found</h3>
        <p className="text-xs">Create or join a club first from the dashboard.</p>
        <Button onClick={() => navigate("/Dashboard")} size="sm">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const handleShareClub = async () => {
    if (!currentClub) return;

    if (currentClub.isPrivate) {
      try {
        const res = await generateInviteMutation.mutateAsync({ clubId: currentClub._id, expiresInHours: 24 });
        const inviteData = res?.data;
        if (inviteData?.code) {
          await navigator.clipboard?.writeText(inviteData.code);
          toast.success(`Single-use invite code copied: ${inviteData.code} (Expires in 24 hours)`);
        } else {
          toast.error("Failed to generate invite code");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to generate invite code");
      }
    } else {
      const slugToCopy = currentClub.slug;
      await navigator.clipboard?.writeText(slugToCopy);
      toast.success(`Public club slug copied: ${slugToCopy}`);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* 1. Header */}
      <div className="flex flex-col gap-3 pb-6 border-b border-border md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl flex items-center gap-2">
              <SettingsIcon className="size-6 text-primary" />
              <span>Club Settings &amp; Governance</span>
            </h1>
            <Badge
              variant="outline"
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 ${
                isClubAdmin
                  ? "border-green-500/40 text-green-400 bg-green-500/10"
                  : "border-border text-muted-foreground"
              }`}
            >
              {isClubAdmin ? "Admin Access" : "Member View"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your fantasy club identity, invite rules, security, and league capacity.
          </p>
        </div>

        {(!currentClub.isPrivate || isClubAdmin) && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareClub}
              title={currentClub.isPrivate ? "Copy Private Invite Code" : "Copy Public Club Slug"}
              className="gap-2 border-border text-foreground hover:bg-secondary cursor-pointer"
            >
              <Share2Icon className="size-3.5 text-muted-foreground" />
              <span>{currentClub.isPrivate ? "Copy Invite Code" : "Copy Club Slug"}</span>
            </Button>
          </div>
        )}
      </div>

      {/* 2. Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card 1: Club Identity */}
        <Card className="rounded-xl border border-border bg-card shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-primary" />
              Club Profile &amp; Identity
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Public information visible to all club members and league managers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="club-name" className="text-xs font-semibold text-foreground">
                Club Name
              </Label>
              <Input
                id="club-name"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                disabled={!isClubAdmin}
                className="bg-background border-border text-sm"
                placeholder="e.g. Apex Champions Club"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="club-desc" className="text-xs font-semibold text-foreground">
                Description &amp; Rules
              </Label>
              <textarea
                id="club-desc"
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                disabled={!isClubAdmin}
                rows={3}
                className="bg-background border border-border rounded-md px-3 py-2 text-xs resize-none w-full focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                placeholder="Describe your club community, tournaments, and fantasy format..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="club-logo" className="text-xs font-semibold text-foreground">
                Logo URL (Optional)
              </Label>
              <Input
                id="club-logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                disabled={!isClubAdmin}
                className="bg-background border-border text-xs"
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Privacy & Membership Settings */}
        <Card className="rounded-xl border border-border bg-card shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <GlobeIcon className="size-4 text-primary" />
              Access &amp; Security
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Control how new members discover and join your private tournaments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/20">
              <div className="space-y-0.5 pr-4">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  {isPrivate ? <LockIcon className="size-3.5 text-amber-400" /> : <GlobeIcon className="size-3.5 text-green-400" />}
                  Private Club (Invite Code Required)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {isPrivate
                    ? "Members can only join with an invite code or administrator direct invite."
                    : "Public club. Anyone with the club slug link can join immediately."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => isClubAdmin && setIsPrivate(!isPrivate)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  isPrivate ? "bg-primary" : "bg-secondary border border-border"
                } ${!isClubAdmin ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div
                  className={`bg-white size-4 rounded-full shadow-md transform transition-transform ${
                    isPrivate ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Slug or Invite Code Preview */}
            {(!isPrivate || isClubAdmin) && (
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/30 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    {isPrivate ? "Private Invite Code" : "Public Club Slug"}
                  </span>
                  <span className="font-mono font-bold text-foreground text-xs">
                    {isPrivate ? currentClub.inviteCode || "Auto-generated" : currentClub.slug}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleShareClub}
                  className="text-xs font-semibold gap-1.5 border-border hover:bg-secondary cursor-pointer h-7"
                >
                  <Share2Icon className="size-3 text-muted-foreground" />
                  <span>Copy {isPrivate ? "Code" : "Slug"}</span>
                </Button>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="max-leagues" className="text-xs font-semibold text-foreground">
                Maximum Active Leagues Limit
              </Label>
              <Input
                id="max-leagues"
                type="number"
                min="1"
                max="25"
                value={maxLeagues}
                onChange={(e) => setMaxLeagues(e.target.value)}
                disabled={!isClubAdmin}
                className="bg-background border-border text-xs w-36"
              />
              <p className="text-[11px] text-muted-foreground">
                Maximum simultaneous active tournament leagues allowed in this club.
              </p>
            </div>
          </CardContent>
          {isClubAdmin && (
            <CardFooter className="border-t border-border pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={updateClubMutation.isPending}
                className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs shadow-none gap-2 h-9"
              >
                {updateClubMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Saving Settings...
                  </>
                ) : (
                  <>
                    <SaveIcon className="size-3.5" />
                    Save Club Settings
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
    </div>
  );
}
