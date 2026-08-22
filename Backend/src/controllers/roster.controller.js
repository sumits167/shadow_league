import {
    getTeamRosterService,
    getLeagueRostersService,
    dropPlayerFromRosterService
} from '../services/roster.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTeamRoster = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const roster = await getTeamRosterService(teamId);
    return res.status(200).json(new ApiResponse(200, roster, "Team roster fetched successfully", true));
});

export const getLeagueRosters = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const rosters = await getLeagueRostersService(leagueId);
    return res.status(200).json(new ApiResponse(200, rosters, "League rosters fetched successfully", true));
});

export const dropPlayerFromRoster = asyncHandler(async (req, res) => {
    const { teamId, playerId } = req.params;
    const userId = req.user._id;
    const updatedRoster = await dropPlayerFromRosterService(teamId, playerId, userId);
    return res.status(200).json(new ApiResponse(200, updatedRoster, "Player dropped from roster successfully", true));
});
