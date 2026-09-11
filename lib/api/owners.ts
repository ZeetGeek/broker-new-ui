import { ApiError, apiFetch } from "@/lib/api/client";

export type BrokerOwnerProfile = {
    ownerUserId: string;
    name: string;
    avatarUrl?: string;
    city?: string;
    locality?: string;
    locationLabel?: string;
    bio?: string;
    companyName?: string;
    verified: boolean;
    listingCount?: number;
    localities: string[];
    phoneDigits?: string;
};

type OwnerProfileApi = {
    id?: string;
    userId?: string;
    ownerUserId?: string;
    fullName?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
    city?: string | null;
    locality?: string | null;
    locationLabel?: string | null;
    bio?: string | null;
    companyName?: string | null;
    verified?: boolean | null;
    listingCount?: number | null;
    propertyCount?: number | null;
    localities?: string[] | null;
    preferredCities?: string[] | null;
    preferredLocalities?: string[] | null;
    phone?: string | null;
    hasActiveRepresentation?: boolean;
};

function digitsOnly(value: string | null | undefined): string {
    return (value ?? "").replace(/\D/g, "");
}

function firstText(...values: Array<string | null | undefined>): string | undefined {
    for (const value of values) {
        const text = value?.trim();
        if (text) return text;
    }
    return undefined;
}

function mapOwnerProfile(raw: OwnerProfileApi, fallbackId: string): BrokerOwnerProfile {
    const ownerUserId = firstText(raw.ownerUserId, raw.userId, raw.id) ?? fallbackId;
    const name = firstText(raw.fullName, raw.name) ?? "Owner";
    const locality = raw.locality?.trim() || undefined;
    const city = raw.city?.trim() || undefined;
    const locationLabel =
        firstText(raw.locationLabel) ??
        ([locality, city].filter(Boolean).join(", ") || undefined);
    const listingCount = raw.listingCount ?? raw.propertyCount ?? undefined;
    const localities = (raw.localities ?? raw.preferredLocalities ?? []).filter(
        (value): value is string => Boolean(value?.trim()),
    );
    const phoneDigits = raw.hasActiveRepresentation ? digitsOnly(raw.phone) : "";

    return {
        ownerUserId,
        name,
        avatarUrl: raw.avatarUrl ?? undefined,
        city,
        locality,
        locationLabel,
        bio: raw.bio?.trim() || undefined,
        companyName: raw.companyName?.trim() || undefined,
        verified: Boolean(raw.verified),
        listingCount: listingCount != null && listingCount > 0 ? listingCount : undefined,
        localities,
        phoneDigits: phoneDigits
            ? phoneDigits.length > 10
                ? phoneDigits.slice(-10)
                : phoneDigits
            : undefined,
    };
}

export const ownersApi = {
    /**
     * Broker-facing owner profile. Public `/owners/:id` first; represented
     * contacts at `/clients/owners/:id` if that is all the API exposes.
     */
    async get(ownerUserId: string, signal?: AbortSignal): Promise<BrokerOwnerProfile> {
        try {
            const raw = await apiFetch<OwnerProfileApi>(`/owners/${ownerUserId}`, { signal });
            return mapOwnerProfile(raw, ownerUserId);
        } catch (error) {
            if (!(error instanceof ApiError) || error.status !== 404) throw error;

            const raw = await apiFetch<OwnerProfileApi>(`/clients/owners/${ownerUserId}`, {
                signal,
            });
            return mapOwnerProfile(raw, ownerUserId);
        }
    },
};
