"use client";
import { type MutableRefObject, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

import { calculateRentCommission, calculateSaleCommission } from "@/lib/calc/commission";
import { formatMoney, formatMoneyCompact } from "@/lib/format/money";
import { formatPropertyCardArea, formatPropertyTypeDisplay } from "@/lib/format/property-card-name";
import { buildBasicsSuggestedTitle } from "@/lib/format/property-title";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";
import { derive } from "@/lib/visibility/derive";
import { FIELD_RULES } from "@/lib/visibility/rules";

import { AppImage } from "@/components/shared/app-image";
import toast from "@/components/shared/app-toast";
import { AttachedClientsSummary } from "@/components/shared/attached-clients-summary";
import { IconButton } from "@/components/shared/icon-button";
import {
    BadgePercent,
    Check,
    CircleHelp,
    Copy,
    ImageIcon,
    List,
    LockKeyhole,
    MapPin,
    MoreHorizontal,
    RefreshCw,
    Upload,
    X,
} from "@/components/shared/icons";
import { OVERLAY_ICON_BUTTON_COLORS } from "@/components/shared/overlay-card";
import { ListingAskPrices } from "@/components/shared/price-with-commission";
import { PropertyOwnerContactActions } from "@/components/shared/property-owner-contact-actions";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";

import { BEDROOM_OPTIONS } from "@/constants/property";
import {
    normalizePhotoOrder,
    removeCoverPhoto,
    replaceCoverPhoto,
} from "@/features/properties/property-form/cover-photo";

import styles from "./live-summary-panel.module.css";
import cardStyles from "@/components/shared/property-card.module.css";

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

export function LiveSummaryPanel({
    audience = "broker",
    values,
    stepIndex,
    compact = false,
    onGoToMedia,
    photoFilesRef,
}: {
    audience?: "owner" | "broker";
    values: PropertyDraftValues;
    stepIndex: number;
    compact?: boolean;
    onGoToMedia?: () => void;
    photoFilesRef?: MutableRefObject<Map<string, File>>;
}) {
    const { setValue, getValues } = useFormContext<PropertyDraftValues>();
    const coverInputRef = useRef<HTMLInputElement>(null);
    const [copiedSummary, setCopiedSummary] = useState<string | null>(null);
    const flags = derive(values);
    const showBedrooms = FIELD_RULES["details.bedrooms"].visible(flags);
    const showBathrooms = FIELD_RULES["details.bathrooms"].visible(flags);
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
                value: values.commission.sale.value ?? 0,
                paidBy: "owner",
                ownerSharePercent: 100,
                separateRates: values.commission.sale.separateRates
                    ? {
                          ownerPercent: values.commission.sale.ownerPercent ?? 0,
                          buyerPercent: values.commission.sale.buyerPercent ?? 0,
                      }
                    : undefined,
                gstApplicable: false,
                gstMode: values.commission.tax.gstMode,
                tdsApplicable: false,
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
            value: values.commission.rent.value ?? 0,
            paidBy: "owner",
            ownerSharePercent: 100,
            renewalFeeMonths: values.commission.rent.renewalFeeApplicable
                ? (values.commission.rent.renewalFeeValue ?? 0)
                : 0,
            gstApplicable: false,
            gstMode: values.commission.tax.gstMode,
            tdsApplicable: false,
            tdsRate: values.commission.tax.tdsRate,
        });
    }, [buyerCharges, deposit, isSale, ownerDeductions, values]);

    const hasPrice = Boolean(price && price > 0);
    const previewPricing = {
        saleAmountInr: isSale ? values.sale.expectedPrice : null,
        rentAmountInr: values.basics.listingFor !== "sell" ? values.rent.monthlyRent : null,
        commissionPercent: "commissionAsPercent" in result ? result.commissionAsPercent : null,
        commissionAmount: values.commission.rent.value,
    };
    const hasPreviewPrice = Boolean(
        (previewPricing.saleAmountInr ?? 0) > 0 || (previewPricing.rentAmountInr ?? 0) > 0,
    );
    const ownerName = values.owner.name.trim();
    const hasClients = values.attachedBuyers.length > 0;
    const showDealBreakdown = stepIndex >= 2 && hasPrice;
    const coBrokerPercent = values.deal.coBrokerSharePercent ?? 0;
    const coBrokerShare = (result.brokerRealIncome * coBrokerPercent) / 100;
    const brokerAfterSplit = Math.max(0, result.brokerRealIncome - coBrokerShare);
    const title = draftTitle(values);
    const bedroomLabel = BEDROOM_OPTIONS.find(
        (option) => option.value === values.details.bedrooms,
    )?.label;
    const cardHeadline = [
        formatPropertyTypeDisplay(values.basics.propertyType),
        showBedrooms ? bedroomLabel : null,
        showBathrooms && values.details.bathrooms ? `${values.details.bathrooms} Bath` : null,
        values.area.areaSqft ? formatPropertyCardArea(values.area.areaSqft) : null,
    ]
        .filter(Boolean)
        .join(" · ");
    const locationLabel =
        [values.location.locality, values.location.city].filter(Boolean).join(", ") ||
        "Location not added";
    const money = (value: number) => (hasPrice ? value : null);
    const dealSheetLines =
        isSale && "ownerNet" in result
            ? [
                  `Sale price: ${formatMoney(values.sale.expectedPrice)}`,
                  values.area.areaSqft
                      ? `Rate per sq ft: ${formatMoney(result.effectiveRatePerSqft)}`
                      : null,
                  `Gross commission: ${formatMoney(result.gross)}`,
                  coBrokerShare > 0
                      ? `Co-broker (${coBrokerPercent}%): ${formatMoney(coBrokerShare)}`
                      : null,
                  `Estimated commission: ${formatMoney(brokerAfterSplit)}`,
              ].filter((line): line is string => Boolean(line))
            : "ownerFirstPayout" in result
              ? [
                    `Monthly rent: ${formatMoney(values.rent.monthlyRent)}`,
                    deposit > 0 ? `Deposit: ${formatMoney(deposit)}` : null,
                    `Gross brokerage: ${formatMoney(result.gross)}`,
                    coBrokerShare > 0
                        ? `Co-broker (${coBrokerPercent}%): ${formatMoney(coBrokerShare)}`
                        : null,
                    `Estimated commission: ${formatMoney(brokerAfterSplit)}`,
                ].filter((line): line is string => Boolean(line))
              : [];
    const summaryText = [title, ...dealSheetLines, "Before applicable taxes and deductions."].join(
        "\n",
    );

    async function copySummary() {
        try {
            await navigator.clipboard.writeText(summaryText);
            setCopiedSummary(summaryText);
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
                    <p className="text-xs text-ink-muted">Estimated commission</p>
                    <AnimatedMoney
                        value={money(brokerAfterSplit)}
                        className="text-base text-brand-text"
                    />
                    <p className="text-xs text-ink-muted">
                        Before applicable taxes and deductions.
                    </p>
                </div>
                <p className="truncate text-xs text-ink-muted">
                    {price ? formatMoneyCompact(price) : "Add a price to calculate"}
                </p>
            </div>
        );
    }

    return (
        <aside
            className="flex flex-col gap-4 min-inline-0"
            aria-label="Property preview and deal summary"
        >
            <article
                className={cn(
                    "overflow-hidden rounded-card bg-surface shadow-md min-inline-0",
                    cardStyles.ownedCard,
                    styles.previewCard,
                )}
            >
                <h2 className="sr-only">Listing preview</h2>
                {photoFilesRef ? (
                    <input
                        ref={coverInputRef}
                        type="file"
                        aria-label="Upload listing cover photo"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        className="sr-only"
                        onChange={(event) => {
                            void handleReplaceCover(event.target.files?.[0]);
                            event.currentTarget.value = "";
                        }}
                    />
                ) : null}
                <div
                    className={cn(
                        "relative overflow-hidden min-inline-0",
                        cover?.url
                            ? "aspect-4/3 bg-surface-muted"
                            : "mx-3 mbs-3 rounded-inner border-2 border-dashed border-brand/35 bg-brand-soft/40",
                    )}
                >
                    <div className="absolute inset-s-3 inset-bs-3 z-10 flex flex-wrap gap-1.5 pe-14">
                        {isSale ? (
                            <Badge color="emerald" blur={cover?.url ? "dark" : false}>
                                For sale
                            </Badge>
                        ) : null}
                        {values.basics.listingFor !== "sell" ? (
                            <Badge color="orange" blur={cover?.url ? "dark" : false}>
                                {values.basics.listingFor === "lease"
                                    ? "For lease"
                                    : values.basics.listingFor === "pg"
                                      ? "PG"
                                      : "For rent"}
                            </Badge>
                        ) : null}
                    </div>
                    {cover?.url && photoFilesRef ? (
                        <div className="absolute inset-e-3 inset-bs-3 z-20">
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <IconButton
                                            type="button"
                                            size="sm"
                                            appearance="inverse"
                                            style={OVERLAY_ICON_BUTTON_COLORS}
                                            aria-label="Cover photo options"
                                        />
                                    }
                                >
                                    <MoreHorizontal aria-hidden />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => coverInputRef.current?.click()}
                                    >
                                        <RefreshCw aria-hidden /> Replace cover
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleRemoveCover}>
                                        <X aria-hidden /> Remove cover
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : null}
                    {cover?.url ? (
                        <AppImage
                            src={cover.url}
                            alt={cover.alt || title}
                            fill
                            sizes="(max-width: 1279px) 100vw, 320px"
                            className="object-cover"
                            unoptimized={/^(blob:|https?:)/.test(cover.url)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-4 px-5 pbs-12 pbe-6 text-center min-block-60 min-inline-0">
                            <div className="flex flex-col items-center gap-3">
                                <span className="flex items-center justify-center rounded-full border-2 border-dashed border-brand/35 text-brand block-12 inline-12">
                                    <ImageIcon
                                        className="block-6 inline-6"
                                        strokeWidth={1.5}
                                        aria-hidden
                                    />
                                </span>
                                <p className="text-sm/5 font-semibold text-ink">
                                    Add a cover photo
                                </p>
                                <p className="body-xs text-ink-muted">
                                    Help people recognise your property.
                                </p>
                            </div>
                            {photoFilesRef || onGoToMedia ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 border-brand/25 bg-surface text-brand-text hover:border-brand/50 hover:bg-surface"
                                    onClick={() =>
                                        photoFilesRef
                                            ? coverInputRef.current?.click()
                                            : onGoToMedia?.()
                                    }
                                >
                                    <Upload className="block-4 inline-4" aria-hidden /> Add cover
                                    photo
                                </Button>
                            ) : null}
                        </div>
                    )}
                </div>
                <div className={cn("flex flex-col", cardStyles.panel)}>
                    <div className="flex items-center gap-2">
                        <span className="body-sm text-ink-muted">Status</span>
                        <Badge color="stone">Draft</Badge>
                    </div>
                    <div className="flex flex-col gap-2 min-inline-0">
                        {hasPreviewPrice ? (
                            <div className={cardStyles.prices}>
                                <ListingAskPrices listing={previewPricing} audience={audience} />
                            </div>
                        ) : (
                            <p className="h5 font-semibold tracking-wide text-brand">
                                Price not set
                            </p>
                        )}
                        <h3 className="body font-semibold tracking-wide wrap-break-word text-ink">
                            {cardHeadline || title}
                        </h3>
                        <p className="body-sm flex items-start gap-1.5 tracking-wide text-ink-muted">
                            <MapPin className="mbs-0.5 shrink-0 block-3.5 inline-3.5" aria-hidden />
                            <span className="wrap-break-word min-inline-0">{locationLabel}</span>
                        </p>
                    </div>
                    {audience === "broker" ? (
                        <div className="flex flex-col gap-2 border-bs border-border-warm pbs-3 min-inline-0">
                            <div
                                className={cn(
                                    "body-sm rounded-control border border-dashed border-brand/40 font-semibold text-brand-text",
                                    cardStyles.ownerRow,
                                    styles.peopleRow,
                                )}
                            >
                                <span className="shrink-0 text-ink-muted">Owner</span>
                                {ownerName ? (
                                    <span className={cardStyles.person}>
                                        <UserAvatar name={ownerName} size="2xs" framed={false} />
                                        <span className={cn(cardStyles.personName, styles.name)}>
                                            {ownerName}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="font-normal text-ink-muted">Not attached</span>
                                )}
                            </div>
                            <div
                                className={cn(
                                    "rounded-control border border-dashed border-brand/40",
                                    cardStyles.clientsRow,
                                )}
                            >
                                {hasClients ? (
                                    <span
                                        aria-hidden
                                        className={cn(
                                            "flex items-center justify-center text-brand-text",
                                            cardStyles.pipelineButton,
                                        )}
                                    >
                                        <List className="block-4 inline-4" />
                                    </span>
                                ) : null}
                                <div
                                    className={cn(
                                        "body-sm",
                                        cardStyles.clientButton,
                                        styles.peopleRow,
                                        !hasClients && styles.emptyClients,
                                    )}
                                >
                                    <span className="shrink-0 font-semibold text-ink-muted">
                                        Clients
                                    </span>
                                    {hasClients ? (
                                        <AttachedClientsSummary
                                            clients={values.attachedBuyers}
                                            maxAvatars={3}
                                            className={cn(cardStyles.clientSummary, styles.summary)}
                                            labelClassName={cn(
                                                "text-brand-text",
                                                cardStyles.clientName,
                                                styles.name,
                                            )}
                                            interactive={false}
                                        />
                                    ) : (
                                        <span className="text-ink-muted">None attached</span>
                                    )}
                                </div>
                            </div>
                            {ownerName ? (
                                <TooltipProvider>
                                    <PropertyOwnerContactActions
                                        ownerName={ownerName}
                                        ownerPhoneDigits={values.owner.phone}
                                    />
                                </TooltipProvider>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </article>

            <article
                className={cn(
                    "overflow-hidden rounded-card bg-surface min-inline-0",
                    showDealBreakdown ? "shadow-md" : "border border-border-warm",
                )}
            >
                <header className="flex items-start justify-between gap-2 px-4 pbs-4">
                    <div className="min-inline-0">
                        <h2 className="text-sm font-semibold text-ink">
                            {isSale ? "Sale deal summary" : "Rent deal summary"}
                        </h2>
                        <p className="mbs-1 text-xs/5 text-ink-muted">Updates as you type</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-control bg-surface-muted px-2 py-1 text-xs font-medium text-ink-muted">
                        <LockKeyhole className="block-3.5 inline-3.5" aria-hidden /> Private
                    </span>
                </header>
                {showDealBreakdown ? (
                    <>
                        <div className="px-4 py-3">
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
                        <div className="border-bs border-border-warm bg-surface p-4">
                            <p className="text-xs font-medium text-ink-muted">
                                Estimated commission
                            </p>
                            <AnimatedMoney
                                value={money(brokerAfterSplit)}
                                className="mbs-1 block text-3xl tracking-[-0.02em] text-brand-text"
                            />
                            <p className="mbs-2 text-xs/5 text-ink-muted">
                                Before applicable taxes and deductions.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={!hasPrice}
                                onClick={() => void copySummary()}
                                className="mbs-4 gap-2 inline-full min-block-11"
                            >
                                {copiedSummary === summaryText ? (
                                    <Check className="block-4 inline-4" aria-hidden />
                                ) : (
                                    <Copy className="block-4 inline-4" aria-hidden />
                                )}
                                <span role="status">
                                    {copiedSummary === summaryText
                                        ? "Summary copied"
                                        : "Copy deal summary"}
                                </span>
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3 px-5 py-6 text-center">
                        <span className="flex items-center justify-center rounded-full border border-brand/20 bg-brand-soft text-brand-text block-12 inline-12">
                            <BadgePercent className="block-6 inline-6" aria-hidden />
                        </span>
                        <div className="flex flex-col gap-1.5 max-inline-64">
                            <p className="text-sm font-semibold text-ink">
                                {audience === "owner"
                                    ? "Broker commission estimate"
                                    : "Your commission estimate"}
                            </p>
                            <p className="text-xs/5 text-ink-muted">
                                Add the price and commission in{" "}
                                <span className="font-semibold text-ink">Price &amp; deal</span>
                                {audience === "owner"
                                    ? " to see the broker's estimated fee."
                                    : " to see your estimated earnings."}
                            </p>
                        </div>
                    </div>
                )}
            </article>
        </aside>
    );
}

function AnimatedMoney({ value, className }: { value: number | null; className?: string }) {
    const text = formatMoney(value);
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
                "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs min-block-11",
                strong ? "font-bold text-ink" : "text-ink-muted",
            )}
        >
            <span className="flex items-center gap-1 min-inline-0">
                {label}
                <Popover>
                    <PopoverTrigger
                        render={
                            <IconButton
                                type="button"
                                size="sm"
                                appearance="ghost"
                                color="var(--color-ink-subtle)"
                                aria-label={`Explain ${label}`}
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
                {value == null ? "— — —" : `${prefix ? `${prefix} ` : ""}${formatMoney(value)}`}
            </span>
        </div>
    );
}
