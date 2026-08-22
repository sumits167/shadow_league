import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sidebar as AceternitySidebar,
  SidebarBody,
  SidebarLink,
  type Links,
} from "@/components/ui/aceternity-sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboardIcon,
  TrophyIcon,
  BarChart3Icon,
  UsersIcon,
  ZapIcon,
  CompassIcon,
  ShieldCheckIcon,
  SettingsIcon,
} from "lucide-react";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useMyClubs } from "@/features/club/hooks/useClub";
import { useClubStore } from "@/store/clubStore";

export function SidebarLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const [open, setOpen] = useState(false);
  const { data: user } = useMe();
  const { data: clubs } = useMyClubs();
  const { activeClub } = useClubStore();

  const currentClub = activeClub || clubs?.[0];
  const isClubAdmin =
    user?.role === "admin" ||
    currentClub?.userRole?.toLowerCase() === "admin" ||
    currentClub?.userRole?.toLowerCase() === "owner";

  const username = user?.username || "Manager";
  const userInitials = username.substring(0, 2).toUpperCase();

  const links: Links[] = [
    {
      label: "Dashboard",
      href: "/Dashboard",
      icon: <LayoutDashboardIcon className="size-4 shrink-0 text-muted-foreground group-hover/sidebar:text-primary transition-colors" />,
    },
    {
      label: "Leagues",
      href: "/Dashboard/AllLeagues",
      icon: <CompassIcon className="size-4 shrink-0 text-muted-foreground group-hover/sidebar:text-primary transition-colors" />,
    },
    {
      label: "Club Members",
      href: "/Dashboard/Members",
      icon: <ShieldCheckIcon className="size-4 shrink-0 text-muted-foreground group-hover/sidebar:text-primary transition-colors" />,
    },
    {
      label: "League Standings",
      href: "/Dashboard/LeaderBoard",
      icon: <TrophyIcon className="size-4 shrink-0 text-muted-foreground group-hover/sidebar:text-primary transition-colors" />,
    },
    ...(isClubAdmin
      ? [
        {
          label: "Club Settings",
          href: "/Dashboard/Settings",
          icon: <SettingsIcon className="size-4 shrink-0 text-muted-foreground group-hover/sidebar:text-primary transition-colors" />,
        },
      ]
      : []),
  ];

  return (
    <AceternitySidebar open={open} setOpen={setOpen}>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
        {/* Desktop & Mobile Sidebar Drawer - Fixed Left Panel */}
        <SidebarBody className="bg-card border-r border-border">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}

            <div className="mt-8 flex flex-col gap-1">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* User Profile in Sidebar footer */}
          <div className="pt-4 border-t border-border/60">
            <SidebarLink
              link={{
                label: `@${username}`,
                href: "/Dashboard",
                icon: (
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7 border border-border">
                      <AvatarImage src={user?.avatarUrl || ""} alt={username} />
                      <AvatarFallback className="bg-primary/20 text-[10px] font-bold text-primary">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>

        {/* Main Dashboard Viewport - Independently Scrollable Container */}
        <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
          <TopNavbar title={title} />
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </AceternitySidebar>
  );
}

export function Sidebar() {
  return null;
}

export const Logo = () => {
  return (
    <Link to="/" className="relative z-20 flex items-center gap-3 py-1">
      <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-none shrink-0">
        <ZapIcon className="size-4 fill-current" />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col min-w-0"
      >
        <span className="font-extrabold tracking-wider text-xs text-foreground truncate">SHADOWLEAGUE</span>
        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest truncate">Sports Analytics</span>
      </motion.div>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link to="/" className="relative z-20 flex items-center py-1">
      <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-none shrink-0">
        <ZapIcon className="size-4 fill-current" />
      </div>
    </Link>
  );
};
