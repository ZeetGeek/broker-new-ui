export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "https://localhost";

export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") || API_URL;

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "YesBroker";

export const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
