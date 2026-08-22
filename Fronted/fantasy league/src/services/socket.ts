import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8000";

let socket: Socket | null = null;

export function getDraftSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("[Draft Socket] Connected to server, socket ID:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Draft Socket] Disconnected from server, reason:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Draft Socket] Connection error:", err.message);
    });
  }

  return socket;
}

export function disconnectDraftSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
