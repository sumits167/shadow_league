import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrophyIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon, EyeIcon } from "lucide-react"

export interface FullLeaderboardItem {
  rank: number
  teamName: string
  manager: string
  avatar?: string
  points: number
  wins: number
  losses: number
  rankChange: number // >0 for up, <0 for down, 0 for no change
  isCurrentUser?: boolean
}

const defaultStandings: FullLeaderboardItem[] = [
  {
    rank: 1,
    teamName: "Gotham Knights",
    manager: "Bruce Wayne",
    points: 1142.5,
    wins: 7,
    losses: 1,
    rankChange: 0,
    isCurrentUser: false,
  },
  {
    rank: 2,
    teamName: "Sumit's Army",
    manager: "Sumit (You)",
    points: 1055.0,
    wins: 6,
    losses: 2,
    rankChange: 2,
    isCurrentUser: true,
  },
  {
    rank: 3,
    teamName: "Cyber Vipers",
    manager: "Sarah Connor",
    points: 1045.2,
    wins: 5,
    losses: 3,
    rankChange: -1,
    isCurrentUser: false,
  },
  {
    rank: 4,
    teamName: "Metro Express",
    manager: "Clark Kent",
    points: 982.0,
    wins: 4,
    losses: 4,
    rankChange: 1,
    isCurrentUser: false,
  },
  {
    rank: 5,
    teamName: "Star City Arrows",
    manager: "Oliver Queen",
    points: 915.6,
    wins: 3,
    losses: 5,
    rankChange: -1,
    isCurrentUser: false,
  },
  {
    rank: 6,
    teamName: "Central City Flash",
    manager: "Barry Allen",
    points: 890.4,
    wins: 3,
    losses: 5,
    rankChange: 0,
    isCurrentUser: false,
  },
]

interface LeaderboardTableFullProps {
  items?: FullLeaderboardItem[]
  onViewTeam?: (item: FullLeaderboardItem) => void
  className?: string
}

export function LeaderboardTableFull({
  items = defaultStandings,
  onViewTeam,
  className = "",
}: LeaderboardTableFullProps) {
  return (
    <Card className={`rounded-xl border border-border bg-card shadow-none ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrophyIcon className="size-4 text-primary" />
            Official League Standings
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Rankings updated live after Week 3 completion
          </CardDescription>
        </div>
        <Badge variant="outline" className="border-border text-muted-foreground text-xs font-normal">
          {items.length} Teams
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-16 text-center text-xs font-bold text-muted-foreground">Rank</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground">Team & Manager</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground">Total Points</TableHead>
                <TableHead className="text-center text-xs font-bold text-muted-foreground">W - L</TableHead>
                <TableHead className="text-center text-xs font-bold text-muted-foreground">Trend</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const getMedal = (rank: number) => {
                  if (rank === 1) return "🥇"
                  if (rank === 2) return "🥈"
                  if (rank === 3) return "🥉"
                  return null
                }
                const medal = getMedal(item.rank)

                return (
                  <TableRow
                    key={item.rank}
                    className={`border-border transition-colors ${
                      item.isCurrentUser
                        ? "bg-primary/10 font-medium hover:bg-primary/15 border-l-4 border-l-primary"
                        : "hover:bg-secondary/20"
                    }`}
                  >
                    {/* Rank */}
                    <TableCell className="text-center font-bold text-xs">
                      <div className="flex items-center justify-center gap-1">
                        {medal ? (
                          <span className="text-base leading-none">{medal}</span>
                        ) : (
                          <span className="inline-flex size-6 items-center justify-center rounded-full bg-secondary text-muted-foreground text-xs font-bold">
                            {item.rank}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Team & Manager */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 border border-border">
                          <AvatarImage src={item.avatar} alt={item.teamName} />
                          <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                            {item.teamName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[160px] sm:max-w-[220px]">
                              {item.teamName}
                            </p>
                            {item.isCurrentUser && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/40 text-primary bg-primary/10">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{item.manager}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Total Points */}
                    <TableCell className="text-right font-extrabold text-xs sm:text-sm text-foreground tabular-nums">
                      {item.points.toFixed(1)} pts
                    </TableCell>

                    {/* W-L Record */}
                    <TableCell className="text-center text-xs font-medium text-foreground">
                      {item.wins} - {item.losses}
                    </TableCell>

                    {/* Rank Change */}
                    <TableCell className="text-center">
                      {item.rankChange > 0 ? (
                        <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400 bg-green-500/10 px-1.5 font-bold">
                          <TrendingUpIcon className="mr-0.5 size-3 inline" /> ↑{item.rankChange}
                        </Badge>
                      ) : item.rankChange < 0 ? (
                        <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400 bg-red-500/10 px-1.5 font-bold">
                          <TrendingDownIcon className="mr-0.5 size-3 inline" /> ↓{Math.abs(item.rankChange)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground bg-secondary px-1.5">
                          <MinusIcon className="mr-0.5 size-3 inline" /> -
                        </Badge>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewTeam?.(item)}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                      >
                        <EyeIcon className="size-3.5" />
                        <span className="hidden sm:inline">View Team</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
