"use client";

import { useFormContext } from "react-hook-form";

import { calculateRentCommission, calculateSaleCommission } from "@/lib/calc/commission";
import { formatMoney } from "@/lib/format/money";
import {
    OWNER_SALE_COMMISSION_MAX,
    OWNER_SALE_COMMISSION_MIN,
    type PropertyDraftValues,
} from "@/lib/schemas/property";
import { cn } from "@/lib/utils";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { BadgePercent } from "@/components/shared/icons";

import {
    CurrencyField,
    FORM_SECTIONS_CLASS,
    NumberField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepCommission({ portal = "broker" }: { portal?: "broker" | "owner" }) {
    const { watch } = useFormContext<PropertyDraftValues>();
    const values = watch();
    const { derived } = useFieldRules();
    const isOwner = portal === "owner";
    const showSale = derived.isSell;
    const showRent = derived.isRentLike;
    const expectedPrice = values.sale.expectedPrice ?? 0;
    const areaSqft = values.area.areaSqft;
    const pricePerSqft = values.sale.pricePerSqft;
    const monthlyRent = values.rent.monthlyRent ?? 0;
    const salePercent = values.commission.sale.value ?? 0;
    const rentAmount = values.commission.rent.value ?? 0;

    const saleResult = calculateSaleCommission({
        salePrice: expectedPrice,
        areaSqft,
        mode: "percent",
        value: salePercent,
        paidBy: "owner",
        ownerSharePercent: 100,
        gstApplicable: false,
        gstMode: values.commission.tax.gstMode,
        tdsApplicable: false,
        tdsRate: values.commission.tax.tdsRate,
    });
    const rentResult = calculateRentCommission({
        monthlyRent,
        securityDeposit: resolveDeposit(values),
        maintenanceAmount: values.rent.maintenanceAmount ?? 0,
        maintenancePaidBy: "tenant",
        lockInMonths: values.rent.lockInMonths ?? 0,
        agreementMonths: values.rent.agreementDurationMonths ?? 11,
        escalationPercent: values.rent.rentEscalationPercent ?? 0,
        mode: "flat",
        value: rentAmount,
        paidBy: "owner",
        ownerSharePercent: 100,
        gstApplicable: false,
        gstMode: values.commission.tax.gstMode,
        tdsApplicable: false,
        tdsRate: values.commission.tax.tdsRate,
    });

    // For "both", lead with sale income; rent-only uses rent figures.
    const result =
        showSale && !showRent ? saleResult : showRent && !showSale ? rentResult : saleResult;
    const primaryIsSale = showSale && (!showRent || values.basics.listingFor === "both");
    const hasBasis = primaryIsSale ? expectedPrice > 0 : monthlyRent > 0;
    const earned = result.gross > 0 || hasBasis;
    const ratePerSqft =
        pricePerSqft != null && pricePerSqft > 0
            ? pricePerSqft
            : primaryIsSale && "effectiveRatePerSqft" in result
              ? result.effectiveRatePerSqft
              : 0;

    const commissionLabel = primaryIsSale
        ? `Commission at ${salePercent}%`
        : `Brokerage · ${formatMoney(rentAmount)}`;
    const allInPrice =
        expectedPrice +
        (values.sale.plcCharge ?? 0) +
        (values.sale.floorRiseCharge ?? 0) +
        (values.sale.maintenanceCharge ?? 0);
    const coBrokerPercent = values.deal.coBrokerSharePercent ?? 0;
    const coBrokerShare = (result.gross * coBrokerPercent) / 100;
    const estimatedCommission = isOwner ? result.gross : Math.max(0, result.gross - coBrokerShare);

    return (
        <div className={FORM_SECTIONS_CLASS}>
            <WizardSection
                title={
                    <>
                        {showSale && showRent
                            ? "Broker commission"
                            : showSale
                              ? "Sale commission"
                              : "Rental brokerage"}
                    </>
                }
                description={
                    isOwner
                        ? "Required. The commission you will pay the broker who closes this deal. Brokers see it on your listing."
                        : "Record the agreed fee. Sale uses a percent; rent uses a fixed amount. Broker-only."
                }
                tone={isOwner ? undefined : "private"}
            >
                <div className="grid gap-4 md:grid-cols-2">
                    {showSale ? (
                        <NumberField
                            name="commission.sale.value"
                            label="Sale commission (%)"
                            step={0.1}
                            min={OWNER_SALE_COMMISSION_MIN}
                            max={OWNER_SALE_COMMISSION_MAX}
                            placeholder="e.g. 2"
                            visibility={isOwner ? "public" : "private"}
                            startIcon={BadgePercent}
                            hint={
                                isOwner
                                    ? `Percent of the sale price. Between ${OWNER_SALE_COMMISSION_MIN}% and ${OWNER_SALE_COMMISSION_MAX}%.`
                                    : `Percent of the sale price, charged to the owner. Between ${OWNER_SALE_COMMISSION_MIN}% and ${OWNER_SALE_COMMISSION_MAX}%.`
                            }
                        />
                    ) : null}
                    {showRent ? (
                        <CurrencyField
                            name="commission.rent.value"
                            label="Rent commission"
                            placeholder="e.g. 25,000 (0 for none)"
                            allowZero
                            visibility={isOwner ? "public" : "private"}
                            hint={
                                isOwner
                                    ? "Fixed amount you pay the broker. For no commission, enter 0."
                                    : "Fixed amount charged to the owner. For no commission, enter 0."
                            }
                        />
                    ) : null}
                </div>
            </WizardSection>

            <WizardSection
                title="Commission summary"
                description={
                    isOwner
                        ? "Estimated fee paid to the broker who closes the deal."
                        : "Live estimate from the rate above. Broker-only."
                }
            >
                {earned ? (
                    <div
                        className="
                          overflow-hidden rounded-card border border-border-warm bg-surface
                        "
                    >
                        <div
                            className={cn(
                                "grid grid-cols-2 gap-x-6 gap-y-4 p-5",
                                primaryIsSale ? "lg:grid-cols-4" : "sm:grid-cols-3",
                            )}
                        >
                            <IncomeFact
                                label={primaryIsSale ? "Property price" : "Monthly rent"}
                                value={formatMoney(primaryIsSale ? expectedPrice : monthlyRent)}
                            />
                            <IncomeFact
                                label="Area"
                                value={
                                    areaSqft > 0
                                        ? `${areaSqft.toLocaleString("en-IN")} sq ft`
                                        : "Area not added"
                                }
                            />
                            <IncomeFact
                                label={primaryIsSale ? "Per sq ft" : "Yearly rent"}
                                value={
                                    primaryIsSale
                                        ? ratePerSqft > 0
                                            ? formatMoney(ratePerSqft)
                                            : "— — —"
                                        : formatMoney(rentResult.annualRent)
                                }
                            />
                            {primaryIsSale ? (
                                <IncomeFact label="All-in price" value={formatMoney(allInPrice)} />
                            ) : null}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 border-bs border-border-warm bg-surface p-5">
                            <div className="min-inline-0">
                                <p className="text-sm font-medium text-brand-text">
                                    Estimated commission
                                </p>
                                <p className="mbs-2 text-sm text-ink">
                                    {commissionLabel}
                                    {!isOwner && coBrokerShare > 0
                                        ? ` · After ${coBrokerPercent}% co-broker share`
                                        : ""}
                                </p>
                                <p className="mbs-1 text-xs text-ink-muted">
                                    Before applicable taxes and deductions.
                                </p>
                            </div>
                            <p className="tabular ms-auto text-2xl font-bold tracking-tight text-brand-text">
                                {formatMoney(estimatedCommission)}
                            </p>
                        </div>

                        {showSale && showRent ? (
                            <dl className="border-bs border-border-warm px-5 py-2">
                                <IncomeRow
                                    label={`Rent brokerage · ${formatMoney(rentAmount)}`}
                                    value={formatMoney(rentResult.gross)}
                                    muted
                                />
                            </dl>
                        ) : null}
                    </div>
                ) : (
                    <p
                        className="
                          rounded-card border border-border-warm bg-surface p-5 text-sm
                          text-ink-muted
                        "
                    >
                        {isOwner
                            ? "Add the price above to see the broker commission."
                            : showSale
                              ? "Add the expected price above to see what you earn."
                              : "Add the monthly rent above to see what you earn."}
                    </p>
                )}
            </WizardSection>
        </div>
    );
}

function IncomeFact({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-inline-0">
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="tabular mbs-1 text-base font-semibold wrap-break-word text-ink">
                {value}
            </p>
        </div>
    );
}

function IncomeRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
    return (
        <div
            className="
              flex items-start justify-between gap-4 border-bs border-border-warm py-3
              first:border-bs-0
            "
        >
            <dt className={cn("text-sm", muted ? "text-ink-muted" : "text-ink")}>{label}</dt>
            <dd className="tabular text-sm font-semibold text-ink">{value}</dd>
        </div>
    );
}

function resolveDeposit(values: PropertyDraftValues): number {
    const value = values.rent.securityDeposit ?? 0;
    return values.rent.securityDepositMode === "months_of_rent"
        ? value * (values.rent.monthlyRent ?? 0)
        : value;
}
