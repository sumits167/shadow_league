import { Lineup } from '../models/lineup.model.js';
import { Team } from '../models/team.model.js';
import { Player } from '../models/player.model.js';
import { League } from '../models/league.model.js';
import ApiError from '../utils/ApiError.js';

export const calculateLineupScoreService = async (teamId, matchWeek) => {
    const lineup = await Lineup.findOne({ teamId, matchWeek }).populate('playerIds');
    if (!lineup) {
        throw new ApiError(404, "Lineup not found for scoring", "LINEUP_NOT_FOUND");
    }

    let matchWeekTotal = 0;
    const playerBreakdown = [];

    const captainIdStr = lineup.captainId.toString();
    const viceCaptainIdStr = lineup.viceCaptainId.toString();

    for (const player of lineup.playerIds) {
        const basePoints = player.fantasyPoints || player.stats?.points || 0;
        let multiplier = 1.0;

        if (player._id.toString() === captainIdStr) {
            multiplier = 2.0; // Captain 2x
        } else if (player._id.toString() === viceCaptainIdStr) {
            multiplier = 1.5; // Vice-Captain 1.5x
        }

        const effectivePoints = basePoints * multiplier;
        matchWeekTotal += effectivePoints;

        playerBreakdown.push({
            playerId: player._id,
            name: player.name,
            position: player.position,
            basePoints,
            multiplier,
            effectivePoints
        });
    }

    return {
        teamId,
        matchWeek,
        matchWeekTotal,
        playerBreakdown
    };
};

export const updateLeagueLeaderboardService = async (leagueId) => {
    const league = await League.findById(leagueId);
    if (!league) {
        throw new ApiError(404, "League not found", "LEAGUE_NOT_FOUND");
    }

    const teams = await Team.find({ leagueId });

    for (const team of teams) {
        // Calculate cumulative points across all matchweeks
        const lineups = await Lineup.find({ teamId: team._id }).populate('playerIds');
        let totalScore = 0;

        for (const lineup of lineups) {
            const captainIdStr = lineup.captainId.toString();
            const viceCaptainIdStr = lineup.viceCaptainId.toString();

            for (const player of lineup.playerIds) {
                const basePoints = player.fantasyPoints || player.stats?.points || 0;
                let multiplier = 1.0;

                if (player._id.toString() === captainIdStr) {
                    multiplier = 2.0;
                } else if (player._id.toString() === viceCaptainIdStr) {
                    multiplier = 1.5;
                }

                totalScore += (basePoints * multiplier);
            }
        }

        team.totalPoints = totalScore;
        await team.save();
    }

    // Update ranks
    const sortedTeams = await Team.find({ leagueId }).sort({ totalPoints: -1 });
    for (let i = 0; i < sortedTeams.length; i++) {
        sortedTeams[i].rank = i + 1;
        await sortedTeams[i].save();
    }

    return sortedTeams;
};

export const getLeagueLeaderboardService = async (leagueId) => {
    const league = await League.findById(leagueId).select('name season status');
    if (!league) {
        throw new ApiError(404, "League not found", "LEAGUE_NOT_FOUND");
    }

    const standings = await Team.find({ leagueId })
        .populate('userId', 'username avatarUrl')
        .sort({ rank: 1, totalPoints: -1 });

    return {
        league,
        standings: standings.map((team, index) => ({
            rank: team.rank || index + 1,
            teamId: team._id,
            teamName: team.name,
            owner: team.userId?.username,
            avatarUrl: team.userId?.avatarUrl,
            totalPoints: team.totalPoints
        }))
    };
};

export const getUserJoinedLeaguesStandingsService = async (userId, clubId) => {
    const userTeams = await Team.find({ userId }).populate('leagueId');

    const validTeams = userTeams.filter(t => t.leagueId && (!clubId || String(t.leagueId.clubId) === String(clubId)));

    const results = [];
    for (const myTeam of validTeams) {
        const league = myTeam.leagueId;
        const allTeams = await Team.find({ leagueId: league._id })
            .populate('userId', 'username avatarUrl')
            .sort({ totalPoints: -1, rank: 1 });

        const standings = allTeams.map((t, idx) => ({
            rank: t.rank || idx + 1,
            teamId: t._id,
            teamName: t.name,
            owner: t.userId?.username,
            avatarUrl: t.userId?.avatarUrl,
            totalPoints: t.totalPoints || 0,
            isUserTeam: String(t._id) === String(myTeam._id)
        }));

        const userRank = standings.findIndex(s => s.isUserTeam) + 1;

        results.push({
            league: {
                _id: league._id,
                name: league.name,
                season: league.season,
                status: league.status,
                entryFee: league.entryFee,
                matchDetails: league.matchDetails
            },
            myTeam: {
                teamId: myTeam._id,
                name: myTeam.name,
                totalPoints: myTeam.totalPoints || 0,
                rank: userRank || 1
            },
            totalTeams: allTeams.length,
            standings
        });
    }

    return results;
};
