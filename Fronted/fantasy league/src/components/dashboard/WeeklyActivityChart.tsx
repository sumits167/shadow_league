import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { ZapIcon, TrendingUpIcon, CalendarIcon } from "lucide-react";

export interface DailyPointPoint {
  label: string;
  points: number;
  avg: number;
  highlight?: string;
}

export interface DailyPointPoint {
  label: string;
  points: number;
  avg: number;
  highlight?: string;
}

const defaultDailyData: DailyPointPoint[] = [
  { label: "Match 1", points: 0, avg: 0, highlight: "Ready" },
  { label: "Match 2", points: 0, avg: 0, highlight: "Upcoming" },
];

const defaultWeeklyData: DailyPointPoint[] = [
  { label: "Tournaments", points: 0, avg: 0 },
];

const chartConfig = {
  points: {
    label: "My Fantasy Points",
    color: "#A855F7",
  },
  avg: {
    label: "League Average",
    color: "#06B6D4",
  },
} satisfies ChartConfig;

interface WeeklyActivityChartProps {
  data?: DailyPointPoint[];
  weeklyData?: DailyPointPoint[];
  className?: string;
  totalPoints?: number;
}

export function WeeklyActivityChart({
  data,
  weeklyData,
  className = "",
  totalPoints = 0,
}: WeeklyActivityChartProps) {
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");

  const hasRealData = (data && data.length > 0) || (weeklyData && weeklyData.length > 0);
  const activeDataset = (viewMode === "daily" ? (data && data.length > 0 ? data : defaultDailyData) : (weeklyData && weeklyData.length > 0 ? weeklyData : defaultWeeklyData));

  // Calculate high day & avg comparison
  const highestScore = activeDataset.length > 0 ? Math.max(...activeDataset.map((d) => d.points || 0)) : 0;
  const currentTotal = totalPoints > 0 ? totalPoints : activeDataset.reduce((sum, d) => sum + (d.points || 0), 0);
  const avgTotal = activeDataset.reduce((sum, d) => sum + (d.avg || 0), 0);
  const diffPercent = avgTotal > 0 && currentTotal > 0 ? (((currentTotal - avgTotal) / avgTotal) * 100).toFixed(1) : "0.0";

  return (
    <Card className={`rounded-xl border border-border bg-card shadow-none ${className}`}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <ZapIcon className="size-4 text-primary" />
              Fantasy Scoring Performance
            </CardTitle>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-[10px] font-bold">
              Captain 2x & VC 1.5x Active
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {viewMode === "daily"
              ? "Daily matchday fantasy points vs league average"
              : "Cumulative matchweek scoring trajectory"}
          </CardDescription>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setViewMode("daily")}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "daily"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Daily Matchdays
          </button>
          <button
            type="button"
            onClick={() => setViewMode("weekly")}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "weekly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Matchweeks
          </button>
        </div>
      </CardHeader>

      {/* KPI Stats Strip */}
      <div className="px-6 py-2 border-y border-border/50 bg-secondary/20 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total Scored:</span>
          <span className="font-extrabold text-foreground">{totalPoints} pts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Peak Matchday:</span>
          <span className="font-bold text-primary">{highestScore} pts</span>
        </div>
        <div className="flex items-center gap-1 text-green-400 font-bold">
          <TrendingUpIcon className="size-3.5" />
          <span>+{diffPercent}% above league avg</span>
        </div>
      </div>

      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <AreaChart data={activeDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillPoints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
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
                  className="bg-card border border-border text-foreground shadow-xl"
                />
              }
            />
            {/* League Average Reference */}
            <Area
              type="monotone"
              dataKey="avg"
              name="League Average"
              stroke="#06B6D4"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#fillAvg)"
            />
            {/* User Fantasy Points */}
            <Area
              type="monotone"
              dataKey="points"
              name="My Fantasy Points"
              stroke="#A855F7"
              strokeWidth={2.5}
              fill="url(#fillPoints)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
