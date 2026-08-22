import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUpIcon, TrendingDownIcon, type LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  isPositive?: boolean
  subtitle?: string
  icon?: LucideIcon
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon: Icon,
  className = "",
}: StatCardProps) {
  return (
    <Card className={`rounded-xl border border-border bg-card shadow-none ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className="p-2 rounded-lg bg-secondary/80 text-foreground border border-border/50">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
          {change && (
            <Badge
              variant="outline"
              className={`flex items-center gap-1 font-semibold text-xs border ${
                isPositive
                  ? "border-green-500/30 text-green-500 bg-green-500/10"
                  : "border-red-500/30 text-red-500 bg-red-500/10"
              }`}
            >
              {isPositive ? (
                <TrendingUpIcon className="size-3" />
              ) : (
                <TrendingDownIcon className="size-3" />
              )}
              {change}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
