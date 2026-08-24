import * as React from "react"
import { Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TrophyIcon, UsersIcon, ClockIcon, MoreVerticalIcon, ArrowRightIcon } from "lucide-react"

export interface ActiveLeagueProps {
  id: string
  name: string
  rank: number
  totalMembers: number
  totalPoints: number
  deadline: string
  status: "LIVE" | "UPCOMING" | "DRAFT" | "COMPLETED" | string
  hasJoined?: boolean
}

export function ActiveLeagueCard({
  id,
  name,
  rank,
  totalMembers,
  totalPoints,
  deadline,
  status,
  hasJoined = false,
}: ActiveLeagueProps) {
  const normStatus = (status || "UPCOMING").toUpperCase();
  const isCreatedOrUpcoming = normStatus === "UPCOMING" || normStatus === "CREATED";

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-none flex flex-col justify-between hover:border-primary/40 transition-colors p-6 pb-6 space-y-4">
      <CardHeader className="p-0 flex flex-row items-start justify-between space-y-0 pb-1">
        <div className="space-y-1 pr-2">
          <div className="flex items-center gap-2">
            <TrophyIcon className="size-4 text-primary shrink-0" />
            <CardTitle className="text-base font-bold text-foreground truncate max-w-[200px]">
              {name}
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            {hasJoined ? (
              <>Rank <span className="font-semibold text-foreground">#{rank}</span> of {totalMembers} Managers</>
            ) : (
              <span className="text-muted-foreground">{totalMembers} Max Teams</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={`text-[10px] font-bold uppercase tracking-wider ${
              normStatus === "LIVE" || normStatus === "ACTIVE"
                ? "border-green-500/40 text-green-400 bg-green-500/10"
                : normStatus === "DRAFT" || normStatus === "DRAFTING"
                ? "border-purple-500/40 text-purple-400 bg-purple-500/10 animate-pulse"
                : normStatus === "UPCOMING" || normStatus === "CREATED"
                ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                : "border-border text-muted-foreground bg-secondary"
            }`}
          >
            {normStatus === "DRAFT" ? "DRAFT LIVE" : normStatus}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground">
                  <MoreVerticalIcon className="size-4" />
                  <span className="sr-only">More options</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-40 border-border bg-card text-foreground">
              <DropdownMenuItem className="cursor-pointer text-xs">View Roster</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs">League Rules</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs">Standings History</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-0 py-1 space-y-3">
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-secondary/30 border border-border/50 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase font-medium">Total Points</span>
            <span className="font-bold text-foreground text-sm tabular-nums">{totalPoints.toFixed(1)} pts</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase font-medium">Capacity</span>
            <span className="font-semibold text-foreground text-sm flex items-center gap-1">
              <UsersIcon className="size-3 text-muted-foreground" />
              {totalMembers}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-[11px]">
            <ClockIcon className="size-3.5 text-primary" />
            Deadline: <span className="font-medium text-foreground">{deadline}</span>
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-0 pt-3 mt-auto">
        {hasJoined ? (
          <Link to={`/Dashboard/League/${id}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full justify-between text-xs border-primary/40 text-primary hover:bg-primary/10 font-semibold cursor-pointer h-9">
              <span>View League</span>
              <ArrowRightIcon className="size-3.5 text-primary" />
            </Button>
          </Link>
        ) : isCreatedOrUpcoming ? (
          <Link to={`/Dashboard/League/${id}`} className="w-full">
            <Button size="sm" className="w-full justify-between text-xs bg-primary text-primary-foreground font-bold hover:bg-primary/90 cursor-pointer h-9 shadow-none">
              <span>Join League</span>
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </Link>
        ) : (
          <Button
            disabled
            size="sm"
            title="Registration is closed for this league because the draft or match is already in progress."
            className="w-full justify-center text-xs bg-secondary text-muted-foreground font-semibold cursor-not-allowed border border-border h-9"
          >
            <span>
              {normStatus === "DRAFT"
                ? "Draft in Progress (Closed)"
                : normStatus === "COMPLETED"
                ? "Season Completed"
                : "Registration Closed"}
            </span>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
