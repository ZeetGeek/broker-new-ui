"use client";

import { useFormContext } from "react-hook-form";

import { FileSignature, Plus, Trash2 } from "lucide-react";

import { calculateRentCommission, calculateSaleCommission } from "@/lib/calc/commission";
import { createClientId } from "@/lib/client-id";
import { formatInr } from "@/lib/format/inr";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { PROPERTY_VISIBLE_WHEN } from "@/lib/visibility/property";

import { Button } from "@/components/ui/button";

import {
    ASSIGNED_BROKER_OPTIONS,
    CO_BROKER_OPTIONS,
    GST_MODE_OPTIONS,
    MANDATE_TYPE_OPTIONS,
    PRIORITY_OPTIONS,
    RENT_COMMISSION_MODE_OPTIONS,
    RENT_COMMISSION_PAID_BY_OPTIONS,
    SALE_COMMISSION_MODE_OPTIONS,
    SALE_COMMISSION_PAID_BY_OPTIONS,
    VERIFICATION_STATUS_OPTIONS,
} from "@/constants/property";
import {
    ChoiceField,
    CurrencyField,
    FORM_GRID_CLASS,
    NumberField,
    SelectField,
    TextAreaField,
    TextField,
    ToggleField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function StepCommission() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const values = watch();
    const isSale = values.basics.listingFor === "sell";
    const milestones = values.commission.sale.paymentMilestones;
    const milestoneTotal = milestones.reduce((total, item) => total + (item.percent || 0), 0);

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
                                options={SALE_COMMISSION_MODE_OPTIONS}
                                columns={3}
                                visibility="private"
                            />
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
                            {PROPERTY_VISIBLE_WHEN.saleSplit(values) ? (
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
                            {values.commission.sale.separateRates ? (
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
                                options={RENT_COMMISSION_MODE_OPTIONS}
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
                            {PROPERTY_VISIBLE_WHEN.rentSplit(values) ? (
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
                            {PROPERTY_VISIBLE_WHEN.renewal(values) ? (
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
                            <button
                                key={key}
                                type="button"
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
                            </button>
                        );
                    })}
                </div>
            </WizardSection>

            <WizardSection
                title="GST and TDS"
                description="Taxes are shown separately so broker income is not overstated."
                tone="private"
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    <ToggleField
                        name="commission.tax.gstApplicable"
                        label="GST applies"
                        description="GST collected is paid to the government; it is not broker income."
                        visibility="private"
                    />
                    <ToggleField
                        name="commission.tax.tdsApplicable"
                        label="TDS applies"
                        description="TDS is advance tax and may be claimed while filing the return."
                        visibility="private"
                    />
                </div>
                <div className={`mbs-5 ${FORM_GRID_CLASS}`}>
                    {values.commission.tax.gstApplicable ? (
                        <SelectField
                            name="commission.tax.gstMode"
                            label="GST treatment"
                            options={GST_MODE_OPTIONS}
                            visibility="private"
                        />
                    ) : null}
                    {values.commission.tax.tdsApplicable ? (
                        <NumberField
                            name="commission.tax.tdsRate"
                            label="TDS rate (%)"
                            max={20}
                            step={0.1}
                            visibility="private"
                            hint={
                                values.commission.tax.tdsRate >= 20
                                    ? "High-rate TDS selected. Confirm the PAN status."
                                    : "TDS is applied only above the configured threshold."
                            }
                        />
                    ) : null}
                </div>
                <TextAreaField
                    name="commission.notes"
                    label="Commission notes"
                    placeholder="Special terms, builder-paid fee, or payment conditions"
                    visibility="private"
                    className="mbs-5"
                />
            </WizardSection>

            {isSale ? (
                <WizardSection
                    title="Payment milestones"
                    description="The agreed percentages must add up to 100%."
                    tone="private"
                >
                    <div className="space-y-3">
                        {milestones.map((milestone, index) => (
                            <div
                                key={milestone.id}
                                className="
                                  grid items-end gap-3 rounded-control border border-border-warm
                                  bg-surface p-3
                                  md:grid-cols-[1fr_0.4fr_auto]
                                "
                            >
                                <TextField
                                    name={`commission.sale.paymentMilestones.${index}.stage`}
                                    label="Milestone"
                                    visibility="private"
                                />
                                <NumberField
                                    name={`commission.sale.paymentMilestones.${index}.percent`}
                                    label="Percent"
                                    max={100}
                                    visibility="private"
                                />
                                <button
                                    type="button"
                                    aria-label="Remove milestone"
                                    onClick={() =>
                                        setValue(
                                            "commission.sale.paymentMilestones",
                                            milestones.filter(
                                                (_, itemIndex) => itemIndex !== index,
                                            ),
                                            { shouldDirty: true },
                                        )
                                    }
                                    className="
                                      flex items-center justify-center rounded-control border
                                      border-border-warm text-danger block-12 inline-12
                                      hover:bg-danger-soft
                                      focus-visible:ring-3 focus-visible:ring-danger/20
                                    "
                                >
                                    <Trash2 className="block-4 inline-4" />
                                </button>
                            </div>
                        ))}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="md"
                                onClick={() =>
                                    setValue(
                                        "commission.sale.paymentMilestones",
                                        [
                                            ...milestones,
                                            {
                                                id: createClientId("milestone"),
                                                stage: "",
                                                percent: 0,
                                            },
                                        ],
                                        { shouldDirty: true },
                                    )
                                }
                            >
                                <Plus aria-hidden /> Add milestone
                            </Button>
                            <p
                                className={`text-sm font-semibold ${
                                    milestoneTotal === 100
                                        ? `text-brand-text`
                                        : `text-danger`
                                }`}
                            >
                                Total: {milestoneTotal}%{" "}
                                {milestoneTotal === 100 ? "Complete" : "Must equal 100%"}
                            </p>
                        </div>
                    </div>
                </WizardSection>
            ) : null}

            <WizardSection
                title="Internal deal record"
                description="Ownership, mandate, verification, and close planning stay inside the broker CRM."
                tone="private"
            >
                <div className={FORM_GRID_CLASS}>
                    <SelectField
                        name="deal.assignedAgentId"
                        label="Assigned broker"
                        options={ASSIGNED_BROKER_OPTIONS}
                        visibility="private"
                    />
                    <SelectField
                        name="deal.coBrokerId"
                        label="Co-broker"
                        options={CO_BROKER_OPTIONS}
                        visibility="private"
                    />
                    <NumberField
                        name="deal.coBrokerSharePercent"
                        label="Co-broker share (%)"
                        max={100}
                        visibility="private"
                    />
                    <SelectField
                        name="deal.mandateType"
                        label="Mandate type"
                        options={MANDATE_TYPE_OPTIONS}
                        visibility="private"
                    />
                    <TextField
                        name="deal.mandateStartDate"
                        label="Mandate starts"
                        type="date"
                        visibility="private"
                    />
                    <TextField
                        name="deal.mandateEndDate"
                        label="Mandate ends"
                        type="date"
                        visibility="private"
                    />
                    <SelectField
                        name="deal.priority"
                        label="Priority"
                        options={PRIORITY_OPTIONS}
                        visibility="private"
                    />
                    <TextField
                        name="deal.expectedClosureDate"
                        label="Expected closure"
                        type="date"
                        visibility="private"
                    />
                    <SelectField
                        name="deal.verificationStatus"
                        label="Verification status"
                        options={VERIFICATION_STATUS_OPTIONS}
                        visibility="private"
                    />
                    <TextField
                        name="deal.siteVisitedOn"
                        label="Site visited on"
                        type="date"
                        visibility="private"
                    />
                </div>
                <label
                    className="
                      mbs-5 flex cursor-pointer items-center gap-3 rounded-control border
                      border-dashed border-brand/35 bg-surface px-4 py-3 text-sm font-semibold
                      text-brand-text min-block-14
                      focus-within:ring-3 focus-within:ring-ring/30
                    "
                >
                    <FileSignature className="block-5 inline-5" aria-hidden />
                    <span>{values.deal.mandateDocumentName || "Add signed mandate document"}</span>
                    <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,image/*"
                        onChange={(event) =>
                            setValue(
                                "deal.mandateDocumentName",
                                event.target.files?.[0]?.name ?? "",
                                { shouldDirty: true },
                            )
                        }
                    />
                </label>
                <TextAreaField
                    name="deal.internalNotes"
                    label="Internal notes"
                    placeholder="Negotiation context, follow-up details, or risk flags"
                    visibility="private"
                    className="mbs-5"
                />
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
