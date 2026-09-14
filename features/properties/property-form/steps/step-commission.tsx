"use client";

import { useFormContext } from "react-hook-form";

import { calculateRentCommission, calculateSaleCommission } from "@/lib/calc/commission";
import { formatInr } from "@/lib/format/inr";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { Button } from "@/components/ui/button";

import {
    RENT_COMMISSION_MODE_OPTIONS,
    RENT_COMMISSION_PAID_BY_OPTIONS,
    SALE_COMMISSION_MODE_OPTIONS,
    SALE_COMMISSION_PAID_BY_OPTIONS,
} from "@/constants/property";
import {
    ChoiceField,
    CurrencyField,
    FORM_GRID_CLASS,
    NumberField,
    ToggleField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepCommission() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const values = watch();
    const { derived, isVisible } = useFieldRules();
    const isSale = derived.isSell;

    const saleScenarios = [1, 2, 3].map((rate) => ({
        rate,
        result: calculateSaleCommission({
            salePrice: values.sale.expectedPrice ?? 0,
            areaSqft: values.area.areaSqft,
            mode: "percent",
            value: rate,
            paidBy: values.commission.sale.paidBy,
            ownerSharePercent: values.commission.sale.ownerSharePercent,
            gstApplicable: values.commission.tax.gstApplicable,
            gstMode: values.commission.tax.gstMode,
            tdsApplicable: values.commission.tax.tdsApplicable,
            tdsRate: values.commission.tax.tdsRate,
        }),
    }));
    const rentScenarios = [0.5, 1, 2].map((months) => ({
        months,
        result: calculateRentCommission({
            monthlyRent: values.rent.monthlyRent ?? 0,
            securityDeposit: resolveDeposit(values),
            maintenanceAmount: values.rent.maintenanceAmount ?? 0,
            maintenancePaidBy: "tenant",
            lockInMonths: values.rent.lockInMonths ?? 0,
            agreementMonths: values.rent.agreementDurationMonths ?? 11,
            escalationPercent: values.rent.rentEscalationPercent ?? 0,
            mode: "months",
            value: months,
            paidBy: values.commission.rent.paidBy,
            ownerSharePercent: values.commission.rent.ownerSharePercent,
            gstApplicable: values.commission.tax.gstApplicable,
            gstMode: values.commission.tax.gstMode,
            tdsApplicable: values.commission.tax.tdsApplicable,
            tdsRate: values.commission.tax.tdsRate,
        }),
    }));

    return (
        <div className="space-y-8">
            <WizardSection
                title={isSale ? "Sale commission" : "Rental brokerage"}
                description="Record the agreed fee and who pays it. These terms stay in the broker file."
                tone="private"
            >
                <div className="space-y-6">
                    {isSale ? (
                        <>
                            <ChoiceField
                                name="commission.sale.mode"
                                label="Commission mode"
                                options={
                                    derived.hasArea
                                        ? SALE_COMMISSION_MODE_OPTIONS
                                        : SALE_COMMISSION_MODE_OPTIONS.filter(
                                              (option) => option.value !== "per_sqft",
                                          )
                                }
                                columns={3}
                                visibility="private"
                            />
                            {!derived.hasArea ? (
                                <p className="text-xs text-ink-muted">
                                    Fill the property area first to use per-sq-ft commission.
                                </p>
                            ) : null}
                            <div className={FORM_GRID_CLASS}>
                                {values.commission.sale.mode === "flat" ? (
                                    <CurrencyField
                                        name="commission.sale.value"
                                        label="Commission amount"
                                        visibility="private"
                                    />
                                ) : (
                                    <NumberField
                                        name="commission.sale.value"
                                        label={
                                            values.commission.sale.mode === "percent"
                                                ? "Commission (%)"
                                                : "Commission per sq ft"
                                        }
                                        step={values.commission.sale.mode === "percent" ? 0.1 : 1}
                                        max={
                                            values.commission.sale.mode === "percent"
                                                ? 10
                                                : undefined
                                        }
                                        visibility="private"
                                    />
                                )}
                                <CurrencyField
                                    name="commission.sale.minAcceptable"
                                    label="Minimum acceptable commission"
                                    visibility="private"
                                />
                            </div>
                            <ChoiceField
                                name="commission.sale.paidBy"
                                label="Paid by"
                                options={SALE_COMMISSION_PAID_BY_OPTIONS}
                                columns={3}
                                visibility="private"
                            />
                            {isVisible("commission.sale.ownerSharePercent") ? (
                                <NumberField
                                    name="commission.sale.ownerSharePercent"
                                    label="Owner share (%)"
                                    max={100}
                                    visibility="private"
                                    hint={`${100 - values.commission.sale.ownerSharePercent}% is paid by the buyer.`}
                                />
                            ) : null}
                            <ToggleField
                                name="commission.sale.separateRates"
                                label="Use separate rates"
                                description="Enter a different percentage for the owner and buyer."
                                visibility="private"
                            />
                            {isVisible("commission.sale.ownerPercent") ? (
                                <div className={FORM_GRID_CLASS}>
                                    <NumberField
                                        name="commission.sale.ownerPercent"
                                        label="Owner rate (%)"
                                        max={10}
                                        step={0.1}
                                        visibility="private"
                                    />
                                    <NumberField
                                        name="commission.sale.buyerPercent"
                                        label="Buyer rate (%)"
                                        max={10}
                                        step={0.1}
                                        visibility="private"
                                    />
                                </div>
                            ) : null}
                            <ToggleField
                                name="commission.sale.negotiable"
                                label="Commission negotiable"
                                visibility="private"
                            />
                        </>
                    ) : (
                        <>
                            <ChoiceField
                                name="commission.rent.mode"
                                label="Brokerage mode"
                                options={RENT_COMMISSION_MODE_OPTIONS.filter(
                                    (option) =>
                                        option.value !== "percent_lease_value" ||
                                        (values.rent.agreementDurationMonths ?? 0) >= 12,
                                )}
                                columns={3}
                                visibility="private"
                            />
                            {values.commission.rent.mode === "flat" ? (
                                <CurrencyField
                                    name="commission.rent.value"
                                    label="Brokerage amount"
                                    visibility="private"
                                />
                            ) : (
                                <NumberField
                                    name="commission.rent.value"
                                    label="Brokerage value"
                                    step={0.1}
                                    visibility="private"
                                    hint="1 month's rent equals 8.33% of yearly rent. 15 days equals 4.17%."
                                />
                            )}
                            <ChoiceField
                                name="commission.rent.paidBy"
                                label="Paid by"
                                options={RENT_COMMISSION_PAID_BY_OPTIONS}
                                columns={3}
                                visibility="private"
                            />
                            {isVisible("commission.rent.ownerSharePercent") ? (
                                <NumberField
                                    name="commission.rent.ownerSharePercent"
                                    label="Owner share (%)"
                                    max={100}
                                    visibility="private"
                                    hint={`${100 - values.commission.rent.ownerSharePercent}% is paid by the tenant.`}
                                />
                            ) : null}
                            <ToggleField
                                name="commission.rent.renewalFeeApplicable"
                                label="Renewal fee"
                                description="Earn again if the tenant renews."
                                visibility="private"
                            />
                            {isVisible("commission.rent.renewalFeeValue") ? (
                                <NumberField
                                    name="commission.rent.renewalFeeValue"
                                    label="Renewal fee (months of rent)"
                                    step={0.25}
                                    visibility="private"
                                />
                            ) : null}
                        </>
                    )}
                </div>
            </WizardSection>

            <WizardSection
                title="Compare the deal"
                description={
                    isSale
                        ? "Choose a common rate to apply it instantly."
                        : "Compare half, one, or two months of rent."
                }
            >
                <div className="grid gap-3 sm:grid-cols-3">
                    {(isSale ? saleScenarios : rentScenarios).map((scenario) => {
                        const key =
                            "rate" in scenario
                                ? `${scenario.rate}%`
                                : `${scenario.months} month${scenario.months === 1 ? "" : "s"}`;
                        const active = isSale
                            ? values.commission.sale.mode === "percent" &&
                              values.commission.sale.value ===
                                  (scenario as (typeof saleScenarios)[number]).rate
                            : values.commission.rent.mode === "months" &&
                              values.commission.rent.value ===
                                  (scenario as (typeof rentScenarios)[number]).months;
                        return (
                            <Button
                                key={key}
                                type="button"
                                variant="outline"
                                size="lg"
                                aria-pressed={active}
                                onClick={() => {
                                    if (isSale && "rate" in scenario) {
                                        setValue("commission.sale.mode", "percent", {
                                            shouldDirty: true,
                                        });
                                        setValue("commission.sale.value", scenario.rate, {
                                            shouldDirty: true,
                                        });
                                    } else if (!isSale && "months" in scenario) {
                                        setValue("commission.rent.mode", "months", {
                                            shouldDirty: true,
                                        });
                                        setValue("commission.rent.value", scenario.months, {
                                            shouldDirty: true,
                                        });
                                    }
                                }}
                                className={`
                                  rounded-control border p-4 text-start
                                  transition-[background-color,border-color] duration-160
                                  focus-visible:ring-3 focus-visible:ring-ring/30
                                  ${
                                      active
                                          ? `border-brand bg-brand-soft`
                                          : `border-border-warm bg-surface hover:border-brand/40`
                                  }`}
                            >
                                <p className="text-sm font-bold text-ink">{key}</p>
                                <p className="tabular mbs-3 text-lg font-bold text-brand-text">
                                    {formatInr(scenario.result.brokerRealIncome)}
                                </p>
                                <p className="mbs-1 text-xs text-ink-muted">Broker real income</p>
                                <p className="tabular mbs-3 text-xs text-ink-muted">
                                    Owner receives{" "}
                                    {formatInr(
                                        isSale
                                            ? (
                                                  scenario.result as (typeof saleScenarios)[number]["result"]
                                              ).ownerNet
                                            : (
                                                  scenario.result as (typeof rentScenarios)[number]["result"]
                                              ).ownerFirstPayout,
                                    )}
                                </p>
                            </Button>
                        );
                    })}
                </div>
            </WizardSection>
        </div>
    );
}

function resolveDeposit(values: PropertyDraftValues): number {
    const value = values.rent.securityDeposit ?? 0;
    return values.rent.securityDepositMode === "months_of_rent"
        ? value * (values.rent.monthlyRent ?? 0)
        : value;
}
