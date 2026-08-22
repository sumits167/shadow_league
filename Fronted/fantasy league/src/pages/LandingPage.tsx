import React from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/dashboard/StatCard"
import {
  TrophyIcon,
  BarChart3Icon,
  ZapIcon,
  ShieldIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  SparklesIcon
} from "lucide-react"
import { TextHoverEffect } from "@/components/ui/text-hover-effect";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"


const AceternityLogo = () => {
  return (
    <svg
      width="66"
      height="65"
      viewBox="0 0 66 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-3 w-3 text-black dark:text-white"
    >
      <path
        d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696"
        stroke="currentColor"
        strokeWidth="15"
        strokeMiterlimit="3.86874"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default function LandingPage() {
  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-hidden w-full">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-12 pb-8">
        <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
          <SparklesIcon className="mr-1.5 size-3.5" /> Draft. Compete. Dominate.
        </Badge>
        <h1 className="w-full max-w-2xl sm:max-w-3xl mx-auto my-2">
          <TextHoverEffect text="Stop Watching. Start Competing." />
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Create your club, draft real players,
          and prove you know the game better
          than anyone in your crew.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {/* <Link to="/Dashboard">
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="div"
              className="bg-card text-foreground font-bold flex items-center space-x-2 px-6 py-2.5 border border-border/80 cursor-pointer"
            >
              <ZapIcon className="size-4 text-primary fill-current" />
              <span>Dashboard</span>
              <ArrowRightIcon className="size-4 ml-1 text-primary" />
            </HoverBorderGradient>
          </Link> */}
          <Link to="/login">
            {/* <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary">
              Sign In to League
            </Button> */}
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="div"
              className="bg-card text-foreground font-bold flex items-center space-x-2 px-6 py-2.5 border border-border/80 cursor-pointer"
            >
              <ZapIcon className="size-4 text-primary fill-current" />
              <span> Sign In to League</span>
              <ArrowRightIcon className="size-4 ml-1 text-primary" />
            </HoverBorderGradient>
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Built for Competitive Leagues</h2>
          <p className="text-sm text-muted-foreground">Flat surfaces, zero clutter, instant data visualization.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-xl border border-border bg-card shadow-none">
            <CardHeader className="space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <BarChart3Icon className="size-5" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">Advanced Analytics</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Predictive scoring models and weekly variance trajectories rendered in clear purple area charts.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-xl border border-border bg-card shadow-none">
            <CardHeader className="space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <TrophyIcon className="size-5" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">Live Standings</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Automatic tie-breakers, points for/against tracking, and real-time win streak calculations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-xl border border-border bg-card shadow-none">
            <CardHeader className="space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <ZapIcon className="size-5" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">H2H Matchup Engine</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Head-to-head match cards with live score updates, lead percentages, and projected final totals.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Analytics Preview Cards */}
      <section id="analytics" className="space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Metrics At A Glance</h2>
          <p className="text-sm text-muted-foreground">Sample KPI indicators from active fantasy matchups.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Weekly Points Avg"
            value="134.8"
            change="+8.4%"
            isPositive={true}
            subtitle="League rank #1"
            icon={ZapIcon}
          />
          <StatCard
            title="Projection Accuracy"
            value="96.2%"
            change="+2.1%"
            isPositive={true}
            subtitle="Model confidence"
            icon={CheckCircle2Icon}
          />
          <StatCard
            title="Roster Strength"
            value="92.0 / 100"
            change="+5.0"
            isPositive={true}
            subtitle="PPR rating"
            icon={ShieldIcon}
          />
          <StatCard
            title="Playoff Probability"
            value="98.5%"
            change="+4.2%"
            isPositive={true}
            subtitle="Clinched berth"
            icon={TrophyIcon}
          />
        </div>
      </section>

      {/* CTA Box */}
      <section className="rounded-xl border border-border bg-card p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Ready to Elevate Your League?</h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Experience clean, data-first sports analytics with zero distraction.
        </p>
        <div className="flex justify-center pt-2">
          <Link to="/Dashboard">
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="div"
              className="bg-card text-foreground font-bold flex items-center space-x-2 px-6 py-2.5 border border-border/80 cursor-pointer"
            >
              <ZapIcon className="size-4 text-primary fill-current" />
              <span>Get Started Now</span>
              <ArrowRightIcon className="size-4 ml-1 text-primary" />
            </HoverBorderGradient>
          </Link>
        </div>
      </section>
    </div>
  )
}