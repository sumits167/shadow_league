import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { TrendingUpIcon } from "lucide-react"

export interface PerformanceTrendPoint {
  label: string;
  myTeam: number;
  leader: number;
  avg: number;
}

const defaultTrendData: PerformanceTrendPoint[] = [
  { label: "Match 1", myTeam: 0, leader: 0, avg: 0 },
  { label: "Match 2", myTeam: 0, leader: 0, avg: 0 },
];

interface TopTeamsPerformanceChartProps {
  data?: PerformanceTrendPoint[];
  myTeamName?: string;
  leaderName?: string;
  className?: string;
}

export function TopTeamsPerformanceChart({
  data,
  myTeamName = "My Squad (You)",
  leaderName = "Leader (#1)",
  className = "",
}: TopTeamsPerformanceChartProps) {
  const chartConfig = {
    myTeam: {
      label: myTeamName,
      color: "#A855F7",
    },
    leader: {
      label: leaderName,
      color: "#22C55E",
    },
    avg: {
      label: "League Avg",
      color: "#06B6D4",
    },
  } satisfies ChartConfig;

  const activeData = data && data.length > 0 ? data : defaultTrendData;
  return (
    <Card className={`rounded-xl border border-border bg-card shadow-none ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingUpIcon className="size-4 text-primary" />
            Weekly Performance Trend
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Comparing your scoring trajectory against the league leader over recent weeks
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
          <AreaChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillMyTeam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillLeader" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2B35" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="bg-card border border-border text-foreground"
                />
              }
            />
            <Area
              type="monotone"
              dataKey="leader"
              stroke="#22C55E"
              strokeWidth={1.5}
              fill="url(#fillLeader)"
            />
            <Area
              type="monotone"
              dataKey="myTeam"
              stroke="#A855F7"
              strokeWidth={2}
              fill="url(#fillMyTeam)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
