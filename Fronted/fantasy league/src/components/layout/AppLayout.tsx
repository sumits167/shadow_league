import * as React from "react"
import { SidebarLayout } from "@/components/layout/Sidebar"

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <SidebarLayout title={title}>
      {children}
    </SidebarLayout>
  )
}
