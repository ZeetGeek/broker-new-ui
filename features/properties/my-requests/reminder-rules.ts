import {
    REMINDER_COOLDOWN_HOURS,
    REMINDER_LIMIT,
    type RequestItem,
} from "@/features/properties/my-requests/types";

const HOUR_MS = 3_600_000;

export type ReminderState =
    | { canRemind: true; remindersLeft: number }
    | {
          canRemind: false;
          reason: "not_pending" | "limit_reached" | "cooling_down";
          remindersLeft: number;
          hoursUntilNext: number;
      };

/**
 * Whether the broker may remind this owner right now. Derived from the
 * timestamps rather than stored, so a cooldown expires on its own without the
 * server having to write a flag back.
 */
export function reminderState(item: RequestItem, now = new Date()): ReminderState {
    const remindersLeft = Math.max(0, REMINDER_LIMIT - item.remindersSent);

    if (item.stage !== "pending") {
        return { canRemind: false, reason: "not_pending", remindersLeft, hoursUntilNext: 0 };
    }

    if (remindersLeft === 0) {
        return { canRemind: false, reason: "limit_reached", remindersLeft: 0, hoursUntilNext: 0 };
    }

    if (item.nudgedAt) {
        const elapsedHours = (now.getTime() - new Date(item.nudgedAt).getTime()) / HOUR_MS;
        if (elapsedHours < REMINDER_COOLDOWN_HOURS) {
            return {
                canRemind: false,
                reason: "cooling_down",
                remindersLeft,
                hoursUntilNext: Math.max(1, Math.ceil(REMINDER_COOLDOWN_HOURS - elapsedHours)),
            };
        }
    }

    return { canRemind: true, remindersLeft };
}

export type ExpiryCountdown = {
    /** Short label for the card: `4 days left`, `18 hours left`, `Expired`. */
    label: string;
    /** True inside the final 24 hours — the card switches to urgent tone. */
    isUrgent: boolean;
    isExpired: boolean;
};

/**
 * Time left before an unanswered request closes itself. Counts in hours on
 * the last day so "1 day left" does not sit there for 23 hours.
 */
export function expiryCountdown(item: RequestItem, now = new Date()): ExpiryCountdown | null {
    if (item.stage !== "pending" || !item.expiresAt) return null;

    const msLeft = new Date(item.expiresAt).getTime() - now.getTime();

    if (msLeft <= 0) {
        return { label: "Expired", isUrgent: true, isExpired: true };
    }

    const hoursLeft = msLeft / HOUR_MS;

    if (hoursLeft < 1) {
        const minutesLeft = Math.max(1, Math.round(msLeft / 60_000));
        return {
            label: `${minutesLeft} min left`,
            isUrgent: true,
            isExpired: false,
        };
    }

    if (hoursLeft < 24) {
        const hours = Math.round(hoursLeft);
        return {
            label: `${hours} ${hours === 1 ? "hour" : "hours"} left`,
            isUrgent: true,
            isExpired: false,
        };
    }

    const days = Math.floor(hoursLeft / 24);
    return {
        label: `${days} ${days === 1 ? "day" : "days"} left`,
        isUrgent: false,
        isExpired: false,
    };
}
