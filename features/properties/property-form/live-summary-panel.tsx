"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFormContext } from "react-hook-form";
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
    RefreshCw,
    Scaling,
    Upload,
    X,
} from "lucide-react";

import { calculateRentCommission, calculateSaleCommission } from "@/lib/calc/commission";
import { formatInr, formatInrCompact } from "@/lib/format/inr";
import { buildBasicsSuggestedTitle } from "@/lib/format/property-title";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
    normalizePhotoOrder,
    removeCoverPhoto,
    replaceCoverPhoto,
} from "@/features/properties/property-form/cover-photo";

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
    photoFilesRef,
}: {
    values: PropertyDraftValues;
    stepIndex: number;
    compact?: boolean;
    onGoToMedia?: () => void;
    photoFilesRef?: MutableRefObject<Map<string, File>>;
}) {
    const { setValue, getValues } = useFormContext<PropertyDraftValues>();
    const coverInputRef = useRef<HTMLInputElement>(null);
    const isSale = values.basics.listingFor === "sell" || values.basics.listingFor === "both";
    const cover = values.media.photos.find((photo) => photo.isCover) ?? null;
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

    function commitPhotos(next: PropertyDraftValues["media"]["photos"]) {
        setValue("media.photos", normalizePhotoOrder(next), {
            shouldDirty: true,
            shouldValidate: true,
        });
    }

    async function handleReplaceCover(file: File | undefined) {
        if (!file || !photoFilesRef) return;
        await replaceCoverPhoto({
            file,
            photos: getValues("media.photos"),
            photoFilesRef,
            commitPhotos,
            patchPhoto: (photoId, patch) => {
                const current = getValues("media.photos");
                setValue(
                    "media.photos",
                    current.map((photo) => (photo.id === photoId ? { ...photo, ...patch } : photo)),
                    { shouldDirty: true, shouldValidate: true },
                );
            },
        });
    }

    function handleRemoveCover() {
        if (!photoFilesRef) return;
        removeCoverPhoto({
            photos: getValues("media.photos"),
            photoFilesRef,
            commitPhotos,
        });
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
        <aside className="flex flex-col gap-3">
            <article
                className="
                  overflow-hidden rounded-card border border-border-warm bg-surface
                "
            >
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                        <Eye className="text-brand block-4 inline-4" aria-hidden />
                        Listing preview
                    </p>
                    <Badge
                        variant="neutral"
                        className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                    >
                        Draft
                    </Badge>
                </div>

                <div className="group relative mx-3.5 aspect-4/3 overflow-hidden rounded-inner bg-surface-muted">
                    {cover ? (
                        <>
                            <AppImage
                                src={cover.url}
                                alt={cover.alt || title}
                                fill
                                sizes="320px"
                                className="object-cover"
                                unoptimized={
                                    cover.url.startsWith("blob:") ||
                                    cover.url.startsWith("http://") ||
                                    cover.url.startsWith("https://")
                                }
                            />
                            {photoFilesRef ? (
                                <>
                                    <input
                                        ref={coverInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                                        className="sr-only"
                                        onChange={(event) => {
                                            void handleReplaceCover(event.target.files?.[0]);
                                            event.currentTarget.value = "";
                                        }}
                                    />
                                    <div
                                        className="
                                          absolute inset-0 flex flex-col items-center
                                          justify-center gap-2 bg-ink/55 p-3 opacity-100
                                          transition-opacity duration-160
                                          md:opacity-0 md:group-hover:opacity-100
                                          md:group-focus-within:opacity-100
                                        "
                                    >
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 border-0 bg-surface text-ink hover:bg-surface"
                                            onClick={() => coverInputRef.current?.click()}
                                        >
                                            <RefreshCw
                                                className="block-3.5 inline-3.5"
                                                aria-hidden
                                            />
                                            Replace cover
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="
                                              text-surface hover:bg-surface/15 hover:text-surface
                                            "
                                            onClick={handleRemoveCover}
                                        >
                                            <X className="me-1 block-3.5 inline-3.5" aria-hidden />
                                            Remove
                                        </Button>
                                    </div>
                                </>
                            ) : null}
                        </>
                    ) : (
                        <div
                            className="
                              flex flex-col items-center justify-center gap-2.5 border border-dashed
                              border-brand/30 bg-brand-soft/25 px-4 py-5 text-center block-full
                            "
                        >
                            <span
                                className="
                                  flex items-center justify-center rounded-control bg-surface
                                  text-brand block-10 inline-10
                                "
                            >
                                <ImageIcon
                                    className="block-5 inline-5"
                                    strokeWidth={1.75}
                                    aria-hidden
                                />
                            </span>
                            <p className="text-sm font-semibold text-ink">Add a cover photo</p>
                            {photoFilesRef ? (
                                <>
                                    <input
                                        ref={coverInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                                        className="sr-only"
                                        onChange={(event) => {
                                            void handleReplaceCover(event.target.files?.[0]);
                                            event.currentTarget.value = "";
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="accent"
                                        size="sm"
                                        onClick={() => coverInputRef.current?.click()}
                                        className="gap-1.5"
                                    >
                                        <Upload className="block-3.5 inline-3.5" aria-hidden />
                                        Upload photo
                                    </Button>
                                </>
                            ) : onGoToMedia ? (
                                <Button
                                    type="button"
                                    variant="accent"
                                    size="sm"
                                    onClick={onGoToMedia}
                                    className="gap-1.5"
                                >
                                    <Upload className="block-3.5 inline-3.5" aria-hidden />
                                    Upload photo
                                </Button>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 px-3.5 py-3.5">
                    <p className="tabular text-xl font-bold tracking-[-0.02em] text-brand">
                        {price && price > 0 ? formatInrCompact(price) : "Price not set"}
                    </p>
                    <p className="line-clamp-2 text-sm/5 font-semibold text-ink">{title}</p>
                    <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                        <MapPin className="shrink-0 block-3.5 inline-3.5" aria-hidden />
                        <span className="truncate">{locationLabel}</span>
                    </p>
                    <div
                        className="
                          mts-1 grid grid-cols-3 gap-2 rounded-control bg-surface-muted px-2.5
                          py-2 text-[11px] font-medium text-ink-muted
                        "
                    >
                        <span className="inline-flex items-center justify-center gap-1 min-inline-0">
                            <BedDouble className="shrink-0 block-3.5 inline-3.5" aria-hidden />
                            <span className="truncate">
                                {bedsLabel(values).replace(" Beds", "")}
                            </span>
                        </span>
                        <span className="inline-flex items-center justify-center gap-1 min-inline-0">
                            <Bath className="shrink-0 block-3.5 inline-3.5" aria-hidden />
                            <span className="truncate">
                                {bathsLabel(values).replace(" Baths", "")}
                            </span>
                        </span>
                        <span className="inline-flex items-center justify-center gap-1 min-inline-0">
                            <Scaling className="shrink-0 block-3.5 inline-3.5" aria-hidden />
                            <span className="truncate">
                                {areaLabel(values).replace(" Sq ft", "")}
                            </span>
                        </span>
                    </div>
                </div>
            </article>

            {stepIndex >= 2 ? (
                <article
                    className="
                      overflow-hidden rounded-card border border-border-warm bg-surface
                    "
                >
                    <div className="flex items-start justify-between gap-3 px-3.5 py-3">
                        <div className="min-inline-0">
                            <p className="text-sm font-semibold text-ink">
                                {isSale ? "Sale deal summary" : "Rent deal summary"}
                            </p>
                            <p className="mbs-0.5 text-xs text-ink-muted">Updates as you type</p>
                        </div>
                        <span
                            className="
                              inline-flex shrink-0 items-center gap-1 rounded-control bg-brand-soft
                              px-2 py-1 text-xs font-medium text-brand-text
                            "
                        >
                            <LockKeyhole className="block-3.5 inline-3.5" aria-hidden />
                            Private
                        </span>
                    </div>

                    <div className="mx-3.5 rounded-control bg-brand-soft/50 px-3.5 py-3">
                        <p className="text-xs font-medium text-brand-text">You earn</p>
                        <AnimatedMoney
                            value={money(brokerAfterSplit)}
                            className="mts-1 block text-2xl tracking-[-0.02em] text-brand"
                        />
                    </div>

                    <div className="flex flex-col gap-2 px-3.5 py-3">
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

                    <div className="border-bs border-border-warm px-2 py-1">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => void copySummary()}
                            className="
                              flex items-center justify-center gap-2 text-xs font-semibold
                              text-brand-text inline-full min-block-10
                              hover:bg-brand-soft hover:text-brand-text
                              focus-visible:ring-2 focus-visible:ring-brand
                            "
                        >
                            <Copy className="block-3.5 inline-3.5" aria-hidden /> Copy summary
                        </Button>
                    </div>
                </article>
            ) : (
                <div
                    className="
                      rounded-card border border-dashed border-brand/30 bg-brand-soft/30 px-3.5
                      py-4
                    "
                >
                    <p className="text-sm font-semibold text-ink">Live deal summary</p>
                    <p className="mbs-1 text-sm/5 text-ink-muted">
                        Add the price on Price & deal to see what you earn.
                    </p>
                </div>
            )}
        </aside>
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
                strong ? "font-bold text-ink" : "text-ink-muted",
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
                                className="text-ink-subtle hover:bg-brand-soft hover:text-brand-text"
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
            <span className="tabular whitespace-nowrap text-ink">
                {value == null ? "— — —" : `${prefix ? `${prefix} ` : ""}${formatInr(value)}`}
            </span>
        </div>
    );
}
