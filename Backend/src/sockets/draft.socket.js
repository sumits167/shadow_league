import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { Team } from '../models/team.model.js';
import { League } from '../models/league.model.js';
import {
    startDraftService,
    getDraftStateService,
    selectDraftPlayerService,
    autoPickDraftPlayerService
} from '../services/draft.service.js';

// In-memory registry of active draft turn timers: leagueId -> Timeout
const activeDraftTimers = new Map();

export function scheduleDraftTurnTimer(leagueId, io, turnDurationSeconds = 30) {
    // Clear any existing timer for this league
    if (activeDraftTimers.has(leagueId)) {
        clearTimeout(activeDraftTimers.get(leagueId));
        activeDraftTimers.delete(leagueId);
    }

    const timeout = setTimeout(async () => {
        try {
            console.log(`[Draft Socket] Turn timer expired for league: ${leagueId}`);
            const result = await autoPickDraftPlayerService(leagueId);
            if (result) {
                const freshState = await getDraftStateService(leagueId);

                // Broadcast expiration and updated state to room
                io.to(`draft:${leagueId}`).emit('draft:turn-expired', {
                    leagueId,
                    teamId: result.teamId,
                    autoPickedPlayerId: result.playerId,
                    round: result.currentRound,
                    pick: result.currentPick
                });

                io.to(`draft:${leagueId}`).emit('draft:player-picked', {
                    leagueId,
                    teamId: result.teamId,
                    playerId: result.playerId,
                    currentRound: result.currentRound,
                    currentPick: result.currentPick,
                    isDraftComplete: result.isDraftComplete
                });

                io.to(`draft:${leagueId}`).emit('draft:turn-started', {
                    leagueId,
                    currentTurnTeam: freshState.currentTurnTeam,
                    currentRound: freshState.currentRound,
                    currentPick: freshState.currentPick,
                    turnStartedAt: freshState.turnStartedAt,
                    turnDuration: freshState.turnDuration,
                    serverTime: freshState.serverTime
                });

                io.to(`draft:${leagueId}`).emit('draft:state', freshState);

                if (freshState.isDraftComplete) {
                    io.to(`draft:${leagueId}`).emit('draft:completed', freshState);
                    activeDraftTimers.delete(leagueId);
                } else {
                    // Schedule next turn
                    scheduleDraftTurnTimer(leagueId, io, freshState.turnDuration || 30);
                }
            }
        } catch (err) {
            console.error(`[Draft Socket] Auto-pick error on timeout for league ${leagueId}:`, err);
        }
    }, turnDurationSeconds * 1000);

    activeDraftTimers.set(leagueId, timeout);
}

export function clearDraftTurnTimer(leagueId) {
    if (activeDraftTimers.has(leagueId)) {
        clearTimeout(activeDraftTimers.get(leagueId));
        activeDraftTimers.delete(leagueId);
    }
}

export function startScheduledDraftWatcher(io) {
    setInterval(async () => {
        try {
            const now = new Date();
            const dueLeagues = await League.find({
                status: { $in: ["Created", "Upcoming"] },
                $or: [
                    { "draftState.scheduledStartTime": { $lte: now } },
                    { "settings.draftDate": { $lte: now } }
                ]
            });

            for (const league of dueLeagues) {
                const teams = await Team.find({ leagueId: league._id });
                if (teams.length >= 2) {
                    console.log(`[Scheduled Draft Watcher] Auto-starting draft for league: ${league.name} (${league._id})`);
                    try {
                        await startDraftService(league._id, league.createdById, true);
                        const freshState = await getDraftStateService(league._id);

                        io.to(`draft:${league._id}`).emit('draft:turn-started', {
                            leagueId: league._id,
                            currentTurnTeam: freshState.currentTurnTeam,
                            currentRound: freshState.currentRound,
                            currentPick: freshState.currentPick,
                            turnStartedAt: freshState.turnStartedAt,
                            turnDuration: freshState.turnDuration,
                            serverTime: freshState.serverTime
                        });

                        io.to(`draft:${league._id}`).emit('draft:state', freshState);
                        scheduleDraftTurnTimer(league._id, io, freshState.turnDuration || 30);
                    } catch (err) {
                        console.error(`[Scheduled Draft Watcher] Failed to start draft for ${league._id}:`, err.message);
                    }
                }
            }
        } catch (err) {
            console.error('[Scheduled Draft Watcher] Polling error:', err);
        }
    }, 4000);
}

export function initDraftSocket(io) {
    // Start background watcher for scheduled drafts
    startScheduledDraftWatcher(io);
    // Socket Authentication Middleware
    io.use(async (socket, next) => {
        try {
            let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
            
            // Fallback: extract from cookie header if present
            if (!token && socket.handshake.headers?.cookie) {
                const cookies = socket.handshake.headers.cookie.split(';').reduce((res, c) => {
                    const [k, v] = c.trim().split('=');
                    res[k] = v;
                    return res;
                }, {});
                token = cookies['accessToken'];
            }

            if (!token) {
                return next(new Error("AUTHENTICATION_REQUIRED"));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded._id).select("-password");
            if (!user) {
                return next(new Error("USER_NOT_FOUND"));
            }

            socket.user = user;
            next();
        } catch (err) {
            return next(new Error("INVALID_OR_EXPIRED_TOKEN"));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        const username = socket.user.username;
        console.log(`[Draft Socket] Manager connected: @${username} (${socket.id})`);

        // Event: Join Draft Room
        socket.on('draft:join', async ({ leagueId }) => {
            try {
                if (!leagueId) {
                    return socket.emit('draft:error', { message: 'League ID is required' });
                }

                // Verify user belongs to a team in the league or is club member
                const roomName = `draft:${leagueId}`;
                socket.join(roomName);
                console.log(`[Draft Socket] @${username} joined room: ${roomName}`);

                // Send immediate complete authoritative draft state
                const currentState = await getDraftStateService(leagueId, userId);
                socket.emit('draft:state', currentState);

                // If draft is active and timer not started, schedule it
                if (currentState.leagueStatus === 'Draft' && !currentState.isDraftComplete && !activeDraftTimers.has(leagueId)) {
                    scheduleDraftTurnTimer(leagueId, io, currentState.turnDuration || 30);
                }
            } catch (err) {
                console.error(`[Draft Socket] Error joining draft room:`, err);
                socket.emit('draft:error', { message: err.message || 'Failed to join draft room' });
            }
        });

        // Event: Select Player
        socket.on('draft:select-player', async ({ leagueId, playerId }) => {
            try {
                if (!leagueId || !playerId) {
                    return socket.emit('draft:error', { message: 'League ID and Player ID are required' });
                }

                // Execute pick via authoritative service
                const pickResult = await selectDraftPlayerService(leagueId, userId, playerId);
                const freshState = await getDraftStateService(leagueId, userId);

                const roomName = `draft:${leagueId}`;

                // Broadcast player picked event
                io.to(roomName).emit('draft:player-picked', {
                    leagueId,
                    teamId: pickResult.teamId,
                    playerId: pickResult.playerId,
                    currentRound: pickResult.currentRound,
                    currentPick: pickResult.currentPick,
                    isDraftComplete: pickResult.isDraftComplete,
                    pickedByUsername: username
                });

                // Broadcast turn started event
                io.to(roomName).emit('draft:turn-started', {
                    leagueId,
                    currentTurnTeam: freshState.currentTurnTeam,
                    currentRound: freshState.currentRound,
                    currentPick: freshState.currentPick,
                    turnStartedAt: freshState.turnStartedAt,
                    turnDuration: freshState.turnDuration,
                    serverTime: freshState.serverTime
                });

                // Broadcast updated full authoritative state
                io.to(roomName).emit('draft:state', freshState);

                // Check draft completion
                if (freshState.isDraftComplete) {
                    io.to(roomName).emit('draft:completed', freshState);
                    clearDraftTurnTimer(leagueId);
                } else {
                    // Reset and schedule timer for next turn
                    scheduleDraftTurnTimer(leagueId, io, freshState.turnDuration || 30);
                }
            } catch (err) {
                console.error(`[Draft Socket] Pick error for @${username}:`, err);
                socket.emit('draft:error', {
                    message: err.message || 'Failed to draft player',
                    code: err.code || 'PICK_FAILED'
                });
            }
        });

        // Event: Disconnect
        socket.on('disconnect', () => {
            console.log(`[Draft Socket] Manager disconnected: @${username} (${socket.id})`);
        });
    });
}
