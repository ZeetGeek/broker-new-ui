import type { BrokerVisit } from "@/lib/api/site-visits";

import type { BuyerRow, OwnerRow } from "@/features/contacts/types";
import type { DealItem } from "@/features/pipeline/types";
import type { MyListingItem } from "@/features/properties/your-listings/types";

type SearchField = string | null | undefined;

function normalize(value: string): string {
    return value
        .normalize("NFKC")
        .toLowerCase()
        .replace(/(\p{L})(\p{N})/gu, "$1 $2")
        .replace(/(\p{N})(\p{L})/gu, "$1 $2")
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
        .trim();
}

/** Each word can match a different field; formatted phone numbers match on digits. */
export function matchesCrmSearch(
    query: string,
    fields: readonly SearchField[],
    phones: readonly SearchField[] = [],
): boolean {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return true;
    const numbers = phones
        .flatMap((phone) => {
            const digits = (phone ?? "").replace(/\D/g, "");
            return digits.length === 10 ? [digits, `91${digits}`] : [digits];
        })
        .filter(Boolean);
    if (/^[\d\s()+-]+$/.test(query.trim())) {
        const digits = query.replace(/\D/g, "");
        if (digits.length >= 3 && numbers.some((phone) => phone.includes(digits))) return true;
    }
    const text = normalize([...fields, ...numbers].filter(Boolean).join(" "));
    return words.every((word) => text.includes(word));
}

export function matchesClientSearch(client: BuyerRow, query: string): boolean {
    return matchesCrmSearch(
        query,
        [
            client.name,
            client.email,
            client.city,
            client.state,
            ...client.preferredLocalities,
            client.notes,
            ...client.activePropertyTitles,
            ...client.attachedProperties.flatMap((property) => [property.title, property.locality]),
        ],
        [client.phoneDigits],
    );
}

export function matchesOwnerSearch(owner: OwnerRow, query: string): boolean {
    return matchesCrmSearch(
        query,
        [
            owner.name,
            owner.details?.email,
            owner.details?.city,
            owner.details?.state,
            owner.details?.locality,
            owner.notes,
            owner.details?.notes,
            ...owner.localities,
            ...owner.propertyTitles,
            owner.linkedListingTitle,
            ...(owner.properties ?? []).flatMap((property) => [property.title, property.locality]),
        ],
        [owner.phoneDigits],
    );
}

export function matchesListingSearch(listing: MyListingItem, query: string): boolean {
    return matchesCrmSearch(
        query,
        [
            listing.title,
            listing.locality,
            listing.city,
            listing.state,
            listing.address,
            listing.society,
            listing.landmark,
            listing.pinCode,
            listing.propertyTypeLabel,
            listing.configLabel,
            listing.ownerName,
            ...(listing.attachedClients ?? []).map((client) => client.name),
        ],
        [listing.ownerPhoneDigits],
    );
}

export function matchesDealSearch(deal: DealItem, query: string): boolean {
    return matchesCrmSearch(
        query,
        [
            deal.buyer.name,
            deal.owner.name,
            deal.property.title,
            deal.property.locality,
            deal.property.city,
            deal.property.propertyTypeLabel,
            deal.property.configLabel,
            deal.note,
        ],
        [deal.buyer.phoneDigits, deal.owner.phoneDigits],
    );
}

export function matchesVisitSearch(visit: BrokerVisit, query: string): boolean {
    return matchesCrmSearch(
        query,
        [
            visit.clientName,
            visit.ownerName,
            visit.propertyTitle,
            visit.locality,
            visit.city,
            visit.notes,
        ],
        [visit.clientPhone],
    );
}
