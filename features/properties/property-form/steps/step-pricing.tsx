"use client";

import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";

import { areaToSqft } from "@/lib/calc/area";
import { formatInr } from "@/lib/format/inr";
import { MAX_DEPOSIT_MONTHS } from "@/lib/properties/form-limits";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { ConditionalField } from "@/components/property/fields/conditional-field";
import { FieldLabel } from "@/components/property/fields/field-label";
import { BedDouble, Clock3, Ruler, Users, Utensils } from "@/components/shared/icons";

import { HOUSEKEEPING_OPTIONS, PG_BED_TYPE_OPTIONS, PG_GENDER_OPTIONS } from "@/constants/property";
import { SlidingTabs } from "@/features/design-system/theme/sliding-tabs";
import {
    CounterField,
    CurrencyField,
    DateField,
    FORM_GRID_CLASS,
    FORM_SECTIONS_CLASS,
    FORM_STACK_CLASS,
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

const DEPOSIT_MODE_TABS = [
    { value: "months_of_rent" as const, label: "In months" },
    { value: "amount" as const, label: "Fixed ₹" },
];

function RentAndDepositSection({
    isPg,
    showMaintenance,
    onMaintenanceChange,
}: {
    isPg: boolean;
    showMaintenance: boolean;
    onMaintenanceChange: (value: number | null) => void;
}) {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const depositMode = watch("rent.securityDepositMode");
    const monthlyRent = watch("rent.monthlyRent");
    const securityDeposit = watch("rent.securityDeposit");

    const depositInRupees =
        depositMode === "months_of_rent"
            ? monthlyRent && securityDeposit
                ? monthlyRent * securityDeposit
                : null
            : securityDeposit;

    function changeDepositMode(next: PropertyDraftValues["rent"]["securityDepositMode"]) {
        if (next === depositMode) return;
        setValue("rent.securityDepositMode", next, { shouldDirty: true, shouldValidate: true });
        if (next === "months_of_rent") {
            setValue("rent.securityDeposit", 2, { shouldDirty: true, shouldValidate: true });
            return;
        }
        const suggested = monthlyRent && monthlyRent > 0 ? monthlyRent * 2 : null;
        setValue("rent.securityDeposit", suggested, { shouldDirty: true, shouldValidate: true });
    }

    return (
        <WizardSection
            title={<>{isPg ? "PG rent" : "Rent details"}</>}
            description="What the tenant pays each month, the deposit to move in, and when they can start."
        >
            <div className={FORM_STACK_CLASS}>
                <div className={FORM_GRID_CLASS}>
                    <CurrencyField
                        name="rent.monthlyRent"
                        label="Monthly rent"
                        placeholder="e.g. 25,000"
                        helperText="Amount the tenant pays every month"
                        className={showMaintenance ? undefined : "md:col-span-2"}
                    />
                    {showMaintenance ? (
                        <CurrencyField
                            name="rent.maintenanceAmount"
                            label="Society maintenance"
                            placeholder="e.g. 3,000"
                            helperText="Monthly society / AMC — same if the flat is later sold"
                            onValueChange={onMaintenanceChange}
                        />
                    ) : null}
                </div>

                <ConditionalField path="rent.securityDepositMode">
                    <div
                        className="
                          space-y-4 rounded-card border border-border-warm bg-surface-muted/35 p-4
                          sm:p-5
                        "
                    >
                        <div
                            className="
                              flex flex-col gap-3
                              sm:flex-row sm:items-center sm:justify-between
                            "
                        >
                            <div className="min-inline-0">
                                <p className="text-sm font-semibold text-ink">
                                    <FieldLabel path="rent.securityDeposit">
                                        Security deposit
                                    </FieldLabel>
                                </p>
                                <p className="mbs-0.5 text-xs text-ink-muted">
                                    Refundable amount collected before move-in.
                                </p>
                            </div>
                            <SlidingTabs
                                value={depositMode}
                                onValueChange={changeDepositMode}
                                ariaLabel="How to set the deposit"
                                options={DEPOSIT_MODE_TABS}
                                className="t-tabs-compact shrink-0"
                            />
                        </div>

                        {depositMode === "months_of_rent" ? (
                            <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
                                <CounterField
                                    name="rent.securityDeposit"
                                    label="Months of rent"
                                    min={0}
                                    max={MAX_DEPOSIT_MONTHS}
                                    className="
                                      block-full
                                      [&_.t-acc-panel]:block-full
                                      [&_.t-acc-panel-inner]:block-full
                                    "
                                />
                                <div
                                    className="
                                      flex flex-row items-center justify-between gap-3
                                      rounded-control border-2 border-dashed border-border-warm
                                      bg-surface px-3 py-2 block-full min-block-14
                                    "
                                >
                                    <p className="text-xs text-ink-muted min-inline-0">
                                        Tenant pays upfront
                                    </p>
                                    <p className="tabular shrink-0 text-base font-bold text-ink">
                                        {depositInRupees != null
                                            ? formatInr(depositInRupees)
                                            : "Add rent to see total"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <CurrencyField
                                name="rent.securityDeposit"
                                label="Deposit amount"
                                allowZero
                                placeholder="e.g. 50,000"
                                helperText="Exact rupees collected as deposit"
                            />
                        )}
                    </div>
                </ConditionalField>

                <DateField
                    name="rent.availableFrom"
                    label="Available from"
                    placeholder="Pick move-in date"
                    hint="Date the tenant can move in"
                />
            </div>
        </WizardSection>
    );
}

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
    const showRentMaintenance = isVisible("rent.maintenanceAmount");
    const showSaleMaintenance = isVisible("sale.maintenanceCharge");

    function syncMaintenance(value: number | null) {
        setValue("sale.maintenanceCharge", value, { shouldDirty: true, shouldValidate: true });
        setValue("rent.maintenanceAmount", value, { shouldDirty: true, shouldValidate: true });
    }

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
            <div className={FORM_SECTIONS_CLASS}>
                <WizardSection
                    title={<>Asking price</>}
                    description="The asking price is public. The owner's floor stays in the broker file."
                >
                    <div className={FORM_GRID_CLASS}>
                        <CurrencyField
                            name="sale.expectedPrice"
                            label="Expected price"
                            placeholder="e.g. 85 L or 8500000"
                            onValueChange={handleExpectedPriceChange}
                        />
                        <NumberField
                            name="sale.pricePerSqft"
                            label="Price per sq ft"
                            min={0}
                            step={1}
                            placeholder="e.g. 5500"
                            startIcon={Ruler}
                            hint={
                                areaSqft > 0
                                    ? `Based on ${areaSqft.toLocaleString("en-IN")} sq ft — edit either side to sync`
                                    : "Add Area on the previous step to sync these fields"
                            }
                            onValueChange={handlePricePerSqftChange}
                        />
                    </div>
                </WizardSection>

                {showSaleMaintenance ||
                isVisible("sale.plcCharge") ||
                isVisible("sale.floorRiseCharge") ? (
                    <WizardSection
                        title={
                            <>
                                {showSaleMaintenance &&
                                !isVisible("sale.plcCharge") &&
                                !isVisible("sale.floorRiseCharge")
                                    ? "Society charges"
                                    : "Extra sale charges"}
                            </>
                        }
                        description={
                            showSaleMaintenance && derived.isRentLike
                                ? "Society maintenance is the same for sale or rent. Other charges apply to buyers only."
                                : "Optional costs a buyer should know on top of the asking price."
                        }
                    >
                        <div className={FORM_GRID_CLASS}>
                            {showSaleMaintenance ? (
                                <CurrencyField
                                    name="sale.maintenanceCharge"
                                    label="Society maintenance"
                                    placeholder="e.g. 3,000"
                                    helperText="Monthly society / AMC — same for sale or rent"
                                    onValueChange={syncMaintenance}
                                    className={
                                        isVisible("sale.plcCharge") ||
                                        isVisible("sale.floorRiseCharge")
                                            ? undefined
                                            : "md:col-span-2"
                                    }
                                />
                            ) : null}
                            {SELL_EXTRA_CHARGES.map(([name, label]) => (
                                <CurrencyField
                                    key={name}
                                    name={name}
                                    label={label}
                                    placeholder="e.g. 50,000"
                                />
                            ))}
                        </div>
                    </WizardSection>
                ) : null}

                {derived.isRentLike ? (
                    <RentAndDepositSection
                        isPg={derived.isPg}
                        showMaintenance={showRentMaintenance}
                        onMaintenanceChange={syncMaintenance}
                    />
                ) : null}
            </div>
        );
    }

    return (
        <div className={FORM_SECTIONS_CLASS}>
            <RentAndDepositSection
                isPg={derived.isPg}
                showMaintenance={showRentMaintenance}
                onMaintenanceChange={syncMaintenance}
            />

            {derived.isPg ? (
                <WizardSection
                    title={<>PG details</>}
                    description="Record the service and price per bed."
                >
                    <div className={FORM_STACK_CLASS}>
                        <div className={FORM_GRID_CLASS}>
                            <SelectField
                                name="rent.pg.bedType"
                                label="Bed type"
                                options={PG_BED_TYPE_OPTIONS}
                                placeholder="Select bed type"
                                startIcon={BedDouble}
                            />
                            <SelectField
                                name="rent.pg.genderAllowed"
                                label="Gender allowed"
                                options={PG_GENDER_OPTIONS}
                                placeholder="Select gender"
                                startIcon={Users}
                            />
                            <CurrencyField
                                name="rent.pg.perBedRent"
                                label="Rent per bed"
                                placeholder="e.g. 8,000"
                            />
                            <TextField
                                name="rent.pg.gateClosingTime"
                                label="Gate closing time"
                                type="time"
                                startIcon={Clock3}
                            />
                            <SelectField
                                name="rent.pg.housekeepingFrequency"
                                label="Housekeeping"
                                options={HOUSEKEEPING_OPTIONS}
                                placeholder="Select frequency"
                                startIcon={Utensils}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <ToggleField name="rent.pg.foodIncluded" label="Food included" />
                            <ToggleField name="rent.pg.laundry" label="Laundry included" />
                        </div>
                    </div>
                </WizardSection>
            ) : null}
        </div>
    );
}
