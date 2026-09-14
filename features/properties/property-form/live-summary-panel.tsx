"use client";

import { useMemo } from "react";
import toast from "react-hot-toast";

import { Building2, CircleHelp, Copy, FileDown, LockKeyhole } from "lucide-react";

import { calculateRentCommission, calculateSaleCommission } from "@/lib/calc/commission";
import { downloadDealSheetPdf } from "@/lib/export/deal-sheet-pdf";
import { formatInr, formatInrCompact } from "@/lib/format/inr";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
    const ownerDeductions = values.sale.otherCharges
        .filter((charge) => charge.paidBy === "owner")
        .reduce((sum, charge) => sum + (charge.amount ?? 0), 0);
    const buyerCharges =
        values.sale.otherCharges
            .filter((charge) => charge.paidBy === "buyer")
            .reduce((sum, charge) => sum + (charge.amount ?? 0), 0) +
        [
            values.sale.parkingCharge,
            values.sale.plcCharge,
            values.sale.floorRiseCharge,
        ].reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
    const deposit = resolveDeposit(values);
    const result = useMemo(() => {
        if (isSale) {
            return calculateSaleCommission({
                salePrice: values.sale.expectedPrice ?? 0,
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
            securityDeposit: deposit,
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
    }, [buyerCharges, deposit, isSale, ownerDeductions, values]);

    const hasPrice = Boolean(price && price > 0);
    const coBrokerPercent = values.deal.coBrokerSharePercent ?? 0;
    const coBrokerShare = (result.brokerRealIncome * coBrokerPercent) / 100;
    const brokerAfterSplit = Math.max(0, result.brokerRealIncome - coBrokerShare);
    const brokerBankAfterSplit = Math.max(0, result.brokerReceives * (1 - coBrokerPercent / 100));
    const tdsAfterSplit = Math.max(0, result.tdsCredit * (1 - coBrokerPercent / 100));
    const title = values.basics.title || "Untitled property";
    const money = (value: number) => (hasPrice ? value : null);
    const dealSheetLines = isSale && "ownerNet" in result
        ? [
              `Sale price: ${formatInr(values.sale.expectedPrice)}`,
              `Rate per sq ft: ${formatInr(result.effectiveRatePerSqft)}`,
              `Gross commission: ${formatInr(result.gross)}`,
              `From owner: ${formatInr(result.ownerGross)}`,
              `From buyer: ${formatInr(result.buyerGross)}`,
              `GST collected: ${formatInr(result.gst)}`,
              `TDS credit: ${formatInr(result.tdsCredit)}`,
              `Money in bank after co-broker split: ${formatInr(brokerBankAfterSplit)}`,
              `Broker real income after co-broker split: ${formatInr(brokerAfterSplit)}`,
              `Owner deductions: ${formatInr(ownerDeductions)}`,
              `Owner receives: ${formatInr(result.ownerNet)}`,
              `Buyer-side charges: ${formatInr(buyerCharges)}`,
              `Buyer total cost: ${formatInr(result.buyerTotalCost)}`,
          ]
        : "ownerFirstPayout" in result
          ? [
                `Monthly rent: ${formatInr(values.rent.monthlyRent)}`,
                `Deposit: ${formatInr(deposit)}`,
                `Yearly rent: ${formatInr(result.annualRent)}`,
                `Lease value: ${formatInr(result.leaseValue)}`,
                `Gross brokerage: ${formatInr(result.gross)}`,
                `From owner: ${formatInr(result.ownerGross)}`,
                `From tenant: ${formatInr(result.tenantGross)}`,
                `GST collected: ${formatInr(result.gst)}`,
                `TDS credit: ${formatInr(result.tdsCredit)}`,
                `Money in bank after co-broker split: ${formatInr(brokerBankAfterSplit)}`,
                `Broker real income after co-broker split: ${formatInr(brokerAfterSplit)}`,
                `Owner first payout: ${formatInr(result.ownerFirstPayout)}`,
                `Owner year 1 net: ${formatInr(result.ownerYearOneNet)}`,
                `Tenant move-in cost: ${formatInr(result.tenantMoveInCost)}`,
                `Renewal fee: ${formatInr(result.renewalFee)}`,
                `3-year potential: ${formatInr(result.threeYearEarning)}`,
            ]
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

    function downloadDealSheet() {
        const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "property"}-deal-sheet`;
        downloadDealSheetPdf({ title: `${title} — deal summary`, lines: dealSheetLines, filename });
        toast.success("PDF deal sheet downloaded.");
    }

    if (compact) {
        return (
            <div className="flex items-center justify-between gap-4">
                <div className="min-inline-0">
                    <p className="text-xs text-surface/65">Broker earns</p>
                    <AnimatedMoney value={money(brokerAfterSplit)} className="
                      text-base text-surface
                    " />
                </div>
                <p className="truncate text-xs text-surface/70">
                    {price ? formatInrCompact(price) : "Add a price to calculate"}
                </p>
            </div>
        );
    }

    return (
        <aside className="space-y-5">
            <Card className="gap-0 border border-border-warm bg-surface py-0 shadow-none">
                <div className="relative aspect-video bg-surface-muted">
                    {cover ? (
                        <AppImage src={cover.url} alt={cover.alt || title} fill sizes="320px" />
                    ) : (
                        <div className="
                          flex flex-col items-center justify-center px-6 text-center block-full
                        ">
                            <Building2 className="text-ink-subtle block-7 inline-7" aria-hidden />
                            <p className="mbs-2 text-sm font-semibold text-ink">Add a cover photo</p>
                            <p className="mbs-1 text-xs text-ink-muted">The listing preview will appear here.</p>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <p className="line-clamp-2 text-base/6 font-bold text-ink">{title}</p>
                    <p className="mbs-1 text-sm text-ink-muted">
                        {[values.location.locality, values.location.city].filter(Boolean).join(", ") || "Location not added"}
                    </p>
                    <div className="
                      mbs-3 flex items-end justify-between gap-3 border-bs border-border-warm pbs-3
                    ">
                        <div>
                            <p className="text-xs text-ink-muted">{isSale ? "Asking price" : "Monthly rent"}</p>
                            <p className="tabular mbs-0.5 text-lg font-bold text-brand-text">
                                {price ? formatInrCompact(price) : "— — —"}
                            </p>
                        </div>
                        <p className="tabular text-sm font-semibold text-ink">
                            {values.area.areaSqft ? `${values.area.areaSqft.toLocaleString("en-IN")} sq ft` : "Area not added"}
                        </p>
                    </div>
                </div>
            </Card>

            {stepIndex >= 4 ? (
                <Card className="gap-0 bg-brand-ink py-0 text-surface ring-0">
                    <div className="p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold">{isSale ? "Sale deal summary" : "Rent deal summary"}</p>
                                <p className="mbs-0.5 text-xs text-surface/60">Updates as you type</p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs text-surface/60">
                                <LockKeyhole className="block-3.5 inline-3.5" /> Private
                            </span>
                        </div>

                        <SectionLabel>Property value</SectionLabel>
                        {isSale && "ownerNet" in result ? (
                            <>
                                <MoneyRow label="Sale price" value={values.sale.expectedPrice} title="The current asking price." />
                                <MoneyRow label="Rate per sq ft" value={money(result.effectiveRatePerSqft)} title="Sale price divided by normalised area." />
                            </>
                        ) : "ownerFirstPayout" in result ? (
                            <>
                                <MoneyRow label="Monthly rent" value={values.rent.monthlyRent} title="The agreed monthly asking rent." />
                                <MoneyRow label="Deposit" value={money(deposit)} title="The security deposit in rupees." />
                                <MoneyRow label="Yearly rent" value={money(result.annualRent)} title="Monthly rent multiplied by 12." />
                                <MoneyRow label="Lease value" value={money(result.leaseValue)} title="Rent across the agreement, including entered escalation." />
                            </>
                        ) : null}

                        <SectionLabel>Broker earns</SectionLabel>
                        <AnimatedMoney value={money(brokerAfterSplit)} className="
                          mbe-3 block text-3xl text-highlight
                        " />
                        <MoneyRow label={isSale ? "Gross commission" : "Gross brokerage"} value={money(result.gross)} title="The agreed fee before GST, TDS, or co-broker sharing." />
                        <MoneyRow label="From owner" value={money(result.ownerGross)} title="The owner's share of the brokerage base." />
                        <MoneyRow label={isSale ? "From buyer" : "From tenant"} value={money(isSale && "buyerGross" in result ? result.buyerGross : "tenantGross" in result ? result.tenantGross : 0)} title="The other party's share of the brokerage base." />
                        <MoneyRow label="GST collected" value={money(result.gst)} prefix="+" title="GST collected for payment to the government." />
                        <MoneyRow label="TDS credit" value={money(result.tds)} prefix="−" title="Advance tax withheld on brokerage excluding GST." />
                        <MoneyRow label="Money in bank" value={money(brokerBankAfterSplit)} strong title="Invoice receipt after TDS and the co-broker split." />
                        <MoneyRow label="Real income" value={money(brokerAfterSplit)} strong title="Brokerage excluding GST after the co-broker split." />
                        <MoneyRow label="TDS claimable" value={money(tdsAfterSplit)} title="TDS credit available for the broker's tax return." />
                        {coBrokerShare > 0 ? (
                            <MoneyRow label={`Co-broker share (${coBrokerPercent}%)`} value={money(coBrokerShare)} title="The amount assigned to the selected co-broker." />
                        ) : null}

                        {isSale && "ownerNet" in result ? (
                            <>
                                <SectionLabel>Owner gets</SectionLabel>
                                <MoneyRow label="Sale price" value={values.sale.expectedPrice} title="The agreed property sale price." />
                                <MoneyRow label="Commission + GST" value={money(result.ownerPays)} prefix="−" title="The owner's invoice share including GST." />
                                <MoneyRow label="Other deductions" value={money(ownerDeductions)} prefix="−" title="Other sale charges marked as owner-paid." />
                                <MoneyRow label="Owner receives" value={money(result.ownerNet)} strong title="Sale price after owner brokerage and deductions." />
                                <SectionLabel>Buyer pays</SectionLabel>
                                <MoneyRow label="Sale price" value={values.sale.expectedPrice} title="The agreed property sale price." />
                                <MoneyRow label="Commission + GST" value={money(result.buyerPays)} prefix="+" title="The buyer's invoice share including GST." />
                                <MoneyRow label="Other charges" value={money(buyerCharges)} prefix="+" title="Entered sale charges marked as buyer-paid." />
                                <MoneyRow label="Buyer total" value={money(result.buyerTotalCost)} strong title="Sale price plus buyer brokerage and entered charges." />
                            </>
                        ) : "ownerFirstPayout" in result ? (
                            <>
                                <SectionLabel>Owner gets</SectionLabel>
                                <MoneyRow label="First payout" value={money(result.ownerFirstPayout)} title="Deposit plus first rent, less owner brokerage." />
                                <MoneyRow label="Owner brokerage" value={money(result.ownerPays)} prefix="−" title="The owner's invoice share including GST." />
                                <MoneyRow label="Year 1 net" value={money(result.ownerYearOneNet)} strong title="First-year rent after owner brokerage and owner-paid maintenance." />
                                <MoneyRow label="Lease net" value={money(result.ownerLeaseNet)} title="Lease value after the owner's brokerage share." />
                                <SectionLabel>Tenant pays on day 1</SectionLabel>
                                <MoneyRow label="Deposit" value={money(deposit)} title="The entered security deposit." />
                                <MoneyRow label="First month rent" value={values.rent.monthlyRent} title="The first month's asking rent." />
                                <MoneyRow label="Brokerage + GST" value={money(result.tenantPays)} title="The tenant's invoice share including GST." />
                                <MoneyRow label="Move-in cost" value={money(result.tenantMoveInCost)} strong title="Deposit, first rent, tenant brokerage, and tenant-paid maintenance." />
                                {result.renewalFee > 0 ? <MoneyRow label="Renewal fee" value={money(result.renewalFee)} title="Expected fee each time the lease renews." /> : null}
                                <MoneyRow label="3-year potential" value={money(result.threeYearEarning)} title="Current brokerage plus two entered renewal fees." />
                            </>
                        ) : null}
                    </div>
                    <div className="grid grid-cols-2 border-bs border-surface/15">
                        <Button type="button" variant="ghost" onClick={() => void copySummary()} className="
                          flex items-center justify-center gap-2 border-e border-surface/15 text-xs
                          font-semibold text-surface min-block-12
                          hover:bg-surface/10 hover:text-surface
                          focus-visible:ring-2 focus-visible:ring-highlight
                        ">
                            <Copy className="block-4 inline-4" /> Copy summary
                        </Button>
                        <Button type="button" variant="ghost" onClick={downloadDealSheet} className="
                          flex items-center justify-center gap-2 text-xs font-semibold text-surface
                          min-block-12
                          hover:bg-surface/10 hover:text-surface
                          focus-visible:ring-2 focus-visible:ring-highlight
                        ">
                            <FileDown className="block-4 inline-4" /> Download PDF
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card className="
                  rounded-card border border-dashed border-border-warm bg-surface-muted p-5
                  shadow-none
                ">
                    <p className="text-sm font-bold text-ink">Live deal summary</p>
                    <p className="mbs-1 text-sm/6 text-ink-muted">Add the price in step 5 to see broker income, owner proceeds, and buyer or tenant cost.</p>
                </Card>
            )}
        </aside>
    );
}

function SectionLabel({ children }: { children: string }) {
    return <p className="
      mbs-5 mbe-2 border-bs border-surface/15 pbs-4 text-[11px] font-bold tracking-[0.12em]
      text-surface/55 uppercase
    ">{children}</p>;
}

function AnimatedMoney({ value, className }: { value: number | null; className?: string }) {
    const text = formatInr(value);
    return (
        <span key={text} className={cn("t-digit-group is-animating tabular font-bold", className)}>
            {text.split("").map((character, index) => (
                <span key={`${character}-${index}`} className="t-digit" data-stagger={index === text.length - 2 ? "1" : index === text.length - 1 ? "2" : undefined}>
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
        <div className={cn("flex items-baseline justify-between gap-4 py-1 text-xs", strong ? `
          font-bold text-surface
        ` : `text-surface/70`)}>
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

function resolveDeposit(values: PropertyDraftValues): number {
    const value = values.rent.securityDeposit ?? 0;
    return values.rent.securityDepositMode === "months_of_rent"
        ? value * (values.rent.monthlyRent ?? 0)
        : value;
}
