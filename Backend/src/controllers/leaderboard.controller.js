import {
    getLeagueLeaderboardService,
    updateLeagueLeaderboardService,
    calculateLineupScoreService,
    getUserJoinedLeaguesStandingsService
} from '../services/scoring.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getLeagueLeaderboard = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const leaderboard = await getLeagueLeaderboardService(leagueId);
    return res.status(200).json(new ApiResponse(200, leaderboard, "Leaderboard fetched successfully", true));
});

export const recalculateLeaderboard = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const standings = await updateLeagueLeaderboardService(leagueId);
    return res.status(200).json(new ApiResponse(200, standings, "Leaderboard recalculated successfully", true));
});

export const getLineupScore = asyncHandler(async (req, res) => {
    const { teamId, matchWeek } = req.params;
    const score = await calculateLineupScoreService(teamId, Number(matchWeek));
    return res.status(200).json(new ApiResponse(200, score, "Matchweek lineup score calculated", true));
});

export const getUserJoinedStandings = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { clubId } = req.query;
    const standings = await getUserJoinedLeaguesStandingsService(userId, clubId);
    return res.status(200).json(new ApiResponse(200, standings, "User joined leagues standings fetched successfully", true));
});
