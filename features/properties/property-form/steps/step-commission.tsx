"use client";

import { useFormContext } from "react-hook-form";

import { BadgePercent, Wallet } from "lucide-react";

import { calculateRentCommission, calculateSaleCommission } from "@/lib/calc/commission";
import { formatInr } from "@/lib/format/inr";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import {
    FORM_SECTIONS_CLASS,
    NumberField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepCommission() {
    const { watch } = useFormContext<PropertyDraftValues>();
    const values = watch();
    const { derived } = useFieldRules();
    const isSale = derived.isSell;
    const expectedPrice = values.sale.expectedPrice ?? 0;
    const areaSqft = values.area.areaSqft;
    const pricePerSqft = values.sale.pricePerSqft;
    const monthlyRent = values.rent.monthlyRent ?? 0;

    const saleResult = calculateSaleCommission({
        salePrice: expectedPrice,
        areaSqft,
        mode: "percent",
        value: values.commission.sale.value,
        // The owner pays the whole brokerage; nothing is charged to the buyer.
        paidBy: "owner",
        ownerSharePercent: 100,
        gstApplicable: values.commission.tax.gstApplicable,
        gstMode: values.commission.tax.gstMode,
        tdsApplicable: values.commission.tax.tdsApplicable,
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
        mode: values.commission.rent.mode,
        value: values.commission.rent.value,
        // The owner pays the whole brokerage; nothing is charged to the tenant.
        paidBy: "owner",
        ownerSharePercent: 100,
        gstApplicable: values.commission.tax.gstApplicable,
        gstMode: values.commission.tax.gstMode,
        tdsApplicable: values.commission.tax.tdsApplicable,
        tdsRate: values.commission.tax.tdsRate,
    });
    const result = isSale ? saleResult : rentResult;
    const hasBasis = isSale ? expectedPrice > 0 : monthlyRent > 0;
    const earned = result.gross > 0 || hasBasis;
    const ratePerSqft =
        pricePerSqft != null && pricePerSqft > 0
            ? pricePerSqft
            : isSale && "effectiveRatePerSqft" in result
              ? result.effectiveRatePerSqft
              : 0;

    return (
        <div className={FORM_SECTIONS_CLASS}>
            <WizardSection
                title={
                    <>
                        <BadgePercent
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        {isSale ? "Sale commission" : "Rental brokerage"}
                    </>
                }
                description="Record the agreed fee and who pays it. These terms stay in the broker file."
                tone="private"
            >
                {isSale ? (
                    <NumberField
                        name="commission.sale.value"
                        label="Commission (%)"
                        step={0.1}
                        max={10}
                        placeholder="e.g. 2"
                        visibility="private"
                        startIcon={BadgePercent}
                        hint="Charged to the owner on the sale price."
                    />
                ) : (
                    <NumberField
                        name="commission.rent.value"
                        label="Months of rent"
                        step={0.25}
                        placeholder="e.g. 1"
                        visibility="private"
                        startIcon={BadgePercent}
                        hint="Charged to the owner."
                    />
                )}
            </WizardSection>

            <WizardSection
                title={
                    <>
                        <Wallet
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Broker income
                    </>
                }
                description="Updates as you change the rate above."
                tone="private"
            >
                {earned ? (
                    <div
                        className="
                          overflow-hidden rounded-control border border-border-warm bg-surface
                        "
                    >
                        <div className="grid border-be border-border-warm sm:grid-cols-3">
                            <SummaryFact
                                label={isSale ? "Property price" : "Monthly rent"}
                                value={formatInr(isSale ? expectedPrice : monthlyRent)}
                            />
                            <SummaryFact
                                label="Area"
                                value={
                                    areaSqft > 0
                                        ? `${areaSqft.toLocaleString("en-IN")} sq ft`
                                        : "Area not added"
                                }
                            />
                            <SummaryFact
                                label={isSale ? "Per sq ft" : "Yearly rent"}
                                value={
                                    isSale
                                        ? ratePerSqft > 0
                                            ? formatInr(ratePerSqft)
                                            : "— — —"
                                        : formatInr(rentResult.annualRent)
                                }
                            />
                        </div>

                        <div className="border-be border-border-warm bg-brand-soft p-4">
                            <p className="text-xs text-ink-muted">Broker income</p>
                            <p className="tabular mbs-1 text-2xl font-bold text-brand-text">
                                {formatInr(result.brokerRealIncome)}
                            </p>
                            <div className="mbs-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                                <span>Gross {formatInr(result.gross)}</span>
                                {result.gst > 0 ? (
                                    <span className="text-success">+ GST {formatInr(result.gst)}</span>
                                ) : null}
                                {result.tds > 0 ? (
                                    <span className="text-danger">− TDS {formatInr(result.tds)}</span>
                                ) : null}
                            </div>
                        </div>

                        <dl className="divide-y divide-border-warm">
                            <EarningRow
                                label={
                                    isSale
                                        ? `Commission at ${values.commission.sale.value}%`
                                        : `Brokerage for ${values.commission.rent.value} month${
                                              values.commission.rent.value === 1 ? "" : "s"
                                          } of rent`
                                }
                                value={formatInr(result.gross)}
                            />
                            <EarningRow
                                label="Charged to the owner"
                                value={formatInr(result.invoiceTotal)}
                                muted
                            />
                            <EarningRow
                                label="Money in bank"
                                value={formatInr(result.brokerReceives)}
                                strong
                            />
                        </dl>
                    </div>
                ) : (
                    <p
                        className="
                          rounded-control border border-dashed border-border-warm bg-surface p-4
                          text-sm text-ink-muted
                        "
                    >
                        {isSale
                            ? "Add the expected price above to see the broker income."
                            : "Add the monthly rent above to see the broker income."}
                    </p>
                )}
            </WizardSection>
        </div>
    );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
    return (
        <div className="border-bs border-border-warm p-4 first:border-bs-0 sm:border-e sm:border-bs-0 sm:last:border-e-0">
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="tabular mbs-1 text-base font-bold text-ink">{value}</p>
        </div>
    );
}

function EarningRow({
    label,
    value,
    muted,
    strong,
}: {
    label: string;
    value: string;
    muted?: boolean;
    strong?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className={`text-sm ${muted ? `text-ink-muted` : `text-ink`}`}>{label}</dt>
            <dd
                className={`tabular text-sm ${
                    strong ? `font-bold text-brand-text` : `font-semibold text-ink`
                }`}
            >
                {value}
            </dd>
        </div>
    );
}

function resolveDeposit(values: PropertyDraftValues): number {
    const value = values.rent.securityDeposit ?? 0;
    return values.rent.securityDepositMode === "months_of_rent"
        ? value * (values.rent.monthlyRent ?? 0)
        : value;
}
