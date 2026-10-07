import { z } from "zod";

/**
 * `+91 98200 22001`, `098200 22001`, `9820022001` all become `9820022001`.
 *
 * The profile arrives from the API in E.164 (`+919820022001`), so the form has
 * to accept what it is given back as well as what a person types.
 */
export function normalizeProfilePhone(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
    return digits;
}

/** Splits `Baner, Kothrud , Hinjewadi` into three clean entries. */
export function parseCommaList(value: string): string[] {
    return value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
}

export const BIO_MAX = 400;
export const MAX_SERVICE_AREAS = 12;
const MAX_PREFERRED = 20;

/**
 * A public slug is part of a URL, so it is the one field where the rules are
 * about the machine rather than the person. Lowercase, digits and hyphens —
 * anything else either breaks the URL or silently changes it.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validation only — no output transforms, so react-hook-form's generic keeps
 * agreeing with the form values. Normalising happens explicitly on submit.
 * Same reasoning as `lib/validation/buyer.ts`.
 */
export const profileFormSchema = z.object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
    phone: z.string().refine(
        // Indian mobile numbers start 6–9. Owners call this number.
        (value) => /^[6-9]\d{9}$/.test(normalizeProfilePhone(value)),
        "Enter a 10-digit mobile number",
    ),
    city: z.string().trim().min(2, "Enter the city you work in").max(60, "City is too long"),
    /** Optional so profiles saved before the state field can still be saved. */
    state: z.string().trim().max(60, "State name is too long"),
    country: z.string().trim().max(60, "Country is too long"),
    /** Blank for an independent broker — most of them are. */
    orgName: z.string().trim().max(120, "Name is too long"),
    bio: z.string().trim().max(BIO_MAX, `Keep it under ${BIO_MAX} characters`),
    // Owner fields
    companyName: z.string().trim().max(120, "Name is too long"),
    gstin: z.string().trim().max(30, "That GSTIN is too long"),
    preferredCities: z
        .string()
        .refine(
            (value) => parseCommaList(value).length <= MAX_PREFERRED,
            `Keep it to ${MAX_PREFERRED} cities`,
        ),
    preferredLocalities: z
        .string()
        .refine(
            (value) => parseCommaList(value).length <= MAX_PREFERRED,
            `Keep it to ${MAX_PREFERRED} localities`,
        ),
    // Broker fields
    /** Empty means "not saying". A broker starting out should not have to type 0. */
    experienceYears: z.string().refine((value) => {
        if (value.trim() === "") return true;
        const years = Number(value);
        return Number.isInteger(years) && years >= 0 && years <= 60;
    }, "Enter a whole number of years, up to 60"),
    licenseNumber: z.string().trim().max(40, "That number is too long"),
    reraState: z.string().trim().max(60, "State name is too long"),
    publicSlug: z
        .string()
        .trim()
        .refine(
            (value) => value === "" || SLUG_PATTERN.test(value),
            "Use lowercase letters, numbers and hyphens only",
        )
        .refine((value) => value.length <= 60, "That is too long for a web address"),
    serviceAreas: z
        .array(z.string())
        .max(
            MAX_SERVICE_AREAS,
            `Pick your best ${MAX_SERVICE_AREAS} areas — a broker who covers everywhere covers nothing`,
        ),
    specializations: z.string(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
