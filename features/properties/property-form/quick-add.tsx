"use client";

import { type MutableRefObject, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { buildBasicsSuggestedTitle } from "@/lib/format/property-title";
import {
    OWNER_SALE_COMMISSION_MAX,
    OWNER_SALE_COMMISSION_MIN,
    type PropertyDraftValues,
} from "@/lib/schemas/property";
import { useFieldRules } from "@/lib/visibility/use-field-rules";
import { useLocationOptions } from "@/hooks/use-locations";
import { useMarket } from "@/hooks/use-market";

import {
    BadgePercent,
    Building2,
    Globe2,
    Map as MapIcon,
    Sparkles,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { BEDROOM_OPTIONS } from "@/constants/property";
import {
    CurrencyField,
    FORM_GRID_CLASS,
    FORM_SECTIONS_CLASS,
    LocalityField,
    NumberField,
    SelectField,
    TextField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";
import { StepBasics } from "@/features/properties/property-form/steps/step-basics";
import { StepMedia } from "@/features/properties/property-form/steps/step-media";
import { StepPublish } from "@/features/properties/property-form/steps/step-publish";
import { useBathroomsFollowBhk } from "@/features/properties/property-form/use-bathrooms-follow-bhk";

/**
 * Minimal create form: every field here maps to a value the create-property API
 * needs (or a value we must send so the listing is usable after save).
 */
export function QuickAdd({
    photoFilesRef,
    portal = "broker",
    propertyId,
}: {
    photoFilesRef: MutableRefObject<Map<string, File>>;
    portal?: "broker" | "owner";
    propertyId?: string;
}) {
    const isOwner = portal === "owner";
    const { watch, setValue, getValues } = useFormContext<PropertyDraftValues>();
    const { derived } = useFieldRules();
    useBathroomsFollowBhk();
    const values = watch();
    const {
        countryOptions,
        stateOptions,
        cityOptions,
        countriesLoading,
        statesLoading,
        citiesLoading,
        selectedCountry,
        selectedState,
        selectedCity,
    } = useLocationOptions({
        countryName: values.location.country,
        stateName: values.location.state,
        cityName: values.location.city,
    });
    const market = useMarket();
    const country = values.location.country;

    // Same as Full details: the listing sits in the holder's country. A draft saved
    // under another country is moved over and its state / city / locality cleared.
    useEffect(() => {
        if (!market || country === market.name) return;
        setValue("location.country", market.name, { shouldDirty: true });
        setValue("location.state", "", { shouldDirty: true });
        setValue("location.city", "", { shouldDirty: true });
        setValue("location.locality", "", { shouldDirty: true });
    }, [market, country, setValue]);
    const showBhk = derived.isResidential && !derived.isPlot;
    const showSalePrice = derived.isSell;
    const showRent = derived.isRentLike && !derived.isPg;

    const [titleTouched, setTitleTouched] = useState(() =>
        Boolean(getValues("basics.title")?.trim()),
    );
    const suggestedTitle = buildBasicsSuggestedTitle({
        bedrooms: showBhk ? values.details.bedrooms : undefined,
        propertyType: values.basics.propertyType,
        locality: values.location.locality,
        city: values.location.city,
    });

    useEffect(() => {
        if (titleTouched || !suggestedTitle) return;
        setValue("basics.title", suggestedTitle, { shouldDirty: true, shouldValidate: true });
    }, [setValue, suggestedTitle, titleTouched]);

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-1.5">
                <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink">
                    Quick add
                </h1>
                <p className="text-sm/6 text-ink-muted max-inline-3xl">
                    Fill in the essentials and publish. You can add more details later from Full
                    details.
                </p>
            </header>

            <div className={FORM_SECTIONS_CLASS}>
                <StepBasics />

                <WizardSection
                    title={<>Where is the property?</>}
                    description="Start broad, then add the details people use to find it."
                >
                    <div className={FORM_GRID_CLASS}>
                        <SelectField
                            name="location.country"
                            label="Country"
                            options={countryOptions}
                            placeholder="Choose a country"
                            startIcon={Globe2}
                            loading={countriesLoading}
                            emptyText="No countries match"
                            limit={50}
                            disabled={Boolean(market)}
                            hint={
                                market
                                    ? "Listings are offered in your account's country"
                                    : undefined
                            }
                            onValueChange={() => {
                                setValue("location.state", "", { shouldDirty: true });
                                setValue("location.city", "", { shouldDirty: true });
                                setValue("location.locality", "", { shouldDirty: true });
                            }}
                        />
                        <SelectField
                            name="location.state"
                            label="State"
                            options={stateOptions}
                            placeholder={
                                selectedCountry ? "Choose a state" : "Choose a country first"
                            }
                            startIcon={MapIcon}
                            loading={statesLoading}
                            disabled={!selectedCountry}
                            emptyText={statesLoading ? "Loading states…" : "No states match"}
                            limit={100}
                            onValueChange={() => {
                                // Cities and localities are per state.
                                setValue("location.city", "", { shouldDirty: true });
                                setValue("location.locality", "", { shouldDirty: true });
                            }}
                        />
                        <SelectField
                            name="location.city"
                            label="City"
                            options={cityOptions}
                            placeholder={selectedState ? "Choose a city" : "Choose a state first"}
                            startIcon={Building2}
                            loading={citiesLoading}
                            disabled={!selectedState}
                            emptyText={citiesLoading ? "Loading cities…" : "No cities match"}
                            limit={100}
                            onValueChange={() => {
                                // Localities are per city.
                                setValue("location.locality", "", { shouldDirty: true });
                            }}
                        />
                        <LocalityField
                            name="location.locality"
                            label="Locality"
                            cityId={selectedCity?.id}
                            placeholder="Search a locality, e.g. Green Park"
                        />
                        <TextField
                            name="location.pincode"
                            label="PIN code"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="400001"
                        />
                        <TextField
                            name="location.landmark"
                            label="Landmark"
                            placeholder="e.g. Near Mart, opposite Mall"
                        />
                        <TextField
                            name="location.projectOrSociety"
                            label="Project or society"
                            placeholder="e.g. Happy Glorious"
                            className="sm:col-span-2"
                        />
                    </div>
                </WizardSection>

                <WizardSection
                    title={<>Size, price & title</>}
                    description="Enough for a usable draft listing."
                >
                    <div className={FORM_GRID_CLASS}>
                        {showBhk ? (
                            <SelectField
                                name="details.bedrooms"
                                label="BHK"
                                options={BEDROOM_OPTIONS}
                            />
                        ) : null}
                        <NumberField
                            name="area.plotArea"
                            label="Area (sq ft)"
                            min={0}
                            placeholder="e.g. 1200"
                            onValueChange={(next) => {
                                const sqft = next != null && next > 0 ? next : 0;
                                setValue("area.plotArea", next, { shouldDirty: true });
                                setValue("area.carpetArea", next, { shouldDirty: true });
                                setValue("area.areaSqft", sqft, { shouldDirty: true });
                                setValue("area.unit", "sqft", { shouldDirty: true });
                            }}
                        />
                        {showSalePrice ? (
                            <CurrencyField name="sale.expectedPrice" label="Expected price" />
                        ) : null}
                        {showRent ? (
                            <CurrencyField name="rent.monthlyRent" label="Monthly rent" />
                        ) : null}
                        {isOwner && showSalePrice ? (
                            <NumberField
                                name="commission.sale.value"
                                label="Sale commission (%)"
                                step={0.1}
                                min={OWNER_SALE_COMMISSION_MIN}
                                max={OWNER_SALE_COMMISSION_MAX}
                                placeholder="e.g. 2"
                                visibility="public"
                                startIcon={BadgePercent}
                                hint={`Required. Between ${OWNER_SALE_COMMISSION_MIN}% and ${OWNER_SALE_COMMISSION_MAX}% of the sale price.`}
                            />
                        ) : null}
                        {isOwner && derived.isRentLike ? (
                            <CurrencyField
                                name="commission.rent.value"
                                label="Rent commission"
                                placeholder="e.g. 25,000 (0 for none)"
                                allowZero
                                visibility="public"
                                hint="Required. Fixed amount you pay the broker. For no commission, enter 0."
                            />
                        ) : null}
                        <TextField
                            name="owner.phone"
                            label="Owner phone"
                            inputMode="tel"
                            maxLength={10}
                            placeholder="9876543210"
                            visibility="private"
                        />
                        <TextField
                            name="basics.title"
                            label="Property title"
                            placeholder={
                                suggestedTitle || "e.g. 3 BHK Apartment in Green Park, Mumbai"
                            }
                            hint="Auto-filled from BHK, type, locality, and city. You can edit it anytime."
                            className="md:col-span-2"
                            onChange={() => setTitleTouched(true)}
                            endAction={
                                suggestedTitle ? (
                                    <Button
                                        type="button"
                                        variant="link"
                                        size="sm"
                                        onClick={() => {
                                            setValue("basics.title", suggestedTitle, {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                            });
                                            setTitleTouched(false);
                                        }}
                                        className="px-2.5 text-brand"
                                    >
                                        <Sparkles className="block-3.5 inline-3.5" aria-hidden />
                                        <span className="hidden sm:inline">
                                            Use suggested title
                                        </span>
                                        <span className="sm:hidden">Suggest</span>
                                    </Button>
                                ) : null
                            }
                        />
                    </div>
                </WizardSection>

                <StepMedia photoFilesRef={photoFilesRef} photosOnly />
                {!isOwner ? <StepPublish propertyId={propertyId} /> : null}
            </div>
        </div>
    );
}
