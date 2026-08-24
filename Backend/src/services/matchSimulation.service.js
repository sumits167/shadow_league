import { League } from '../models/league.model.js';
import { Team } from '../models/team.model.js';
import { User } from '../models/user.model.js';
import { Lineup } from '../models/lineup.model.js';
import { Roster } from '../models/roster.model.js';
import { Player } from '../models/player.model.js';
import { autoSelectAllPendingLineupsService } from './lineup.service.js';

// In-memory active match simulation intervals: leagueId -> { timer, speed, isRunning, currentIndex, ... }
const activeSimulations = new Map();

// Helper to safely convert Map or plain object to a clean Object without Mongoose internal keys
export function sanitizePointsMapToObject(mapOrObj) {
    const result = {};
    if (!mapOrObj) return result;
    if (mapOrObj instanceof Map) {
        for (const [k, v] of mapOrObj.entries()) {
            if (typeof k === 'string' && !k.startsWith('$')) {
                result[k] = Number(v) || 0;
            }
        }
    } else if (typeof mapOrObj === 'object' && mapOrObj !== null) {
        for (const [k, v] of Object.entries(mapOrObj)) {
            if (typeof k === 'string' && !k.startsWith('$')) {
                result[k] = Number(v) || 0;
            }
        }
    }
    return result;
}

// Helper to award points to all identifier aliases (id, _id, name)
export function awardPoints(pointsMap, playerObj, pts) {
    if (!playerObj || !pointsMap || !pts) return;
    const ids = [];
    if (playerObj.id) ids.push(String(playerObj.id));
    if (playerObj._id) ids.push(String(playerObj._id));
    if (playerObj.name) ids.push(String(playerObj.name).toLowerCase().trim());

    ids.forEach(id => {
        if (!id.startsWith('$')) {
            pointsMap.set(id, (pointsMap.get(id) || 0) + pts);
        }
    });
}

// Helper to generate simulated 2-innings ball-by-ball events for a full cricket match
export function generateMatchBalls(matchDetails, squad = []) {
    const team1Name = matchDetails?.team1?.name || matchDetails?.name?.split(" vs ")?.[0] || "Team 1";
    const team2Name = matchDetails?.team2?.name || matchDetails?.name?.split(" vs ")?.[1] || "Team 2";

    const t1Short = (matchDetails?.team1?.shortName || team1Name.substring(0, 3)).toUpperCase();
    const t2Short = (matchDetails?.team2?.shortName || team2Name.substring(0, 3)).toUpperCase();

    const team1Squad = (squad || []).filter(p => p.realTeam === t1Short || p.realTeam === matchDetails?.team1?.shortName || p.realTeam === team1Name);
    const team2Squad = (squad || []).filter(p => p.realTeam === t2Short || p.realTeam === matchDetails?.team2?.shortName || p.realTeam === team2Name);

    // Inning 1: Team 1 Batsmen vs Team 2 Bowlers
    const t1_b1 = team1Squad[0] || { id: "p_ind_01", name: "Virat Kohli", realTeam: "IND", position: "BAT" };
    const t1_b2 = team1Squad[1] || { id: "p_ind_02", name: "Rohit Sharma", realTeam: "IND", position: "BAT" };
    const t1_b3 = team1Squad[2] || { id: "p_ind_03", name: "Suryakumar Yadav", realTeam: "IND", position: "BAT" };
    const t1_b4 = team1Squad[3] || { id: "p_ind_04", name: "Shubman Gill", realTeam: "IND", position: "BAT" };

    const t2_bowl1 = team2Squad.find(p => p.position === "BOWL" || p.position === "AR") || { id: "p_aus_11", name: "Pat Cummins", realTeam: "AUS", position: "BOWL" };
    const t2_bowl2 = team2Squad.filter(p => p.position === "BOWL" || p.position === "AR")[1] || { id: "p_aus_10", name: "Mitchell Starc", realTeam: "AUS", position: "BOWL" };

    // Inning 2: Team 2 Batsmen vs Team 1 Bowlers
    const t2_b1 = team2Squad[0] || { id: "p_aus_01", name: "Travis Head", realTeam: "AUS", position: "BAT" };
    const t2_b2 = team2Squad[1] || { id: "p_aus_02", name: "David Warner", realTeam: "AUS", position: "BAT" };
    const t2_b3 = team2Squad[2] || { id: "p_aus_03", name: "Glenn Maxwell", realTeam: "AUS", position: "AR" };
    const t2_b4 = team2Squad[3] || { id: "p_aus_04", name: "Steve Smith", realTeam: "AUS", position: "BAT" };

    const t1_bowl1 = team1Squad.find(p => p.position === "BOWL" || p.position === "AR") || { id: "p_ind_11", name: "Jasprit Bumrah", realTeam: "IND", position: "BOWL" };
    const t1_bowl2 = team1Squad.filter(p => p.position === "BOWL" || p.position === "AR")[1] || { id: "p_ind_10", name: "Mohammed Shami", realTeam: "IND", position: "BOWL" };

    const ballEvents = [
        // ==========================================
        // INNING 1: Team 1 Batting (Target Setting)
        // ==========================================
        // Over 0 (Bowler: Pat Cummins)
        { inning: 1, over: 0, ball: 1, runs: 0, batsman: t1_b1, bowler: t2_bowl1, type: "dot", commentary: `${t2_bowl1.name} steams in to ${t1_b1.name}, length ball on off, pushed defensively to point.` },
        { inning: 1, over: 0, ball: 2, runs: 4, batsman: t1_b1, bowler: t2_bowl1, type: "four", commentary: `FOUR! Gorgeous cover drive! ${t1_b1.name} creams the half-volley through the covers with perfection!` },
        { inning: 1, over: 0, ball: 3, runs: 1, batsman: t1_b1, bowler: t2_bowl1, type: "single", commentary: `Tucked to mid-on for a sharp single.` },
        { inning: 1, over: 0, ball: 4, runs: 6, batsman: t1_b2, bowler: t2_bowl1, type: "six", commentary: `SIX! BOOM! ${t1_b2.name} pulls the short ball high into the mid-wicket stands! Massive hit!` },
        { inning: 1, over: 0, ball: 5, runs: 0, batsman: t1_b2, bowler: t2_bowl1, type: "dot", commentary: `Beaten outside off stump on the drive.` },
        { inning: 1, over: 0, ball: 6, runs: 2, batsman: t1_b2, bowler: t2_bowl1, type: "two", commentary: `Whipped off the pads for a couple of runs through square leg.` },

        // Over 1 (Bowler: Mitchell Starc)
        { inning: 1, over: 1, ball: 1, runs: 1, batsman: t1_b1, bowler: t2_bowl2, type: "single", commentary: `${t2_bowl2.name} into the attack. Yorker length on middle, dug out for one.` },
        { inning: 1, over: 1, ball: 2, runs: 4, batsman: t1_b2, bowler: t2_bowl2, type: "four", commentary: `FOUR! Slashed over backward point! Outfield is lightning quick!` },
        { inning: 1, over: 1, ball: 3, runs: "W", batsman: t1_b2, bowler: t2_bowl2, type: "wicket", commentary: `OUT! CLEAN BOWLED! ${t2_bowl2.name} delivers a 148 km/h searing inswinging yorker that shatters the middle stump!` },
        { inning: 1, over: 1, ball: 4, runs: 0, batsman: t1_b3, bowler: t2_bowl2, type: "dot", commentary: `New batter ${t1_b3.name} leaves the outswinger safely.` },
        { inning: 1, over: 1, ball: 5, runs: 4, batsman: t1_b3, bowler: t2_bowl2, type: "four", commentary: `FOUR! First ball boundary for ${t1_b3.name}! Innovative scoop over fine leg!` },
        { inning: 1, over: 1, ball: 6, runs: 1, batsman: t1_b3, bowler: t2_bowl2, type: "single", commentary: `Dabbed to third man to keep strike.` },

        // Over 2 (Bowler: Pat Cummins)
        { inning: 1, over: 2, ball: 1, runs: 6, batsman: t1_b1, bowler: t2_bowl1, type: "six", commentary: `SIX! ${t1_b1.name} steps out and lofts ${t2_bowl1.name} over long-off with supreme authority!` },
        { inning: 1, over: 2, ball: 2, runs: 1, batsman: t1_b1, bowler: t2_bowl1, type: "single", commentary: `Punched to deep cover for one.` },
        { inning: 1, over: 2, ball: 3, runs: 4, batsman: t1_b3, bowler: t2_bowl1, type: "four", commentary: `FOUR! Guided past short third man with deft wrists!` },
        { inning: 1, over: 2, ball: 4, runs: "W", batsman: t1_b3, bowler: t2_bowl1, type: "wicket", commentary: `CAUGHT! ${t1_b3.name} holes out to deep mid-wicket! Taken cleanly on the rope!` },
        { inning: 1, over: 2, ball: 5, runs: 1, batsman: t1_b4, bowler: t2_bowl1, type: "single", commentary: `New batter ${t1_b4.name} opens his account with a push to long-on.` },
        { inning: 1, over: 2, ball: 6, runs: 6, batsman: t1_b1, bowler: t2_bowl1, type: "six", commentary: `SIX! 50 FOR ${t1_b1.name.toUpperCase()}! Pulled over deep square leg to conclude Inning 1 on a high!` },

        // ==========================================
        // INNING 2: Team 2 Chase
        // ==========================================
        // Over 0 (Bowler: Jasprit Bumrah)
        { inning: 2, over: 0, ball: 1, runs: 4, batsman: t2_b1, bowler: t1_bowl1, type: "four", commentary: `INNING 2 BEGINS! ${t2_b1.name} punches ${t1_bowl1.name}'s first ball through cover for FOUR! Target chase underway!` },
        { inning: 2, over: 0, ball: 2, runs: 0, batsman: t2_b1, bowler: t1_bowl1, type: "dot", commentary: `Fiery bouncer from ${t1_bowl1.name}! Whizzed past the helmet!` },
        { inning: 2, over: 0, ball: 3, runs: 6, batsman: t2_b1, bowler: t1_bowl1, type: "six", commentary: `SIX! High and handsome! ${t2_b1.name} clears the front leg and smashes it over long-on!` },
        { inning: 2, over: 0, ball: 4, runs: 1, batsman: t2_b1, bowler: t1_bowl1, type: "single", commentary: `Tapped to point for a quick single.` },
        { inning: 2, over: 0, ball: 5, runs: 0, batsman: t2_b2, bowler: t1_bowl1, type: "dot", commentary: `Beaten by extra bounce outside off.` },
        { inning: 2, over: 0, ball: 6, runs: 4, batsman: t2_b2, bowler: t1_bowl1, type: "four", commentary: `FOUR! ${t2_b2.name} drives powerfully past the bowler down to the fence!` },

        // Over 1 (Bowler: Mohammed Shami)
        { inning: 2, over: 1, ball: 1, runs: 1, batsman: t2_b1, bowler: t1_bowl2, type: "single", commentary: `${t1_bowl2.name} into the attack. Pushed to mid-off for a single.` },
        { inning: 2, over: 1, ball: 2, runs: "W", batsman: t2_b2, bowler: t1_bowl2, type: "wicket", commentary: `OUT! EDGED AND GONE! ${t1_bowl2.name} strikes with an unplayable outswinger! Caught behind by the keeper!` },
        { inning: 2, over: 1, ball: 3, runs: 0, batsman: t2_b3, bowler: t1_bowl2, type: "dot", commentary: `New batter ${t2_b3.name} defends solidly on middle.` },
        { inning: 2, over: 1, ball: 4, runs: 6, batsman: t2_b3, bowler: t1_bowl2, type: "six", commentary: `SIX! REVERSE SWEEP FOR SIX! ${t2_b3.name} plays the audacious switch hit over backward point!` },
        { inning: 2, over: 1, ball: 5, runs: 1, batsman: t2_b3, bowler: t1_bowl2, type: "single", commentary: `Pushed down to long-on for one.` },
        { inning: 2, over: 1, ball: 6, runs: 4, batsman: t2_b1, bowler: t1_bowl2, type: "four", commentary: `FOUR! Cut away behind point! The chase is heating up!` },

        // Over 2 (Bowler: Jasprit Bumrah - Final Over)
        { inning: 2, over: 2, ball: 1, runs: 1, batsman: t2_b3, bowler: t1_bowl1, type: "single", commentary: `${t1_bowl1.name} returns for the decisive final over. Searing yorker dug out for a single.` },
        { inning: 2, over: 2, ball: 2, runs: 4, batsman: t2_b1, bowler: t1_bowl1, type: "four", commentary: `FOUR! ${t2_b1.name} reaches his 35* with a fierce drive through mid-wicket!` },
        { inning: 2, over: 2, ball: 3, runs: "W", batsman: t2_b1, bowler: t1_bowl1, type: "wicket", commentary: `OUT! CLEAN BOWLED! ${t1_bowl1.name} shatters the stumps with an unplayable 145 km/h yorker! Turning point of the match!` },
        { inning: 2, over: 2, ball: 4, runs: 1, batsman: t2_b4, bowler: t1_bowl1, type: "single", commentary: `New batter ${t2_b4.name} pushes to long-on.` },
        { inning: 2, over: 2, ball: 5, runs: 2, batsman: t2_b3, bowler: t1_bowl1, type: "two", commentary: `Scampered back for two runs in deep cover!` },
        { inning: 2, over: 2, ball: 6, runs: 1, batsman: t2_b3, bowler: t1_bowl1, type: "single", commentary: `MATCH FINISHED! Accurate yorker to seal the victory in a thrilling finish!` }
    ];

    return ballEvents;
}

// Award Shadow League Points to top 3 winning teams
export async function awardShadowLeaguePoints(league, finalLeaderboard) {
    if (!finalLeaderboard || finalLeaderboard.length === 0) return;

    const prize1 = league.settings?.prizePool?.firstPlace ?? 500;
    const prize2 = league.settings?.prizePool?.secondPlace ?? 300;
    const prize3 = league.settings?.prizePool?.thirdPlace ?? 150;
    const prizes = [prize1, prize2, prize3];

    for (let i = 0; i < Math.min(3, finalLeaderboard.length); i++) {
        const standing = finalLeaderboard[i];
        const prizeAmount = prizes[i];
        if (standing.userId && prizeAmount > 0) {
            await User.findByIdAndUpdate(standing.userId, {
                $inc: { shadowPoints: prizeAmount }
            });
            standing.shadowPointsWon = prizeAmount;
        }
    }
}

// Calculate fantasy leaderboard based on current player points
export async function calculateLiveLeaderboard(leagueId, playerPointsMap) {
    const league = await League.findById(leagueId);
    const teams = await Team.find({ leagueId }).populate('userId', 'username avatarUrl shadowPoints');
    const standings = [];

    // Reconstruct player points map if not provided but stored on league
    let activePointsMap = playerPointsMap;
    if ((!activePointsMap || (activePointsMap instanceof Map && activePointsMap.size === 0) || (typeof activePointsMap === 'object' && Object.keys(activePointsMap).length === 0)) && league?.matchState?.playerFantasyPoints) {
        activePointsMap = league.matchState.playerFantasyPoints;
    }

    const poolMap = new Map();
    (league?.matchPlayerPool || []).forEach(p => {
        if (p.id) poolMap.set(p.id, p);
        if (p._id) poolMap.set(p._id.toString(), p);
        if (p.name) poolMap.set(p.name.toLowerCase().trim(), p);
    });

    // Pre-fetch any DB players that might be referenced by 24-char ObjectId
    const allPlayerRefs = [];
    for (const team of teams) {
        let lineup = await Lineup.findOne({ teamId: team._id, matchWeek: 1 });
        if (!lineup || !lineup.playerIds || lineup.playerIds.length === 0) {
            const roster = await Roster.findOne({ teamId: team._id });
            if (roster && roster.playerIds) {
                allPlayerRefs.push(...roster.playerIds);
            }
        } else {
            allPlayerRefs.push(...lineup.playerIds);
        }
    }

    const missingObjectIds = allPlayerRefs
        .map(p => (p ? (typeof p === 'string' ? p : (p._id ? p._id.toString() : p.id ? p.id.toString() : "")) : ""))
        .filter(id => id && id.length === 24 && !poolMap.has(id));

    if (missingObjectIds.length > 0) {
        try {
            const dbPlayers = await Player.find({ _id: { $in: missingObjectIds } });
            dbPlayers.forEach(p => {
                poolMap.set(p._id.toString(), p);
                if (p.id) poolMap.set(p.id, p);
                if (p.name) poolMap.set(p.name.toLowerCase().trim(), p);
            });
        } catch {
            // ignore
        }
    }

    for (const team of teams) {
        let lineup = await Lineup.findOne({ teamId: team._id, matchWeek: 1 });
        // Fallback to roster if no lineup was explicitly submitted
        if (!lineup || !lineup.playerIds || lineup.playerIds.length === 0) {
            const roster = await Roster.findOne({ teamId: team._id });
            if (roster && roster.playerIds && roster.playerIds.length > 0) {
                lineup = {
                    playerIds: roster.playerIds.slice(0, 11),
                    captainId: roster.playerIds[0],
                    viceCaptainId: roster.playerIds[1] || roster.playerIds[0]
                };
            }
        }

        let totalScore = 0;
        const playerScores = [];

        if (lineup && lineup.playerIds) {
            const capIdStr = lineup.captainId ? (typeof lineup.captainId === 'string' ? lineup.captainId : (lineup.captainId.id || lineup.captainId._id?.toString() || lineup.captainId.toString())) : "";
            const vcIdStr = lineup.viceCaptainId ? (typeof lineup.viceCaptainId === 'string' ? lineup.viceCaptainId : (lineup.viceCaptainId.id || lineup.viceCaptainId._id?.toString() || lineup.viceCaptainId.toString())) : "";

            for (const p of lineup.playerIds) {
                const pId = p ? (typeof p === 'string' ? p : (p.id || p._id?.toString() || p.toString())) : "";
                
                // Collect all possible identifier aliases for this player
                const candidateKeys = [];
                if (typeof p === 'string') {
                    candidateKeys.push(p, p.toLowerCase(), p.trim());
                } else if (p && typeof p === 'object') {
                    if (p.id) candidateKeys.push(String(p.id), String(p.id).toLowerCase());
                    if (p._id) candidateKeys.push(String(p._id));
                    if (p.name) candidateKeys.push(String(p.name).toLowerCase().trim());
                }

                const poolPlayer = poolMap.get(pId) || (typeof p === 'string' ? (poolMap.get(p) || poolMap.get(p.toLowerCase().trim())) : null);
                if (poolPlayer) {
                    if (poolPlayer.id) candidateKeys.push(String(poolPlayer.id), String(poolPlayer.id).toLowerCase());
                    if (poolPlayer._id) candidateKeys.push(String(poolPlayer._id));
                    if (poolPlayer.name) candidateKeys.push(String(poolPlayer.name).toLowerCase().trim());
                }

                let basePoints = 0;
                if (activePointsMap) {
                    for (const key of candidateKeys) {
                        if (!key) continue;
                        let val = 0;
                        if (typeof activePointsMap.get === 'function') {
                            val = activePointsMap.get(key) || activePointsMap.get(key.toLowerCase());
                        } else if (typeof activePointsMap === 'object') {
                            val = activePointsMap[key] || activePointsMap[key.toLowerCase()];
                        }
                        if (val && typeof val === 'number' && val > 0) {
                            basePoints = val;
                            break;
                        }
                    }
                }

                let mult = 1.0;
                let role = "Player";

                if (pId === capIdStr || candidateKeys.includes(capIdStr)) {
                    mult = 2.0;
                    role = "Captain (2x)";
                } else if (pId === vcIdStr || candidateKeys.includes(vcIdStr)) {
                    mult = 1.5;
                    role = "Vice-Captain (1.5x)";
                }

                const effective = Math.round(basePoints * mult * 10) / 10;
                totalScore += effective;

                const pName = poolPlayer?.name || (typeof p === 'object' ? p.name : null) || pId || "Player";

                playerScores.push({
                    playerId: pId,
                    name: pName,
                    role,
                    multiplier: mult,
                    basePoints,
                    effectivePoints: effective
                });
            }
        }

        const calculatedPoints = Math.round(totalScore * 10) / 10;
        team.totalPoints = calculatedPoints;
        await team.save();

        standings.push({
            teamId: team._id,
            userId: team.userId?._id,
            teamName: team.name,
            manager: team.userId?.username || "Manager",
            avatarUrl: team.userId?.avatarUrl,
            shadowPoints: team.userId?.shadowPoints || 0,
            totalPoints: calculatedPoints,
            players: playerScores
        });
    }

    // Sort by points descending and assign rank in memory and in DB
    standings.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    for (let idx = 0; idx < standings.length; idx++) {
        standings[idx].rank = idx + 1;
        await Team.findByIdAndUpdate(standings[idx].teamId, {
            totalPoints: standings[idx].totalPoints,
            rank: standings[idx].rank
        });
    }

    return standings;
}

// Start or resume the live match simulation
export async function startMatchSimulation(leagueId, io) {
    const league = await League.findById(leagueId);
    if (!league) return null;

    // 1. Auto-select any pending lineups before starting match
    await autoSelectAllPendingLineupsService(leagueId, 1);

    // 2. Initialize match state
    league.status = "Active";
    league.matchState = league.matchState || {};
    league.matchState.status = "Live";
    league.matchState.startedAt = league.matchState.startedAt || new Date();
    league.matchState.simulationSpeed = league.matchState.simulationSpeed || 1;

    const balls = generateMatchBalls(league.matchDetails, league.matchPlayerPool);
    league.matchState.totalBalls = balls.length;
    await league.save();

    // Map of cumulative player points
    const playerPointsMap = new Map();
    if (league.matchState.playerFantasyPoints) {
        for (const [k, v] of Object.entries(league.matchState.playerFantasyPoints)) {
            playerPointsMap.set(k, v);
        }
    }

    // Stop existing simulation ticker if any
    if (activeSimulations.has(leagueId.toString())) {
        clearInterval(activeSimulations.get(leagueId.toString()).timer);
    }

    const simState = {
        currentIndex: league.matchState.currentBallIndex || 0,
        speed: league.matchState.simulationSpeed || 1,
        isRunning: true,
        team1Runs: league.matchState.currentScore?.team1?.runs || 0,
        team1Wickets: league.matchState.currentScore?.team1?.wickets || 0,
        team2Runs: league.matchState.currentScore?.team2?.runs || 0,
        team2Wickets: league.matchState.currentScore?.team2?.wickets || 0,
        batterStats: new Map(),
        bowlerStats: new Map(),
        playerPointsMap: playerPointsMap,
        timer: null
    };

    const ticker = async () => {
        if (simState.currentIndex >= balls.length) {
            // Match completed
            clearInterval(simState.timer);
            activeSimulations.delete(leagueId.toString());

            const updatedLeague = await League.findById(leagueId);
            if (updatedLeague) {
                const t1Name = updatedLeague.matchDetails?.team1?.name || updatedLeague.matchDetails?.name?.split(" vs ")?.[0] || "Team 1";
                const t2Name = updatedLeague.matchDetails?.team2?.name || updatedLeague.matchDetails?.name?.split(" vs ")?.[1] || "Team 2";

                const winText = simState.team1Runs > simState.team2Runs
                    ? `${t1Name} won by ${simState.team1Runs - simState.team2Runs} runs!`
                    : simState.team2Runs > simState.team1Runs
                    ? `${t2Name} won by ${10 - simState.team2Wickets} wickets!`
                    : `Match Tied!`;

                updatedLeague.status = "Completed";
                updatedLeague.matchState.status = "Completed";
                updatedLeague.matchState.completedAt = new Date();
                updatedLeague.matchState.currentScore = {
                    team1: { name: t1Name, score: `${simState.team1Runs}/${simState.team1Wickets}`, overs: "3.0", runs: simState.team1Runs, wickets: simState.team1Wickets },
                    team2: { name: t2Name, score: `${simState.team2Runs}/${simState.team2Wickets}`, overs: "3.0", runs: simState.team2Runs, wickets: simState.team2Wickets },
                    statusText: `Match Completed • ${winText}`
                };

                const finalLeaderboard = await calculateLiveLeaderboard(leagueId, simState.playerPointsMap);
                await awardShadowLeaguePoints(updatedLeague, finalLeaderboard);

                const winnerTeam = finalLeaderboard[0] || null;
                updatedLeague.matchState.winner = winnerTeam;
                updatedLeague.matchState.playerFantasyPoints = sanitizePointsMapToObject(simState.playerPointsMap);
                updatedLeague.markModified('matchState.playerFantasyPoints');
                await updatedLeague.save();

                io.to(`league:${leagueId}`).emit('match:completed', {
                    leagueId,
                    matchStatus: "Completed",
                    finalScore: updatedLeague.matchState.currentScore,
                    winner: winnerTeam,
                    leaderboard: finalLeaderboard
                });
            }
            return;
        }

        const ball = balls[simState.currentIndex];
        const batsmanId = ball.batsman.id || ball.batsman._id?.toString() || "p_01";
        const bowlerId = ball.bowler.id || ball.bowler._id?.toString() || "p_10";

        // Process score for current inning
        if (ball.inning === 1) {
            if (ball.runs === "W") {
                simState.team1Wickets += 1;
                awardPoints(simState.playerPointsMap, ball.bowler, 25);
                const bStats = simState.bowlerStats.get(bowlerId) || { name: ball.bowler.name, wickets: 0, runs: 0, overs: "0.0" };
                bStats.wickets += 1;
                simState.bowlerStats.set(bowlerId, bStats);
            } else {
                const r = Number(ball.runs) || 0;
                simState.team1Runs += r;

                let bonus = 0;
                if (r === 4) bonus = 1;
                if (r === 6) bonus = 2;
                awardPoints(simState.playerPointsMap, ball.batsman, r + bonus);

                const bStats = simState.bowlerStats.get(bowlerId) || { name: ball.bowler.name, wickets: 0, runs: 0, overs: "0.0" };
                bStats.runs += r;
                simState.bowlerStats.set(bowlerId, bStats);

                const batStat = simState.batterStats.get(batsmanId) || { name: ball.batsman.name, runs: 0, balls: 0, fours: 0, sixes: 0 };
                batStat.runs += r;
                batStat.balls += 1;
                if (r === 4) batStat.fours += 1;
                if (r === 6) batStat.sixes += 1;
                simState.batterStats.set(batsmanId, batStat);
            }
        } else {
            // Inning 2
            if (ball.runs === "W") {
                simState.team2Wickets += 1;
                awardPoints(simState.playerPointsMap, ball.bowler, 25);
                const bStats = simState.bowlerStats.get(bowlerId) || { name: ball.bowler.name, wickets: 0, runs: 0, overs: "0.0" };
                bStats.wickets += 1;
                simState.bowlerStats.set(bowlerId, bStats);
            } else {
                const r = Number(ball.runs) || 0;
                simState.team2Runs += r;

                let bonus = 0;
                if (r === 4) bonus = 1;
                if (r === 6) bonus = 2;
                awardPoints(simState.playerPointsMap, ball.batsman, r + bonus);

                const bStats = simState.bowlerStats.get(bowlerId) || { name: ball.bowler.name, wickets: 0, runs: 0, overs: "0.0" };
                bStats.runs += r;
                simState.bowlerStats.set(bowlerId, bStats);

                const batStat = simState.batterStats.get(batsmanId) || { name: ball.batsman.name, runs: 0, balls: 0, fours: 0, sixes: 0 };
                batStat.runs += r;
                batStat.balls += 1;
                if (r === 4) batStat.fours += 1;
                if (r === 6) batStat.sixes += 1;
                simState.batterStats.set(batsmanId, batStat);
            }
        }

        simState.currentIndex += 1;

        const oversFormatted = `${ball.over}.${ball.ball}`;
        const target = simState.team1Runs + 1;
        const runsNeeded = Math.max(0, target - simState.team2Runs);

        const t1Name = league.matchDetails?.team1?.name || league.matchDetails?.name?.split(" vs ")?.[0] || "Team 1";
        const t2Name = league.matchDetails?.team2?.name || league.matchDetails?.name?.split(" vs ")?.[1] || "Team 2";

        const scoreObj = {
            team1: {
                name: t1Name,
                score: `${simState.team1Runs}/${simState.team1Wickets}`,
                overs: ball.inning === 1 ? oversFormatted : "3.0",
                runs: simState.team1Runs,
                wickets: simState.team1Wickets
            },
            team2: {
                name: t2Name,
                score: ball.inning === 1 ? "Yet to bat" : `${simState.team2Runs}/${simState.team2Wickets}`,
                overs: ball.inning === 1 ? "0.0" : oversFormatted,
                runs: simState.team2Runs,
                wickets: simState.team2Wickets
            },
            currentInnings: ball.inning,
            statusText: ball.inning === 1
                ? `Inning 1 • ${t1Name} ${simState.team1Runs}/${simState.team1Wickets} (${oversFormatted} ov)`
                : `Inning 2 • ${t2Name} need ${runsNeeded} runs to win (${oversFormatted} ov)`
        };

        const activeBatters = Array.from(simState.batterStats.values()).slice(-2);
        const activeBowler = simState.bowlerStats.get(bowlerId) || { name: ball.bowler.name, overs: oversFormatted, wickets: ball.inning === 1 ? simState.team1Wickets : simState.team2Wickets, runs: ball.inning === 1 ? simState.team1Runs : simState.team2Runs, maidens: 0 };

        // Save progress to League model including real-time player fantasy points
        await League.findByIdAndUpdate(leagueId, {
            "matchState.currentBallIndex": simState.currentIndex,
            "matchState.currentScore": scoreObj,
            "matchState.currentBatters": activeBatters,
            "matchState.currentBowler": activeBowler,
            "matchState.lastBall": ball,
            "matchState.playerFantasyPoints": sanitizePointsMapToObject(simState.playerPointsMap)
        });

        // Calculate live fantasy leaderboard
        const liveLeaderboard = await calculateLiveLeaderboard(leagueId, simState.playerPointsMap);

        // Broadcast to room
        io.to(`league:${leagueId}`).emit('match:ball-update', {
            leagueId,
            ballIndex: simState.currentIndex,
            totalBalls: balls.length,
            ball,
            matchScore: scoreObj,
            currentBatters: activeBatters,
            currentBowler: activeBowler,
            leaderboard: liveLeaderboard,
            playerPoints: Object.fromEntries(simState.playerPointsMap)
        });
    };

    simState.ticker = ticker;

    // Run first ball immediately
    ticker();

    // Schedule subsequent balls
    const intervalMs = Math.max(100, Math.floor(2200 / simState.speed));
    simState.timer = setInterval(ticker, intervalMs);
    activeSimulations.set(leagueId.toString(), simState);

    return league;
}

// Fast forward or adjust speed
export async function fastForwardMatchSimulation(leagueId, io, speedOrInstant = "instant") {
    const league = await League.findById(leagueId);
    if (!league) return null;

    if (speedOrInstant === "instant") {
        // Complete remaining match instantly
        const balls = generateMatchBalls(league.matchDetails, league.matchPlayerPool);
        const playerPointsMap = new Map();

        // Give realistic high points to all players in match
        (league.matchPlayerPool || []).forEach(p => {
            const pts = Math.floor(Math.random() * 50) + (p.price > 10 ? 40 : 15);
            awardPoints(playerPointsMap, p, pts);
        });

        if (activeSimulations.has(leagueId.toString())) {
            clearInterval(activeSimulations.get(leagueId.toString()).timer);
            activeSimulations.delete(leagueId.toString());
        }

        league.status = "Completed";
        league.matchState = league.matchState || {};
        league.matchState.status = "Completed";
        league.matchState.completedAt = new Date();
        league.matchState.currentBallIndex = balls.length;
        const t1Name = league.matchDetails?.team1?.name || league.matchDetails?.name?.split(" vs ")?.[0] || "Team 1";
        const t2Name = league.matchDetails?.team2?.name || league.matchDetails?.name?.split(" vs ")?.[1] || "Team 2";

        league.matchState.currentScore = {
            team1: { name: t1Name, score: "68/2", overs: "3.0", runs: 68, wickets: 2 },
            team2: { name: t2Name, score: "62/3", overs: "3.0", runs: 62, wickets: 3 },
            statusText: `Match Completed • ${t1Name} won by 6 runs!`
        };

        const finalLeaderboard = await calculateLiveLeaderboard(leagueId, playerPointsMap);
        await awardShadowLeaguePoints(league, finalLeaderboard);

        const winnerTeam = finalLeaderboard[0] || null;
        league.matchState.winner = winnerTeam;
        league.matchState.playerFantasyPoints = sanitizePointsMapToObject(playerPointsMap);
        league.markModified('matchState.playerFantasyPoints');
        await league.save();

        io.to(`league:${leagueId}`).emit('match:completed', {
            leagueId,
            matchStatus: "Completed",
            finalScore: league.matchState.currentScore,
            winner: winnerTeam,
            leaderboard: finalLeaderboard
        });

        return league;
    }

    // Otherwise adjust speed without resetting current state
    const newSpeed = Number(speedOrInstant) || 2;
    if (activeSimulations.has(leagueId.toString())) {
        const sim = activeSimulations.get(leagueId.toString());
        clearInterval(sim.timer);
        sim.speed = newSpeed;
        const intervalMs = Math.max(100, Math.floor(2200 / sim.speed));
        sim.timer = setInterval(sim.ticker, intervalMs);
        
        await League.findByIdAndUpdate(leagueId, {
            "matchState.simulationSpeed": newSpeed
        });
    } else {
        await startMatchSimulation(leagueId, io);
    }

    return league;
}

export async function getLiveMatchStateService(leagueId) {
    const league = await League.findById(leagueId);
    if (!league) return null;

    const teams = await Team.find({ leagueId }).populate('userId', 'username avatarUrl shadowPoints');
    
    // Check if simulation is active or if points were saved
    const simState = activeSimulations.get(leagueId.toString());
    let playerPointsMap = new Map();

    if (simState && simState.playerPointsMap) {
        playerPointsMap = simState.playerPointsMap;
    } else if (league.matchState && league.matchState.playerFantasyPoints) {
        const savedPoints = league.matchState.playerFantasyPoints;
        if (savedPoints instanceof Map) {
            playerPointsMap = savedPoints;
        } else if (typeof savedPoints === 'object') {
            playerPointsMap = new Map(Object.entries(savedPoints));
        }
    }

    let standings = [];
    if (playerPointsMap.size > 0) {
        standings = await calculateLiveLeaderboard(leagueId, playerPointsMap);
    } else {
        standings = teams.map((team, idx) => ({
            teamId: team._id,
            userId: team.userId?._id,
            teamName: team.name,
            manager: team.userId?.username || "Manager",
            avatarUrl: team.userId?.avatarUrl,
            shadowPoints: team.userId?.shadowPoints || 0,
            totalPoints: team.totalPoints || 0,
            rank: team.rank || idx + 1,
            players: []
        }));
        standings.sort((a, b) => b.totalPoints - a.totalPoints);
        standings.forEach((s, idx) => { s.rank = idx + 1; });
    }

    return {
        leagueId: league._id,
        leagueName: league.name,
        status: league.status,
        matchDetails: league.matchDetails,
        matchState: league.matchState || { status: "Scheduled" },
        teamsCount: teams.length,
        standings
    };
}
