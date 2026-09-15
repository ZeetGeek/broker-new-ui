"use client";

import { useState } from "react";

import { formatAreaSqft } from "@/lib/format/area";
import {
    defaultPriceMode,
    type ListingPriceMode,
    offersBoth,
    offersRent,
    offersSale,
} from "@/lib/format/listing-availability";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import type { MyListingItem } from "@/features/properties/your-listings/types";

/**
 * A listing offered for both sale and rent has two asks, and jamming them
 * side by side makes neither readable. Show one at full size, switch with a
 * toggle, and keep the other as a quiet secondary line.
 */
export function PropertyPriceBlock({ item }: { item: MyListingItem }) {
    const [mode, setMode] = useState<ListingPriceMode>(defaultPriceMode(item));
    const both = offersBoth(item);

    const showsSale = both ? mode === "sale" : offersSale(item);
    const amount = showsSale ? item.saleAmountInr : item.rentAmountInr;

    const perSqft = (() => {
        if (!showsSale) return null;
        if (item.pricePerSqft != null && item.pricePerSqft > 0) return item.pricePerSqft;
        const areaForRate =
            item.carpetAreaSqft != null && item.carpetAreaSqft > 0
                ? item.carpetAreaSqft
                : item.areaSqft;
        if (item.saleAmountInr != null && areaForRate > 0) {
            return Math.round(item.saleAmountInr / areaForRate);
        }
        return null;
    })();

    // The price alone leaves half the card empty on a sale-only listing, so the
    // headline numbers a broker quotes on a call sit beside it.
    const headlineStats = [
        item.bhk > 0 ? { label: "Config", value: item.configLabel } : null,
        { label: "Area", value: formatAreaSqft(item.areaSqft) },
        item.carpetAreaSqft != null && item.carpetAreaSqft > 0
            ? { label: "Carpet", value: formatAreaSqft(item.carpetAreaSqft) }
            : null,
        { label: "Furnishing", value: item.furnishingLabel },
    ].filter((stat): stat is { label: string; value: string } => stat != null);

    return (
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="flex flex-col gap-3">
                {both ? (
                    <div
                        className="
                          inline-flex rounded-control border border-border-warm bg-surface-muted
                          p-0.5 inline-fit
                        "
                    >
                        {(["sale", "rent"] as const).map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setMode(value)}
                                className={cn(
                                    `
                                      body-sm rounded-control px-4 py-1.5 font-semibold
                                      transition-colors duration-160
                                    `,
                                    mode === value
                                        ? "bg-surface text-ink shadow-xs"
                                        : "text-ink-muted hover:text-ink",
                                )}
                            >
                                {value === "sale" ? "For sale" : "For rent"}
                            </button>
                        ))}
                    </div>
                ) : null}

                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="display-3 tabular text-brand">
                        {amount == null
                            ? "Price on request"
                            : showsSale
                              ? formatPriceInr(amount)
                              : formatRentInr(amount)}
                    </span>
                    {!both ? (
                        <span className="body-sm font-semibold text-ink-muted">
                            {offersRent(item) && !offersSale(item) ? "for rent" : "for sale"}
                        </span>
                    ) : null}
                </div>

                <div className="body-sm flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-muted">
                    {perSqft ? (
                        <span className="tabular">{formatPriceInr(perSqft)} per sq ft</span>
                    ) : null}
                    {both ? (
                        <span className="tabular">
                            Also {showsSale ? "for rent at" : "for sale at"}{" "}
                            <span className="font-semibold text-ink">
                                {showsSale
                                    ? formatRentInr(item.rentAmountInr ?? 0)
                                    : formatPriceInr(item.saleAmountInr ?? 0)}
                            </span>
                        </span>
                    ) : null}
                    {item.maintenanceInr != null && item.maintenanceInr > 0 ? (
                        <span className="tabular">
                            + {formatPriceInr(item.maintenanceInr)}/mo maintenance
                        </span>
                    ) : null}
                </div>
            </div>

            <dl
                className="
                  md:border-is md:pis-8
                  flex shrink-0 gap-6 border-bs border-border-warm pbs-4
                  md:border-bs-0 md:pbs-0
                "
            >
                {headlineStats.map((stat) => (
                    <div key={stat.label} className="flex flex-col gap-1">
                        <dt className="body-xs text-ink-muted">{stat.label}</dt>
                        <dd className="body font-semibold text-ink">{stat.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
