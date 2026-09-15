"use client";

import { io, type Socket } from "socket.io-client";

import { SOCKET_URL } from "@/config";

let socket: Socket | null = null;
let socketToken: string | null = null;

/**
 * Reuse one Socket.IO client for the notification namespace.
 *
 * Important: do not call `disconnect()` on a socket that is still connecting.
 * That produces the browser error:
 *   "WebSocket is closed before the connection is established."
 * which is common during React Strict Mode remounts / token hydration races.
 */
export function getNotificationSocket(accessToken: string): Socket {
    if (socket && socketToken === accessToken) {
        if (!socket.connected) {
            socket.connect();
        }
        return socket;
    }

    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }

    socketToken = accessToken;
    socket = io(`${SOCKET_URL}/notifications`, {
        auth: { token: accessToken },
        // Prefer polling first so nginx/TLS handshake can complete, then upgrade.
        // Websocket-first often fails briefly during backend hot-reloads.
        transports: ["polling", "websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
    });

    return socket;
}

export function disconnectNotificationSocket() {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }
    socketToken = null;
}
