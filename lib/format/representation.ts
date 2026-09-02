import { calendarDaysBetween, formatDateShort } from "@/lib/format/date";

const REPRESENTATION_URGENT_DAYS = 14;

export type RepresentationExpiryDisplay = {
    label: string;
    isUrgent: boolean;
};

/** Expiry copy for represented property cards. Orange only within 14 days. */
export function formatRepresentationExpiry(
    endsAt: Date,
    now = new Date(),
): RepresentationExpiryDisplay {
    const daysRemaining = calendarDaysBetween(now, endsAt);

    if (daysRemaining <= REPRESENTATION_URGENT_DAYS) {
        const dayLabel = daysRemaining === 1 ? "1 day" : `${daysRemaining} days`;
        return {
            label: `Representation ends in ${dayLabel}`,
            isUrgent: true,
        };
    }

    return {
        label: `Representation ends ${formatDateShort(endsAt)}`,
        isUrgent: false,
    };
}

export function formatRepresentedSince(since: Date): string {
    return `You represent this since ${formatDateShort(since)}`;
}
