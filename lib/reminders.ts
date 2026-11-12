export const MAX_REMINDER_MINUTES = 365 * 24 * 60;

export function isReminderOffset(minutes: number): boolean {
    return Number.isInteger(minutes) && minutes >= 0 && minutes <= MAX_REMINDER_MINUTES;
}

export function reminderLabel(minutes: number, atTimeLabel: string): string {
    if (!isReminderOffset(minutes)) return "Invalid reminder";
    if (minutes === 0) return atTimeLabel;
    let remaining = minutes;
    const parts: string[] = [];
    for (const { size, label } of [
        { size: 1440, label: "day" },
        { size: 60, label: "hour" },
        { size: 1, label: "minute" },
    ]) {
        const count = Math.floor(remaining / size);
        if (count) parts.push(`${count} ${label}${count === 1 ? "" : "s"}`);
        remaining %= size;
    }
    return `${parts.join(" ")} before`;
}
