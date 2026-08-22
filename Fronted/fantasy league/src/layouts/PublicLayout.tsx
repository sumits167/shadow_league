import React from "react"
import { Outlet, Link } from "react-router-dom"
import { TrophyIcon } from "lucide-react"
import { FloatingDock } from "@/components/ui/floating-dock"
import { FloatingNav } from "@/components/ui/floating-navbar"
import { Spotlight } from "@/components/ui/spotlight-new"
import {
  IconHome,
  IconTrophy,
  IconChartBar,
  IconFlame,
  IconUserCheck,
} from "@tabler/icons-react"

function PublicLayout() {
  const links = [
    {
      title: "Home",
      icon: <IconHome className="h-full w-full text-foreground" />,
      href: "/",
    },
    {
      title: "Features",
      icon: <IconTrophy className="h-full w-full text-foreground" />,
      href: "#features",
    },
    {
      title: "Analytics",
      icon: <IconChartBar className="h-full w-full text-foreground" />,
      href: "#analytics",
    },
    {
      title: "Dashboard",
      icon: <IconFlame className="h-full w-full text-primary" />,
      href: "/Dashboard",
    },
    {
      title: "Sign In",
      icon: <IconUserCheck className="h-full w-full text-foreground" />,
      href: "/login",
    },
  ]

  const navItems = [
    {
      name: "Home",
      link: "/",
      icon: <IconHome className="size-4 text-foreground" />,
    },
    {
      name: "Features",
      link: "#features",
      icon: <IconTrophy className="size-4 text-foreground" />,
    },
    {
      name: "Analytics",
      link: "#analytics",
      icon: <IconChartBar className="size-4 text-foreground" />,
    },
    {
      name: "Dashboard",
      link: "/Dashboard",
      icon: <IconFlame className="size-4 text-primary" />,
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden w-full max-w-full">
      <Spotlight />

      {/* Floating Top Navigation */}
      <FloatingNav navItems={navItems} />

      {/* Main Content */}
      <main className="flex-1 pt-12 pb-24">
        <Outlet />
      </main>

      {/* Floating Dock Navigation at Bottom */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <FloatingDock items={links} />
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 text-center text-xs text-muted-foreground relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrophyIcon className="size-4 text-primary" />
            <span className="font-semibold text-foreground">ShadowLeague Sports Analytics</span>
          </div>
          <p>&copy; {new Date().getFullYear()} ShadowLeague Inc. Minimal flat sports dashboard.</p>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout