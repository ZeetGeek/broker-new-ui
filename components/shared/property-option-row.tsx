"use client";

import { cn } from "@/lib/utils";

import { MapPin } from "@/components/shared/icons";
import {
    type CommissionAudience,
    ListingAskPrices,
} from "@/components/shared/price-with-commission";
import { PropertyCoverImage } from "@/components/shared/property-cover-image";
import {
    propertyAskAmounts,
    propertyInfoLine,
    propertyLookingForBadges,
    propertyOffersRent,
    propertyOffersSale,
    type PropertyPickerProperty,
    propertyPlaceLine,
} from "@/components/shared/property-picker-meta";
import { Badge } from "@/components/ui/badge";

/**
 * Shared face for PropertyInlineSelect rows and PropertyPicker modal rows.
 * Cover + ask price + property info + location + Sale/Rent badges —
 * same language as browse card meta.
 */
export function PropertyOptionRow({
    property,
    audience = "broker",
    className,
}: {
    property: PropertyPickerProperty;
    audience?: CommissionAudience;
    className?: string;
}) {
    const amounts = propertyAskAmounts(property);
    const hasAsk = propertyOffersSale(property) || propertyOffersRent(property);
    const info = propertyInfoLine(property);
    const place = propertyPlaceLine(property);
    const lookingBadges = propertyLookingForBadges(property);

    return (
        <span className={cn("flex items-center gap-3 inline-full min-inline-0", className)}>
            <PropertyCoverImage src={property.imageUrl} alt="" size={64} className="shrink-0" />
            <span className="flex flex-1 flex-col gap-1 min-inline-0">
                {hasAsk ? (
                    <ListingAskPrices
                        listing={amounts}
                        audience={audience}
                        size="xs"
                        showEmptyTip
                    />
                ) : (
                    <span className="body-xs font-semibold text-ink-subtle">Price not set</span>
                )}
                <span data-control-value className="truncate text-control font-medium text-ink">
                    {info}
                </span>
                {place ? (
                    <span className="body-xs flex items-center gap-1 text-ink-muted min-inline-0">
                        <MapPin
                            aria-hidden
                            className="shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        <span className="truncate capitalize">{place}</span>
                    </span>
                ) : null}
                {property.warning ? (
                    <Badge color="amber" className="self-start">
                        {property.warning}
                    </Badge>
                ) : null}
                {property.statusChips?.length ? (
                    <span className="flex flex-wrap gap-1">
                        {property.statusChips.map((chip) => (
                            <Badge key={chip.label} color={chip.color}>
                                {chip.label}
                            </Badge>
                        ))}
                    </span>
                ) : null}
            </span>
            {lookingBadges.length > 0 ? (
                <span className="ms-auto flex shrink-0 flex-row flex-wrap items-center justify-end gap-1">
                    {lookingBadges.map((badge) => (
                        <Badge key={badge.label} color={badge.color}>
                            {badge.label}
                        </Badge>
                    ))}
                </span>
            ) : null}
        </span>
    );
}
