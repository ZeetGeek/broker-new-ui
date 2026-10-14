import type { VisitSlot } from "@/lib/api/owner-slots";
import type { PropertyListing } from "@/lib/api/properties";
import { formatDateIso, formatTime24, parseApiInstant } from "@/lib/format/date";

/** Visiting times: 8:00 AM – 8:00 PM, every 30 minutes. */
export const DAY_SLOT_TIMES = buildSlotTimes(8 * 60, 20 * 60, 30);

/*
 * Bulk / recurring presets — parked for now.
 *
 * export const QUICK_PRESETS = [
 *   {
 *     id: "weekends",
 *     label: "Weekends 10am–1pm",
 *     from: "10:00",
 *     to: "13:00",
 *     weekdays: new Set([0, 6]),
 *   },
 *   {
 *     id: "evenings",
 *     label: "Weekday evenings 5–7pm",
 *     from: "17:00",
 *     to: "19:00",
 *     weekdays: new Set([1, 2, 3, 4, 5]),
 *   },
 * ] as const;
 *
 * export type QuickPreset = (typeof QUICK_PRESETS)[number];
 */

function buildSlotTimes(fromMinutes: number, toMinutes: number, step: number): string[] {
    const times: string[] = [];
    for (let minutes = fromMinutes; minutes <= toMinutes; minutes += step) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        times.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
    return times;
}

export function label12(hhmm: string): string {
    const [hourPart, minute] = hhmm.split(":");
    const hour = Number(hourPart);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${period}`;
}

export function addMinutes(hhmm: string, minutes: number): string {
    const [hourPart, minutePart] = hhmm.split(":");
    const total = Number(hourPart) * 60 + Number(minutePart) + minutes;
    const hour = Math.floor(total / 60) % 24;
    const minute = total % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function isExpiredSlot(
    dateIso: string,
    time: string,
    todayIso: string,
    nowTime: string,
): boolean {
    if (dateIso < todayIso) return true;
    if (dateIso > todayIso) return false;
    return time < nowTime;
}

export function slotStartKey(slot: VisitSlot): string | null {
    const start = parseApiInstant(slot.startAt);
    return `${formatDateIso(start)}|${formatTime24(start)}`;
}

export function propertyConfigLabel(property: PropertyListing): string {
    if (property.bhkConfig?.trim()) return property.bhkConfig.trim();
    if (property.bedrooms != null && property.bedrooms > 0) return `${property.bedrooms} BHK`;
    return property.propertyType?.trim() || property.subtype?.trim() || "Property";
}

export function propertyAmountInr(property: PropertyListing): {
    amountInr: number;
    isRent: boolean;
} {
    const isRent = property.transactionType === "rent";
    const raw = isRent ? property.monthlyRent : property.salePrice;
    const amountInr = typeof raw === "number" ? raw : Number(raw ?? 0);
    return {
        amountInr: Number.isFinite(amountInr) ? amountInr : 0,
        isRent,
    };
}

export function propertyLocalityLine(property: PropertyListing): string {
    const place = property.society?.trim() || property.address?.trim();
    const city = property.city?.trim();
    if (place && city) return `${place}, ${city}`;
    return place || city || "Location TBD";
}
