import type { UserProfile } from "@/lib/api/profile";

/** Launch defaults when the broker profile has no city yet (Surat first). */
export const CONTACT_LOCATION_FALLBACK = {
    country: "India",
    state: "Gujarat",
    city: "Surat",
} as const;

export type ContactLocationDefaults = {
    country: string;
    state: string;
    city: string;
};

/** Prefer the signed-in broker’s profile location, then the Surat launch defaults. */
export function contactLocationDefaults(profile?: UserProfile | null): ContactLocationDefaults {
    const country = profile?.country?.trim() || CONTACT_LOCATION_FALLBACK.country;
    const state =
        profile?.broker?.reraState?.trim() ||
        profile?.reraState?.trim() ||
        CONTACT_LOCATION_FALLBACK.state;
    const city = profile?.city?.trim() || CONTACT_LOCATION_FALLBACK.city;
    return { country, state, city };
}
