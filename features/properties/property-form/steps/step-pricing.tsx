"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";

import {
    BadgePercent,
    BedDouble,
    CalendarCheck,
    CalendarClock,
    CircleDollarSign,
    Clock3,
    Droplets,
    FileText,
    HandCoins,
    LockKeyhole,
    Receipt,
    Repeat,
    Ruler,
    Shield,
    Users,
    Utensils,
    Zap,
} from "lucide-react";

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
    FORM_SECTIONS_CLASS,
    FORM_STACK_CLASS,
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

                {(isVisible("sale.maintenanceCharge") ||
                    isVisible("sale.plcCharge") ||
                    isVisible("sale.floorRiseCharge")) ? (
                    <WizardSection
                        title={
                            <>
                                <Receipt
                                    className="shrink-0 text-brand block-5 inline-5"
                                    strokeWidth={1.75}
                                    aria-hidden
                                />
                                Charges
                            </>
                        }
                        description="Add every amount a buyer should know before making an offer."
                    >
                        <div className={FORM_GRID_CLASS}>
                            <CurrencyField
                                name="sale.maintenanceCharge"
                                label="Monthly maintenance"
                                placeholder="e.g. 3,000"
                                helperText="Type 3000 or 3,000 — monthly society charge"
                                className="md:col-span-2"
                            />
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
            </div>
        );
    }

    return (
        <div className={FORM_SECTIONS_CLASS}>
            <WizardSection
                title={
                    <>
                        <HandCoins
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        {derived.isPg ? "PG rent" : "Rent and deposit"}
                    </>
                }
                description="Record the full move-in amount, not only the monthly rent."
            >
                <div className={FORM_STACK_CLASS}>
                    <div className={FORM_GRID_CLASS}>
                        <CurrencyField
                            name="rent.monthlyRent"
                            label="Monthly rent"
                            placeholder="e.g. 25,000"
                        />
                        <CurrencyField
                            name="rent.ownerMinimumRent"
                            label="Owner's minimum rent"
                            placeholder="e.g. 22,000"
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
                                placeholder="e.g. 2"
                                startIcon={Shield}
                                hint={
                                    values.rent.monthlyRent
                                        ? `${formatInr((values.rent.securityDeposit ?? 0) * values.rent.monthlyRent)} deposit`
                                        : undefined
                                }
                            />
                        ) : (
                            <CurrencyField
                                name="rent.securityDeposit"
                                label="Security deposit"
                                placeholder="e.g. 50,000"
                            />
                        )}
                        <TextField
                            name="rent.availableFrom"
                            label="Available from"
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            startIcon={CalendarClock}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setValue(
                                    "rent.availableFrom",
                                    new Date().toISOString().slice(0, 10),
                                    { shouldDirty: true },
                                )
                            }
                        >
                            <CalendarCheck aria-hidden /> Available immediately
                        </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <ToggleField name="rent.rentNegotiable" label="Rent negotiable" />
                        <SelectField
                            name="rent.currentStatus"
                            label="Current status"
                            options={CURRENT_STATUS_OPTIONS}
                            placeholder="Select status"
                            startIcon={FileText}
                        />
                    </div>
                    {isVisible("rent.tenantVacatingOn") ? (
                        <TextField
                            name="rent.tenantVacatingOn"
                            label="Tenant vacating on"
                            type="date"
                            visibility="private"
                            startIcon={CalendarClock}
                            className="max-inline-sm"
                        />
                    ) : null}
                </div>
            </WizardSection>

            <WizardSection
                title={
                    <>
                        <Receipt
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Monthly charges
                    </>
                }
                description="Make recurring costs clear before the first visit."
            >
                <div className={FORM_STACK_CLASS}>
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
                                placeholder="Select frequency"
                                startIcon={Repeat}
                            />
                        </div>
                    ) : null}
                    <div className={FORM_GRID_CLASS}>
                        <SelectField
                            name="rent.electricityBilling"
                            label="Electricity billing"
                            options={ELECTRICITY_BILLING_OPTIONS}
                            placeholder="Select billing"
                            startIcon={Zap}
                        />
                        <SelectField
                            name="rent.waterCharges"
                            label="Water charges"
                            options={WATER_CHARGE_OPTIONS}
                            placeholder="Select water charges"
                            startIcon={Droplets}
                        />
                    </div>
                </div>
            </WizardSection>

            {derived.isRent || derived.isLease ? (
                <WizardSection
                    title={
                        <>
                            <FileText
                                className="shrink-0 text-brand block-5 inline-5"
                                strokeWidth={1.75}
                                aria-hidden
                            />
                            Agreement terms
                        </>
                    }
                    description="Capture the dates and clauses that affect the tenancy."
                >
                    <div className={FORM_GRID_CLASS}>
                        <NumberField
                            name="rent.lockInMonths"
                            label="Lock-in (months)"
                            placeholder="e.g. 6"
                            startIcon={LockKeyhole}
                        />
                        <NumberField
                            name="rent.noticePeriodMonths"
                            label="Notice period (months)"
                            placeholder="e.g. 1"
                            startIcon={CalendarClock}
                        />
                        <SelectField
                            name="rent.agreementDurationMonths"
                            label="Agreement duration"
                            options={AGREEMENT_DURATION_OPTIONS}
                            placeholder="Select duration"
                            startIcon={FileText}
                        />
                        <NumberField
                            name="rent.rentEscalationPercent"
                            label="Yearly rent increase (%)"
                            max={100}
                            step={0.1}
                            placeholder="e.g. 5"
                            startIcon={BadgePercent}
                        />
                    </div>
                </WizardSection>
            ) : null}

            {isVisible("rent.preferredTenant") ? (
                <WizardSection
                    title={
                        <>
                            <Users
                                className="shrink-0 text-brand block-5 inline-5"
                                strokeWidth={1.75}
                                aria-hidden
                            />
                            Tenant preference
                        </>
                    }
                    description="Plain restrictions prevent avoidable calls and visits."
                >
                    <div className={FORM_STACK_CLASS}>
                        <MultiChipField
                            name="rent.preferredTenant"
                            label="Preferred tenant"
                            options={PREFERRED_TENANT_OPTIONS}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <ToggleField name="rent.nonVegAllowed" label="Non-veg allowed" />
                            <ToggleField name="rent.petsAllowed" label="Pets allowed" />
                            <ToggleField name="rent.smokingAllowed" label="Smoking allowed" />
                            <ToggleField name="rent.partyAllowed" label="Parties allowed" />
                        </div>
                    </div>
                </WizardSection>
            ) : null}

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
