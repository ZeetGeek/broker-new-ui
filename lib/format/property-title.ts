import { needsBhk, PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/validation/property";

import { toLabel } from "@/constants/property";

export function buildPropertyTitle({
    bhk,
    propertyType,
    locality,
    city,
}: {
    bhk: number;
    propertyType: PropertyType;
    locality: string;
    city: string;
}): string {
    const typeLabel = PROPERTY_TYPE_LABELS[propertyType];
    const place = [locality.trim(), city.trim()].filter(Boolean).join(", ");

    if (needsBhk(propertyType) && bhk >= 1) {
        const bhkLabel = bhk >= 5 ? "5+ BHK" : `${bhk} BHK`;
        return place ? `${bhkLabel} ${typeLabel} in ${place}` : `${bhkLabel} ${typeLabel}`;
    }

    return place ? `${typeLabel} in ${place}` : typeLabel;
}

function bedroomLabel(bedrooms: string | undefined): string {
    if (!bedrooms) return "";
    if (bedrooms === "1rk") return "1 RK";
    return `${bedrooms} BHK`;
}

/** Draft listing title from BHK, property type, locality, and city. */
export function buildBasicsSuggestedTitle({
    bedrooms,
    propertyType,
    locality,
    city,
}: {
    bedrooms?: string;
    propertyType?: string;
    locality?: string;
    city?: string;
}): string {
    const configuration = bedroomLabel(bedrooms);
    const kind = propertyType ? toLabel(propertyType) : "";
    const place = [locality?.trim(), city?.trim()].filter(Boolean).join(", ");

    if (configuration && kind && place) return `${configuration} ${kind} in ${place}`;
    if (configuration && kind) return `${configuration} ${kind}`;
    if (kind && place) return `${kind} in ${place}`;
    if (configuration && place) return `${configuration} in ${place}`;
    return kind || configuration || place || "";
}
