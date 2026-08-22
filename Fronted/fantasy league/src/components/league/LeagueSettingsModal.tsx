import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateLeague, useDeleteLeague } from "@/features/league/hooks/useLeague";
import { toast } from "sonner";
import {
  Settings2Icon,
  SaveIcon,
  Trash2Icon,
  AlertTriangleIcon,
  Loader2,
  CalendarIcon,
  UsersIcon,
  TrophyIcon,
  SparklesIcon,
  LockIcon,
} from "lucide-react";

export interface LeagueSettingsData {
  _id: string;
  name: string;
  season?: string;
  entryFee?: number;
  status?: string;
  settings?: {
    minTeams?: number;
    maxTeams?: number;
    prizePool?: {
      firstPlace?: number;
      secondPlace?: number;
      thirdPlace?: number;
    };
    rosterSize?: number;
    draftDate?: string;
  };
  draftState?: {
    scheduledStartTime?: string;
  };
}

interface LeagueSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  league: LeagueSettingsData | null;
  onSuccess?: () => void;
}

export function LeagueSettingsModal({
  open,
  onOpenChange,
  league,
  onSuccess,
}: LeagueSettingsModalProps) {
  const [leagueName, setLeagueName] = useState("");
  const [season, setSeason] = useState("2026");
  const [minTeams, setMinTeams] = useState("2");
  const [maxTeams, setMaxTeams] = useState("10");
  const [firstPlacePrize, setFirstPlacePrize] = useState("500");
  const [secondPlacePrize, setSecondPlacePrize] = useState("300");
  const [thirdPlacePrize, setThirdPlacePrize] = useState("150");
  const [draftDate, setDraftDate] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const updateLeagueMutation = useUpdateLeague();
  const deleteLeagueMutation = useDeleteLeague();

  useEffect(() => {
    if (league) {
      setLeagueName(league.name || "");
      setSeason(league.season || "2026");
      setMinTeams(String(league.settings?.minTeams || 2));
      setMaxTeams(String(league.settings?.maxTeams || 10));
      setFirstPlacePrize(String(league.settings?.prizePool?.firstPlace ?? 500));
      setSecondPlacePrize(String(league.settings?.prizePool?.secondPlace ?? 300));
      setThirdPlacePrize(String(league.settings?.prizePool?.thirdPlace ?? 150));

      const scheduledTime = league.draftState?.scheduledStartTime || league.settings?.draftDate;
      if (scheduledTime) {
        setDraftDate(new Date(scheduledTime).toISOString().slice(0, 16));
      } else {
        setDraftDate("");
      }
      setIsConfirmingDelete(false);
    }
  }, [league, open]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!league?._id) return;
    if (!leagueName.trim()) {
      toast.error("Please enter a valid league name");
      return;
    }

    const minT = Number(minTeams) || 2;
    const maxT = Number(maxTeams) || 10;
    if (minT > maxT) {
      toast.error("Minimum teams cannot be greater than Maximum teams!");
      return;
    }

    const p1 = Number(firstPlacePrize) || 0;
    const p2 = Number(secondPlacePrize) || 0;
    const p3 = Number(thirdPlacePrize) || 0;

    if (p1 <= p2 || p2 <= p3 || p3 < 0) {
      toast.error("Invalid Prize Pool: 1st Place points must be greater than 2nd Place, and 2nd Place must be greater than 3rd Place!");
      return;
    }

    try {
      await updateLeagueMutation.mutateAsync({
        leagueId: league._id,
        payload: {
          name: leagueName.trim(),
          season: season.trim(),
          settings: {
            minTeams: minT,
            maxTeams: maxT,
            prizePool: {
              firstPlace: p1,
              secondPlace: p2,
              thirdPlace: p3,
            },
            draftDate: draftDate ? new Date(draftDate).toISOString() : undefined,
          },
        },
      });
      toast.success("League settings & prize pool saved successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update league settings");
    }
  };

  const handleDelete = async () => {
    if (!league?._id) return;

    try {
      await deleteLeagueMutation.mutateAsync(league._id);
      toast.success(`League "${league.name}" deleted successfully.`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete league");
    }
  };

  if (!league) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-card border-l border-border p-6 flex flex-col justify-between w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="p-0 space-y-1.5 border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Settings2Icon className="size-5 text-primary" />
              League Settings
            </SheetTitle>
            <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/40 text-primary">
              {league.status || "Created"}
            </Badge>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Configure capacity, rules, schedule, and Shadow League Points prize pool for <strong>{league.name}</strong>.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleUpdate} className="space-y-4 my-auto py-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-league-name" className="text-xs font-semibold text-foreground">
              League Name
            </Label>
            <Input
              id="edit-league-name"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className="bg-background border-border text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-season" className="text-xs font-semibold text-foreground">
                Season
              </Label>
              <Input
                id="edit-season"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="bg-background border-border text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <LockIcon className="size-3 text-muted-foreground" /> Entry Fee (Locked)
              </Label>
              <div className="h-9 px-3 rounded-md border border-border bg-secondary/40 flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  {league.entryFee && league.entryFee > 0 ? `₹${league.entryFee}` : "Free (₹0)"}
                </span>
                <Badge variant="outline" className="text-[9px] uppercase border-border text-muted-foreground font-semibold">
                  Fixed
                </Badge>
              </div>
            </div>
          </div>

          {/* Min & Max Teams Capacity */}
          <div className="p-3 rounded-xl border border-border bg-secondary/20 space-y-2">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <UsersIcon className="size-3.5 text-primary" /> Teams Capacity Rules
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-min-teams" className="text-[11px] text-muted-foreground">
                  Min Teams to Start Draft
                </Label>
                <Input
                  id="edit-min-teams"
                  type="number"
                  min="2"
                  max="20"
                  value={minTeams}
                  onChange={(e) => setMinTeams(e.target.value)}
                  className="bg-background border-border text-xs h-8"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-max-teams" className="text-[11px] text-muted-foreground">
                  Max Teams Limit
                </Label>
                <Input
                  id="edit-max-teams"
                  type="number"
                  min="2"
                  max="20"
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(e.target.value)}
                  className="bg-background border-border text-xs h-8"
                  required
                />
              </div>
            </div>
          </div>

          {/* Shadow League Points Prize Pool */}
          <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <TrophyIcon className="size-3.5 text-primary" /> Shadow League Points Prize Pool
              </Label>
              <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">
                Points (SLP)
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Rule: 1st Place &gt; 2nd Place &gt; 3rd Place points.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="space-y-1">
                <Label htmlFor="prize-p1" className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  🥇 1st Place
                </Label>
                <Input
                  id="prize-p1"
                  type="number"
                  min="1"
                  value={firstPlacePrize}
                  onChange={(e) => setFirstPlacePrize(e.target.value)}
                  className="bg-background border-border text-xs h-8 text-amber-400 font-bold"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prize-p2" className="text-[10px] text-slate-300 font-bold flex items-center gap-1">
                  🥈 2nd Place
                </Label>
                <Input
                  id="prize-p2"
                  type="number"
                  min="1"
                  value={secondPlacePrize}
                  onChange={(e) => setSecondPlacePrize(e.target.value)}
                  className="bg-background border-border text-xs h-8 text-slate-300 font-bold"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prize-p3" className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                  🥉 3rd Place
                </Label>
                <Input
                  id="prize-p3"
                  type="number"
                  min="0"
                  value={thirdPlacePrize}
                  onChange={(e) => setThirdPlacePrize(e.target.value)}
                  className="bg-background border-border text-xs h-8 text-amber-600 font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-draft-date" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 text-primary" /> Scheduled Draft Date &amp; Time
            </Label>
            <Input
              id="edit-draft-date"
              type="datetime-local"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="bg-background border-border text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Draft will auto-start countdown for all participants at this scheduled time.
            </p>
          </div>

          {/* Danger Zone: Delete League */}
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2 pt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
              <AlertTriangleIcon className="size-4" /> Danger Zone
            </div>
            <p className="text-[11px] text-muted-foreground">
              Deleting this league will permanently remove all member teams, draft rosters, and scores.
            </p>
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteLeagueMutation.isPending}
                  className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold h-7 cursor-pointer"
                >
                  {deleteLeagueMutation.isPending ? "Deleting..." : "Yes, Delete League"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="text-xs h-7 text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsConfirmingDelete(true)}
                className="text-xs h-7 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 cursor-pointer gap-1.5"
              >
                <Trash2Icon className="size-3.5" />
                <span>Delete League</span>
              </Button>
            )}
          </div>

          <Button
            type="submit"
            disabled={updateLeagueMutation.isPending}
            className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs h-9 cursor-pointer shadow-none gap-1.5"
          >
            {updateLeagueMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <SaveIcon className="size-3.5" />
                Save League Settings
              </>
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
