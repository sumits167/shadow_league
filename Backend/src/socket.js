import { Server } from "socket.io";
import { initDraftSocket } from "./sockets/draft.socket.js";
import { initMatchSocket } from "./sockets/match.socket.js";

let io;

export function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_ORIGIN || process.env.FRONTED_URL || "http://localhost:5173",
            credentials: true,
            methods: ["GET", "POST", "PATCH", "DELETE"]
        }
    });

    // Initialize Draft & Match Socket Subsystems
    initDraftSocket(io);
    initMatchSocket(io);

    console.log("[Socket.IO] Draft and Match Sockets initialized with CORS support");
    return io;
}

export function getIo() {
    return io;
}