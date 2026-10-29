import type { UserProfile } from "@/lib/api/profile";
import { sessionCountryName } from "@/lib/auth/session";

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

/**
 * Prefer the signed-in broker’s profile location, then their market. The
 * Surat / Gujarat defaults only apply inside the launch country.
 */
export function contactLocationDefaults(profile?: UserProfile | null): ContactLocationDefaults {
    const country = profile?.country?.trim() || sessionCountryName();
    const inLaunchCountry = country === CONTACT_LOCATION_FALLBACK.country;
    const state =
        profile?.broker?.reraState?.trim() ||
        profile?.reraState?.trim() ||
        (inLaunchCountry ? CONTACT_LOCATION_FALLBACK.state : "");
    const city = profile?.city?.trim() || (inLaunchCountry ? CONTACT_LOCATION_FALLBACK.city : "");
    return { country, state, city };
}
