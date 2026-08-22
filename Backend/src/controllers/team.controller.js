import {
    getTeamByIdService,
    getUserTeamInLeagueService,
    getLeagueTeamsService,
    updateTeamService
} from '../services/team.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTeamById = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const team = await getTeamByIdService(teamId);
    return res.status(200).json(new ApiResponse(200, team, "Team details fetched successfully", true));
});

export const getUserTeamInLeague = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const userId = req.user._id;
    const team = await getUserTeamInLeagueService(leagueId, userId);
    return res.status(200).json(new ApiResponse(200, team, "User team fetched successfully", true));
});

export const getLeagueTeams = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const teams = await getLeagueTeamsService(leagueId);
    return res.status(200).json(new ApiResponse(200, teams, "League teams fetched successfully", true));
});

export const updateTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user._id;
    const team = await updateTeamService(teamId, userId, req.body);
    return res.status(200).json(new ApiResponse(200, team, "Team updated successfully", true));
});
