import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeftRightIcon, ZapIcon } from "lucide-react";

export interface PlayerProps {
  id: string;
  name: string;
  team: string;
  role: "Batsman" | "Bowler" | "All-Rounder" | "Wicket Keeper";
  avatar?: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  status: "Playing" | "Upcoming" | "Finished" | "Injured";
  weekPoints: number;
  seasonPoints?: number;
  isBench?: boolean;
  onAction?: () => void;
  onSetCaptain?: () => void;
  onSetViceCaptain?: () => void;
}

export function PlayerCard({
  name,
  team,
  role,
  avatar,
  isCaptain,
  isViceCaptain,
  status,
  weekPoints,
  seasonPoints,
  isBench = false,
  onAction,
  onSetCaptain,
  onSetViceCaptain,
}: PlayerProps) {
  return (
    <Card className={`rounded-xl border bg-card shadow-none transition-all ${
      isCaptain
        ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40"
        : isViceCaptain
        ? "border-amber-500/40 bg-amber-500/5 ring-1 ring-amber-500/30"
        : isBench
        ? "border-border/60 bg-secondary/20"
        : "border-border hover:border-border/80"
    }`}>
      <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
        {/* Player info & avatar */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative shrink-0">
            <Avatar className="size-11 border border-border">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-secondary text-xs font-bold text-foreground">
                {name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isCaptain && (
              <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-[10px] shadow-none" title="Captain (2x Points)">
                C
              </span>
            )}
            {isViceCaptain && (
              <span className="absolute -top-1 -right-1 size-5 rounded-full bg-amber-500 text-black flex items-center justify-center font-extrabold text-[10px] shadow-none" title="Vice Captain (1.5x Points)">
                VC
              </span>
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-foreground truncate leading-tight">
                {name}
              </h3>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground font-normal">
                {team}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
              <span className="font-medium text-foreground">{role}</span>
              <span>•</span>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 font-semibold uppercase ${
                  status === "Playing"
                    ? "border-green-500/40 text-green-400 bg-green-500/10"
                    : status === "Upcoming"
                    ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                    : status === "Injured"
                    ? "border-red-500/40 text-red-400 bg-red-500/10"
                    : "border-border text-muted-foreground bg-secondary"
                }`}
              >
                {status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Multiplier tags & actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!isBench && (
            <div className="flex items-center gap-1">
              <Button
                variant={isCaptain ? "default" : "outline"}
                size="sm"
                onClick={onSetCaptain}
                className={`h-7 px-2 text-[10px] font-bold cursor-pointer transition-all ${
                  isCaptain
                    ? "bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                title="Make Captain (2x Points)"
              >
                C (2x)
              </Button>
              <Button
                variant={isViceCaptain ? "default" : "outline"}
                size="sm"
                onClick={onSetViceCaptain}
                className={`h-7 px-2 text-[10px] font-bold cursor-pointer transition-all ${
                  isViceCaptain
                    ? "bg-amber-500 text-black font-extrabold"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                title="Make Vice-Captain (1.5x Points)"
              >
                VC (1.5x)
              </Button>
            </div>
          )}

          <div className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Zap className="size-3 text-primary" />
              <span className="text-sm font-extrabold text-foreground tabular-nums">
                {isCaptain ? weekPoints * 2 : isViceCaptain ? Math.round(weekPoints * 1.5) : weekPoints} pts
              </span>
            </div>
            {seasonPoints !== undefined && (
              <p className="text-[10px] text-muted-foreground">Season: {seasonPoints}</p>
            )}
          </div>

          {onAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAction}
              className="h-7 px-2 text-xs border-border hover:bg-secondary text-foreground cursor-pointer"
              title={isBench ? "Promote to Starting XI" : "Swap with bench"}
            >
              <ArrowLeftRightIcon className="size-3.5 sm:mr-1" />
              <span className="hidden sm:inline">{isBench ? "Promote" : "Swap"}</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Zap({ className }: { className?: string }) {
  return <ZapIcon className={className} />;
}
