/** Adapt a wall-clock time to a date library without interpreting it as a UTC instant. */
export function timeOnlyToDate(value?: string | null): Date | null {
    const parts = value?.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!parts || +parts[1] > 23 || +parts[2] > 59 || +(parts[3] ?? 0) > 59) return null;
    return new Date(2000, 0, 1, +parts[1], +parts[2], +(parts[3] ?? 0));
}

export function dateToTimeOnly(value: Date, seconds = false): string {
    const parts = [value.getHours(), value.getMinutes()];
    if (seconds) parts.push(value.getSeconds());
    return parts.map((part) => String(part).padStart(2, "0")).join(":");
}
