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
import { formatPriceInr } from "@/lib/format/price";

import { HandCoins } from "@/components/shared/icons";
import {
    type CommissionAudience,
    listingCommissionTip,
    PriceWithCommission,
} from "@/components/shared/price-with-commission";

import { SlidingTabs } from "@/features/design-system/theme/sliding-tabs";
import type { MyListingItem } from "@/features/properties/your-listings/types";

import styles from "./property-detail.module.css";

/**
 * A listing offered for both sale and rent has two asks, and jamming them
 * side by side makes neither readable. Show one at full size, switch with a
 * toggle, and keep the other as a quiet secondary line.
 */
export function PropertyPriceBlock({
    item: rawItem,
    audience = "broker",
    hideCommission = false,
    compact = false,
}: {
    item: MyListingItem;
    /** Owner portal: "Broker gets". Broker portal: "You get". */
    audience?: CommissionAudience;
    /** Public share page: price only, no broker commission line or tip. */
    hideCommission?: boolean;
    compact?: boolean;
}) {
    const item = hideCommission
        ? { ...rawItem, commissionPercent: null, commissionAmount: null }
        : rawItem;
    const showEmptyTip = !hideCommission;
    const [mode, setMode] = useState<ListingPriceMode>(defaultPriceMode(item));
    const both = offersBoth(item);

    const showsSale = both
        ? mode === "sale"
        : offersSale(item) || (!offersRent(item) && item.transactionType !== "rent");
    const amount = showsSale ? item.saleAmountInr : item.rentAmountInr;

    const perSqft =
        showsSale && item.saleAmountInr != null && item.areaSqft > 0
            ? Math.round(item.saleAmountInr / item.areaSqft)
            : null;

    // The price alone leaves half the card empty on a sale-only listing, so the
    // headline numbers a broker quotes on a call sit beside it.
    const headlineStats = [
        item.bhk > 0 ? { label: "Config", value: item.configLabel } : null,
        { label: "Area", value: formatAreaSqft(item.areaSqft) },
        { label: "Furnishing", value: item.furnishingLabel },
    ].filter((stat): stat is { label: string; value: string } => stat != null);

    return (
        <div
            className={
                compact
                    ? "flex flex-col gap-4"
                    : `flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8`
            }
        >
            <div className="flex flex-col gap-3">
                {both ? (
                    <SlidingTabs
                        value={mode}
                        onValueChange={setMode}
                        ariaLabel="Property price"
                        options={[
                            { value: "sale", label: "For sale" },
                            { value: "rent", label: "For rent" },
                        ]}
                        className="t-tabs-compact self-start"
                    />
                ) : null}

                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {amount == null ? (
                        <span
                            className={
                                compact ? "h4 tabular text-brand" : "display-3 tabular text-brand"
                            }
                        >
                            Price on request
                        </span>
                    ) : (
                        <PriceWithCommission
                            amountInr={amount}
                            isRent={!showsSale}
                            commissionPercent={item.commissionPercent}
                            commissionAmountInr={item.commissionAmount}
                            audience={audience}
                            size={compact ? "xl" : "2xl"}
                            showEmptyTip={showEmptyTip}
                        />
                    )}
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
                            <PriceWithCommission
                                amountInr={
                                    showsSale
                                        ? (item.rentAmountInr ?? 0)
                                        : (item.saleAmountInr ?? 0)
                                }
                                isRent={showsSale}
                                commissionPercent={item.commissionPercent}
                                commissionAmountInr={item.commissionAmount}
                                audience={audience}
                                size="sm"
                                showEmptyTip={showEmptyTip}
                                className="text-ink"
                            />
                        </span>
                    ) : null}
                    {item.maintenanceInr != null && item.maintenanceInr > 0 ? (
                        <span className="tabular">
                            + {formatPriceInr(item.maintenanceInr)}/mo maintenance
                        </span>
                    ) : null}
                </div>
                {compact && !hideCommission && amount != null
                    ? (() => {
                          const tip = listingCommissionTip({
                              amountInr: amount ?? 0,
                              isRent: !showsSale,
                              commissionPercent: item.commissionPercent,
                              commissionAmountInr: item.commissionAmount,
                              audience,
                          });
                          return tip ? (
                              <div className={styles.commissionSummary}>
                                  <HandCoins size={22} strokeWidth={1.75} aria-hidden />
                                  <div>
                                      <p className={tip.plain ? "text-ink-muted" : "text-ink"}>
                                          {tip.headline}
                                      </p>
                                      {tip.detail ? <span>{tip.detail}</span> : null}
                                  </div>
                              </div>
                          ) : null;
                      })()
                    : null}
            </div>

            {!compact ? (
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
            ) : null}
        </div>
    );
}
