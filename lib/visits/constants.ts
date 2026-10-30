export { APP_TIME_ZONE as VISITS_TIME_ZONE } from "@/lib/datetime/timezone";
export const MIN_NOTICE_MINUTES = 60;
// Current booking API: one lead per showing.
export const MAX_BUYERS_PER_VISIT = 1;
export const DAY_START = 7;
export const DAY_END = 21;

export const TIME_BUCKETS = [
    { id: "morning", label: "Morning", detail: "6 AM–12 PM", start: 6, end: 12 },
    { id: "afternoon", label: "Afternoon", detail: "12–4 PM", start: 12, end: 16 },
    { id: "evening", label: "Evening", detail: "4–9 PM", start: 16, end: 21 },
] as const;
