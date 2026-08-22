import { useNavigate } from "react-router-dom";
import { useAceternitySidebar } from "@/components/ui/aceternity-sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  SearchIcon,
  BellIcon,
  TrophyIcon,
  MenuIcon,
  LogOut,
  Loader2,
  ShieldCheckIcon,
  ArrowLeftRightIcon
} from "lucide-react";
import { useMe, useLogout } from "@/features/auth/hooks/useAuth";
import { useClubStore } from "@/store/clubStore";
import { toast } from "sonner";

interface TopNavbarProps {
  title?: string;
}

export function TopNavbar({ title = "Sports Analytics" }: TopNavbarProps) {
  const { setOpen } = useAceternitySidebar();
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { activeClub } = useClubStore();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.success("Logged out");
      navigate("/login");
    }
  };

  const username = user?.username || "Manager";
  const userInitials = username.substring(0, 2).toUpperCase();
  const role = user?.role === "admin" ? "Club Admin" : "Fantasy Manager";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((prev) => !prev)}
          className="-ml-1 text-muted-foreground hover:text-foreground md:hidden"
        >
          <MenuIcon className="size-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <Separator orientation="vertical" className="h-4 bg-border md:hidden" />
        <div className="flex items-center gap-2">
          <TrophyIcon className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground tracking-wide">
            {title}
          </span>
        </div>

        <Separator orientation="vertical" className="h-4 bg-border hidden sm:block" />

        {/* Active Club / Workspace Pill */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/select-club")}
          className="h-8 px-2.5 gap-1.5 text-xs border-border bg-secondary/40 hover:bg-secondary text-foreground cursor-pointer shadow-none"
          title="Click to switch Club Workspace"
        >
          <ShieldCheckIcon className="size-3.5 text-primary" />
          <span className="font-bold truncate max-w-[130px] sm:max-w-[180px]">
            {activeClub?.name || "Select Club Workspace"}
          </span>
          <ArrowLeftRightIcon className="size-3 text-muted-foreground ml-0.5 opacity-60" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block w-52 lg:w-64">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search leagues, teams..."
            className="h-9 w-full bg-background pl-8 text-xs border-border focus-visible:ring-primary"
          />
        </div>

        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
          <BellIcon className="size-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        <Separator orientation="vertical" className="h-4 bg-border hidden sm:block" />

        {/* Real User Profile with Logout */}
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8 border border-border">
            <AvatarImage src={user?.avatarUrl || ""} alt={username} />
            <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-none">
              @{username}
            </span>
            <span className="text-[10px] text-muted-foreground capitalize">
              {role}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 gap-1.5 transition-colors cursor-pointer"
            title="Sign out of ShadowLeague"
          >
            {logoutMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <LogOut className="size-3.5" />
            )}
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
