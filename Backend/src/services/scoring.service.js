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

    const { calculateLiveLeaderboard } = await import('./matchSimulation.service.js');
    const pointsMap = league.matchState?.playerFantasyPoints || {};
    await calculateLiveLeaderboard(leagueId, pointsMap);

    const sortedTeams = await Team.find({ leagueId }).sort({ totalPoints: -1 });
    return sortedTeams;
};

export const getLeagueLeaderboardService = async (leagueId) => {
    const league = await League.findById(leagueId).select('name season status matchState matchDetails');
    if (!league) {
        throw new ApiError(404, "League not found", "LEAGUE_NOT_FOUND");
    }

    try {
        const { calculateLiveLeaderboard } = await import('./matchSimulation.service.js');
        const pointsMap = league.matchState?.playerFantasyPoints || {};
        const liveStandings = await calculateLiveLeaderboard(leagueId, pointsMap);
        if (liveStandings && liveStandings.length > 0) {
            return {
                league,
                standings: liveStandings.map((s, index) => ({
                    rank: s.rank || index + 1,
                    teamId: s.teamId,
                    teamName: s.teamName,
                    owner: s.manager,
                    avatarUrl: s.avatarUrl,
                    totalPoints: s.totalPoints || 0
                }))
            };
        }
    } catch {
        // fallback to database standings
    }

    let standings = await Team.find({ leagueId })
        .populate('userId', 'username avatarUrl shadowPoints')
        .sort({ totalPoints: -1 });

    return {
        league,
        standings: standings.map((team, index) => ({
            rank: team.rank || index + 1,
            teamId: team._id,
            teamName: team.name,
            owner: team.userId?.username,
            avatarUrl: team.userId?.avatarUrl,
            totalPoints: team.totalPoints || 0
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
        const currentMyTeam = allTeams.find(t => String(t._id) === String(myTeam._id)) || myTeam;

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
                totalPoints: currentMyTeam.totalPoints || 0,
                rank: userRank || 1
            },
            totalTeams: allTeams.length,
            standings
        });
    }

    return results;
};
