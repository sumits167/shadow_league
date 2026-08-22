import crypto from 'crypto';
import { League } from '../models/league.model.js';
import { Club } from '../models/club.model.js';
import { ClubMember } from '../models/clubMember.model.js';
import { Team } from '../models/team.model.js';
import { MatchDataProvider } from './matchProvider/matchData.provider.js';
import ApiError from '../utils/ApiError.js';

const generateSlug = (name) => {
    const slugified = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex');
    return `${slugified}-${randomHex}`;
};

export const createLeagueService = async (userId, leagueData) => {
    const {
        clubId,
        name,
        season = "2026",
        entryFee = 0,
        settings,
        matchId,
        playerOwnershipLimit = 5
    } = leagueData;

    // Verify user is a member/admin of the club
    const membership = await ClubMember.findOne({ clubId, userId });
    if (!membership) {
        throw new ApiError(403, "You must be a member of the club to create a league", "FORBIDDEN");
    }

    const club = await Club.findById(clubId);
    if (!club) {
        throw new ApiError(404, "Club not found", "CLUB_NOT_FOUND");
    }

    // Check max leagues limit for club
    const currentLeaguesCount = await League.countDocuments({ clubId, status: { $ne: 'Completed' } });
    if (currentLeaguesCount >= (club.settings?.maxLeagues || 10)) {
        throw new ApiError(400, `Club has reached maximum limit of ${club.settings?.maxLeagues || 10} active leagues`, "MAX_LEAGUES_REACHED");
    }

    const slug = generateSlug(name);

    // Resolve match details & eligible squad pool
    let resolvedMatchId = matchId;
    let matchDetails = null;
    let matchPlayerPool = [];

    if (resolvedMatchId) {
        const match = await MatchDataProvider.getMatchById(resolvedMatchId);
        if (match) {
            matchDetails = {
                name: match.name,
                series: match.series,
                format: match.format,
                venue: match.venue,
                matchDate: match.matchDate,
                lineupLockTime: match.lineupLockTime,
                team1: match.team1,
                team2: match.team2
            };
            matchPlayerPool = match.squad.map(p => ({
                id: p.id,
                name: p.name,
                realTeam: p.realTeam,
                position: p.position,
                price: p.price,
                ownershipLimit: playerOwnershipLimit || p.ownershipLimit || 5
            }));
        }
    } else {
        // Default to first upcoming match if none specified
        const upcoming = await MatchDataProvider.getUpcomingMatches();
        if (upcoming && upcoming.length > 0) {
            resolvedMatchId = upcoming[0].id;
            const match = await MatchDataProvider.getMatchById(resolvedMatchId);
            if (match) {
                matchDetails = {
                    name: match.name,
                    series: match.series,
                    format: match.format,
                    venue: match.venue,
                    matchDate: match.matchDate,
                    lineupLockTime: match.lineupLockTime,
                    team1: match.team1,
                    team2: match.team2
                };
                matchPlayerPool = match.squad.map(p => ({
                    id: p.id,
                    name: p.name,
                    realTeam: p.realTeam,
                    position: p.position,
                    price: p.price,
                    ownershipLimit: playerOwnershipLimit || p.ownershipLimit || 5
                }));
            }
        }
    }

    const league = await League.create({
        clubId,
        name,
        slug,
        season,
        entryFee,
        settings,
        matchId: resolvedMatchId,
        matchDetails,
        matchPlayerPool,
        playerOwnershipLimit,
        createdById: userId,
        status: "Created"
    });

    return league;
};

export const getClubLeaguesService = async (clubId, userId) => {
    const membership = await ClubMember.findOne({ clubId, userId });
    if (!membership) {
        throw new ApiError(403, "Must be a club member to view leagues", "FORBIDDEN");
    }

    const leagues = await League.find({ clubId }).sort({ createdAt: -1 });

    const leaguesWithTeams = await Promise.all(leagues.map(async (league) => {
        const teamCount = await Team.countDocuments({ leagueId: league._id });
        const userTeam = await Team.findOne({ leagueId: league._id, userId }).select('_id name totalPoints rank');
        return {
            ...league.toObject(),
            teamCount,
            hasJoined: !!userTeam,
            userTeam
        };
    }));

    return leaguesWithTeams;
};

export const getLeagueByIdService = async (leagueId, userId) => {
    const league = await League.findById(leagueId).populate('clubId', 'name slug ownerId');
    if (!league) {
        throw new ApiError(404, "League not found", "LEAGUE_NOT_FOUND");
    }

    const membership = await ClubMember.findOne({ clubId: league.clubId._id, userId });
    if (!membership) {
        throw new ApiError(403, "Must be a club member to view this league", "FORBIDDEN");
    }

    const teamCount = await Team.countDocuments({ leagueId: league._id });
    const userTeam = await Team.findOne({ leagueId: league._id, userId });

    return {
        ...league.toObject(),
        teamCount,
        hasJoined: !!userTeam,
        userTeam,
        userRoleInClub: membership.role
    };
};

export const joinLeagueService = async (leagueId, userId, teamData) => {
    const league = await League.findById(leagueId);
    if (!league) {
        throw new ApiError(404, "League not found", "LEAGUE_NOT_FOUND");
    }

    // Must be member of the club
    const membership = await ClubMember.findOne({ clubId: league.clubId, userId });
    if (!membership) {
        throw new ApiError(403, "You must join the club before joining this league", "NOT_CLUB_MEMBER");
    }

    if (league.status === "Completed") {
        throw new ApiError(400, "Cannot join a completed league season", "LEAGUE_COMPLETED");
    }

    // Check one user = one team per league
    const existingTeam = await Team.findOne({ leagueId, userId });
    if (existingTeam) {
        throw new ApiError(400, "You already have a team in this league (Rule: One team per user per league)", "TEAM_ALREADY_EXISTS");
    }

    // Check max teams limit
    const currentTeamsCount = await Team.countDocuments({ leagueId });
    if (currentTeamsCount >= (league.settings?.maxTeams || 10)) {
        throw new ApiError(400, "League is full", "LEAGUE_FULL");
    }

    const team = await Team.create({
        leagueId,
        userId,
        name: teamData.teamName,
        logoUrl: teamData.logoUrl || ""
    });

    return team;
};

export const updateLeagueService = async (leagueId, userId, updateData) => {
    const league = await League.findById(leagueId);
    if (!league) {
        throw new ApiError(404, "League not found", "LEAGUE_NOT_FOUND");
    }

    const membership = await ClubMember.findOne({ clubId: league.clubId, userId });
    if (!membership || membership.role !== 'admin') {
        throw new ApiError(403, "Only club administrators can modify league settings", "FORBIDDEN");
    }

    if (updateData.settings?.prizePool) {
        const { firstPlace, secondPlace, thirdPlace } = updateData.settings.prizePool;
        if (Number(firstPlace) <= Number(secondPlace) || Number(secondPlace) <= Number(thirdPlace) || Number(thirdPlace) < 0) {
            throw new ApiError(400, "Invalid Prize Pool: 1st place points must be greater than 2nd place, and 2nd place must be greater than 3rd place");
        }
    }

    if (updateData.settings) {
        const existingSettings = league.settings?.toObject ? league.settings.toObject() : (league.settings || {});
        updateData.settings = {
            ...existingSettings,
            ...updateData.settings,
            prizePool: updateData.settings.prizePool ? {
                ...(existingSettings.prizePool || {}),
                ...updateData.settings.prizePool
            } : existingSettings.prizePool
        };
    }

    // Protect entryFee: entry fee cannot be modified after league creation
    delete updateData.entryFee;

    const updatedLeague = await League.findByIdAndUpdate(
        leagueId,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    return updatedLeague;
};

export const completeSeasonService = async (leagueId, userId) => {
    const league = await League.findById(leagueId);
    if (!league) {
        throw new ApiError(404, "League not found", "LEAGUE_NOT_FOUND");
    }

    const membership = await ClubMember.findOne({ clubId: league.clubId, userId });
    if (!membership || membership.role !== 'admin') {
        throw new ApiError(403, "Only club administrators can complete a season", "FORBIDDEN");
    }

    league.status = "Completed";
    await league.save();

    return league;
};

export const deleteLeagueService = async (leagueId, userId) => {
    const league = await League.findById(leagueId);
    if (!league) {
        throw new ApiError(404, "League not found", "LEAGUE_NOT_FOUND");
    }

    const membership = await ClubMember.findOne({ clubId: league.clubId, userId });
    if (!membership || membership.role !== 'admin') {
        throw new ApiError(403, "Only club administrators can delete a league", "FORBIDDEN");
    }

    await Team.deleteMany({ leagueId });
    await League.findByIdAndDelete(leagueId);

    return { message: "League deleted successfully" };
};
