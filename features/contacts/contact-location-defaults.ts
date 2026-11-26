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
    const state =
        profile?.state?.trim() ||
        profile?.broker?.reraState?.trim() ||
        profile?.reraState?.trim() ||
        "";
    // City belongs to a state. Without one the City picker is locked, so a
    // lone default city would leave the form stuck on "Pick a state".
    const city = state ? profile?.city?.trim() || "" : "";
    return { country, state, city };
}

/**
 * Location for an existing contact's edit form.
 *
 * State and city are taken together: from the contact when it has either,
 * otherwise from the defaults. Mixing them (the contact's city with the
 * broker's state) can pair a city with a state it is not in.
 */
export function contactLocationValues(
    saved: { country?: string | null; state?: string | null; city?: string | null },
    defaults: ContactLocationDefaults,
): ContactLocationDefaults {
    const state = saved.state?.trim() || "";
    const city = saved.city?.trim() || "";
    const country = saved.country?.trim() || defaults.country;
    if (!state && !city) return { country, state: defaults.state, city: defaults.city };
    return { country, state, city };
}
