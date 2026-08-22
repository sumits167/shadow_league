import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ClockIcon, AlertCircleIcon, ShieldAlertIcon, SwordsIcon, ArrowLeftRightIcon } from "lucide-react"

export interface LeagueEvent {
  id: string
  leagueName: string
  title: string
  date: string
  time: string
  statusBadge: string
  badgeVariant: "green" | "amber" | "muted"
  icon: any
}

const defaultEvents: LeagueEvent[] = [
  {
    id: "e1",
    leagueName: "IPL Season 2026",
    title: "Team Lock Window",
    date: "Thu, Jul 30",
    time: "7:30 PM EST",
    statusBadge: "In 4 hrs",
    badgeVariant: "amber",
    icon: ShieldAlertIcon,
  },
  {
    id: "e2",
    leagueName: "IPL Season 2026",
    title: "Match Starts: MI vs CSK",
    date: "Thu, Jul 30",
    time: "8:00 PM EST",
    statusBadge: "In 4.5 hrs",
    badgeVariant: "green",
    icon: SwordsIcon,
  },
  {
    id: "e3",
    leagueName: "IPL Season 2026",
    title: "Waiver Processing",
    date: "Fri, Jul 31",
    time: "3:00 AM EST",
    statusBadge: "Tomorrow",
    badgeVariant: "muted",
    icon: ClockIcon,
  },
  {
    id: "e4",
    leagueName: "IPL Season 2026",
    title: "Trade Deadline",
    date: "Sun, Aug 2",
    time: "11:59 PM EST",
    statusBadge: "In 3 days",
    badgeVariant: "muted",
    icon: ArrowLeftRightIcon,
  },
]

interface LeagueEventsTimelineProps {
  events?: LeagueEvent[]
  className?: string
}

export function LeagueEventsTimeline({
  events = defaultEvents,
  className = "",
}: LeagueEventsTimelineProps) {
  return (
    <Card className={`rounded-xl border border-border bg-card shadow-none ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <ClockIcon className="size-4 text-primary" />
            Upcoming Deadlines & Events
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Nearest league events and lock windows
          </CardDescription>
        </div>
        <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
          {events.length} Events
        </Badge>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <div className="relative pl-4 space-y-4 border-l border-border/60">
          {events.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.id} className="relative group">
                <div
                  className={`absolute -left-[21px] top-1 size-2.5 rounded-full border-2 bg-card ${item.badgeVariant === "amber"
                      ? "border-amber-500 bg-amber-500/20 animate-pulse"
                      : item.badgeVariant === "green"
                        ? "border-green-500 bg-green-500/20"
                        : "border-primary"
                    }`}
                />

                <div className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-secondary/20 border border-border/40 hover:border-border transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="size-3.5 text-primary shrink-0" />
                      <p className="text-xs font-bold text-foreground leading-none">{item.title}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="size-3 text-muted-foreground" />
                        {item.date}
                      </span>
                      <span>•</span>
                      <span>{item.time}</span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 shrink-0 ${item.badgeVariant === "amber"
                        ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                        : item.badgeVariant === "green"
                          ? "border-green-500/40 text-green-400 bg-green-500/10"
                          : "border-border text-muted-foreground bg-secondary"
                      }`}
                  >
                    {item.badgeVariant === "amber" && <AlertCircleIcon className="mr-1 size-3 text-amber-400" />}
                    {item.statusBadge}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
