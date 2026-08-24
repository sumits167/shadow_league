import { League } from '../models/league.model.js';
import { Team } from '../models/team.model.js';
import { Roster } from '../models/roster.model.js';
import { Player } from '../models/player.model.js';
import { MatchDataProvider } from './matchProvider/matchData.provider.js';
import ApiError from '../utils/ApiError.js';

export const startDraftService = async (leagueId, requestingUserId, isAutoScheduled = false) => {
    const league = await League.findById(leagueId);
    if (!league) {
        throw new ApiError(404, "League not found", "LEAGUE_NOT_FOUND");
    }

    if (league.status === "Completed") {
        throw new ApiError(400, "Cannot start draft for completed league", "LEAGUE_COMPLETED");
    }

    // Check if draft is already locked to a future scheduled time
    const existingSchedule = league.draftState?.scheduledStartTime || league.settings?.draftDate;
    if (!isAutoScheduled && existingSchedule && new Date(existingSchedule) > new Date()) {
        throw new ApiError(400, `Draft is scheduled for ${new Date(existingSchedule).toLocaleString()} and is locked. It will start automatically at that time and cannot be started manually.`, "DRAFT_SCHEDULED_LOCKED");
    }

    const minTeams = league.settings?.minTeams || 2;
    const teams = await Team.find({ leagueId }).sort({ createdAt: 1 });
    if (teams.length < minTeams) {
        throw new ApiError(400, `At least ${minTeams} teams are required to start the draft (currently ${teams.length} joined)`, "MIN_TEAMS_REQUIRED");
    }

    // Ensure matchPlayerPool is populated
    if (!league.matchPlayerPool || league.matchPlayerPool.length === 0) {
        const matchId = league.matchId || "match_ind_aus_2026_01";
        const match = await MatchDataProvider.getMatchById(matchId);
        if (match && match.squad) {
            league.matchPlayerPool = match.squad.map(p => ({
                id: p.id,
                name: p.name,
                realTeam: p.realTeam,
                position: p.position,
                price: p.price,
                ownershipLimit: league.playerOwnershipLimit || p.ownershipLimit || 5
            }));
            if (!league.matchDetails) {
                league.matchDetails = {
                    name: match.name,
                    series: match.series,
                    format: match.format,
                    venue: match.venue,
                    matchDate: match.matchDate,
                    lineupLockTime: match.lineupLockTime,
                    team1: match.team1,
                    team2: match.team2
                };
            }
        }
    }

    const now = new Date();
    league.status = "Draft";
    league.draftState = {
        startedAt: now,
        turnStartedAt: now,
        turnExpiresAt: new Date(now.getTime() + 30 * 1000),
        currentPick: 1,
        currentRound: 1,
        turnDurationSeconds: 30
    };

    await league.save();

    // Ensure Roster documents exist for all teams
    for (const team of teams) {
        let roster = await Roster.findOne({ teamId: team._id });
        if (!roster) {
            await Roster.create({
                teamId: team._id,
                leagueId: league._id,
                playerIds: []
            });
        }
    }

    return { league, teamsCount: teams.length, message: "Snake draft started successfully" };
};

export const scheduleDraftService = async (leagueId, requestingUserId, scheduledStartTime) => {
    const league = await League.findById(leagueId);
    if (!league) {
        throw new ApiError(404, "League not found", "LEAGUE_NOT_FOUND");
    }

    if (league.status !== "Created" && league.status !== "Upcoming") {
        throw new ApiError(400, `Cannot schedule draft for league in ${league.status} status`, "INVALID_LEAGUE_STATUS");
    }

    // Check if draft is already locked to a scheduled time
    const existingSchedule = league.draftState?.scheduledStartTime || league.settings?.draftDate;
    if (existingSchedule && new Date(existingSchedule) > new Date()) {
        throw new ApiError(400, `Draft is already scheduled and locked for ${new Date(existingSchedule).toLocaleString()}. Once scheduled, the draft time cannot be modified.`, "DRAFT_SCHEDULE_LOCKED");
    }

    const minTeams = league.settings?.minTeams || 2;
    const teams = await Team.find({ leagueId }).sort({ createdAt: 1 });
    if (teams.length < minTeams) {
        throw new ApiError(400, `At least ${minTeams} teams are required to schedule the draft (currently ${teams.length} joined)`, "MIN_TEAMS_REQUIRED");
    }

    if (!scheduledStartTime) {
        throw new ApiError(400, "Scheduled start time is required", "INVALID_SCHEDULE_TIME");
    }

    const scheduledDate = new Date(scheduledStartTime);
    if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
        throw new ApiError(400, "Scheduled draft time must be in the future", "INVALID_FUTURE_TIME");
    }

    league.settings = league.settings || {};
    league.settings.draftDate = scheduledDate;
    league.draftState = league.draftState || {};
    league.draftState.scheduledStartTime = scheduledDate;

    await league.save();

    return {
        league,
        scheduledStartTime: scheduledDate,
        message: `Draft successfully scheduled for ${scheduledDate.toLocaleString()}`
    };
};

export const getDraftStateService = async (leagueId, requestingUserId) => {
    const league = await League.findById(leagueId);
    if (!league) {
        throw new ApiError(404, "League not found", "LEAGUE_NOT_FOUND");
    }

    const teams = await Team.find({ leagueId }).populate('userId', 'username avatarUrl').sort({ createdAt: 1 });
    const rosters = await Roster.find({ leagueId });

    // Auto-populate matchPlayerPool if missing
    if (!league.matchPlayerPool || league.matchPlayerPool.length === 0) {
        const matchId = league.matchId || "match_ind_aus_2026_01";
        const match = await MatchDataProvider.getMatchById(matchId);
        if (match && match.squad) {
            league.matchPlayerPool = match.squad.map(p => ({
                id: p.id,
                name: p.name,
                realTeam: p.realTeam,
                position: p.position,
                price: p.price,
                ownershipLimit: league.playerOwnershipLimit || p.ownershipLimit || 5
            }));
            await league.save();
        }
    }

    // Auto-start scheduled draft if scheduled start time has arrived
    const scheduledTime = league.draftState?.scheduledStartTime || league.settings?.draftDate;
    if ((league.status === "Created" || league.status === "Upcoming") && scheduledTime && new Date(scheduledTime) <= new Date()) {
        if (teams.length >= 2) {
            try {
                await startDraftService(leagueId, requestingUserId);
                const updatedLeague = await League.findById(leagueId);
                if (updatedLeague) {
                    league.status = updatedLeague.status;
                    league.draftState = updatedLeague.draftState;
                }
            } catch (err) {
                console.error("[Auto-Start Draft] Error auto-starting draft on schedule time:", err.message);
            }
        }
    }

    const maxRosterSize = league.settings?.rosterSize || 15;
    const numTeams = teams.length || 1;
    const totalDraftPicks = numTeams * maxRosterSize;

    // Calculate total picks made so far
    let totalPicksMade = 0;
    rosters.forEach(r => {
        totalPicksMade += (r.playerIds || []).length;
    });

    const isDraftComplete = totalPicksMade >= totalDraftPicks && teams.length > 0;
    const currentRound = Math.min(Math.floor(totalPicksMade / numTeams) + 1, maxRosterSize);
    const pickIndexInRound = totalPicksMade % numTeams;

    // Snake Draft Turn Logic:
    // Odd rounds (1, 3, 5...): Team 1 -> Team N
    // Even rounds (2, 4, 6...): Team N -> Team 1
    let currentTurnTeam = null;
    if (!isDraftComplete && teams.length > 0) {
        const isRoundOdd = currentRound % 2 === 1;
        const turnTeamIndex = isRoundOdd ? pickIndexInRound : (numTeams - 1 - pickIndexInRound);
        currentTurnTeam = teams[turnTeamIndex] || teams[0];
    }

    const turnDuration = league.draftState?.turnDurationSeconds || 30;
    let turnStartedAt = league.draftState?.turnStartedAt || league.draftState?.startedAt || new Date();
    let turnExpiresAt = league.draftState?.turnExpiresAt;

    // If turnExpiresAt is unset or past for active draft, initialize
    if (league.status === "Draft" && (!turnExpiresAt || new Date(turnExpiresAt) < new Date(Date.now() - 60000))) {
        turnStartedAt = new Date();
        turnExpiresAt = new Date(Date.now() + turnDuration * 1000);
        league.draftState = league.draftState || {};
        league.draftState.turnStartedAt = turnStartedAt;
        league.draftState.turnExpiresAt = turnExpiresAt;
        league.draftState.currentPick = totalPicksMade + 1;
        league.draftState.currentRound = currentRound;
        await league.save();
    }

    let timeRemaining = turnDuration;
    if (turnExpiresAt) {
        const diffMs = new Date(turnExpiresAt).getTime() - Date.now();
        timeRemaining = Math.max(0, Math.ceil(diffMs / 1000));
    }

    // Player pool resolution with Limited Ownership counter
    const playerOwnershipMap = {};
    rosters.forEach(r => {
        (r.playerIds || []).forEach(pId => {
            const idStr = pId ? (pId._id ? pId._id.toString() : pId.toString()) : "";
            if (idStr) {
                playerOwnershipMap[idStr] = (playerOwnershipMap[idStr] || 0) + 1;
            }
        });
    });

    // Player pool lookup map
    const playersMap = new Map();
    if (league.matchPlayerPool && league.matchPlayerPool.length > 0) {
        league.matchPlayerPool.forEach(p => {
            playersMap.set(p.id, {
                id: p.id,
                _id: p.id,
                name: p.name,
                realTeam: p.realTeam,
                position: p.position,
                price: p.price,
                ownershipLimit: p.ownershipLimit || maxOwnership
            });
        });
    }

    // Build available players from match pool (League-level availability based on ownership limit)
    let availablePlayers = [];
    if (league.matchPlayerPool && league.matchPlayerPool.length > 0) {
        availablePlayers = league.matchPlayerPool.map(p => {
            const ownedCount = playerOwnershipMap[p.id] || 0;
            const ownershipLimit = p.ownershipLimit || maxOwnership;
            const isAvailable = ownedCount < ownershipLimit;
            return {
                _id: p.id,
                id: p.id,
                name: p.name,
                realTeam: p.realTeam,
                position: p.position,
                price: p.price,
                ownershipLimit,
                currentOwnership: ownedCount,
                isAvailable
            };
        });
    } else {
        const allDbPlayers = await Player.find({ availabilityStatus: "available" }).sort({ price: -1, name: 1 });
        allDbPlayers.forEach(p => {
            playersMap.set(p._id.toString(), {
                id: p._id.toString(),
                _id: p._id.toString(),
                name: p.name,
                realTeam: p.realTeam,
                position: p.position,
                price: p.price,
                ownershipLimit: maxOwnership
            });
        });

        availablePlayers = allDbPlayers.map(p => {
            const pIdStr = p._id.toString();
            const ownedCount = playerOwnershipMap[pIdStr] || 0;
            const isAvailable = ownedCount < maxOwnership;
            return {
                _id: p._id,
                id: pIdStr,
                name: p.name,
                realTeam: p.realTeam,
                position: p.position,
                price: p.price,
                ownershipLimit: maxOwnership,
                currentOwnership: ownedCount,
                isAvailable
            };
        });
    }

    // Map teams with their fully hydrated player rosters
    const teamsDraftStatus = teams.map((team, idx) => {
        const roster = rosters.find(r => r.teamId.toString() === team._id.toString());
        const teamPlayerIds = roster ? (roster.playerIds || []).map(pId => pId ? (pId._id ? pId._id.toString() : pId.toString()) : "") : [];
        const hydratedTeamPlayers = teamPlayerIds.map(pId => {
            return playersMap.get(pId) || {
                id: pId,
                name: "Squad Player",
                position: "BAT",
                realTeam: "CRIC",
                price: 10
            };
        });

        return {
            teamId: team._id,
            teamName: team.name,
            username: team.userId?.username,
            avatarUrl: team.userId?.avatarUrl,
            draftSlot: idx + 1,
            rosterCount: teamPlayerIds.length,
            playerIds: teamPlayerIds,
            players: hydratedTeamPlayers,
            isCurrentTurn: currentTurnTeam ? currentTurnTeam._id.toString() === team._id.toString() : false
        };
    });

    const defaultMatchDetails = {
        name: "India vs Australia",
        series: "T20 Super Series 2026",
        format: "T20",
        venue: "Wankhede Stadium, Mumbai",
        matchDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
        lineupLockTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 30).toISOString(),
        team1: { name: "India", shortName: "IND" },
        team2: { name: "Australia", shortName: "AUS" }
    };

    return {
        leagueId: league._id,
        leagueName: league.name,
        leagueStatus: league.status,
        matchDetails: league.matchDetails || defaultMatchDetails,
        currentRound,
        currentPick: totalPicksMade + 1,
        totalDraftPicks,
        isDraftComplete,
        timeRemaining,
        turnStartedAt: turnStartedAt ? new Date(turnStartedAt).toISOString() : new Date().toISOString(),
        turnDuration: turnDuration,
        turnExpiresAt: turnExpiresAt ? new Date(turnExpiresAt).toISOString() : new Date(Date.now() + 30000).toISOString(),
        serverTime: Date.now(),
        scheduledStartTime: league.draftState?.scheduledStartTime || league.settings?.draftDate,
        currentTurnTeam: currentTurnTeam ? {
            teamId: currentTurnTeam._id,
            teamName: currentTurnTeam.name,
            username: currentTurnTeam.userId?.username
        } : null,
        maxRosterSize,
        availablePlayers,
        teams: teamsDraftStatus
    };
};

export const selectDraftPlayerService = async (leagueId, userId, playerId) => {
    const league = await League.findById(leagueId);
    if (!league) {
        throw new ApiError(404, "League not found", "LEAGUE_NOT_FOUND");
    }

    if (league.status !== "Draft" && league.status !== "Created" && league.status !== "Upcoming") {
        throw new ApiError(400, `Cannot draft players when league status is ${league.status}`, "INVALID_DRAFT_STATE");
    }

    const team = await Team.findOne({ leagueId, userId });
    if (!team) {
        throw new ApiError(403, "You do not own a team in this league", "NO_TEAM");
    }

    // Get draft state to verify it is user's team's turn
    const currentState = await getDraftStateService(leagueId, userId);
    if (currentState.currentTurnTeam && currentState.currentTurnTeam.teamId.toString() !== team._id.toString()) {
        throw new ApiError(400, `Not your turn. Currently ${currentState.currentTurnTeam.teamName}'s turn.`, "NOT_YOUR_TURN");
    }

    // Get or create team roster
    let roster = await Roster.findOne({ teamId: team._id });
    if (!roster) {
        roster = await Roster.create({
            teamId: team._id,
            leagueId,
            playerIds: []
        });
    }

    const maxRosterSize = league.settings?.rosterSize || 15;
    if (roster.playerIds.length >= maxRosterSize) {
        throw new ApiError(400, `Your roster is already full (${maxRosterSize} players)`, "ROSTER_FULL");
    }

    // Check if team already has this player
    const hasPlayer = roster.playerIds.some(id => (id ? id.toString() : "") === playerId.toString());
    if (hasPlayer) {
        throw new ApiError(400, "You have already drafted this player to your squad", "ALREADY_DRAFTED_BY_YOU");
    }

    // Check limited ownership limit across all teams in league
    const allRosters = await Roster.find({ leagueId });
    const ownershipCount = allRosters.filter(r =>
        (r.playerIds || []).some(id => (id ? id.toString() : "") === playerId.toString())
    ).length;

    const maxOwnership = league.playerOwnershipLimit || 5;
    if (ownershipCount >= maxOwnership) {
        throw new ApiError(400, `Player has reached maximum ownership limit of ${maxOwnership} teams in this league`, "PLAYER_OWNERSHIP_LIMIT_REACHED");
    }

    // Add player to roster
    roster.playerIds.push(playerId);
    await roster.save();

    // Recalculate pick and round
    let totalPicksMade = 0;
    const allTeams = await Team.find({ leagueId });
    const updatedRosters = await Roster.find({ leagueId });
    updatedRosters.forEach(r => {
        totalPicksMade += (r.playerIds || []).length;
    });

    const numTeams = allTeams.length || 1;
    const currentRound = Math.min(Math.floor(totalPicksMade / numTeams) + 1, maxRosterSize);
    const totalDraftPicks = numTeams * maxRosterSize;
    const isDraftComplete = allTeams.length > 0 && totalPicksMade >= totalDraftPicks;

    // Reset turn timer in DB
    const now = new Date();
    league.draftState = league.draftState || {};
    league.draftState.turnStartedAt = now;
    league.draftState.turnExpiresAt = new Date(now.getTime() + 30 * 1000);
    league.draftState.currentPick = totalPicksMade + 1;
    league.draftState.currentRound = currentRound;

    if (isDraftComplete) {
        league.status = "Active";
    }

    await league.save();

    return {
        teamId: team._id,
        playerId,
        rosterCount: roster.playerIds.length,
        currentRound,
        currentPick: totalPicksMade + 1,
        isDraftComplete,
        message: `Player drafted successfully to ${team.name}`
    };
};

export const autoPickDraftPlayerService = async (leagueId) => {
    const league = await League.findById(leagueId);
    if (!league || league.status !== "Draft") return null;

    const state = await getDraftStateService(leagueId);
    if (state.isDraftComplete || !state.currentTurnTeam) return null;

    const currentTurnTeamId = state.currentTurnTeam.teamId;
    const team = await Team.findById(currentTurnTeamId);
    if (!team) return null;

    const roster = await Roster.findOne({ teamId: team._id });
    const userRosterIds = (roster?.playerIds || []).map(id => id ? id.toString() : "");

    // Find first available player not in team's roster
    const candidatePlayer = (state.availablePlayers || []).find(p => p.isAvailable && !userRosterIds.includes(p.id));
    if (!candidatePlayer) return null;

    return await selectDraftPlayerService(leagueId, team.userId, candidatePlayer.id);
};
