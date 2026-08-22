import { Roster } from '../models/roster.model.js';
import { Team } from '../models/team.model.js';
import { League } from '../models/league.model.js';
import { Player } from '../models/player.model.js';
import ApiError from '../utils/ApiError.js';

// Helper to hydrate player details from League matchPlayerPool or DB Player collection
const hydrateRosterPlayers = async (roster, league) => {
    if (!roster) return roster;
    const rosterObj = roster.toObject ? roster.toObject() : roster;
    const playerIds = rosterObj.playerIds || [];

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
                price: p.price,
                ownershipLimit: p.ownershipLimit || 5
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

    rosterObj.playerIds = hydratedPlayers;
    rosterObj.players = hydratedPlayers;
    return rosterObj;
};

export const getTeamRosterService = async (teamId) => {
    const roster = await Roster.findOne({ teamId });
    if (!roster) {
        throw new ApiError(404, "Roster not found for this team", "ROSTER_NOT_FOUND");
    }

    const league = await League.findById(roster.leagueId);
    return await hydrateRosterPlayers(roster, league);
};

export const getLeagueRostersService = async (leagueId) => {
    const rosters = await Roster.find({ leagueId }).populate('teamId', 'name userId totalPoints');
    const league = await League.findById(leagueId);

    const hydrated = await Promise.all(
        rosters.map(r => hydrateRosterPlayers(r, league))
    );
    return hydrated;
};

export const dropPlayerFromRosterService = async (teamId, playerId, userId) => {
    const team = await Team.findById(teamId);
    if (!team) {
        throw new ApiError(404, "Team not found", "TEAM_NOT_FOUND");
    }

    if (team.userId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only manage your own team's roster", "FORBIDDEN");
    }

    const roster = await Roster.findOne({ teamId });
    if (!roster) {
        throw new ApiError(404, "Roster not found", "ROSTER_NOT_FOUND");
    }

    const playerIndex = roster.playerIds.findIndex(id => (id ? id.toString() : "") === playerId.toString());
    if (playerIndex === -1) {
        throw new ApiError(400, "Player is not in your roster", "PLAYER_NOT_IN_ROSTER");
    }

    roster.playerIds.splice(playerIndex, 1);
    await roster.save();

    const league = await League.findById(roster.leagueId);
    return await hydrateRosterPlayers(roster, league);
};
