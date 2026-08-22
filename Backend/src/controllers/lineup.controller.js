import {
    submitLineupService,
    getLineupService,
    lockLineupService
} from '../services/lineup.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const submitLineup = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const lineup = await submitLineupService(userId, req.body);
    return res.status(200).json(new ApiResponse(200, lineup, "Lineup submitted successfully", true));
});

export const getLineup = asyncHandler(async (req, res) => {
    const { teamId, matchWeek } = req.params;
    const lineup = await getLineupService(teamId, Number(matchWeek));
    return res.status(200).json(new ApiResponse(200, lineup, "Lineup fetched successfully", true));
});

export const lockLineup = asyncHandler(async (req, res) => {
    const { teamId, matchWeek } = req.params;
    const lineup = await lockLineupService(teamId, Number(matchWeek));
    return res.status(200).json(new ApiResponse(200, lineup, "Lineup locked successfully", true));
});
