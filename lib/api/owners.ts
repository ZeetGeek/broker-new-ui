import { ApiError, apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";

import { MOCK_OWNER_LISTINGS } from "@/features/properties/owner-listings/mock-owner-listings";

export type OwnerProfileProperty = {
    id: string;
    title: string;
    city?: string;
    address?: string;
    transactionType?: string;
    propertyType?: string;
    bhkConfig?: string | null;
    areaSqft?: number | null;
    salePrice?: string | null;
    monthlyRent?: string | null;
    photos: string[];
};

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
    email?: string;
    contactUnlocked: boolean;
    properties: OwnerProfileProperty[];
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
    email?: string | null;
    contactUnlocked?: boolean | null;
    hasActiveRepresentation?: boolean;
    properties?: Array<{
        id?: string;
        title?: string | null;
        city?: string | null;
        address?: string | null;
        transactionType?: string | null;
        propertyType?: string | null;
        bhkConfig?: string | null;
        areaSqft?: number | null;
        salePrice?: string | number | null;
        monthlyRent?: string | number | null;
        photos?: string[] | null;
    }> | null;
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
    const contactUnlocked = Boolean(raw.contactUnlocked ?? raw.hasActiveRepresentation);
    const phoneDigits = contactUnlocked ? digitsOnly(raw.phone) : "";
    const properties = (raw.properties ?? [])
        .filter((row): row is NonNullable<typeof row> & { id: string } => Boolean(row?.id))
        .map((row) => ({
            id: row.id,
            title: row.title?.trim() || "Property",
            city: row.city?.trim() || undefined,
            address: row.address?.trim() || undefined,
            transactionType: row.transactionType ?? undefined,
            propertyType: row.propertyType ?? undefined,
            bhkConfig: row.bhkConfig ?? undefined,
            areaSqft: row.areaSqft ?? undefined,
            salePrice: row.salePrice != null ? String(row.salePrice) : undefined,
            monthlyRent: row.monthlyRent != null ? String(row.monthlyRent) : undefined,
            photos: (row.photos ?? []).filter((src): src is string => Boolean(src)),
        }));

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
        listingCount: listingCount ?? (properties.length || undefined),
        localities,
        phoneDigits: phoneDigits
            ? phoneDigits.length > 10
                ? phoneDigits.slice(-10)
                : phoneDigits
            : undefined,
        email: contactUnlocked ? raw.email?.trim() || undefined : undefined,
        contactUnlocked,
        properties,
    };
}

export const ownersApi = {
    /**
     * Broker-facing owner profile. Public `/owners/:id` first; represented
     * contacts at `/clients/owners/:id` if that is all the API exposes.
     */
    async get(ownerUserId: string, signal?: AbortSignal): Promise<BrokerOwnerProfile> {
        if (isMockMode()) {
            const listing = MOCK_OWNER_LISTINGS.find((item) => item.ownerUserId === ownerUserId);
            const name = listing?.ownerName ?? "Owner";
            return {
                ownerUserId,
                name,
                city: listing?.city,
                locality: listing?.locality,
                locationLabel: listing?.ownerLocationLabel,
                verified: true,
                listingCount: MOCK_OWNER_LISTINGS.filter((item) => item.ownerUserId === ownerUserId)
                    .length,
                localities: listing ? [listing.locality] : [],
                contactUnlocked: false,
                properties: [],
            };
        }
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
