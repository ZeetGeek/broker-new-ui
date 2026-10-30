export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "https://localhost";

export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") || API_URL;

/**
 * Local UI-design mode. When true, pages use the fixture sets in `features/`
 * instead of the remote API — so screens can be designed without a valid login
 * token. Turn off (`false` or unset) to talk to the real backend again.
 */
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "YesBroker";

/**
 * Owner accounts and marketplace workflows are deferred for the broker-only launch.
 * Enable explicitly with `true` for the later owner phase. NEXT_PUBLIC settings
 * are baked into the client bundle: changing this requires a fresh build.
 */
export const FEATURE_PLATFORM_OWNER = process.env.NEXT_PUBLIC_FEATURE_PLATFORM_OWNER === "true";

export const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
