import { MatchDataProvider } from '../services/matchProvider/matchData.provider.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getUpcomingMatches = asyncHandler(async (req, res) => {
  const matches = await MatchDataProvider.getUpcomingMatches();
  return res.status(200).json(new ApiResponse(200, matches, "Upcoming matches fetched successfully", true));
});

export const getMatchById = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const match = await MatchDataProvider.getMatchById(matchId);
  if (!match) {
    throw new ApiError(404, "Match not found", "MATCH_NOT_FOUND");
  }
  return res.status(200).json(new ApiResponse(200, match, "Match details fetched successfully", true));
});

export const getMatchPlayers = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const players = await MatchDataProvider.getMatchPlayers(matchId);
  return res.status(200).json(new ApiResponse(200, players, "Match eligible players fetched successfully", true));
});
