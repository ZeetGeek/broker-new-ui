import type { UserProfile } from "@/lib/api/profile";
import { sessionCountryName } from "@/lib/auth/session";

/** Country-only fallback when the broker profile has no location yet. */
export const CONTACT_LOCATION_FALLBACK = {
    country: "India",
    state: "",
    city: "",
} as const;

export type ContactLocationDefaults = {
    country: string;
    state: string;
    city: string;
};

/**
 * Prefer the signed-in broker’s profile location, then their market country.
 * State and city stay empty until the user or profile provides them.
 */
export function contactLocationDefaults(profile?: UserProfile | null): ContactLocationDefaults {
    const country = profile?.country?.trim() || sessionCountryName();
    const state = profile?.broker?.reraState?.trim() || profile?.reraState?.trim() || "";
    const city = profile?.city?.trim() || "";
    return { country, state, city };
}
