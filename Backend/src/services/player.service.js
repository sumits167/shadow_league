import { Player } from '../models/player.model.js';
import ApiError from '../utils/ApiError.js';

export const createPlayerService = async (playerData) => {
    const player = await Player.create(playerData);
    return player;
};

export const getPlayersService = async (query = {}) => {
    const { position, sport, realTeam, availabilityStatus, search } = query;
    const filter = {};

    if (position) filter.position = position;
    if (sport) filter.sport = sport;
    if (realTeam) filter.realTeam = realTeam;
    if (availabilityStatus) filter.availabilityStatus = availabilityStatus;
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    const players = await Player.find(filter).sort({ price: -1, name: 1 });
    return players;
};

export const getPlayerByIdService = async (playerId) => {
    const player = await Player.findById(playerId);
    if (!player) {
        throw new ApiError(404, "Player not found", "PLAYER_NOT_FOUND");
    }
    return player;
};

export const updatePlayerStatsService = async (playerId, statsData) => {
    const player = await Player.findById(playerId);
    if (!player) {
        throw new ApiError(404, "Player not found", "PLAYER_NOT_FOUND");
    }

    if (statsData.fantasyPoints !== undefined) {
        player.fantasyPoints += statsData.fantasyPoints;
    }

    if (statsData.runs !== undefined) player.stats.runs += statsData.runs;
    if (statsData.wickets !== undefined) player.stats.wickets += statsData.wickets;
    if (statsData.goals !== undefined) player.stats.goals += statsData.goals;
    if (statsData.assists !== undefined) player.stats.assists += statsData.assists;

    await player.save();
    return player;
};

export const seedSamplePlayersService = async () => {
    const count = await Player.countDocuments();
    if (count > 0) return { message: `Players already seeded (${count} exist)` };

    const samplePlayers = [
        { name: "Virat Kohli", sport: "cricket", position: "BAT", realTeam: "RCB", price: 12.0 },
        { name: "Jasprit Bumrah", sport: "cricket", position: "BOWL", realTeam: "MI", price: 11.5 },
        { name: "Hardik Pandya", sport: "cricket", position: "AR", realTeam: "MI", price: 10.5 },
        { name: "MS Dhoni", sport: "cricket", position: "WK", realTeam: "CSK", price: 10.0 },
        { name: "Rohit Sharma", sport: "cricket", position: "BAT", realTeam: "MI", price: 11.0 },
        { name: "Rashid Khan", sport: "cricket", position: "BOWL", realTeam: "GT", price: 10.0 },
        { name: "Ravindra Jadeja", sport: "cricket", position: "AR", realTeam: "CSK", price: 10.5 },
        { name: "KL Rahul", sport: "cricket", position: "WK", realTeam: "LSG", price: 10.0 },
        { name: "Suryakumar Yadav", sport: "cricket", position: "BAT", realTeam: "MI", price: 11.0 },
        { name: "Mohammed Shami", sport: "cricket", position: "BOWL", realTeam: "GT", price: 9.5 },
        { name: "Shubman Gill", sport: "cricket", position: "BAT", realTeam: "GT", price: 10.5 },
        { name: "Rishabh Pant", sport: "cricket", position: "WK", realTeam: "DC", price: 10.0 },
        { name: "Axar Patel", sport: "cricket", position: "AR", realTeam: "DC", price: 9.0 },
        { name: "Yuzvendra Chahal", sport: "cricket", position: "BOWL", realTeam: "RR", price: 9.0 },
        { name: "Yashasvi Jaiswal", sport: "cricket", position: "BAT", realTeam: "RR", price: 10.0 },
        { name: "Sanju Samson", sport: "cricket", position: "WK", realTeam: "RR", price: 9.5 },
        { name: "Kuldeep Yadav", sport: "cricket", position: "BOWL", realTeam: "DC", price: 9.0 },
        { name: "Rinku Singh", sport: "cricket", position: "BAT", realTeam: "KKR", price: 8.5 },
        { name: "Sunil Narine", sport: "cricket", position: "AR", realTeam: "KKR", price: 10.0 },
        { name: "Andre Russell", sport: "cricket", position: "AR", realTeam: "KKR", price: 10.5 }
    ];

    const seeded = await Player.insertMany(samplePlayers);
    return { message: "Seeded sample players successfully", count: seeded.length };
};
