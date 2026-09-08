import {
    ATTEMPT_LIMIT,
    REMINDER_LIMIT,
    type RequestItem,
} from "@/features/properties/my-requests/types";

/**
 * What the broker is allowed to do on this request right now.
 *
 * The rules, in one place:
 * - While an attempt is pending the broker may send up to REMINDER_LIMIT
 *   reminders, then cancel it.
 * - An attempt ends when the broker cancels it or the owner rejects it.
 *   Either way the next attempt opens, up to ATTEMPT_LIMIT.
 * - After the last attempt ends without an approval the property locks and
 *   the broker has no further move. The owner may still make contact.
 */
export type AttemptActions = {
    /** Reminder budget still open on the current pending attempt. */
    canRemind: boolean;
    /** Reminders already sent on this attempt. */
    remindersUsed: number;
    remindersLeft: number;
    /** Broker may cancel this attempt and free the next one. */
    canCancel: boolean;
    /** Broker may open a fresh attempt on this property. */
    canRetry: boolean;
    /** Attempts already used, including the current one. */
    attemptsUsed: number;
    attemptsLeft: number;
    /** No attempts remain and the owner never approved. */
    isLocked: boolean;
};

export function attemptActions(item: RequestItem): AttemptActions {
    const attemptsUsed = item.attemptNumber;
    const attemptsLeft = Math.max(0, ATTEMPT_LIMIT - attemptsUsed);
    const remindersUsed = item.reminderCount ?? (item.reminderUsed ? REMINDER_LIMIT : 0);
    const remindersLeft = Math.max(0, REMINDER_LIMIT - remindersUsed);

    if (item.stage === "pending") {
        return {
            canRemind: remindersLeft > 0,
            remindersUsed,
            remindersLeft,
            canCancel: true,
            canRetry: false,
            attemptsUsed,
            attemptsLeft,
            isLocked: false,
        };
    }

    // Cancelled and rejected both end an attempt, so both hand over the next
    // one. A rejection still costs the broker a try.
    if (item.stage === "cancelled" || item.stage === "declined") {
        return {
            canRemind: false,
            remindersUsed,
            remindersLeft: 0,
            canCancel: false,
            canRetry: attemptsLeft > 0,
            attemptsUsed,
            attemptsLeft,
            isLocked: false,
        };
    }

    return {
        canRemind: false,
        remindersUsed,
        remindersLeft: 0,
        canCancel: false,
        canRetry: false,
        attemptsUsed,
        attemptsLeft,
        isLocked: item.stage === "locked",
    };
}

/** `Attempt 2 of 3` — shown wherever the broker needs to know what is left. */
export function attemptLabel(item: RequestItem): string {
    return `Attempt ${Math.min(item.attemptNumber, ATTEMPT_LIMIT)} of ${ATTEMPT_LIMIT}`;
}
