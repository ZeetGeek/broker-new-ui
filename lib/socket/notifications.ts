"use client";

import { io, type Socket } from "socket.io-client";

import { SOCKET_URL } from "@/config";

let socket: Socket | null = null;

export function getNotificationSocket(accessToken: string): Socket {
    if (socket?.connected) return socket;

    socket?.disconnect();

    socket = io(`${SOCKET_URL}/notifications`, {
        auth: { token: accessToken },
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
    });

    return socket;
}

export function disconnectNotificationSocket() {
    socket?.disconnect();
    socket = null;
}
