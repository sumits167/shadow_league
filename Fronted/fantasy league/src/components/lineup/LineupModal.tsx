import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubmitLineup } from "@/features/team/hooks/useTeam";
import { toast } from "sonner";
import {
  ShieldCheckIcon,
  CrownIcon,
  ZapIcon,
  SparklesIcon,
  CheckCircle2Icon,
  Loader2,
  AlertCircleIcon,
  UsersIcon,
  LockIcon,
  XCircleIcon,
  PlusIcon,
} from "lucide-react";

export interface LineupPlayer {
  _id?: string;
  id: string;
  name: string;
  realTeam: string;
  position: "BAT" | "BOWL" | "AR" | "WK" | string;
  price: number;
}

interface LineupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  leagueId: string;
  draftedPlayers: LineupPlayer[];
  initialSelectedIds?: string[];
  initialCaptainId?: string;
  initialViceCaptainId?: string;
  isMatchStarted?: boolean;
  onSuccess?: () => void;
}

export function LineupModal({
  open,
  onOpenChange,
  teamId,
  leagueId,
  draftedPlayers = [],
  initialSelectedIds = [],
  initialCaptainId = "",
  initialViceCaptainId = "",
  isMatchStarted = false,
  onSuccess,
}: LineupModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string>("");
  const [viceCaptainId, setViceCaptainId] = useState<string>("");
  const [filterPos, setFilterPos] = useState<string>("ALL");

  const submitLineupMutation = useSubmitLineup();

  // Populate from initial selections when opened without auto-wiping user picks
  useEffect(() => {
    if (!open) return;

    if (initialSelectedIds && initialSelectedIds.length > 0) {
      setSelectedIds(initialSelectedIds);
      if (initialCaptainId) setCaptainId(initialCaptainId);
      if (initialViceCaptainId) setViceCaptainId(initialViceCaptainId);
    }
  }, [open, initialSelectedIds, initialCaptainId, initialViceCaptainId]);

  // Smart Auto-Fill helper (only triggered when explicitly clicked)
  const handleAutoFillClick = () => {
    if (!draftedPlayers || draftedPlayers.length === 0) {
      toast.error("No drafted squad players found.");
      return;
    }

    const wks = draftedPlayers.filter((p) => p.position === "WK").sort((a, b) => b.price - a.price);
    const bats = draftedPlayers.filter((p) => p.position === "BAT").sort((a, b) => b.price - a.price);
    const ars = draftedPlayers.filter((p) => p.position === "AR").sort((a, b) => b.price - a.price);
    const bowls = draftedPlayers.filter((p) => p.position === "BOWL").sort((a, b) => b.price - a.price);

    const picked: LineupPlayer[] = [];
    const added = new Set<string>();

    const add = (p: LineupPlayer) => {
      const pId = p.id || p._id || "";
      if (pId && !added.has(pId) && picked.length < 11) {
        picked.push(p);
        added.add(pId);
      }
    };

    if (wks.length > 0) add(wks[0]);
    bats.slice(0, 3).forEach(add);
    ars.slice(0, 1).forEach(add);
    bowls.slice(0, 3).forEach(add);

    // Fill remaining to 11 with highest priced players
    const remaining = [...draftedPlayers].sort((a, b) => b.price - a.price);
    for (const p of remaining) {
      if (picked.length >= 11) break;
      add(p);
    }

    const ids = picked.map((p) => p.id || p._id || "");
    setSelectedIds(ids);

    const sortedByPrice = [...picked].sort((a, b) => b.price - a.price);
    if (sortedByPrice[0]) setCaptainId(sortedByPrice[0].id || sortedByPrice[0]._id || "");
    if (sortedByPrice[1]) setViceCaptainId(sortedByPrice[1].id || sortedByPrice[1]._id || "");

    toast.success("Optimal Starting 11 auto-filled!");
  };

  const toggleSelectPlayer = (player: LineupPlayer) => {
    if (isMatchStarted) return;
    const pId = player.id || player._id || "";
    if (!pId) return;

    if (selectedIds.includes(pId)) {
      setSelectedIds((prev) => prev.filter((id) => id !== pId));
      if (captainId === pId) setCaptainId("");
      if (viceCaptainId === pId) setViceCaptainId("");
    } else {
      if (selectedIds.length >= 11) {
        toast.error("11 players already selected! Unselect a player first.");
        return;
      }
      setSelectedIds((prev) => [...prev, pId]);
      if (!captainId) setCaptainId(pId);
      else if (!viceCaptainId && captainId !== pId) setViceCaptainId(pId);
    }
  };

  const setCaptain = (pId: string) => {
    if (isMatchStarted) return;
    if (!selectedIds.includes(pId)) return;
    if (viceCaptainId === pId) setViceCaptainId("");
    setCaptainId(pId);
    toast.info("Captain (2x Multiplier) updated!");
  };

  const setViceCaptain = (pId: string) => {
    if (isMatchStarted) return;
    if (!selectedIds.includes(pId)) return;
    if (captainId === pId) setCaptainId("");
    setViceCaptainId(pId);
    toast.info("Vice-Captain (1.5x Multiplier) updated!");
  };

  // Validation
  const selectedPlayers = draftedPlayers.filter((p) => selectedIds.includes(p.id || p._id || ""));
  const wkCount = selectedPlayers.filter((p) => p.position === "WK").length;
  const batCount = selectedPlayers.filter((p) => p.position === "BAT").length;
  const arCount = selectedPlayers.filter((p) => p.position === "AR").length;
  const bowlCount = selectedPlayers.filter((p) => p.position === "BOWL").length;

  const isValidCount = selectedIds.length === 11;
  const hasCap = !!captainId;
  const hasVC = !!viceCaptainId && viceCaptainId !== captainId;
  const hasMinWK = wkCount >= 1;
  const hasMinBAT = batCount >= 3;
  const hasMinAR = arCount >= 1;
  const hasMinBOWL = bowlCount >= 3;
  const isLineupValid = isValidCount && hasCap && hasVC && hasMinWK && hasMinBAT && hasMinAR && hasMinBOWL;

  const handleSubmit = async () => {
    if (!teamId) {
      toast.error("No fantasy team found for this league.");
      return;
    }
    if (isMatchStarted) {
      toast.error("Match is already in progress! Lineup modifications are locked.");
      return;
    }
    if (!isLineupValid) {
      toast.error("Please select 11 players (min 1 WK, 3 BAT, 1 AR, 3 BOWL) with Captain & Vice-Captain assigned.");
      return;
    }

    try {
      await submitLineupMutation.mutateAsync({
        teamId,
        matchWeek: 1,
        playerIds: selectedIds,
        captainId,
        viceCaptainId,
      });
      toast.success("Starting 11 lineup saved & locked successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save lineup");
    }
  };

  const filteredDrafted = draftedPlayers.filter((p) => filterPos === "ALL" || p.position === filterPos);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-card border-l border-border p-6 flex flex-col justify-between w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="p-0 space-y-1.5 border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <ShieldCheckIcon className="size-5 text-primary" />
              Starting 11 Lineup Selector
            </SheetTitle>
            {!isMatchStarted && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAutoFillClick}
                className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10 h-7 cursor-pointer"
              >
                <SparklesIcon className="size-3.5" />
                <span>Auto-Fill 11</span>
              </Button>
            )}
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            {isMatchStarted
              ? "Match in progress. Below is your active starting 11 lineup and multipliers."
              : "Choose 11 starters from your 15 drafted squad. Assign Captain (2x) & Vice-Captain (1.5x) before the match starts."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 my-auto py-4">
          {/* Status & Position Counter Banner */}
          <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <UsersIcon className="size-4 text-primary" />
                Selected: <span className={selectedIds.length === 11 ? "text-green-400 font-extrabold" : "text-amber-400 font-extrabold"}>{selectedIds.length}/11 Players</span>
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${captainId ? "border-amber-500/40 text-amber-400 bg-amber-500/10" : "border-border text-muted-foreground"}`}>
                  C (2x): {captainId ? "Assigned" : "Required"}
                </Badge>
                <Badge variant="outline" className={`text-[10px] ${viceCaptainId ? "border-indigo-500/40 text-indigo-400 bg-indigo-500/10" : "border-border text-muted-foreground"}`}>
                  VC (1.5x): {viceCaptainId ? "Assigned" : "Required"}
                </Badge>
              </div>
            </div>

            {/* Position balance pills */}
            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              <div className={`p-1 rounded-lg border ${wkCount >= 1 ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-border text-muted-foreground"}`}>
                WK: {wkCount}/1+
              </div>
              <div className={`p-1 rounded-lg border ${batCount >= 3 ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-border text-muted-foreground"}`}>
                BAT: {batCount}/3+
              </div>
              <div className={`p-1 rounded-lg border ${arCount >= 1 ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-border text-muted-foreground"}`}>
                AR: {arCount}/1+
              </div>
              <div className={`p-1 rounded-lg border ${bowlCount >= 3 ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-border text-muted-foreground"}`}>
                BOWL: {bowlCount}/3+
              </div>
            </div>
          </div>

          {/* Position Filters */}
          <div className="flex items-center gap-1 bg-secondary/20 p-1 rounded-lg border border-border">
            {["ALL", "WK", "BAT", "AR", "BOWL"].map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setFilterPos(pos)}
                className={`flex-1 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  filterPos === pos ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* 15 Drafted Players List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredDrafted.map((player) => {
              const pId = player.id || player._id || "";
              const isSelected = selectedIds.includes(pId);
              const isCap = captainId === pId;
              const isVC = viceCaptainId === pId;

              return (
                <div
                  key={pId}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-primary/50 bg-primary/5 shadow-sm"
                      : "border-border/60 bg-card hover:border-border"
                  }`}
                >
                  <div
                    onClick={() => toggleSelectPlayer(player)}
                    className={`flex items-center gap-3 flex-1 ${isMatchStarted ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div
                      className={`size-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-background"
                      }`}
                    >
                      {isSelected && <CheckCircle2Icon className="size-3.5" />}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{player.name}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-border text-muted-foreground">
                          {player.realTeam}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-primary">{player.position}</span>
                        <span>•</span>
                        <span>₹{player.price} Cr</span>
                      </div>
                    </div>
                  </div>

                  {/* Captain & Vice-Captain Selectors */}
                  {isSelected ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isMatchStarted}
                        onClick={() => setCaptain(pId)}
                        title="Assign as Captain (2x Points)"
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 border ${
                          isCap
                            ? "bg-amber-500 text-black border-amber-400 font-extrabold shadow-sm"
                            : "border-border text-muted-foreground hover:text-amber-400 hover:border-amber-500/40 cursor-pointer"
                        } ${isMatchStarted ? "cursor-default" : ""}`}
                      >
                        <CrownIcon className="size-3" /> C (2x)
                      </button>

                      <button
                        type="button"
                        disabled={isMatchStarted}
                        onClick={() => setViceCaptain(pId)}
                        title="Assign as Vice-Captain (1.5x Points)"
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 border ${
                          isVC
                            ? "bg-indigo-600 text-white border-indigo-400 font-extrabold shadow-sm"
                            : "border-border text-muted-foreground hover:text-indigo-400 hover:border-indigo-500/40 cursor-pointer"
                        } ${isMatchStarted ? "cursor-default" : ""}`}
                      >
                        <ZapIcon className="size-3" /> VC (1.5x)
                      </button>

                      {!isMatchStarted && (
                        <button
                          type="button"
                          onClick={() => toggleSelectPlayer(player)}
                          title="Remove from 11"
                          className="p-1 rounded text-muted-foreground hover:text-rose-400 cursor-pointer"
                        >
                          <XCircleIcon className="size-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    !isMatchStarted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleSelectPlayer(player)}
                        disabled={selectedIds.length >= 11}
                        className="text-[10px] h-6 px-2 border-border text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                      >
                        <PlusIcon className="size-3" /> Select
                      </Button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: Hidden/Locked when match is live (Item 2 Requirement) */}
        <SheetFooter className="p-0 pt-4 border-t border-border flex flex-col gap-2">
          {isMatchStarted ? (
            <div className="p-3 rounded-xl border border-green-500/40 bg-green-500/10 text-center space-y-1">
              <span className="text-xs font-bold text-green-400 flex items-center justify-center gap-1.5">
                <LockIcon className="size-3.5" /> Match In Progress • Lineup Locked
              </span>
              <p className="text-[10px] text-muted-foreground">
                Your Starting 11 and Captain multipliers are locked and accumulating fantasy points live.
              </p>
            </div>
          ) : (
            <>
              {!isLineupValid && (
                <div className="text-[11px] text-amber-400 flex items-center gap-1.5">
                  <AlertCircleIcon className="size-3.5 shrink-0" />
                  <span>Select exactly 11 players, min 1 WK, 3 BAT, 1 AR, 3 BOWL with C (2x) & VC (1.5x).</span>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!isLineupValid || submitLineupMutation.isPending}
                className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-10 cursor-pointer shadow-none text-xs"
              >
                {submitLineupMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Saving Lineup...
                  </>
                ) : (
                  "Confirm & Lock Starting 11"
                )}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
