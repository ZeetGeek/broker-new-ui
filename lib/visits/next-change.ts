/** Largest delay `setTimeout` accepts without firing immediately. */
const MAX_TIMER_MS = 2_147_483_000;
/** Ask a moment after the change so the server's clock has passed it too. */
const PADDING_MS = 1000;
/**
 * When the moment has passed on this phone but the server still reported it,
 * the phone's clock is ahead. Ask again on this cadence until the server agrees.
 */
const RETRY_MS = 5000;

/**
 * Milliseconds until the Visits list should refetch because a visit starts
 * or ends (Upcoming → Running → Needs update). Null when nothing is due.
 */
export function msUntil(nextChangeAt: string | null, now: number): number | null {
    if (!nextChangeAt) return null;
    const at = Date.parse(nextChangeAt);
    if (!Number.isFinite(at)) return null;
    const wait = at - now;
    return Math.min(MAX_TIMER_MS, wait <= 0 ? RETRY_MS : wait + PADDING_MS);
}
