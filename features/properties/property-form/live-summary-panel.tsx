"use client";

import { useMemo } from "react";
import toast from "react-hot-toast";

import { Building2, Copy, FileDown, LockKeyhole } from "lucide-react";

import { calculateRentCommission, calculateSaleCommission } from "@/lib/calc/commission";
import { formatInr, formatInrCompact } from "@/lib/format/inr";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";

export function LiveSummaryPanel({
    values,
    stepIndex,
    compact = false,
}: {
    values: PropertyDraftValues;
    stepIndex: number;
    compact?: boolean;
}) {
    const isSale = values.basics.listingFor === "sell";
    const cover = values.media.photos.find((photo) => photo.isCover) ?? values.media.photos[0];
    const price = isSale ? values.sale.expectedPrice : values.rent.monthlyRent;
    const result = useMemo(() => {
        if (isSale) {
            const ownerDeductions = values.sale.otherCharges
                .filter((charge) => charge.paidBy === "owner")
                .reduce((sum, charge) => sum + (charge.amount ?? 0), 0);
            const buyerCharges =
                values.sale.otherCharges
                    .filter((charge) => charge.paidBy === "buyer")
                    .reduce((sum, charge) => sum + (charge.amount ?? 0), 0) +
                [
                    values.sale.parkingCharge,
                    values.sale.clubMembershipCharge,
                    values.sale.plcCharge,
                    values.sale.floorRiseCharge,
                    values.sale.corpusFund,
                    values.sale.legalCharge,
                ].reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
            return calculateSaleCommission({
                salePrice: values.sale.expectedPrice ?? values.sale.ownerMinimumPrice ?? 0,
                areaSqft: values.area.areaSqft,
                mode: values.commission.sale.mode,
                value: values.commission.sale.value,
                paidBy: values.commission.sale.paidBy,
                ownerSharePercent: values.commission.sale.ownerSharePercent,
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
            securityDeposit: resolveDeposit(values),
            maintenanceAmount: values.rent.maintenanceAmount ?? 0,
            maintenancePaidBy: values.rent.maintenanceMode === "extra" ? "tenant" : "owner",
            lockInMonths: values.rent.lockInMonths ?? 0,
            agreementMonths: values.rent.agreementDurationMonths ?? 11,
            escalationPercent: values.rent.rentEscalationPercent ?? 0,
            mode: values.commission.rent.mode,
            value: values.commission.rent.value,
            paidBy: values.commission.rent.paidBy,
            ownerSharePercent: values.commission.rent.ownerSharePercent,
            renewalFeeMonths: values.commission.rent.renewalFeeApplicable
                ? (values.commission.rent.renewalFeeValue ?? 0)
                : 0,
            gstApplicable: values.commission.tax.gstApplicable,
            gstMode: values.commission.tax.gstMode,
            tdsApplicable: values.commission.tax.tdsApplicable,
            tdsRate: values.commission.tax.tdsRate,
        });
    }, [isSale, values]);

    const coBrokerShare = (result.brokerRealIncome * (values.deal.coBrokerSharePercent ?? 0)) / 100;
    const brokerAfterSplit = Math.max(0, result.brokerRealIncome - coBrokerShare);
    const title = values.basics.title || "Untitled property";
    const summaryText = isSale
        ? `${title}\nSale price: ${formatInr(values.sale.expectedPrice)}\nBroker real income: ${formatInr(brokerAfterSplit)}\nOwner receives: ${formatInr("ownerNet" in result ? result.ownerNet : 0)}\nBuyer total: ${formatInr("buyerTotalCost" in result ? result.buyerTotalCost : 0)}`
        : `${title}\nMonthly rent: ${formatInr(values.rent.monthlyRent)}\nBroker real income: ${formatInr(brokerAfterSplit)}\nOwner first payout: ${formatInr("ownerFirstPayout" in result ? result.ownerFirstPayout : 0)}\nTenant move-in cost: ${formatInr("tenantMoveInCost" in result ? result.tenantMoveInCost : 0)}`;

    async function copySummary() {
        try {
            await navigator.clipboard.writeText(summaryText);
            toast.success("Deal summary copied.");
        } catch {
            toast.error("Couldn't copy the summary.");
        }
    }

    function printDealSheet() {
        const printWindow = window.open("", "_blank", "width=720,height=900");
        if (!printWindow) {
            toast.error("Allow pop-ups to print the deal sheet.");
            return;
        }
        const safeText = summaryText.replace(
            /[&<>]/g,
            (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character] ?? character,
        );
        printWindow.document.write(
            `<title>Property deal summary</title><style>body{font-family:system-ui,sans-serif;padding:48px;line-height:1.7;color:#111}h1{font-size:24px}pre{white-space:pre-wrap;font:16px/1.8 system-ui,sans-serif}</style><h1>Property deal summary</h1><pre>${safeText}</pre>`,
        );
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    if (compact) {
        return (
            <div className="flex items-center justify-between gap-4">
                <div className="min-inline-0">
                    <p className="text-xs text-surface/65">Broker earns</p>
                    <AnimatedMoney value={brokerAfterSplit} className="text-base text-surface" />
                </div>
                <p className="truncate text-xs text-surface/70">
                    {price ? formatInrCompact(price) : "Add a price to calculate"}
                </p>
            </div>
        );
    }

    return (
        <aside className="space-y-5">
            <div className="overflow-hidden rounded-card border border-border-warm bg-surface">
                <div className="relative aspect-video bg-surface-muted">
                    {cover ? (
                        <AppImage src={cover.url} alt={cover.alt || title} fill sizes="320px" />
                    ) : (
                        <div
                            className="
                              flex flex-col items-center justify-center px-6 text-center block-full
                            "
                        >
                            <Building2 className="text-ink-subtle block-7 inline-7" aria-hidden />
                            <p className="mbs-2 text-sm font-semibold text-ink">
                                Add a cover photo
                            </p>
                            <p className="mbs-1 text-xs text-ink-muted">
                                The listing preview will appear here.
                            </p>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <p className="line-clamp-2 text-base/6 font-bold text-ink">{title}</p>
                    <p className="mbs-1 text-sm text-ink-muted">
                        {[values.location.locality, values.location.city]
                            .filter(Boolean)
                            .join(", ") || "Location not added"}
                    </p>
                    <div
                        className="
                          mbs-3 flex items-end justify-between gap-3 border-bs border-border-warm
                          pbs-3
                        "
                    >
                        <div>
                            <p className="text-xs text-ink-muted">
                                {isSale ? "Asking price" : "Monthly rent"}
                            </p>
                            <p className="tabular mbs-0.5 text-lg font-bold text-brand-text">
                                {price ? formatInrCompact(price) : "— — —"}
                            </p>
                        </div>
                        <p className="tabular text-sm font-semibold text-ink">
                            {values.area.areaSqft
                                ? `${values.area.areaSqft.toLocaleString("en-IN")} sq ft`
                                : "Area not added"}
                        </p>
                    </div>
                </div>
            </div>

            {stepIndex >= 4 ? (
                <div className="overflow-hidden rounded-card bg-brand-ink text-surface">
                    <div className="p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold">
                                    {isSale ? "Sale deal" : "Rental deal"}
                                </p>
                                <p
                                    className="mbs-0.5 text-xs text-surface/60"
                                >
                                    Updates as you type
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs text-surface/60">
                                <LockKeyhole
                                    className="block-3.5 inline-3.5"
                                />{" "}
                                Private
                            </span>
                        </div>
                        <div className="mbs-5 border-y border-surface/15 py-4">
                            <p className="text-xs text-surface/60">Broker real income</p>
                            <AnimatedMoney
                                value={brokerAfterSplit}
                                className="mbs-1 text-3xl text-highlight"
                            />
                            {coBrokerShare > 0 ? (
                                <p className="mbs-2 text-xs text-surface/60">
                                    After {values.deal.coBrokerSharePercent}% co-broker split
                                </p>
                            ) : null}
                        </div>
                        <div className="space-y-2 py-4">
                            <MoneyRow
                                label={isSale ? "Commission" : "Brokerage"}
                                value={result.gross}
                                title="The agreed fee before tax treatment."
                            />
                            <MoneyRow
                                label="GST collected"
                                value={result.gst}
                                prefix="+"
                                title="GST is collected for payment to the government."
                            />
                            <MoneyRow
                                label="TDS credit"
                                value={result.tds}
                                prefix="−"
                                title="Advance tax withheld on the brokerage base."
                            />
                            <MoneyRow
                                label="Money in bank"
                                value={result.brokerReceives}
                                strong
                                title="Invoice total less TDS."
                            />
                        </div>
                        {isSale && "ownerNet" in result ? (
                            <div className="space-y-2 border-bs border-surface/15 pbs-4">
                                <MoneyRow label="Owner receives" value={result.ownerNet} strong />
                                <MoneyRow
                                    label="Buyer total"
                                    value={result.buyerTotalCost}
                                    strong
                                />
                            </div>
                        ) : "ownerFirstPayout" in result ? (
                            <div className="space-y-2 border-bs border-surface/15 pbs-4">
                                <MoneyRow
                                    label="Owner first payout"
                                    value={result.ownerFirstPayout}
                                    strong
                                />
                                <MoneyRow
                                    label="Tenant move-in"
                                    value={result.tenantMoveInCost}
                                    strong
                                />
                                {result.renewalFee > 0 ? (
                                    <MoneyRow label="Renewal fee" value={result.renewalFee} />
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                    <div className="grid grid-cols-2 border-bs border-surface/15">
                        <button
                            type="button"
                            onClick={() => void copySummary()}
                            className="
                              flex items-center justify-center gap-2 border-e border-surface/15
                              text-xs font-semibold text-surface min-block-12
                              hover:bg-surface/10
                              focus-visible:ring-2 focus-visible:ring-highlight
                            "
                        >
                            <Copy className="block-4 inline-4" /> Copy summary
                        </button>
                        <button
                            type="button"
                            onClick={printDealSheet}
                            className="
                              flex items-center justify-center gap-2 text-xs font-semibold
                              text-surface min-block-12
                              hover:bg-surface/10
                              focus-visible:ring-2 focus-visible:ring-highlight
                            "
                        >
                            <FileDown className="block-4 inline-4" /> Print deal sheet
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className="
                      rounded-card border border-dashed border-border-warm bg-surface-muted p-5
                    "
                >
                    <p className="text-sm font-bold text-ink">Live deal summary</p>
                    <p className="mbs-1 text-sm/6 text-ink-muted">
                        Add the price in step 5 to see broker income, owner proceeds, and buyer or
                        tenant cost.
                    </p>
                </div>
            )}
        </aside>
    );
}

function AnimatedMoney({ value, className }: { value: number; className?: string }) {
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
    value: number;
    prefix?: string;
    strong?: boolean;
    title?: string;
}) {
    return (
        <div
            className={cn(
                "flex items-baseline justify-between gap-4 text-xs",
                strong
                    ? `font-bold text-surface`
                    : `text-surface/70`,
            )}
            title={title}
        >
            <span>{label}</span>
            <span className="tabular whitespace-nowrap">
                {prefix ? `${prefix} ` : ""}
                {formatInr(value)}
            </span>
        </div>
    );
}

function resolveDeposit(values: PropertyDraftValues): number {
    const value = values.rent.securityDeposit ?? 0;
    return values.rent.securityDepositMode === "months_of_rent"
        ? value * (values.rent.monthlyRent ?? 0)
        : value;
}
