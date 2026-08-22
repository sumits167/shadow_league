import {
    createLeagueService,
    getClubLeaguesService,
    getLeagueByIdService,
    joinLeagueService,
    updateLeagueService,
    completeSeasonService,
    deleteLeagueService
} from '../services/league.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createLeague = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const league = await createLeagueService(userId, req.body);
    return res.status(201).json(new ApiResponse(201, league, "League created successfully", true));
});

export const getClubLeagues = asyncHandler(async (req, res) => {
    const { clubId } = req.params;
    const userId = req.user._id;
    const leagues = await getClubLeaguesService(clubId, userId);
    return res.status(200).json(new ApiResponse(200, leagues, "Leagues fetched successfully", true));
});

export const getLeagueById = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const userId = req.user._id;
    const league = await getLeagueByIdService(leagueId, userId);
    return res.status(200).json(new ApiResponse(200, league, "League details fetched successfully", true));
});

export const joinLeague = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const userId = req.user._id;
    const team = await joinLeagueService(leagueId, userId, req.body);
    return res.status(201).json(new ApiResponse(201, team, "Joined league successfully", true));
});

export const updateLeague = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const userId = req.user._id;
    const updatedLeague = await updateLeagueService(leagueId, userId, req.body);
    return res.status(200).json(new ApiResponse(200, updatedLeague, "League updated successfully", true));
});

export const completeSeason = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const userId = req.user._id;
    const league = await completeSeasonService(leagueId, userId);
    return res.status(200).json(new ApiResponse(200, league, "Season marked as completed", true));
});

export const deleteLeague = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const userId = req.user._id;
    const result = await deleteLeagueService(leagueId, userId);
    return res.status(200).json(new ApiResponse(200, result, "League deleted successfully", true));
});
