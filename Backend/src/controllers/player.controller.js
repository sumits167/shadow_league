import {
    createPlayerService,
    getPlayersService,
    getPlayerByIdService,
    updatePlayerStatsService,
    seedSamplePlayersService
} from '../services/player.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createPlayer = asyncHandler(async (req, res) => {
    const player = await createPlayerService(req.body);
    return res.status(201).json(new ApiResponse(201, player, "Player created successfully", true));
});

export const getPlayers = asyncHandler(async (req, res) => {
    const players = await getPlayersService(req.query);
    return res.status(200).json(new ApiResponse(200, players, "Players fetched successfully", true));
});

export const getPlayerById = asyncHandler(async (req, res) => {
    const { playerId } = req.params;
    const player = await getPlayerByIdService(playerId);
    return res.status(200).json(new ApiResponse(200, player, "Player fetched successfully", true));
});

export const updatePlayerStats = asyncHandler(async (req, res) => {
    const { playerId } = req.params;
    const player = await updatePlayerStatsService(playerId, req.body);
    return res.status(200).json(new ApiResponse(200, player, "Player stats updated successfully", true));
});

export const seedSamplePlayers = asyncHandler(async (req, res) => {
    const result = await seedSamplePlayersService();
    return res.status(200).json(new ApiResponse(200, result, "Sample players seeded successfully", true));
});
