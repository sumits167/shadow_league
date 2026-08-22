import {
    startDraftService,
    scheduleDraftService,
    getDraftStateService,
    selectDraftPlayerService
} from '../services/draft.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const startDraft = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const userId = req.user._id;
    const result = await startDraftService(leagueId, userId);
    return res.status(200).json(new ApiResponse(200, result, "Draft started successfully", true));
});

export const scheduleDraft = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const { scheduledStartTime } = req.body;
    const userId = req.user._id;
    const result = await scheduleDraftService(leagueId, userId, scheduledStartTime);
    return res.status(200).json(new ApiResponse(200, result, "Draft scheduled successfully", true));
});

export const getDraftState = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const state = await getDraftStateService(leagueId);
    return res.status(200).json(new ApiResponse(200, state, "Draft state fetched successfully", true));
});

export const selectDraftPlayer = asyncHandler(async (req, res) => {
    const { leagueId } = req.params;
    const { playerId } = req.body;
    const userId = req.user._id;
    const result = await selectDraftPlayerService(leagueId, userId, playerId);
    return res.status(200).json(new ApiResponse(200, result, "Player drafted successfully", true));
});
