"use client";

import { useMemo } from "react";
import toast from "react-hot-toast";

import {
    Bath,
    BedDouble,
    CircleHelp,
    Copy,
    Eye,
    ImageIcon,
    LockKeyhole,
    MapPin,
    Scaling,
    Upload,
} from "lucide-react";

import { calculateRentCommission, calculateSaleCommission } from "@/lib/calc/commission";
import { formatInr, formatInrCompact } from "@/lib/format/inr";
import { buildBasicsSuggestedTitle } from "@/lib/format/property-title";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function resolveDeposit(values: PropertyDraftValues): number {
    const rent = values.rent.monthlyRent ?? 0;
    const deposit = values.rent.securityDeposit ?? 0;
    if (values.rent.securityDepositMode === "months_of_rent") return rent * deposit;
    return deposit;
}

function draftTitle(values: PropertyDraftValues): string {
    const custom = values.basics.title?.trim();
    if (custom) return custom;
    return (
        buildBasicsSuggestedTitle({
            bedrooms: values.details.bedrooms,
            propertyType: values.basics.propertyType,
            locality: values.location.locality,
            city: values.location.city,
        }) || "Untitled property"
    );
}

function bedsLabel(values: PropertyDraftValues): string {
    const bedrooms = String(values.details.bedrooms ?? "").trim();
    if (!bedrooms || bedrooms === "0") return "-- Beds";
    if (bedrooms === "5" || bedrooms === "5+") return "5+ Beds";
    return `${bedrooms} Beds`;
}

function bathsLabel(values: PropertyDraftValues): string {
    const baths = values.details.bathrooms;
    if (baths == null || baths <= 0) return "-- Baths";
    return `${baths} Baths`;
}

function areaLabel(values: PropertyDraftValues): string {
    if (!values.area.areaSqft) return "-- Sq ft";
    return `${values.area.areaSqft.toLocaleString("en-US")} Sq ft`;
}

export function LiveSummaryPanel({
    values,
    stepIndex,
    compact = false,
    onGoToMedia,
}: {
    values: PropertyDraftValues;
    stepIndex: number;
    compact?: boolean;
    onGoToMedia?: () => void;
}) {
    const isSale = values.basics.listingFor === "sell" || values.basics.listingFor === "both";
    const cover = values.media.photos.find((photo) => photo.isCover) ?? values.media.photos[0];
    const price = isSale ? values.sale.expectedPrice : values.rent.monthlyRent;
    const ownerDeductions = 0;
    const buyerCharges = [values.sale.plcCharge, values.sale.floorRiseCharge].reduce<number>(
        (sum, amount) => sum + (amount ?? 0),
        0,
    );
    const deposit = resolveDeposit(values);
    const result = useMemo(() => {
        if (isSale) {
            return calculateSaleCommission({
                salePrice: values.sale.expectedPrice ?? 0,
                areaSqft: values.area.areaSqft,
                mode: values.commission.sale.mode,
                value: values.commission.sale.value,
                paidBy: "owner",
                ownerSharePercent: 100,
                separateRates: values.commission.sale.separateRates
                    ? {
                          ownerPercent: values.commission.sale.ownerPercent ?? 0,
                          buyerPercent: values.commission.sale.buyerPercent ?? 0,
                      }
                    : undefined,
                gstApplicable: values.commission.tax.gstApplicable,
                gstMode: values.commission.tax.gstMode,
                tdsApplicable: values.commission.tax.tdsApplicable,
                tdsRate: values.commission.tax.tdsRate,
                otherOwnerDeductions: ownerDeductions,
                buyerSideCharges: buyerCharges,
            });
        }
        return calculateRentCommission({
            monthlyRent: values.rent.monthlyRent ?? 0,
            securityDeposit: deposit,
            maintenanceAmount: values.rent.maintenanceAmount ?? 0,
            maintenancePaidBy: values.rent.maintenanceMode === "extra" ? "tenant" : "owner",
            lockInMonths: values.rent.lockInMonths ?? 0,
            agreementMonths: values.rent.agreementDurationMonths ?? 11,
            escalationPercent: values.rent.rentEscalationPercent ?? 0,
            mode: "flat",
            value: values.commission.rent.value,
            paidBy: "owner",
            ownerSharePercent: 100,
            renewalFeeMonths: values.commission.rent.renewalFeeApplicable
                ? (values.commission.rent.renewalFeeValue ?? 0)
                : 0,
            gstApplicable: values.commission.tax.gstApplicable,
            gstMode: values.commission.tax.gstMode,
            tdsApplicable: values.commission.tax.tdsApplicable,
            tdsRate: values.commission.tax.tdsRate,
        });
    }, [buyerCharges, deposit, isSale, ownerDeductions, values]);

    const hasPrice = Boolean(price && price > 0);
    const coBrokerPercent = values.deal.coBrokerSharePercent ?? 0;
    const coBrokerShare = (result.brokerRealIncome * coBrokerPercent) / 100;
    const brokerAfterSplit = Math.max(0, result.brokerRealIncome - coBrokerShare);
    const title = draftTitle(values);
    const locationLabel =
        [values.location.locality, values.location.city].filter(Boolean).join(", ") ||
        "Location not added";
    const money = (value: number) => (hasPrice ? value : null);
    const dealSheetLines =
        isSale && "ownerNet" in result
            ? [
                  `Sale price: ${formatInr(values.sale.expectedPrice)}`,
                  values.area.areaSqft
                      ? `Rate per sq ft: ${formatInr(result.effectiveRatePerSqft)}`
                      : null,
                  `Gross commission: ${formatInr(result.gross)}`,
                  coBrokerShare > 0
                      ? `Co-broker (${coBrokerPercent}%): ${formatInr(coBrokerShare)}`
                      : null,
                  `Broker earns: ${formatInr(brokerAfterSplit)}`,
              ].filter((line): line is string => Boolean(line))
            : "ownerFirstPayout" in result
              ? [
                    `Monthly rent: ${formatInr(values.rent.monthlyRent)}`,
                    deposit > 0 ? `Deposit: ${formatInr(deposit)}` : null,
                    `Gross brokerage: ${formatInr(result.gross)}`,
                    coBrokerShare > 0
                        ? `Co-broker (${coBrokerPercent}%): ${formatInr(coBrokerShare)}`
                        : null,
                    `Broker earns: ${formatInr(brokerAfterSplit)}`,
                ].filter((line): line is string => Boolean(line))
              : [];
    const summaryText = [title, ...dealSheetLines].join("\n");

    async function copySummary() {
        try {
            await navigator.clipboard.writeText(summaryText);
            toast.success("Deal summary copied.");
        } catch {
            toast.error("Couldn't copy the summary.");
        }
    }

    if (compact) {
        return (
            <div className="flex items-center justify-between gap-4">
                <div className="min-inline-0">
                    <p className="text-xs text-surface/65">Broker earns</p>
                    <AnimatedMoney
                        value={money(brokerAfterSplit)}
                        className="text-base text-surface"
                    />
                </div>
                <p className="truncate text-xs text-surface/70">
                    {price ? formatInrCompact(price) : "Add a price to calculate"}
                </p>
            </div>
        );
    }

    return (
        <aside className="flex flex-col gap-4">
            <Card
                className="
                  gap-0 overflow-hidden rounded-card border border-border-warm bg-surface py-0
                  shadow-none ring-0
                "
            >
                <div className="flex flex-col gap-4 p-4">
                    <div className="flex items-center gap-2 text-ink">
                        <Eye className="text-ink-muted block-4 inline-4" aria-hidden />
                        <p className="text-sm font-bold">Listing preview</p>
                    </div>

                    <div
                        className="
                      relative aspect-16/10 overflow-hidden rounded-inner bg-surface-muted
                    "
                    >
                        {cover ? (
                            <AppImage
                                src={cover.url}
                                alt={cover.alt || title}
                                fill
                                sizes="320px"
                                unoptimized={
                                    cover.url.startsWith("http://") ||
                                    cover.url.startsWith("https://")
                                }
                            />
                        ) : (
                            <div
                                className="
                              flex flex-col items-center justify-center gap-3 px-5 py-6 text-center
                              block-full
                            "
                            >
                                <ImageIcon
                                    className="text-ink-subtle block-7 inline-7"
                                    strokeWidth={1.5}
                                    aria-hidden
                                />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-ink">Add a cover photo</p>
                                    <p className="text-xs text-ink-muted">JPG, PNG up to 10 MB</p>
                                </div>
                                {onGoToMedia ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={onGoToMedia}
                                        className="gap-1.5 bg-surface"
                                    >
                                        <Upload className="block-3.5 inline-3.5" aria-hidden />
                                        Upload photo
                                    </Button>
                                ) : null}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-3">
                            <p className="line-clamp-2 text-base/6 font-bold text-ink min-inline-0">
                                {title}
                            </p>
                            <Badge
                                variant="urgent"
                                className="shrink-0 rounded-md px-2 py-0.5 text-[11px]"
                            >
                                Draft
                            </Badge>
                        </div>
                        <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                            <MapPin className="shrink-0 block-3.5 inline-3.5" aria-hidden />
                            <span className="truncate">{locationLabel}</span>
                        </p>
                        <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-ink-muted">
                                {isSale ? "Asking price" : "Monthly rent"}
                            </p>
                            <p className="tabular text-lg font-bold text-ink">
                                {price && price > 0 ? formatInrCompact(price) : "— — —"}
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="
                      mx-4 flex items-center justify-between gap-3 border-bs border-border-warm
                      py-3.5 text-xs font-medium text-ink-muted
                    "
                >
                    <span className="inline-flex items-center gap-1.5 min-inline-0">
                        <BedDouble className="shrink-0 block-3.5 inline-3.5" aria-hidden />
                        <span className="truncate">{bedsLabel(values)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 min-inline-0">
                        <Bath className="shrink-0 block-3.5 inline-3.5" aria-hidden />
                        <span className="truncate">{bathsLabel(values)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 min-inline-0">
                        <Scaling className="shrink-0 block-3.5 inline-3.5" aria-hidden />
                        <span className="truncate">{areaLabel(values)}</span>
                    </span>
                </div>
            </Card>

            {stepIndex >= 2 ? (
                <Card className="gap-0 overflow-hidden bg-brand-ink py-0 text-surface ring-0">
                    <div className="space-y-1 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-inline-0">
                                <p className="text-sm font-bold">
                                    {isSale ? "Sale deal summary" : "Rent deal summary"}
                                </p>
                                <p className="mbs-0.5 text-xs text-surface/60">
                                    Broker income · updates as you type
                                </p>
                            </div>
                            <span
                                className="
                              inline-flex shrink-0 items-center gap-1 text-xs text-surface/60
                            "
                            >
                                <LockKeyhole className="block-3.5 inline-3.5" aria-hidden />
                                Private
                            </span>
                        </div>

                        <SectionLabel>Property</SectionLabel>
                        {isSale && "ownerNet" in result ? (
                            <>
                                <MoneyRow
                                    label="Sale price"
                                    value={values.sale.expectedPrice}
                                    title="The current asking price."
                                />
                                {values.area.areaSqft ? (
                                    <MoneyRow
                                        label="Rate per sq ft"
                                        value={money(result.effectiveRatePerSqft)}
                                        title="Sale price divided by area."
                                    />
                                ) : null}
                            </>
                        ) : "ownerFirstPayout" in result ? (
                            <>
                                <MoneyRow
                                    label="Monthly rent"
                                    value={values.rent.monthlyRent}
                                    title="The agreed monthly asking rent."
                                />
                                {deposit > 0 ? (
                                    <MoneyRow
                                        label="Deposit"
                                        value={money(deposit)}
                                        title="The security deposit in rupees."
                                    />
                                ) : null}
                            </>
                        ) : null}

                        <SectionLabel>You earn</SectionLabel>
                        <AnimatedMoney
                            value={money(brokerAfterSplit)}
                            className="mbe-2 block text-2xl text-highlight"
                        />
                        <MoneyRow
                            label={isSale ? "Gross commission" : "Gross brokerage"}
                            value={money(result.gross)}
                            title="Agreed fee before any co-broker split."
                        />
                        {coBrokerShare > 0 ? (
                            <MoneyRow
                                label={`Co-broker (${coBrokerPercent}%)`}
                                value={money(coBrokerShare)}
                                prefix="−"
                                title="Share paid to the co-broker."
                            />
                        ) : null}
                    </div>
                    <div className="border-bs border-surface/15">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => void copySummary()}
                            className="
                              flex items-center justify-center gap-2 text-xs font-semibold
                              text-surface inline-full min-block-11
                              hover:bg-surface/10 hover:text-surface
                              focus-visible:ring-2 focus-visible:ring-highlight
                            "
                        >
                            <Copy className="block-4 inline-4" aria-hidden /> Copy summary
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card
                    className="
                      rounded-card border border-dashed border-border-warm bg-surface-muted p-4
                      shadow-none
                    "
                >
                    <p className="text-sm font-bold text-ink">Live deal summary</p>
                    <p className="mbs-1 text-sm/6 text-ink-muted">
                        Add the price on Price & deal to see what you earn.
                    </p>
                </Card>
            )}
        </aside>
    );
}

function SectionLabel({ children }: { children: string }) {
    return (
        <p
            className="
              mbs-4 mbe-1.5 border-bs border-surface/15 pbs-3 text-[11px] font-bold
              tracking-[0.12em] text-surface/55 uppercase
            "
        >
            {children}
        </p>
    );
}

function AnimatedMoney({ value, className }: { value: number | null; className?: string }) {
    const text = formatInr(value);
    return (
        <span key={text} className={cn("t-digit-group is-animating tabular font-bold", className)}>
            {text.split("").map((character, index) => (
                <span
                    key={`${character}-${index}`}
                    className="t-digit"
                    data-stagger={
                        index === text.length - 2
                            ? "1"
                            : index === text.length - 1
                              ? "2"
                              : undefined
                    }
                >
                    {character === " " ? "\u00a0" : character}
                </span>
            ))}
        </span>
    );
}

function MoneyRow({
    label,
    value,
    prefix,
    strong,
    title,
}: {
    label: string;
    value: number | null | undefined;
    prefix?: string;
    strong?: boolean;
    title: string;
}) {
    return (
        <div
            className={cn(
                "flex items-baseline justify-between gap-4 py-1 text-xs",
                strong ? "font-bold text-surface" : "text-surface/70",
            )}
        >
            <span className="flex items-center gap-1.5">
                {label}
                <Popover>
                    <PopoverTrigger
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                aria-label={`Explain ${label}`}
                                className="text-surface/55 hover:bg-surface/10 hover:text-surface"
                            />
                        }
                    >
                        <CircleHelp className="block-3.5 inline-3.5" aria-hidden />
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="text-xs/5 inline-56">
                        {title}
                    </PopoverContent>
                </Popover>
            </span>
            <span className="tabular whitespace-nowrap">
                {value == null ? "— — —" : `${prefix ? `${prefix} ` : ""}${formatInr(value)}`}
            </span>
        </div>
    );
}
