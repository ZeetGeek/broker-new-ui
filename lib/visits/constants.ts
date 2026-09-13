export const VISITS_TIME_ZONE = "Asia/Kolkata";
export const MIN_NOTICE_MINUTES = 60;
export const MAX_BUYERS_PER_VISIT = 3;
export const DAY_START = 7;
export const DAY_END = 21;
export const TRAVEL_BUFFER_MINUTES = 10;

export const TIME_BUCKETS = [
    { id: "morning", label: "Morning", detail: "6 AM–12 PM", start: 6, end: 12 },
    { id: "afternoon", label: "Afternoon", detail: "12–4 PM", start: 12, end: 16 },
    { id: "evening", label: "Evening", detail: "4–9 PM", start: 16, end: 21 },
] as const;

