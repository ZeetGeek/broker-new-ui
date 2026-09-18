"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";

import {
    BedDouble,
    CircleDollarSign,
    Clock3,
    HandCoins,
    Receipt,
    Ruler,
    Users,
    Utensils,
} from "lucide-react";

import { areaToSqft } from "@/lib/calc/area";
import { calculateSaleCommission } from "@/lib/calc/commission";
import { formatInr, formatInrCompact } from "@/lib/format/inr";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { ConditionalField } from "@/components/property/fields/conditional-field";
import { FieldLabel } from "@/components/property/fields/field-label";

import {
    HOUSEKEEPING_OPTIONS,
    PG_BED_TYPE_OPTIONS,
    PG_GENDER_OPTIONS,
} from "@/constants/property";
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
            title={
                <>
                    <HandCoins
                        className="shrink-0 text-brand block-5 inline-5"
                        strokeWidth={1.75}
                        aria-hidden
                    />
                    {isPg ? "PG rent" : "Rent details"}
                </>
            }
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
                                    min={1}
                                    max={12}
                                    className="block-full [&_.t-acc-panel]:block-full [&_.t-acc-panel-inner]:block-full"
                                />
                                <div
                                    className="
                                      flex flex-row items-center justify-between gap-3 rounded-control
                                      border-2 border-dashed border-border-warm bg-surface px-3 py-2
                                      block-full min-block-14
                                    "
                                >
                                    <p className="text-xs text-ink-muted min-inline-0">
                                        Tenant pays upfront
                                    </p>
                                    <p className="tabular shrink-0 text-base font-bold text-ink">
                                        {depositInRupees
                                            ? formatInr(depositInRupees)
                                            : "Add rent to see total"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <CurrencyField
                                name="rent.securityDeposit"
                                label="Deposit amount"
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
    const brokerBank = Math.max(0, (saleDeal?.brokerReceives ?? 0) * (1 - coBrokerPercent / 100));

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
                    title={
                        <>
                            <CircleDollarSign
                                className="shrink-0 text-brand block-5 inline-5"
                                strokeWidth={1.75}
                                aria-hidden
                            />
                            Asking price
                        </>
                    }
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
                    <div
                        className="
                          mbs-4 overflow-hidden rounded-control border-2 border-border-warm
                          bg-surface
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
                                        ? `${areaSqft.toLocaleString("en-IN")} sq ft`
                                        : "Area not added"
                                }
                            />
                            <PriceFact
                                label="Per sq ft"
                                value={formatInr(values.sale.pricePerSqft)}
                            />
                            <PriceFact label="All-in price" value={formatInrCompact(allInPrice)} />
                        </div>

                        <div className="border-bs-2 border-border-warm p-4">
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
                                        <span className="text-success">
                                            + GST {formatInr(brokerGst)}
                                        </span>
                                    ) : null}
                                    {brokerTds > 0 ? (
                                        <span className="text-danger">
                                            − TDS {formatInr(brokerTds)}
                                        </span>
                                    ) : null}
                                    {coBrokerShare > 0 ? (
                                        <span className="text-danger">
                                            − Co-broker ({coBrokerPercent}%){" "}
                                            {formatInr(coBrokerShare)}
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

                {showSaleMaintenance ||
                isVisible("sale.plcCharge") ||
                isVisible("sale.floorRiseCharge") ? (
                    <WizardSection
                        title={
                            <>
                                <Receipt
                                    className="shrink-0 text-brand block-5 inline-5"
                                    strokeWidth={1.75}
                                    aria-hidden
                                />
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
                    title={
                        <>
                            <BedDouble
                                className="shrink-0 text-brand block-5 inline-5"
                                strokeWidth={1.75}
                                aria-hidden
                            />
                            PG details
                        </>
                    }
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

function PriceFact({ label, value }: { label: string; value: string }) {
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
            <p className="tabular mbs-1 text-base font-bold text-ink">{value || "— — —"}</p>
        </div>
    );
}
