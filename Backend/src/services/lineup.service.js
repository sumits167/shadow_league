import { Lineup } from '../models/lineup.model.js';
import { Team } from '../models/team.model.js';
import { Roster } from '../models/roster.model.js';
import { League } from '../models/league.model.js';
import { Player } from '../models/player.model.js';
import ApiError from '../utils/ApiError.js';

// Helper to hydrate lineup players from League match pool or DB Player collection
const hydrateLineupPlayers = async (lineup, league) => {
    if (!lineup) return lineup;
    const lineupObj = lineup.toObject ? lineup.toObject() : lineup;
    const playerIds = lineupObj.playerIds || [];

    const pool = league?.matchPlayerPool || [];
    const poolMap = new Map();
    pool.forEach(p => {
        poolMap.set(p.id, p);
        if (p._id) poolMap.set(p._id.toString(), p);
    });

    const hydratedPlayers = [];
    const missingObjectIds = [];

    for (const pId of playerIds) {
        const idStr = pId ? (pId._id ? pId._id.toString() : pId.toString()) : "";
        if (poolMap.has(idStr)) {
            const p = poolMap.get(idStr);
            hydratedPlayers.push({
                _id: p.id || idStr,
                id: p.id || idStr,
                name: p.name,
                realTeam: p.realTeam,
                position: p.position,
                price: p.price
            });
        } else if (idStr.length === 24) {
            missingObjectIds.push(idStr);
        }
    }

    if (missingObjectIds.length > 0) {
        const dbPlayers = await Player.find({ _id: { $in: missingObjectIds } });
        dbPlayers.forEach(p => {
            hydratedPlayers.push(p);
        });
    }

    // Hydrate Captain and Vice-Captain
    const capIdStr = lineupObj.captainId ? (lineupObj.captainId._id ? lineupObj.captainId._id.toString() : lineupObj.captainId.toString()) : "";
    const vcIdStr = lineupObj.viceCaptainId ? (lineupObj.viceCaptainId._id ? lineupObj.viceCaptainId._id.toString() : lineupObj.viceCaptainId.toString()) : "";

    const captain = hydratedPlayers.find(p => (p.id === capIdStr || (p._id && p._id.toString() === capIdStr))) || poolMap.get(capIdStr) || { id: capIdStr, name: "Captain" };
    const viceCaptain = hydratedPlayers.find(p => (p.id === vcIdStr || (p._id && p._id.toString() === vcIdStr))) || poolMap.get(vcIdStr) || { id: vcIdStr, name: "Vice-Captain" };

    lineupObj.playerIds = hydratedPlayers;
    lineupObj.captain = captain;
    lineupObj.viceCaptain = viceCaptain;
    return lineupObj;
};

export const submitLineupService = async (userId, lineupData) => {
    const { teamId, matchWeek, playerIds, captainId, viceCaptainId, lockDeadline } = lineupData;

    const team = await Team.findById(teamId);
    if (!team) {
        throw new ApiError(404, "Team not found", "TEAM_NOT_FOUND");
    }

    if (team.userId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only submit lineups for your own team", "FORBIDDEN");
    }

    // Verify all players belong to user's roster
    const roster = await Roster.findOne({ teamId });
    if (!roster) {
        throw new ApiError(400, "Team does not have an active roster", "NO_ROSTER");
    }

    const rosterPlayerIds = (roster.playerIds || []).map(id => id ? id.toString() : "");
    const areAllInRoster = playerIds.every(id => rosterPlayerIds.includes(id ? id.toString() : ""));

    if (!areAllInRoster) {
        throw new ApiError(400, "All lineup players must belong to your team's roster", "PLAYER_NOT_IN_ROSTER");
    }

    // Check existing lineup status / deadline
    const existingLineup = await Lineup.findOne({ teamId, matchWeek });
    if (existingLineup) {
        if (existingLineup.isLocked) {
            throw new ApiError(400, "Lineup for this matchweek is locked and cannot be modified", "LINEUP_LOCKED");
        }

        if (existingLineup.lockDeadline && new Date() > new Date(existingLineup.lockDeadline)) {
            existingLineup.isLocked = true;
            await existingLineup.save();
            throw new ApiError(400, "Lineup submission deadline has passed", "DEADLINE_PASSED");
        }
    }

    const deadlineDate = lockDeadline ? new Date(lockDeadline) : (existingLineup?.lockDeadline || new Date(Date.now() + 86400000));

    const lineup = await Lineup.findOneAndUpdate(
        { teamId, matchWeek },
        {
            leagueId: team.leagueId,
            teamId,
            matchWeek,
            playerIds,
            captainId,
            viceCaptainId,
            lockDeadline: deadlineDate,
            submittedAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const league = await League.findById(team.leagueId);
    return await hydrateLineupPlayers(lineup, league);
};

export const getLineupService = async (teamId, matchWeek) => {
    let lineup = await Lineup.findOne({ teamId, matchWeek });
    const team = await Team.findById(teamId);
    const league = team ? await League.findById(team.leagueId) : null;

    // If no lineup for this matchweek, fallback to previous week's lineup
    if (!lineup && matchWeek > 1) {
        const previousLineup = await Lineup.findOne({ teamId, matchWeek: matchWeek - 1 });
        if (previousLineup) {
            const hydrated = await hydrateLineupPlayers(previousLineup, league);
            return {
                ...hydrated,
                isFallbackFromPreviousWeek: true,
                targetMatchWeek: matchWeek
            };
        }
    }

    if (!lineup) {
        throw new ApiError(404, "No lineup found for this team and matchweek", "LINEUP_NOT_FOUND");
    }

    return await hydrateLineupPlayers(lineup, league);
};

export const lockLineupService = async (teamId, matchWeek) => {
    const lineup = await Lineup.findOne({ teamId, matchWeek });
    if (!lineup) {
        throw new ApiError(404, "Lineup not found", "LINEUP_NOT_FOUND");
    }

    lineup.isLocked = true;
    await lineup.save();

    const team = await Team.findById(teamId);
    const league = team ? await League.findById(team.leagueId) : null;
    return await hydrateLineupPlayers(lineup, league);
};

export const autoSelectLineupService = async (teamId, leagueId, matchWeek = 1) => {
    const team = await Team.findById(teamId);
    if (!team) return null;

    const league = await League.findById(leagueId || team.leagueId);
    if (!league) return null;

    const roster = await Roster.findOne({ teamId });
    if (!roster || !roster.playerIds || roster.playerIds.length === 0) {
        return null;
    }

    // Resolve 15 drafted players
    const pool = league.matchPlayerPool || [];
    const poolMap = new Map();
    pool.forEach(p => {
        poolMap.set(p.id, p);
        if (p._id) poolMap.set(p._id.toString(), p);
    });

    const rosterPlayers = [];
    for (const pId of roster.playerIds) {
        const idStr = pId ? (pId._id ? pId._id.toString() : pId.toString()) : "";
        if (poolMap.has(idStr)) {
            rosterPlayers.push(poolMap.get(idStr));
        } else if (idStr.length === 24) {
            const dbPlayer = await Player.findById(idStr);
            if (dbPlayer) rosterPlayers.push(dbPlayer);
        }
    }

    if (rosterPlayers.length === 0) return null;

    // Pick balanced 11 players
    const wks = rosterPlayers.filter(p => p.position === "WK").sort((a, b) => (b.price || 0) - (a.price || 0));
    const bats = rosterPlayers.filter(p => p.position === "BAT").sort((a, b) => (b.price || 0) - (a.price || 0));
    const ars = rosterPlayers.filter(p => p.position === "AR").sort((a, b) => (b.price || 0) - (a.price || 0));
    const bowls = rosterPlayers.filter(p => p.position === "BOWL").sort((a, b) => (b.price || 0) - (a.price || 0));

    const selected11 = [];
    const addedIds = new Set();

    const addPlayer = (p) => {
        if (!p) return;
        const pId = p.id || p._id?.toString();
        if (pId && !addedIds.has(pId) && selected11.length < 11) {
            selected11.push(p);
            addedIds.add(pId);
        }
    };

    // 1. Minimum requirements
    if (wks.length > 0) addPlayer(wks[0]);
    bats.slice(0, 3).forEach(addPlayer);
    ars.slice(0, 1).forEach(addPlayer);
    bowls.slice(0, 3).forEach(addPlayer);

    // 2. Fill remaining slots with highest price players
    const remaining = [...rosterPlayers].sort((a, b) => (b.price || 0) - (a.price || 0));
    for (const p of remaining) {
        if (selected11.length >= 11) break;
        addPlayer(p);
    }

    // 3. Captain (highest price) & Vice Captain (2nd highest price)
    const sortedByPrice = [...selected11].sort((a, b) => (b.price || 0) - (a.price || 0));
    const captainId = sortedByPrice[0]?.id || sortedByPrice[0]?._id;
    const viceCaptainId = (sortedByPrice[1] || sortedByPrice[0])?.id || (sortedByPrice[1] || sortedByPrice[0])?._id;

    const playerIds = selected11.map(p => p.id || p._id);

    const lineup = await Lineup.findOneAndUpdate(
        { teamId, matchWeek },
        {
            leagueId: league._id,
            teamId,
            matchWeek,
            playerIds,
            captainId,
            viceCaptainId,
            isLocked: true,
            submittedAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return await hydrateLineupPlayers(lineup, league);
};

export const autoSelectAllPendingLineupsService = async (leagueId, matchWeek = 1) => {
    const teams = await Team.find({ leagueId });
    const results = [];

    for (const team of teams) {
        const existingLineup = await Lineup.findOne({ teamId: team._id, matchWeek });
        if (!existingLineup || (existingLineup.playerIds || []).length < 11) {
            const autoLineup = await autoSelectLineupService(team._id, leagueId, matchWeek);
            results.push({ teamId: team._id, teamName: team.name, autoSelected: true, lineup: autoLineup });
        } else {
            // Lock existing lineup
            existingLineup.isLocked = true;
            await existingLineup.save();
            results.push({ teamId: team._id, teamName: team.name, autoSelected: false });
        }
    }

    return results;
};
