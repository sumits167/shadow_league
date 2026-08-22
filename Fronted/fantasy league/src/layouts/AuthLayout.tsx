import { Outlet, Link } from "react-router-dom"
import { ZapIcon, TrophyIcon, ActivityIcon, TrendingUpIcon, CheckCircle2Icon } from "lucide-react"
import { Spotlight } from "@/components/ui/spotlight-new"



import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMe } from "@/features/auth/hooks/useAuth";
import Loading from "@/components/Loading";

function AuthLayout() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/Dashboard", { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return <Loading />;
  }



  return (
    <div className="min-h-screen w-full bg-background flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background SVG Grid Pattern */}
      <Spotlight />

      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(#2A2B35 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Left Column: Creative Sports Analytics Feature Showcase (Desktop) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10 border-r border-border bg-card/50">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-none group-hover:scale-105 transition-transform">
              <ZapIcon className="size-6 fill-current" />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-lg text-foreground block leading-none">SHADOWLEAGUE</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Sports Analytics</span>
            </div>
          </Link>
        </div>

        {/* Center Hero Content */}
        <div className="space-y-8 max-w-lg my-auto py-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <ActivityIcon className="size-3.5" /> Draft. Compete. Dominate.
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Everything Your League Needs. Nothing It Doesn't.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Live scores, weekly trends, and standings updated automatically. You just manage your team.
            </p>
          </div>

          {/* Feature Bullets */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="size-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2Icon className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Real-Time Matchups</h4>
                <p className="text-[11px] text-muted-foreground">Live scores as the match unfolds.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2Icon className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Weekly Performance</h4>
                <p className="text-[11px] text-muted-foreground">Track your trend across every match week.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2Icon className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Automatic Standings</h4>
                <p className="text-[11px] text-muted-foreground">Rankings refresh after every match.</p>
              </div>
            </div>
          </div>

          {/* Mini Creative Widget Preview */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <TrophyIcon className="size-3.5 text-primary" /> ShadowLeague Premier
              </span>
              <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30">
                LIVE
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
              <span className="text-muted-foreground">Sumit's Army (1,055 pts)</span>
              <span className="font-bold text-primary flex items-center gap-1">
                <TrendingUpIcon className="size-3" /> Winning vs Rahul's XI
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ShadowLeague Inc. Minimal flat sports dashboard.
        </p>
      </div>

      {/* Right Column: Form Area (Centered for Login/Register) */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 relative z-10 my-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Only Header Logo */}
          <div className="flex flex-col items-center text-center space-y-2 lg:hidden">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-none group-hover:scale-105 transition-transform">
                <ZapIcon className="size-6 fill-current" />
              </div>
            </Link>
            <h1 className="text-xl font-bold tracking-wider text-foreground">SHADOWLEAGUE</h1>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Sports Analytics Platform</p>
          </div>

          <Outlet />

          <p className="text-center text-xs text-muted-foreground lg:hidden">
            &copy; {new Date().getFullYear()} ShadowLeague Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout