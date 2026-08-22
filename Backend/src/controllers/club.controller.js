import {
    createClubService,
    getUserClubsService,
    getClubBySlugService,
    joinClubService,
    getClubMembersService,
    removeClubMemberService,
    updateClubMemberRoleService,
    updateClubService,
    generateClubInviteCodeService
} from '../services/club.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createClub = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const club = await createClubService(userId, req.body);
    return res.status(201).json(new ApiResponse(201, club, "Club created successfully", true));
});

export const getMyClubs = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const clubs = await getUserClubsService(userId);
    return res.status(200).json(new ApiResponse(200, clubs, "User clubs fetched successfully", true));
});

export const getClubBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const userId = req.user._id;
    const club = await getClubBySlugService(slug, userId);
    return res.status(200).json(new ApiResponse(200, club, "Club details fetched successfully", true));
});

export const joinClub = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const userId = req.user._id;
    const { inviteCode } = req.body;
    const result = await joinClubService(slug, userId, inviteCode);
    return res.status(200).json(new ApiResponse(200, result, "Joined club successfully", true));
});

export const generateClubInviteCode = asyncHandler(async (req, res) => {
    const { clubId } = req.params;
    const { expiresInHours } = req.body || {};
    const userId = req.user._id;
    const result = await generateClubInviteCodeService(clubId, userId, expiresInHours);
    return res.status(201).json(new ApiResponse(201, result, "Single-use invite code generated successfully", true));
});

export const getClubMembers = asyncHandler(async (req, res) => {
    const { clubId } = req.params;
    const userId = req.user._id;
    const members = await getClubMembersService(clubId, userId);
    return res.status(200).json(new ApiResponse(200, members, "Club members fetched successfully", true));
});

export const removeClubMember = asyncHandler(async (req, res) => {
    const { clubId, targetUserId } = req.params;
    const userId = req.user._id;
    const result = await removeClubMemberService(clubId, targetUserId, userId);
    return res.status(200).json(new ApiResponse(200, result, "Member removed successfully", true));
});

export const updateClubMemberRole = asyncHandler(async (req, res) => {
    const { clubId, targetUserId } = req.params;
    const { role } = req.body;
    const userId = req.user._id;
    const result = await updateClubMemberRoleService(clubId, targetUserId, role, userId);
    return res.status(200).json(new ApiResponse(200, result, "Member role updated successfully", true));
});

export const updateClub = asyncHandler(async (req, res) => {
    const { clubId } = req.params;
    const userId = req.user._id;
    const updatedClub = await updateClubService(clubId, req.body, userId);
    return res.status(200).json(new ApiResponse(200, updatedClub, "Club updated successfully", true));
});
