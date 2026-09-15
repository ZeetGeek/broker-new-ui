"use client";

import { useFormContext } from "react-hook-form";

import { BadgePercent, Wallet } from "lucide-react";

import { calculateRentCommission, calculateSaleCommission } from "@/lib/calc/commission";
import { formatInr } from "@/lib/format/inr";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";
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

    const commissionLabel = isSale
        ? `Commission at ${values.commission.sale.value}%`
        : `Brokerage · ${values.commission.rent.value} month${
              values.commission.rent.value === 1 ? "" : "s"
          } rent`;

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
                description="Live estimate from the rate above. Broker-only."
            >
                {earned ? (
                    <div
                        className="
                          overflow-hidden rounded-control border-2 border-border-warm bg-surface
                        "
                    >
                        <div className="grid sm:grid-cols-3">
                            <IncomeFact
                                label={isSale ? "Property price" : "Monthly rent"}
                                value={formatInr(isSale ? expectedPrice : monthlyRent)}
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

                        <div className="border-bs-2 border-border-warm p-5">
                            <p className="text-xs font-medium text-ink-muted">Money in bank</p>
                            <p className="tabular mbs-1 text-3xl font-bold tracking-tight text-brand-text">
                                {formatInr(result.brokerReceives)}
                            </p>
                            <div className="mbs-3 flex flex-wrap gap-2">
                                <IncomeChip label="Gross" value={formatInr(result.gross)} />
                                {result.gst > 0 ? (
                                    <IncomeChip
                                        label="+ GST"
                                        value={formatInr(result.gst)}
                                        tone="success"
                                    />
                                ) : null}
                                {result.tds > 0 ? (
                                    <IncomeChip
                                        label="− TDS"
                                        value={formatInr(result.tds)}
                                        tone="danger"
                                    />
                                ) : null}
                            </div>
                        </div>

                        <dl className="border-bs-2 border-border-warm">
                            <IncomeRow label={commissionLabel} value={formatInr(result.gross)} />
                            <IncomeRow
                                label="Charged to the owner"
                                value={formatInr(result.invoiceTotal)}
                                muted
                            />
                        </dl>
                    </div>
                ) : (
                    <p
                        className="
                          rounded-control border-2 border-dashed border-border-warm bg-surface p-5
                          text-sm text-ink-muted
                        "
                    >
                        {isSale
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
        <div
            className="
              border-bs-2 border-border-warm p-4
              first:border-bs-0
              sm:border-e-2 sm:border-bs-0
              sm:last:border-e-0
            "
        >
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="tabular mbs-1 text-base font-bold text-ink">{value}</p>
        </div>
    );
}

function IncomeChip({
    label,
    value,
    tone = "default",
}: {
    label: string;
    value: string;
    tone?: "default" | "success" | "danger";
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-control px-2.5 py-1 text-xs font-medium",
                tone === "success" && "bg-success-soft text-success",
                tone === "danger" && "bg-danger-soft text-danger",
                tone === "default" && "bg-surface-muted text-ink-muted",
            )}
        >
            {label} <span className="tabular font-semibold">{value}</span>
        </span>
    );
}

function IncomeRow({
    label,
    value,
    muted,
}: {
    label: string;
    value: string;
    muted?: boolean;
}) {
    return (
        <div
            className="
              flex items-center justify-between gap-4 border-bs-2 border-border-warm px-4 py-3.5
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
