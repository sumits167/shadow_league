import React from 'react'
import { ZapIcon } from 'lucide-react'
import { LoaderFive } from "@/components/ui/loader"

function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-3">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-none animate-pulse">
        <ZapIcon className="size-6 fill-current" />
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        <LoaderFive text="Loading Sports Analytics..." />
      </div>
    </div>
  )
}

export default Loading