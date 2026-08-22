import { Team } from '../models/team.model.js';
import { Roster } from '../models/roster.model.js';
import { Lineup } from '../models/lineup.model.js';
import ApiError from '../utils/ApiError.js';

export const getTeamByIdService = async (teamId) => {
    const team = await Team.findById(teamId).populate('userId', 'username email avatarUrl').populate('leagueId', 'name season status');
    if (!team) {
        throw new ApiError(404, "Team not found", "TEAM_NOT_FOUND");
    }

    const roster = await Roster.findOne({ teamId }).populate('playerIds');
    const latestLineup = await Lineup.findOne({ teamId }).sort({ matchWeek: -1 }).populate('playerIds captainId viceCaptainId');

    return {
        ...team.toObject(),
        roster: roster ? roster.playerIds : [],
        latestLineup
    };
};

export const getUserTeamInLeagueService = async (leagueId, userId) => {
    const team = await Team.findOne({ leagueId, userId }).populate('userId', 'username avatarUrl');
    if (!team) {
        throw new ApiError(404, "Team not found for user in this league", "TEAM_NOT_FOUND");
    }

    const roster = await Roster.findOne({ teamId: team._id }).populate('playerIds');
    const latestLineup = await Lineup.findOne({ teamId: team._id }).sort({ matchWeek: -1 }).populate('playerIds captainId viceCaptainId');

    return {
        ...team.toObject(),
        roster: roster ? roster.playerIds : [],
        latestLineup
    };
};

export const getLeagueTeamsService = async (leagueId) => {
    const teams = await Team.find({ leagueId })
        .populate('userId', 'username avatarUrl')
        .sort({ totalPoints: -1 });

    return teams;
};

export const updateTeamService = async (teamId, userId, updateData) => {
    const team = await Team.findById(teamId);
    if (!team) {
        throw new ApiError(404, "Team not found", "TEAM_NOT_FOUND");
    }

    if (team.userId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only update your own team", "FORBIDDEN");
    }

    if (updateData.name) team.name = updateData.name;
    if (updateData.logoUrl !== undefined) team.logoUrl = updateData.logoUrl;

    await team.save();
    return team;
};
