import { useState } from "react";
import { useMatchSocket } from "@/features/match/hooks/useMatchSocket";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  TrophyIcon,
  FlameIcon,
  ZapIcon,
  RadioIcon,
  FastForwardIcon,
  PlayCircleIcon,
  GaugeIcon,
  CrownIcon,
  CheckCircle2Icon,
  SparklesIcon,
  Volume2Icon,
  UsersIcon,
  ActivityIcon,
  MedalIcon,
  ShieldCheckIcon,
} from "lucide-react";

interface LiveMatchCenterProps {
  leagueId: string;
  myUsername?: string;
  isClubAdmin?: boolean;
}

export function LiveMatchCenter({ leagueId, myUsername, isClubAdmin }: LiveMatchCenterProps) {
  const {
    matchStatus,
    score,
    currentBatters,
    currentBowler,
    recentBalls,
    latestBall,
    leaderboard,
    simulationSpeed,
    startMatch,
    setSpeed,
    fastForward,
  } = useMatchSocket(leagueId);

  const [activeTab, setActiveTab] = useState<"commentary" | "leaderboard">("commentary");

  const isLive = matchStatus === "Live";
  const isCompleted = matchStatus === "Completed";
  const isScheduled = matchStatus === "Scheduled";

  const team1Name = score?.team1?.name || "Team 1";
  const team2Name = score?.team2?.name || "Team 2";

  const displayStatusText = (() => {
    if (isCompleted && score) {
      const t1Runs = score.team1?.runs ?? 0;
      const t2Runs = score.team2?.runs ?? 0;
      const t2Wickets = score.team2?.wickets ?? 0;

      if (t1Runs > 0 || t2Runs > 0) {
        if (t1Runs > t2Runs) {
          return `Match Completed • ${team1Name} won by ${t1Runs - t2Runs} runs!`;
        } else if (t2Runs > t1Runs) {
          return `Match Completed • ${team2Name} won by ${10 - t2Wickets} wickets!`;
        } else if (t1Runs === t2Runs) {
          return `Match Completed • Match Tied!`;
        }
      }
    }
    return score?.statusText || "Match simulation active with real-time fantasy score calculations.";
  })();

  const winningTeam = leaderboard?.[0] || null;
  const runnerUp = leaderboard?.[1] || null;
  const thirdPlace = leaderboard?.[2] || null;

  return (
    <div className="space-y-6">
      {/* 1. COMPLETED MATCH: WINNER CELEBRATION SHOWCASE & PODIUM */}
      {isCompleted && winningTeam && (
        <Card className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/15 via-card to-card p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <TrophyIcon className="size-64 text-amber-500" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500 text-black font-extrabold text-xs px-2.5 py-0.5 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <CrownIcon className="size-3.5" /> League Champion
                </Badge>
                <Badge variant="outline" className="border-green-500/40 text-green-400 bg-green-500/10 text-xs font-bold">
                  Match Completed
                </Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <span>{winningTeam.teamName}</span>
                <span className="text-amber-400 font-normal">Won the League!</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                <span>Manager: <strong className="text-foreground">@{winningTeam.manager}</strong></span>
                <span>•</span>
                <span>Total Score: <strong className="text-amber-400 font-mono">{winningTeam.totalPoints.toFixed(1)} pts</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">Shadow Points Prize</span>
                <span className="text-lg font-mono font-extrabold text-amber-400">+500 SLP</span>
              </div>
            </div>
          </div>

          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1st Place */}
            <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1">
                  🥇 1st Place (Champion)
                </span>
                <Badge className="bg-amber-500 text-black text-[10px] font-bold">+500 SLP</Badge>
              </div>
              <div className="flex items-center gap-2.5">
                <Avatar className="size-8 border border-amber-500/40">
                  <AvatarImage src={winningTeam.avatarUrl} />
                  <AvatarFallback className="text-xs font-bold">{winningTeam.manager.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xs font-bold text-foreground">{winningTeam.teamName}</div>
                  <div className="text-[11px] text-muted-foreground">@{winningTeam.manager}</div>
                </div>
              </div>
              <div className="text-sm font-mono font-extrabold text-amber-400 pt-1">
                {winningTeam.totalPoints.toFixed(1)} pts
              </div>
            </div>

            {/* 2nd Place */}
            {runnerUp && (
              <div className="p-4 rounded-xl border border-slate-400/40 bg-secondary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-300 flex items-center gap-1">
                    🥈 2nd Place (Runner Up)
                  </span>
                  <Badge variant="outline" className="border-slate-400/40 text-slate-300 text-[10px] font-bold">+300 SLP</Badge>
                </div>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8 border border-slate-400/40">
                    <AvatarImage src={runnerUp.avatarUrl} />
                    <AvatarFallback className="text-xs font-bold">{runnerUp.manager.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xs font-bold text-foreground">{runnerUp.teamName}</div>
                    <div className="text-[11px] text-muted-foreground">@{runnerUp.manager}</div>
                  </div>
                </div>
                <div className="text-sm font-mono font-extrabold text-slate-300 pt-1">
                  {runnerUp.totalPoints.toFixed(1)} pts
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {thirdPlace && (
              <div className="p-4 rounded-xl border border-amber-700/40 bg-secondary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-600 flex items-center gap-1">
                    🥉 3rd Place (Bronze)
                  </span>
                  <Badge variant="outline" className="border-amber-700/40 text-amber-600 text-[10px] font-bold">+150 SLP</Badge>
                </div>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8 border border-amber-700/40">
                    <AvatarImage src={thirdPlace.avatarUrl} />
                    <AvatarFallback className="text-xs font-bold">{thirdPlace.manager.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xs font-bold text-foreground">{thirdPlace.teamName}</div>
                    <div className="text-[11px] text-muted-foreground">@{thirdPlace.manager}</div>
                  </div>
                </div>
                <div className="text-sm font-mono font-extrabold text-amber-600 pt-1">
                  {thirdPlace.totalPoints.toFixed(1)} pts
                </div>
              </div>
            )}
          </div>

          {/* Winner's Selected Starting 11 Roster */}
          {winningTeam.players && winningTeam.players.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheckIcon className="size-3.5 text-primary" />
                  Winner's Selected Starting 11 Players &amp; Points
                </h4>
                <span className="text-[11px] text-muted-foreground">11 Players Active</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {winningTeam.players.map((p, pIdx) => {
                  const isCap = p.role.includes("Captain (2x)");
                  const isVC = p.role.includes("Vice-Captain (1.5x)");

                  return (
                    <div
                      key={pIdx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                        isCap
                          ? "border-amber-500/50 bg-amber-500/10"
                          : isVC
                          ? "border-indigo-500/50 bg-indigo-500/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="space-y-0.5 truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground truncate">{p.name}</span>
                          {isCap && (
                            <Badge className="bg-amber-500 text-black text-[9px] px-1 py-0 font-extrabold">2x</Badge>
                          )}
                          {isVC && (
                            <Badge className="bg-indigo-600 text-white text-[9px] px-1 py-0 font-extrabold">1.5x</Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground block">{p.role}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-primary">
                          {p.effectivePoints.toFixed(1)}
                        </span>
                        <span className="text-[9px] text-muted-foreground block">pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 2. Live Match Scorecard Banner */}
      <Card className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-6 shadow-none overflow-hidden relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          {/* Match Teams & Live Score */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Badge
                variant="outline"
                className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 gap-1.5 ${
                  isLive
                    ? "border-red-500/40 text-red-400 bg-red-500/10 animate-pulse"
                    : isCompleted
                    ? "border-green-500/40 text-green-400 bg-green-500/10"
                    : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                }`}
              >
                <RadioIcon className="size-3.5" />
                <span>{isLive ? "LIVE CRICKET MATCH" : isCompleted ? "MATCH COMPLETED" : "MATCH READY TO START"}</span>
              </Badge>
              <span className="text-xs text-muted-foreground">• T20 Super Slate 2026</span>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {team1Name}
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-foreground tracking-tight">
                  {score?.team1?.score || "0/0"}{" "}
                  <span className="text-base font-normal text-muted-foreground font-sans">
                    ({score?.team1?.overs || "0.0"} ov)
                  </span>
                </span>
              </div>

              <div className="text-xl font-extrabold text-muted-foreground">vs</div>

              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  {team2Name}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-muted-foreground tracking-tight">
                  {score?.team2?.score || "Yet to bat"}
                </span>
              </div>
            </div>

            <p className="text-xs text-primary font-semibold flex items-center gap-1.5">
              <ActivityIcon className="size-3.5" />
              <span>{displayStatusText}</span>
            </p>
          </div>

          {/* Admin Match Controls Bar (3.1 & 3.2 Requirements) */}
          {isClubAdmin && !isCompleted && (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 shrink-0 sm:min-w-[280px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <GaugeIcon className="size-3.5 text-primary" /> Admin Match Controls
                </span>
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                  {simulationSpeed}x Speed
                </Badge>
              </div>

              {isScheduled && (
                <Button
                  onClick={startMatch}
                  size="sm"
                  className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs h-8 cursor-pointer shadow-none gap-1.5"
                >
                  <PlayCircleIcon className="size-4" />
                  <span>Start Match Now (Immediate Launch)</span>
                </Button>
              )}

              {isLive && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 5, 10].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setSpeed(spd)}
                        className={`flex-1 py-1 rounded text-[11px] font-bold transition-all cursor-pointer border ${
                          simulationSpeed === spd
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={() => fastForward("instant")}
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-bold border-amber-500/40 text-amber-400 hover:bg-amber-500/10 h-7 cursor-pointer gap-1.5"
                  >
                    <FastForwardIcon className="size-3.5" />
                    <span>Instant Finish Match</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* 3. Live Active Batters & Bowler Mini Strip */}
      {!isCompleted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 rounded-xl border border-border bg-card space-y-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FlameIcon className="size-3.5 text-amber-400" /> Active Batters
            </span>
            {currentBatters.length > 0 ? (
              <div className="space-y-1.5">
                {currentBatters.map((b, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      {b.name} {idx === 0 && <span className="text-primary font-bold">*</span>}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      <strong className="text-foreground">{b.runs}</strong> ({b.balls}) • 4s: {b.fours} • 6s: {b.sixes}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic py-2">Opening batsmen walking into the ground...</div>
            )}
          </Card>

          <Card className="p-4 rounded-xl border border-border bg-card space-y-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ZapIcon className="size-3.5 text-primary" /> Active Bowler
            </span>
            {currentBowler ? (
              <div className="flex items-center justify-between text-xs py-1">
                <span className="font-semibold text-foreground">{currentBowler.name}</span>
                <div className="font-mono text-muted-foreground flex items-center gap-2">
                  <span>{currentBowler.overs} ov</span>
                  <span>{currentBowler.maidens} m</span>
                  <span>{currentBowler.runs} r</span>
                  <span className="font-bold text-primary">{currentBowler.wickets} w</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic py-2">Bowler running up to the bowling crease...</div>
            )}
          </Card>
        </div>
      )}

      {/* 4. Navigation Tabs: Commentary Feed vs Live Fantasy Leaderboard */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("commentary")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "commentary"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Volume2Icon className="size-3.5" />
          <span>Ball-by-Ball Live Commentary</span>
          {recentBalls.length > 0 && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary-foreground/40 text-primary-foreground">
              {recentBalls.length}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leaderboard")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "leaderboard"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrophyIcon className="size-3.5" />
          <span>Live Real-Time Leaderboard</span>
          {leaderboard.length > 0 && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary-foreground/40 text-primary-foreground">
              {leaderboard.length} Teams
            </Badge>
          )}
        </button>
      </div>

      {/* 5. Tab 1: Ball-by-Ball Feed */}
      {activeTab === "commentary" && (
        <Card className="rounded-xl border border-border bg-card p-5 shadow-none space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <RadioIcon className="size-4 text-primary animate-pulse" />
              Live Over-by-Over Commentary
            </h3>
            {latestBall && (
              <Badge variant="outline" className="text-xs font-mono font-bold border-primary/40 text-primary">
                Over {latestBall.over}.{latestBall.ball} • {latestBall.runs} runs
              </Badge>
            )}
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {recentBalls.map((b, idx) => {
              const isWicket = b.runs === "W" || b.type === "wicket";
              const isFour = b.runs === 4 || b.type === "four";
              const isSix = b.runs === 6 || b.type === "six";

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    idx === 0
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 bg-secondary/10"
                  }`}
                >
                  <div
                    className={`size-8 rounded-lg font-bold font-mono text-xs flex items-center justify-center shrink-0 border ${
                      isWicket
                        ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                        : isSix
                        ? "border-purple-500/40 text-purple-400 bg-purple-500/10"
                        : isFour
                        ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                        : "border-border text-muted-foreground bg-secondary/30"
                    }`}
                  >
                    {b.runs}
                  </div>

                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-foreground">
                        Over {b.over}.{b.ball}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {b.bowler.name} to {b.batsman.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {b.commentary}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 6. Tab 2: Live Leaderboard */}
      {activeTab === "leaderboard" && (
        <Card className="rounded-xl border border-border bg-card p-5 shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrophyIcon className="size-4 text-primary" />
                Live League Leaderboard Standings
              </h3>
              <p className="text-xs text-muted-foreground">
                Rankings update in real-time with 2x Captain &amp; 1.5x Vice-Captain multipliers applied.
              </p>
            </div>
            <Badge variant="outline" className="border-green-500/40 text-green-400 bg-green-500/10 text-xs font-bold">
              {isCompleted ? "Final Standings" : "Real-Time Active"}
            </Badge>
          </div>

          <div className="space-y-2">
            {leaderboard.map((item) => {
              const isMe = item.manager === myUsername;

              return (
                <div
                  key={item.teamId}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isMe
                      ? "border-primary/60 bg-primary/10 shadow-sm"
                      : "border-border/60 bg-secondary/20 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-8 rounded-lg flex items-center justify-center font-extrabold text-xs border ${
                        item.rank === 1
                          ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                          : item.rank === 2
                          ? "border-slate-400/40 text-slate-300 bg-slate-400/10"
                          : item.rank === 3
                          ? "border-amber-700/40 text-amber-600 bg-amber-700/10"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      #{item.rank}
                    </div>

                    <Avatar className="size-8 border border-border">
                      <AvatarImage src={item.avatarUrl} />
                      <AvatarFallback className="text-[10px] font-bold">
                        {item.manager.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground">{item.teamName}</span>
                        {isMe && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/40 text-primary font-bold">
                            You
                          </Badge>
                        )}
                        {item.rank <= 3 && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-400">
                            +{item.rank === 1 ? 500 : item.rank === 2 ? 300 : 150} SLP
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">@{item.manager}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base sm:text-lg font-mono font-extrabold text-foreground">
                      {item.totalPoints.toFixed(1)}{" "}
                      <span className="text-xs font-sans text-muted-foreground font-normal">pts</span>
                    </span>
                    <span className="text-[10px] text-green-400 block font-semibold">
                      Rank #{item.rank}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
