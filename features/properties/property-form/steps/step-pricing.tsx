"use client";

import { useFormContext } from "react-hook-form";

import { CalendarCheck, Plus, Trash2 } from "lucide-react";

import { createClientId } from "@/lib/client-id";
import { formatInr, formatInrCompact, inrWordHint } from "@/lib/format/inr";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { Button } from "@/components/ui/button";

import {
    AGREEMENT_DURATION_OPTIONS,
    CURRENT_STATUS_OPTIONS,
    ELECTRICITY_BILLING_OPTIONS,
    HOUSEKEEPING_OPTIONS,
    MAINTENANCE_FREQUENCY_OPTIONS,
    MAINTENANCE_MODE_OPTIONS,
    PAID_BY_OPTIONS,
    PG_BED_TYPE_OPTIONS,
    PG_GENDER_OPTIONS,
    PREFERRED_TENANT_OPTIONS,
    SECURITY_DEPOSIT_MODE_OPTIONS,
    WATER_CHARGE_OPTIONS,
} from "@/constants/property";
import {
    ChoiceField,
    CurrencyField,
    FORM_GRID_CLASS,
    MultiChipField,
    NumberField,
    SelectField,
    TextField,
    ToggleField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

const SELL_EXTRA_CHARGES = [
    ["sale.parkingCharge", "Parking charge"],
    ["sale.plcCharge", "Preferred location charge"],
    ["sale.floorRiseCharge", "Floor-rise charge"],
] as const;

export function StepPricing() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const values = watch();
    const { derived, isVisible } = useFieldRules();
    const sale = derived.isSell;
    const areaSqft = values.area.areaSqft;
    const expectedPrice = values.sale.expectedPrice;
    const otherCharges = values.sale.otherCharges;

    const fixedCharges = SELL_EXTRA_CHARGES.reduce((total, [name]) => {
        const key = name.split(".")[1] as keyof PropertyDraftValues["sale"];
        const amount = values.sale[key];
        return total + (typeof amount === "number" ? amount : 0);
    }, 0);
    const customCharges = otherCharges.reduce((total, charge) => total + (charge.amount ?? 0), 0);
    const allInPrice = (expectedPrice ?? 0) + fixedCharges + customCharges;

    function setExpectedPrice(value: number | null) {
        if (value != null && areaSqft > 0) {
            setValue("sale.pricePerSqft", Math.round(value / areaSqft), { shouldDirty: true });
        }
    }

    function setPricePerSqft(value: number | null) {
        if (value != null && areaSqft > 0) {
            setValue("sale.expectedPrice", Math.round(value * areaSqft), { shouldDirty: true });
        }
    }

    if (sale) {
        return (
            <div className="space-y-8">
                <WizardSection
                    title="Asking price"
                    description="The asking price is public. The owner's floor stays in the broker file."
                >
                    <div className={FORM_GRID_CLASS}>
                        <CurrencyField
                            name="sale.expectedPrice"
                            label="Expected price"
                            onValueChange={setExpectedPrice}
                        />
                        <CurrencyField
                            name="sale.pricePerSqft"
                            label="Price per sq ft"
                            onValueChange={setPricePerSqft}
                        />
                    </div>
                    <div
                        className="
                          mbs-5 grid overflow-hidden rounded-control border border-border-warm
                          bg-surface-muted
                          sm:grid-cols-3
                        "
                    >
                        <PriceFact label="Price in words" value={inrWordHint(expectedPrice)} />
                        <PriceFact label="Per sq ft" value={formatInr(values.sale.pricePerSqft)} />
                        <PriceFact
                            label="All-in price"
                            value={formatInrCompact(allInPrice)}
                        />
                    </div>
                </WizardSection>

                {isVisible("sale.otherCharges") ? (
                    <WizardSection
                        title="Charges"
                        description="Add every amount a buyer should know before making an offer."
                    >
                        <div className={FORM_GRID_CLASS}>
                            <CurrencyField
                                name="sale.maintenanceCharge"
                                label="Maintenance charge"
                            />
                            <SelectField
                                name="sale.maintenanceFrequency"
                                label="Maintenance frequency"
                                options={MAINTENANCE_FREQUENCY_OPTIONS}
                            />
                            {SELL_EXTRA_CHARGES.map(([name, label]) => (
                                <CurrencyField key={name} name={name} label={label} />
                            ))}
                        </div>
                        {isVisible("sale.gstOnProperty") ? (
                            <div className="mbs-5 grid gap-3 sm:grid-cols-3">
                                <ToggleField name="sale.gstOnProperty" label="GST on property" />
                            </div>
                        ) : null}
                        {isVisible("sale.gstOnPropertyPercent") ? (
                            <div className="mbs-5 max-inline-xs">
                                <NumberField
                                    name="sale.gstOnPropertyPercent"
                                    label="Property GST (%)"
                                    max={100}
                                    step={0.1}
                                />
                            </div>
                        ) : null}

                        <div className="mbs-6 space-y-3">
                            {otherCharges.map((charge, index) => (
                                <div
                                    key={charge.id}
                                    className="
                                      grid items-end gap-3 rounded-control border border-border-warm
                                      bg-surface p-3
                                      md:grid-cols-[1.2fr_0.8fr_0.7fr_auto]
                                    "
                                >
                                    <TextField
                                        name={`sale.otherCharges.${index}.label`}
                                        label="Charge name"
                                        placeholder="Other charge"
                                    />
                                    <CurrencyField
                                        name={`sale.otherCharges.${index}.amount`}
                                        label="Amount"
                                    />
                                    <SelectField
                                        name={`sale.otherCharges.${index}.paidBy`}
                                        label="Paid by"
                                        options={PAID_BY_OPTIONS}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-lg"
                                        aria-label="Remove charge"
                                        onClick={() =>
                                            setValue(
                                                "sale.otherCharges",
                                                otherCharges.filter(
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
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="md"
                                onClick={() =>
                                    setValue(
                                        "sale.otherCharges",
                                        [
                                            ...otherCharges,
                                            {
                                                id: createClientId("charge"),
                                                label: "",
                                                amount: null,
                                                paidBy: "buyer",
                                            },
                                        ],
                                        { shouldDirty: true },
                                    )
                                }
                            >
                                <Plus aria-hidden /> Add charge
                            </Button>
                        </div>
                    </WizardSection>
                ) : null}

            </div>
        );
    }

    return (
        <div className="space-y-8">
            <WizardSection
                title={derived.isPg ? "PG rent" : "Rent and deposit"}
                description="Record the full move-in amount, not only the monthly rent."
            >
                <div className={FORM_GRID_CLASS}>
                    <CurrencyField name="rent.monthlyRent" label="Monthly rent" />
                    <CurrencyField
                        name="rent.ownerMinimumRent"
                        label="Owner's minimum rent"
                        visibility="private"
                    />
                    <ChoiceField
                        name="rent.securityDepositMode"
                        label="Deposit mode"
                        options={SECURITY_DEPOSIT_MODE_OPTIONS}
                        columns={2}
                        className="md:col-span-2"
                    />
                    {values.rent.securityDepositMode === "months_of_rent" ? (
                        <NumberField
                            name="rent.securityDeposit"
                            label="Deposit (months of rent)"
                            max={24}
                            step={0.5}
                            hint={
                                values.rent.monthlyRent
                                    ? `${formatInr((values.rent.securityDeposit ?? 0) * values.rent.monthlyRent)} deposit`
                                    : undefined
                            }
                        />
                    ) : (
                        <CurrencyField name="rent.securityDeposit" label="Security deposit" />
                    )}
                    <TextField
                        name="rent.availableFrom"
                        label="Available from"
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                    />
                </div>
                <div className="mbs-3 flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setValue("rent.availableFrom", new Date().toISOString().slice(0, 10), {
                                shouldDirty: true,
                            })
                        }
                    >
                        <CalendarCheck aria-hidden /> Available immediately
                    </Button>
                </div>
                <div className="mbs-5 grid gap-3 sm:grid-cols-2">
                    <ToggleField name="rent.rentNegotiable" label="Rent negotiable" />
                    <SelectField
                        name="rent.currentStatus"
                        label="Current status"
                        options={CURRENT_STATUS_OPTIONS}
                    />
                </div>
                {isVisible("rent.tenantVacatingOn") ? (
                    <div className="mbs-5 max-inline-sm">
                        <TextField
                            name="rent.tenantVacatingOn"
                            label="Tenant vacating on"
                            type="date"
                            visibility="private"
                        />
                    </div>
                ) : null}
            </WizardSection>

            <WizardSection
                title="Monthly charges"
                description="Make recurring costs clear before the first visit."
            >
                <div className="space-y-5">
                    <ChoiceField
                        name="rent.maintenanceMode"
                        label="Maintenance"
                        options={MAINTENANCE_MODE_OPTIONS}
                        columns={2}
                    />
                    {isVisible("rent.maintenanceAmount") ? (
                        <div className={FORM_GRID_CLASS}>
                            <CurrencyField
                                name="rent.maintenanceAmount"
                                label="Maintenance amount"
                            />
                            <SelectField
                                name="rent.maintenanceFrequency"
                                label="Frequency"
                                options={MAINTENANCE_FREQUENCY_OPTIONS}
                            />
                        </div>
                    ) : null}
                    <div className={FORM_GRID_CLASS}>
                        <SelectField
                            name="rent.electricityBilling"
                            label="Electricity billing"
                            options={ELECTRICITY_BILLING_OPTIONS}
                        />
                        <SelectField
                            name="rent.waterCharges"
                            label="Water charges"
                            options={WATER_CHARGE_OPTIONS}
                        />
                    </div>
                </div>
            </WizardSection>

            {derived.isRent || derived.isLease ? (
                <WizardSection
                    title="Agreement terms"
                    description="Capture the dates and clauses that affect the tenancy."
                >
                    <div className={FORM_GRID_CLASS}>
                        <NumberField name="rent.lockInMonths" label="Lock-in (months)" />
                        <NumberField
                            name="rent.noticePeriodMonths"
                            label="Notice period (months)"
                        />
                        <SelectField
                            name="rent.agreementDurationMonths"
                            label="Agreement duration"
                            options={AGREEMENT_DURATION_OPTIONS}
                        />
                        <NumberField
                            name="rent.rentEscalationPercent"
                            label="Yearly rent increase (%)"
                            max={100}
                            step={0.1}
                        />
                    </div>
                </WizardSection>
            ) : null}

            {isVisible("rent.preferredTenant") ? (
                <WizardSection
                    title="Tenant preference"
                    description="Plain restrictions prevent avoidable calls and visits."
                >
                    <MultiChipField
                        name="rent.preferredTenant"
                        label="Preferred tenant"
                        options={PREFERRED_TENANT_OPTIONS}
                    />
                    <div className="mbs-5 grid gap-3 sm:grid-cols-2">
                        <ToggleField name="rent.nonVegAllowed" label="Non-veg allowed" />
                        <ToggleField name="rent.petsAllowed" label="Pets allowed" />
                        <ToggleField name="rent.smokingAllowed" label="Smoking allowed" />
                        <ToggleField name="rent.partyAllowed" label="Parties allowed" />
                    </div>
                </WizardSection>
            ) : null}

            {derived.isPg ? (
                <WizardSection
                    title="PG details"
                    description="Record the service and price per bed."
                >
                    <div className={FORM_GRID_CLASS}>
                        <SelectField
                            name="rent.pg.bedType"
                            label="Bed type"
                            options={PG_BED_TYPE_OPTIONS}
                        />
                        <SelectField
                            name="rent.pg.genderAllowed"
                            label="Gender allowed"
                            options={PG_GENDER_OPTIONS}
                        />
                        <CurrencyField name="rent.pg.perBedRent" label="Rent per bed" />
                        <TextField
                            name="rent.pg.gateClosingTime"
                            label="Gate closing time"
                            type="time"
                        />
                        <SelectField
                            name="rent.pg.housekeepingFrequency"
                            label="Housekeeping"
                            options={HOUSEKEEPING_OPTIONS}
                        />
                    </div>
                    <div className="mbs-5 grid gap-3 sm:grid-cols-2">
                        <ToggleField name="rent.pg.foodIncluded" label="Food included" />
                        <ToggleField name="rent.pg.laundry" label="Laundry included" />
                    </div>
                </WizardSection>
            ) : null}
        </div>
    );
}

function PriceFact({ label, value }: { label: string; value: string }) {
    return (
        <div
            className="
              border-bs border-border-warm p-4
              first:border-bs-0
              sm:border-e sm:border-bs-0
              sm:last:border-e-0
            "
        >
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="tabular mbs-1 text-base font-bold text-ink">{value || "— — —"}</p>
        </div>
    );
}
