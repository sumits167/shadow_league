import crypto from 'crypto';
import { Club } from '../models/club.model.js';
import { ClubMember } from '../models/clubMember.model.js';
import { ClubInvite } from '../models/clubInvite.model.js';
import ApiError from '../utils/ApiError.js';

const generateSlug = (name) => {
    const slugified = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex');
    return `${slugified}-${randomHex}`;
};

const generateInviteCode = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

export const generateClubInviteCodeService = async (clubId, userId, expiresInHours = 24) => {
    const club = await Club.findById(clubId);
    if (!club) {
        throw new ApiError(404, "Club not found", "CLUB_NOT_FOUND");
    }

    const membership = await ClubMember.findOne({ clubId, userId });
    if (club.ownerId.toString() !== userId.toString() && (!membership || membership.role !== 'admin')) {
        throw new ApiError(403, "Only club administrators can generate invite codes", "FORBIDDEN");
    }

    // Generate unique uppercase code
    let code;
    let exists = true;
    while (exists) {
        code = crypto.randomBytes(4).toString('hex').toUpperCase();
        const found = await ClubInvite.findOne({ code });
        if (!found) exists = false;
    }

    const parsedHours = Number(expiresInHours) > 0 ? Number(expiresInHours) : 24;
    const expiresAt = new Date(Date.now() + parsedHours * 60 * 60 * 1000);

    const invite = await ClubInvite.create({
        clubId,
        code,
        createdBy: userId,
        expiresAt
    });

    return {
        code: invite.code,
        expiresAt: invite.expiresAt,
        expiresInHours: parsedHours,
        isUsed: false
    };
};

export const createClubService = async (userId, clubData) => {
    const slug = generateSlug(clubData.name);
    const inviteCode = generateInviteCode();

    const club = await Club.create({
        ...clubData,
        slug,
        ownerId: userId,
        inviteCode
    });

    await ClubMember.create({
        clubId: club._id,
        userId,
        role: 'admin'
    });

    return club;
};

export const getUserClubsService = async (userId) => {
    const memberships = await ClubMember.find({ userId }).select('clubId role');
    const clubIds = memberships.map(m => m.clubId);

    const clubs = await Club.find({ _id: { $in: clubIds } }).populate('ownerId', 'username email avatarUrl');

    const result = clubs.map(club => {
        const membership = memberships.find(m => m.clubId.toString() === club._id.toString());
        return {
            ...club.toObject(),
            userRole: membership ? membership.role : 'member'
        };
    });

    return result;
};

export const getClubBySlugService = async (slug, userId) => {
    const club = await Club.findOne({ slug }).populate('ownerId', 'username email avatarUrl');
    if (!club) {
        throw new ApiError(404, "Club not found", "CLUB_NOT_FOUND");
    }

    const membership = await ClubMember.findOne({ clubId: club._id, userId });
    const memberCount = await ClubMember.countDocuments({ clubId: club._id });

    return {
        ...club.toObject(),
        isMember: !!membership,
        userRole: membership ? membership.role : null,
        memberCount
    };
};

export const joinClubService = async (identifier, userId, inviteCode) => {
    const trimmedIdentifier = identifier ? identifier.trim() : "";
    const trimmedCode = inviteCode ? inviteCode.trim() : "";
    const searchCandidate = (trimmedCode || trimmedIdentifier).toUpperCase();

    // 1. Check if the input is a single-use ClubInvite code
    let inviteRecord = await ClubInvite.findOne({ code: searchCandidate });
    let club = null;

    if (inviteRecord) {
        club = await Club.findById(inviteRecord.clubId);
    }

    // 2. If not found via invite record, look up by public slug or legacy static code
    if (!club) {
        club = await Club.findOne({
            $or: [
                { slug: trimmedIdentifier.toLowerCase() },
                { inviteCode: searchCandidate }
            ]
        });
    }

    // 3. Fallback prefix search
    if (!club) {
        club = await Club.findOne({
            slug: { $regex: new RegExp(`^${trimmedIdentifier}`, 'i') }
        });
    }

    if (!club) {
        throw new ApiError(404, "Club not found with the provided slug or invite code", "CLUB_NOT_FOUND");
    }

    const existingMember = await ClubMember.findOne({ clubId: club._id, userId });
    if (existingMember) {
        throw new ApiError(400, "You are already a member of this club", "ALREADY_MEMBER");
    }

    // Access control: Public clubs allow anyone with the slug. Private clubs require a valid, single-use invite code.
    if (club.isPrivate && !club.settings?.allowPublicJoin) {
        // Verify single-use invite record if available
        if (inviteRecord && inviteRecord.clubId.toString() === club._id.toString()) {
            if (inviteRecord.isUsed) {
                throw new ApiError(403, "This invite code has already been used and is no longer valid.", "INVITE_ALREADY_USED");
            }
            if (new Date() > new Date(inviteRecord.expiresAt)) {
                throw new ApiError(403, "This invite code has expired. Please ask the club admin for a new invite code.", "INVITE_EXPIRED");
            }

            // Immediately delete the single-use invite code document after use
            await ClubInvite.findByIdAndDelete(inviteRecord._id);
        } else if (club.inviteCode && searchCandidate === club.inviteCode) {
            // Allowed for legacy static club invite code
        } else {
            throw new ApiError(403, "This is a Private Club. A valid single-use invite code is required to join.", "PRIVATE_CLUB_INVITE_REQUIRED");
        }
    }

    const member = await ClubMember.create({
        clubId: club._id,
        userId,
        role: 'member'
    });

    return { club, member };
};

export const getClubMembersService = async (clubId, requestingUserId) => {
    const membership = await ClubMember.findOne({ clubId, userId: requestingUserId });
    if (!membership) {
        throw new ApiError(403, "You must be a member of the club to view its members", "FORBIDDEN");
    }

    const members = await ClubMember.find({ clubId }).populate('userId', 'username email avatarUrl role');
    return members;
};

export const removeClubMemberService = async (clubId, targetUserId, requestingUserId) => {
    const requesterMembership = await ClubMember.findOne({ clubId, userId: requestingUserId });
    if (!requesterMembership || requesterMembership.role !== 'admin') {
        throw new ApiError(403, "Only club administrators can remove members", "FORBIDDEN");
    }

    const club = await Club.findById(clubId);
    if (club.ownerId.toString() === targetUserId.toString()) {
        throw new ApiError(400, "Cannot remove the club owner", "CANNOT_REMOVE_OWNER");
    }

    const deleted = await ClubMember.findOneAndDelete({ clubId, userId: targetUserId });
    if (!deleted) {
        throw new ApiError(404, "Member not found in club", "MEMBER_NOT_FOUND");
    }

    return { message: "Member removed successfully" };
};

export const updateClubMemberRoleService = async (clubId, targetUserId, newRole, requestingUserId) => {
    const requesterMembership = await ClubMember.findOne({ clubId, userId: requestingUserId });
    if (!requesterMembership || requesterMembership.role !== 'admin') {
        throw new ApiError(403, "Only club administrators can update member roles", "FORBIDDEN");
    }

    const club = await Club.findById(clubId);
    if (!club) {
        throw new ApiError(404, "Club not found", "CLUB_NOT_FOUND");
    }

    if (club.ownerId.toString() === targetUserId.toString() && newRole !== 'admin') {
        throw new ApiError(400, "Cannot demote the club owner", "CANNOT_DEMOTE_OWNER");
    }

    if (!['admin', 'member'].includes(newRole)) {
        throw new ApiError(400, "Role must be 'admin' or 'member'", "INVALID_ROLE");
    }

    const member = await ClubMember.findOneAndUpdate(
        { clubId, userId: targetUserId },
        { $set: { role: newRole } },
        { new: true }
    ).populate('userId', 'username email avatarUrl role');

    if (!member) {
        throw new ApiError(404, "Member not found in club", "MEMBER_NOT_FOUND");
    }

    return member;
};

export const updateClubService = async (clubId, updateData, requestingUserId) => {
    const membership = await ClubMember.findOne({ clubId, userId: requestingUserId });
    if (!membership || membership.role !== 'admin') {
        throw new ApiError(403, "Only club administrators can update club settings", "FORBIDDEN");
    }

    const updatedClub = await Club.findByIdAndUpdate(
        clubId,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    return updatedClub;
};
