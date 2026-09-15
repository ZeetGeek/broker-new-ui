"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";

import { CalendarCheck } from "lucide-react";

import { areaToSqft } from "@/lib/calc/area";
import { calculateSaleCommission } from "@/lib/calc/commission";
import { formatInr, formatInrCompact } from "@/lib/format/inr";
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
    ["sale.plcCharge", "Preferred location charge"],
    ["sale.floorRiseCharge", "Floor-rise charge"],
] as const;

function rateFromPrice(expectedPrice: number, areaSqft: number): number {
    if (areaSqft <= 0) return 0;
    return Math.round(expectedPrice / areaSqft);
}

function priceFromRate(rate: number, areaSqft: number): number {
    if (areaSqft <= 0) return 0;
    return Math.round(rate * areaSqft);
}

export function StepPricing() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const values = watch();
    const { derived, isVisible } = useFieldRules();
    const sale = derived.isSell;
    const unit = values.area.unit;
    const carpet = values.area.carpetArea;
    const listingArea = values.area.plotArea;
    const areaSqft = values.area.areaSqft;
    const expectedPrice = values.sale.expectedPrice;
    const pricePerSqft = values.sale.pricePerSqft;
    const editingRef = useRef<"price" | "rate" | null>(null);

    const fixedCharges = SELL_EXTRA_CHARGES.reduce((total, [name]) => {
        const key = name.split(".")[1] as keyof PropertyDraftValues["sale"];
        const amount = values.sale[key];
        return total + (typeof amount === "number" ? amount : 0);
    }, 0);
    const allInPrice =
        (expectedPrice ?? 0) +
        fixedCharges +
        (typeof values.sale.maintenanceCharge === "number" ? values.sale.maintenanceCharge : 0);

    const coBrokerPercent = values.deal.coBrokerSharePercent ?? 0;
    const saleDeal = useMemo(() => {
        if (!sale || expectedPrice == null || expectedPrice <= 0) return null;
        return calculateSaleCommission({
            salePrice: expectedPrice,
            areaSqft,
            mode: values.commission.sale.mode,
            value: values.commission.sale.value,
            paidBy: "owner",
            ownerSharePercent: 100,
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
            otherOwnerDeductions: 0,
            buyerSideCharges: fixedCharges,
        });
    }, [
        areaSqft,
        expectedPrice,
        fixedCharges,
        sale,
        values.commission.sale.buyerPercent,
        values.commission.sale.mode,
        values.commission.sale.ownerPercent,
        values.commission.sale.separateRates,
        values.commission.sale.value,
        values.commission.tax.gstApplicable,
        values.commission.tax.gstMode,
        values.commission.tax.tdsApplicable,
        values.commission.tax.tdsRate,
    ]);

    const brokerGross = saleDeal?.gross ?? 0;
    const brokerGst = saleDeal?.gst ?? 0;
    const brokerTds = saleDeal?.tds ?? 0;
    const brokerReal = saleDeal?.brokerRealIncome ?? 0;
    const coBrokerShare = (brokerReal * coBrokerPercent) / 100;
    const brokerNet = Math.max(0, brokerReal - coBrokerShare);
    const brokerBank = Math.max(
        0,
        (saleDeal?.brokerReceives ?? 0) * (1 - coBrokerPercent / 100),
    );

    // Keep normalised sq ft in sync even if user left the area step earlier.
    useEffect(() => {
        const source = listingArea != null && listingArea > 0 ? listingArea : carpet;
        const nextSqft = areaToSqft(source, unit);
        if (nextSqft !== areaSqft) {
            setValue("area.areaSqft", nextSqft, { shouldDirty: true });
        }
    }, [areaSqft, carpet, listingArea, setValue, unit]);

    // Expected price → price / sq ft
    useEffect(() => {
        if (!sale || editingRef.current === "rate") return;
        if (expectedPrice == null || expectedPrice <= 0 || areaSqft <= 0) return;
        const next = rateFromPrice(expectedPrice, areaSqft);
        if (pricePerSqft !== next) {
            setValue("sale.pricePerSqft", next, { shouldDirty: true });
        }
    }, [areaSqft, expectedPrice, pricePerSqft, sale, setValue]);

    function handleExpectedPriceChange(value: number | null) {
        editingRef.current = "price";
        if (value != null && value > 0 && areaSqft > 0) {
            setValue("sale.pricePerSqft", rateFromPrice(value, areaSqft), { shouldDirty: true });
        } else if (value == null || value <= 0) {
            setValue("sale.pricePerSqft", null, { shouldDirty: true });
        }
    }

    function handlePricePerSqftChange(value: number | null) {
        editingRef.current = "rate";
        if (value != null && value >= 0 && areaSqft > 0) {
            setValue("sale.expectedPrice", priceFromRate(value, areaSqft), { shouldDirty: true });
        }
        window.requestAnimationFrame(() => {
            editingRef.current = null;
        });
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
                            onValueChange={handleExpectedPriceChange}
                        />
                        <NumberField
                            name="sale.pricePerSqft"
                            label="Price per sq ft"
                            min={0}
                            step={1}
                            placeholder="e.g. 5500"
                            hint={
                                areaSqft > 0
                                    ? `Based on ${areaSqft.toLocaleString("en-US")} sq ft — edit either side to sync`
                                    : "Add Area on the previous step to sync these fields"
                            }
                            onValueChange={handlePricePerSqftChange}
                        />
                    </div>
                    <div
                        className="
                          mbs-5 overflow-hidden rounded-control border border-border-warm
                          bg-surface-muted
                        "
                    >
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                            <PriceFact
                                label="Property price"
                                value={
                                    expectedPrice != null && expectedPrice > 0
                                        ? formatInr(expectedPrice)
                                        : "Add a price"
                                }
                            />
                            <PriceFact
                                label="Area"
                                value={
                                    areaSqft > 0
                                        ? `${areaSqft.toLocaleString("en-US")} sq ft`
                                        : "Area not added"
                                }
                            />
                            <PriceFact
                                label="Per sq ft"
                                value={formatInr(values.sale.pricePerSqft)}
                            />
                            <PriceFact label="All-in price" value={formatInrCompact(allInPrice)} />
                        </div>

                        <div className="border-bs border-border-warm p-4">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <p className="text-xs text-ink-muted">Broker earns (live)</p>
                                    <p className="tabular mbs-1 text-xl font-bold text-brand-text">
                                        {saleDeal ? formatInr(brokerNet) : "— — —"}
                                    </p>
                                </div>
                                {saleDeal ? (
                                    <p className="tabular text-sm text-ink-muted">
                                        Bank receipt {formatInr(brokerBank)}
                                    </p>
                                ) : null}
                            </div>
                            {saleDeal ? (
                                <div className="mbs-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                                    <span>Gross {formatInr(brokerGross)}</span>
                                    {brokerGst > 0 ? (
                                        <span className="text-success">+ GST {formatInr(brokerGst)}</span>
                                    ) : null}
                                    {brokerTds > 0 ? (
                                        <span className="text-danger">− TDS {formatInr(brokerTds)}</span>
                                    ) : null}
                                    {coBrokerShare > 0 ? (
                                        <span className="text-danger">
                                            − Co-broker ({coBrokerPercent}%) {formatInr(coBrokerShare)}
                                        </span>
                                    ) : null}
                                </div>
                            ) : (
                                <p className="mbs-2 text-xs text-ink-muted">
                                    Enter an expected price to calculate brokerage in real time.
                                </p>
                            )}
                        </div>
                    </div>
                </WizardSection>

                {(isVisible("sale.maintenanceCharge") ||
                    isVisible("sale.plcCharge") ||
                    isVisible("sale.floorRiseCharge")) ? (
                    <WizardSection
                        title="Charges"
                        description="Add every amount a buyer should know before making an offer."
                    >
                        <div className={FORM_GRID_CLASS}>
                            <CurrencyField
                                name="sale.maintenanceCharge"
                                label="Maintenance charge"
                                placeholder="e.g. 3,000"
                                helperText="Type 3000 or 3,000 — monthly society charge"
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
                                placeholder="e.g. 3,000"
                                helperText="Type 3000 or 3,000 — monthly society charge"
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
