import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import dbConnect from './db/index.js';
import { initSocket } from './socket.js';
import errorhandler from './middleware/error.middleware.js';

// Route Imports
import authRouter from './routes/auth.routes.js';
import clubRouter from './routes/club.routes.js';
import leagueRouter from './routes/league.routes.js';
import playerRouter from './routes/player.routes.js';
import draftRouter from './routes/draft.routes.js';
import teamRouter from './routes/team.routes.js';
import rosterRouter from './routes/roster.routes.js';
import lineupRouter from './routes/lineup.routes.js';
import leaderboardRouter from './routes/leaderboard.routes.js';
import notificationRouter from './routes/notification.routes.js';
import paymentRouter from './routes/payment.routes.js';
import matchRouter from './routes/match.routes.js';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true,
}));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));

// Base route for API health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Shadowleague API is running' });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/clubs', clubRouter);
app.use('/api/v1/leagues', leagueRouter);
app.use('/api/v1/players', playerRouter);
app.use('/api/v1/draft', draftRouter);
app.use('/api/v1/teams', teamRouter);
app.use('/api/v1/rosters', rosterRouter);
app.use('/api/v1/lineups', lineupRouter);
app.use('/api/v1/leaderboard', leaderboardRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/payment', paymentRouter);
app.use('/api/v1/matches', matchRouter);

// Error middleware
app.use(errorhandler);

const server = createServer(app);
const io = initSocket(server);

dbConnect()
  .then(() => {
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`Shadowleague Server is listening on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

export { app, server, io };
