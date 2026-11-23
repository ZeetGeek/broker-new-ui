import type { PropertyPickerProperty } from "@/components/shared/property-picker-meta";

import type { MyListingItem } from "@/features/properties/your-listings/types";

function positiveAmount(value: number | null | undefined): number | null {
    if (value == null || !Number.isFinite(value) || value <= 0) return null;
    return value;
}

/** Broker-owned inventory, including both ask prices and their commissions. */
export function mapMyListingToPicker(property: MyListingItem): PropertyPickerProperty {
    return {
        id: property.id,
        title: property.title,
        locality: property.locality || undefined,
        city: property.city || undefined,
        state: property.state || undefined,
        imageUrl: property.imageSrc || undefined,
        propertyTypeLabel: property.propertyTypeLabel,
        areaSqft: property.areaSqft,
        bhk: property.bhk,
        bathrooms: property.bathrooms,
        saleAmountInr: positiveAmount(property.saleAmountInr),
        rentAmountInr: positiveAmount(property.rentAmountInr),
        commissionPercent: property.commissionPercent,
        commissionAmountInr: property.commissionAmount,
    };
}

/**
 * AttachableProperty from client attach flows.
 * Uses legacy isRent + amountInr — maps into sale/rent ask slots.
 */
export function mapAttachablePropertyToPicker(property: {
    id: string;
    title: string;
    city?: string;
    locality?: string;
    state?: string;
    isRent?: boolean;
    amountInr?: number;
    commissionPercent?: number | null;
    commissionAmount?: number | null;
    imageUrl?: string;
    propertyTypeLabel?: string;
    areaSqft?: number | null;
    bhk?: number | null;
    bathrooms?: number | null;
}): PropertyPickerProperty {
    const amount = positiveAmount(property.amountInr);
    return {
        id: property.id,
        title: property.title,
        city: property.city || undefined,
        locality: property.locality || undefined,
        state: property.state || undefined,
        imageUrl: property.imageUrl,
        propertyTypeLabel: property.propertyTypeLabel,
        areaSqft: property.areaSqft,
        bhk: property.bhk,
        bathrooms: property.bathrooms,
        saleAmountInr: property.isRent ? null : amount,
        rentAmountInr: property.isRent ? amount : null,
        commissionPercent: property.isRent ? null : (property.commissionPercent ?? null),
        commissionAmountInr: property.isRent ? (property.commissionAmount ?? null) : null,
    };
}

/** Task link-options / quick-add catalog property. */
export function mapTaskPropertyToPicker(property: {
    id: string;
    title: string;
    locality?: string;
    city?: string;
    state?: string;
    configLabel?: string;
    imageUrl?: string;
    saleAmountInr?: number | null;
    rentAmountInr?: number | null;
    propertyTypeLabel?: string;
    areaSqft?: number | null;
    bhk?: number | null;
    bathrooms?: number | null;
}): PropertyPickerProperty {
    return {
        id: property.id,
        title: property.title,
        locality: property.locality || undefined,
        city: property.city || undefined,
        state: property.state || undefined,
        imageUrl: property.imageUrl,
        propertyTypeLabel: property.propertyTypeLabel || property.configLabel || undefined,
        areaSqft: property.areaSqft,
        bhk: property.bhk,
        bathrooms: property.bathrooms,
        saleAmountInr: positiveAmount(property.saleAmountInr),
        rentAmountInr: positiveAmount(property.rentAmountInr),
    };
}

/** Schedule / visit lead property — often title-only until richer payload exists. */
export function mapVisitLeadPropertyToPicker(property: {
    propertyId: string;
    propertyTitle: string;
    locality?: string;
    city?: string;
    state?: string;
    imageUrl?: string;
    saleAmountInr?: number | null;
    rentAmountInr?: number | null;
    propertyTypeLabel?: string;
    areaSqft?: number | null;
    bhk?: number | null;
}): PropertyPickerProperty {
    return {
        id: property.propertyId,
        title: property.propertyTitle,
        locality: property.locality || undefined,
        city: property.city || undefined,
        state: property.state || undefined,
        imageUrl: property.imageUrl,
        propertyTypeLabel: property.propertyTypeLabel,
        areaSqft: property.areaSqft,
        bhk: property.bhk,
        saleAmountInr: positiveAmount(property.saleAmountInr),
        rentAmountInr: positiveAmount(property.rentAmountInr),
    };
}

/** Filter sheet `{ id, title }` rows. */
export function mapFilterPropertyToPicker(property: {
    id: string;
    title: string;
    locality?: string;
    city?: string;
    state?: string;
}): PropertyPickerProperty {
    return {
        id: property.id,
        title: property.title,
        locality: property.locality || undefined,
        city: property.city || undefined,
        state: property.state || undefined,
    };
}

/** Invite-broker select rows (`label` is the display title). */
export function mapLabeledPropertyToPicker(property: {
    id: string;
    label: string;
    locality?: string;
    city?: string;
    state?: string;
    imageUrl?: string;
}): PropertyPickerProperty {
    return {
        id: property.id,
        title: property.label,
        locality: property.locality || undefined,
        city: property.city || undefined,
        state: property.state || undefined,
        imageUrl: property.imageUrl,
    };
}

/**
 * Broker visit / time-request nested property summary
 * (`purpose` + `amountInr` → sale/rent ask).
 */
export function mapVisitPropertySummaryToPicker(property: {
    id: string;
    title: string;
    locality?: string;
    city?: string;
    state?: string;
    configLabel?: string;
    propertyType?: string;
    areaSqft?: number | null;
    amountInr?: number;
    purpose?: "sale" | "rent";
    commissionPercent?: number | null;
    commissionAmountInr?: number | null;
    coverUrl?: string;
    imageUrl?: string;
}): PropertyPickerProperty {
    const amount = positiveAmount(property.amountInr);
    const isRent = property.purpose === "rent";
    return {
        id: property.id,
        title: property.title,
        locality: property.locality || undefined,
        city: property.city || undefined,
        state: property.state || undefined,
        imageUrl: property.coverUrl || property.imageUrl,
        propertyTypeLabel: property.propertyType || property.configLabel || undefined,
        areaSqft: property.areaSqft,
        saleAmountInr: isRent ? null : amount,
        rentAmountInr: isRent ? amount : null,
        commissionPercent: isRent ? null : (property.commissionPercent ?? null),
        commissionAmountInr: isRent ? (property.commissionAmountInr ?? null) : null,
    };
}

/** Time-request / slot row with nested `property` summary. */
export function mapNestedVisitPropertyToPicker(item: {
    property: Parameters<typeof mapVisitPropertySummaryToPicker>[0];
}): PropertyPickerProperty {
    return mapVisitPropertySummaryToPicker(item.property);
}
