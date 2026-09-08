import { needsBhk, PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/validation/property";

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
