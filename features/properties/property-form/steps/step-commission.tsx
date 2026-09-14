"use client";

import { useFormContext } from "react-hook-form";

import { calculateRentCommission, calculateSaleCommission } from "@/lib/calc/commission";
import { formatInr } from "@/lib/format/inr";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { NumberField, WizardSection } from "@/features/properties/property-form/form-fields";

export function StepCommission() {
    const { watch } = useFormContext<PropertyDraftValues>();
    const values = watch();
    const { derived } = useFieldRules();
    const isSale = derived.isSell;

    const saleResult = calculateSaleCommission({
        salePrice: values.sale.expectedPrice ?? 0,
        areaSqft: values.area.areaSqft,
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
        monthlyRent: values.rent.monthlyRent ?? 0,
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
    const hasBasis = isSale
        ? (values.sale.expectedPrice ?? 0) > 0
        : (values.rent.monthlyRent ?? 0) > 0;
    const earned = result.gross > 0 || hasBasis;

    return (
        <div className="space-y-8">
            <WizardSection
                title={isSale ? "Sale commission" : "Rental brokerage"}
                description="Record the agreed fee and who pays it. These terms stay in the broker file."
                tone="private"
            >
                <div className="space-y-6">
                    {isSale ? (
                        <NumberField
                            name="commission.sale.value"
                            label="Commission (%)"
                            step={0.1}
                            max={10}
                            visibility="private"
                            hint="Charged to the owner on the sale price."
                        />
                    ) : (
                        <NumberField
                            name="commission.rent.value"
                            label="Months of rent"
                            step={0.25}
                            visibility="private"
                            hint="Charged to the owner."
                        />
                    )}
                </div>
            </WizardSection>

            <WizardSection
                title="Broker income"
                description="Updates as you change the rate above."
                tone="private"
            >
                {earned ? (
                    <div
                        className="
                          overflow-hidden rounded-control border border-border-warm bg-surface
                        "
                    >
                        <div className="border-be border-border-warm bg-brand-soft p-4">
                            <p className="text-xs text-ink-muted">Broker income</p>
                            <p className="tabular mbs-1 text-2xl font-bold text-brand-text">
                                {formatInr(result.brokerRealIncome)}
                            </p>
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
                            ? "Add the expected price in step 5 to see the broker income."
                            : "Add the monthly rent in step 5 to see the broker income."}
                    </p>
                )}
            </WizardSection>
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
