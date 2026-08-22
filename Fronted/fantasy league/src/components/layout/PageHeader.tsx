import * as React from "react"
import { Badge } from "@/components/ui/badge"

interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-2 pb-6 border-b border-border md:flex-row md:items-center md:justify-between ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          {badge && (
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 font-medium">
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 pt-2 md:pt-0">
          {actions}
        </div>
      )}
    </div>
  )
}
