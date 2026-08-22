import * as React from "react"
import { Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ClockIcon, AlertCircleIcon, CheckCircle2Icon } from "lucide-react"

export interface DeadlineItem {
  id: string
  leagueName: string
  date: string
  time: string
  timeRemaining: string
  isUrgent?: boolean
}

const defaultDeadlines: DeadlineItem[] = [
  {
    id: "1",
    leagueName: "ShadowLeague Premier",
    date: "Thu, Jul 30",
    time: "8:00 PM EST",
    timeRemaining: "In 4 hrs",
    isUrgent: true,
  },
  {
    id: "2",
    leagueName: "Gotham Champions League",
    date: "Fri, Jul 31",
    time: "7:00 PM EST",
    timeRemaining: "Tomorrow",
    isUrgent: false,
  },
  {
    id: "3",
    leagueName: "Cyber Legends Fantasy",
    date: "Sat, Aug 1",
    time: "1:00 PM EST",
    timeRemaining: "In 2 days",
    isUrgent: false,
  },
  {
    id: "4",
    leagueName: "Gridiron Dynasty League",
    date: "Sun, Aug 2",
    time: "4:15 PM EST",
    timeRemaining: "In 3 days",
    isUrgent: false,
  },
]

interface UpcomingDeadlinesProps {
  deadlines?: DeadlineItem[]
  className?: string
}

export function UpcomingDeadlines({
  deadlines = defaultDeadlines,
  className = "",
}: UpcomingDeadlinesProps) {
  return (
    <Card className={`rounded-xl border border-border bg-card shadow-none ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <ClockIcon className="size-4 text-primary" />
            Upcoming Deadlines
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Next lineup & waiver lock windows
          </CardDescription>
        </div>
        <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
          {deadlines.length} Pending
        </Badge>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <div className="relative pl-4 space-y-4 border-l border-border/60">
          {deadlines.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline Dot */}
              <div
                className={`absolute -left-[21px] top-1 size-2.5 rounded-full border-2 bg-card ${
                  item.isUrgent
                    ? "border-amber-500 bg-amber-500/20 animate-pulse"
                    : "border-primary"
                }`}
              />

              <Link to={`/Dashboard/League/${item.id}`} className="block">
                <div className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-secondary/20 border border-border/40 hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground leading-none group-hover:text-primary transition-colors">{item.leagueName}</p>
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
                    className={`text-[10px] font-semibold px-2 py-0.5 shrink-0 ${
                      item.isUrgent
                        ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                        : "border-border text-muted-foreground bg-secondary"
                    }`}
                  >
                    {item.isUrgent && <AlertCircleIcon className="mr-1 size-3 text-amber-400" />}
                    {item.timeRemaining}
                  </Badge>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
