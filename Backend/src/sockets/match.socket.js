import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { League } from '../models/league.model.js';
import {
    startMatchSimulation,
    fastForwardMatchSimulation,
    getLiveMatchStateService
} from '../services/matchSimulation.service.js';

export function startScheduledMatchWatcher(io) {
    setInterval(async () => {
        try {
            const now = new Date();
            // Check for leagues in "Active" status whose matchDate has arrived and matchState.status is "Scheduled"
            const dueLeagues = await League.find({
                status: "Active",
                "matchState.status": { $in: ["Scheduled", null] },
                $or: [
                    { "matchDetails.matchDate": { $lte: now } },
                    { "draftState.startedAt": { $lte: new Date(now.getTime() - 1000 * 60 * 10) } }
                ]
            });

            for (const league of dueLeagues) {
                console.log(`[Scheduled Match Watcher] Auto-starting live match simulation for league: ${league.name} (${league._id})`);
                try {
                    await startMatchSimulation(league._id, io);
                } catch (err) {
                    console.error(`[Scheduled Match Watcher] Error starting match for ${league._id}:`, err.message);
                }
            }
        } catch (err) {
            console.error('[Scheduled Match Watcher] Error checking scheduled matches:', err);
        }
    }, 5000);
}

export function initMatchSocket(io) {
    startScheduledMatchWatcher(io);

    io.on('connection', (socket) => {
        // Join League match room
        socket.on('match:join', async ({ leagueId }) => {
            if (!leagueId) return;
            const roomName = `league:${leagueId}`;
            socket.join(roomName);

            try {
                const state = await getLiveMatchStateService(leagueId);
                if (state) {
                    socket.emit('match:state', state);
                }
            } catch (err) {
                console.error(`[Match Socket] Error sending state to ${socket.id}:`, err.message);
            }
        });

        // Admin Action: Start Match Now (Immediate Launch)
        socket.on('match:start', async ({ leagueId }) => {
            if (!leagueId) return;
            try {
                console.log(`[Match Socket] Admin triggered match:start for league ${leagueId}`);
                await startMatchSimulation(leagueId, io);
            } catch (err) {
                socket.emit('match:error', { message: err.message });
            }
        });

        // Admin Action: Set Simulation Speed
        socket.on('match:set-speed', async ({ leagueId, speed }) => {
            if (!leagueId) return;
            try {
                console.log(`[Match Socket] Admin changed speed to ${speed}x for league ${leagueId}`);
                await fastForwardMatchSimulation(leagueId, io, speed);
            } catch (err) {
                socket.emit('match:error', { message: err.message });
            }
        });

        // Admin Action: Fast Forward to Match End
        socket.on('match:fast-forward', async ({ leagueId }) => {
            if (!leagueId) return;
            try {
                console.log(`[Match Socket] Admin triggered fast-forward to end for league ${leagueId}`);
                await fastForwardMatchSimulation(leagueId, io, "instant");
            } catch (err) {
                socket.emit('match:error', { message: err.message });
            }
        });

        socket.on('match:leave', ({ leagueId }) => {
            if (leagueId) {
                socket.leave(`league:${leagueId}`);
            }
        });
    });
}
