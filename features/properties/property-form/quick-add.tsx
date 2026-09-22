"use client";

import type { MutableRefObject } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { Camera, Check } from "lucide-react";

import { createClientId } from "@/lib/client-id";
import { DEFAULT_PROPERTY_DRAFT, type PropertyDraftValues } from "@/lib/schemas/property";
import { useFieldRules } from "@/lib/visibility/use-field-rules";

import { AppImage } from "@/components/shared/app-image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    BEDROOM_OPTIONS,
    LISTING_FOR_OPTIONS,
    PROPERTY_CATEGORY_OPTIONS,
    propertyTypeOptions,
} from "@/constants/property";
import {
    ChoiceField,
    CurrencyField,
    FORM_GRID_CLASS,
    NumberField,
    SelectField,
    TextField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

import { useLocationOptions } from "@/hooks/use-locations";

/**
 * Minimal create form: every field here maps to a value the create-property API
 * needs (or a value we must send so the listing is usable after save).
 *
 * API-required: visibility (set on save), transactionType ← listingFor, city.
 * Always sent with create: category/type, locality→address, area, price/rent, photo.
 */
export function QuickAdd({
    photoFilesRef,
}: {
    photoFilesRef: MutableRefObject<Map<string, File>>;
}) {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const { derived } = useFieldRules();
    const values = watch();
    // Quick add has no country / state field — it keeps the draft defaults, so
    // the city list is the cities of that default state. The full wizard step
    // is where country and state can be changed.
    const { cityOptions, citiesLoading, selectedState } = useLocationOptions({
        countryName: values.location.country,
        stateName: values.location.state,
    });
    const firstPhoto = values.media.photos[0];
    const showBhk = derived.isResidential && !derived.isPlot;
    const showSalePrice = derived.isSell;
    const showRent = derived.isRentLike && !derived.isPg;

    function addPhoto(file: File | undefined) {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Choose a photo smaller than 10 MB.");
            return;
        }
        const url = URL.createObjectURL(file);
        photoFilesRef.current.set(url, file);
        setValue(
            "media.photos",
            [
                {
                    id: createClientId("quick-photo"),
                    url,
                    name: file.name,
                    tag: "other",
                    isCover: true,
                    order: 0,
                    alt: "",
                    status: "ready",
                },
            ],
            { shouldDirty: true },
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-ink">
                    Save the lead from the site
                </h2>
                <p className="mbs-2 text-sm/6 text-ink-muted max-inline-2xl">
                    Fill the fields required to create the listing. It saves as a draft so you can
                    complete the rest later.
                </p>
            </div>
            <WizardSection
                title="Property essentials"
                description="These map to the create-property API required fields (deal type, city) plus the basics needed for a usable draft."
            >
                <div className="flex flex-col gap-4">
                    <ChoiceField
                        name="basics.listingFor"
                        label="Listing for"
                        options={LISTING_FOR_OPTIONS}
                        columns={3}
                    />
                    <ChoiceField
                        name="basics.category"
                        label="Category"
                        options={PROPERTY_CATEGORY_OPTIONS}
                        columns={5}
                        onValueChange={() => {
                            setValue("basics.propertyType", "", { shouldDirty: true });
                            setValue("basics.propertySubType", "", { shouldDirty: true });
                            setValue(
                                "details.commercial",
                                structuredClone(DEFAULT_PROPERTY_DRAFT.details.commercial),
                                { shouldDirty: true },
                            );
                            setValue(
                                "details.land",
                                structuredClone(DEFAULT_PROPERTY_DRAFT.details.land),
                                { shouldDirty: true },
                            );
                        }}
                    />
                    <div className={FORM_GRID_CLASS}>
                        <SelectField
                            name="basics.propertyType"
                            label="Property type"
                            options={propertyTypeOptions(values.basics.category)}
                        />
                        <SelectField
                            name="location.city"
                            label="City"
                            options={cityOptions}
                            placeholder={selectedState ? "Choose a city" : "Loading cities…"}
                            loading={citiesLoading}
                            disabled={!selectedState}
                            emptyText={citiesLoading ? "Loading cities…" : "No cities match"}
                            limit={100}
                        />
                        <TextField
                            name="location.locality"
                            label="Locality"
                            placeholder="e.g. Vesu"
                        />
                        <TextField
                            name="location.pincode"
                            label="PIN code"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="395007"
                        />
                        <TextField
                            name="location.landmark"
                            label="Landmark"
                            placeholder="e.g. Near VR Mall"
                        />
                        <TextField
                            name="location.projectOrSociety"
                            label="Project or society"
                            placeholder="e.g. Happy Glorious"
                        />
                        <TextField
                            name="basics.title"
                            label="Property title"
                            placeholder="e.g. 3 BHK in Vesu"
                            className="md:col-span-2"
                        />
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
                        <TextField
                            name="owner.phone"
                            label="Owner phone"
                            inputMode="tel"
                            maxLength={10}
                            placeholder="9876543210"
                            visibility="private"
                        />
                    </div>
                </div>
            </WizardSection>
            <WizardSection
                title="One reference photo"
                description="Required so the draft can be recognised and the create request can include photos."
            >
                <Label
                    htmlFor="quick-property-photo"
                    className="
                      relative flex cursor-pointer items-center justify-center overflow-hidden
                      rounded-card border-2 border-dashed border-brand/35 bg-brand-soft/30
                      min-block-48
                      focus-within:ring-3 focus-within:ring-ring/30
                    "
                >
                    {firstPhoto ? (
                        <>
                            <AppImage
                                src={firstPhoto.url}
                                alt="Quick property reference"
                                fill
                                sizes="768px"
                            />
                            <span
                                className="
                                  absolute inset-s-3 inset-be-3 inline-flex items-center gap-2
                                  rounded-control bg-brand-ink px-3 py-2 text-sm font-semibold
                                  text-surface
                                "
                            >
                                <Check className="block-4 inline-4" /> Photo added
                            </span>
                        </>
                    ) : (
                        <span className="flex flex-col items-center p-6 text-center">
                            <Camera className="text-brand block-7 inline-7" />
                            <span className="mbs-3 text-sm font-bold text-ink">
                                Take or choose a photo
                            </span>
                            <span className="mbs-1 text-xs text-ink-muted">
                                JPG, PNG, WebP or HEIC
                            </span>
                        </span>
                    )}
                    <Input
                        id="quick-property-photo"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={(event) => addPhoto(event.target.files?.[0])}
                    />
                </Label>
            </WizardSection>
        </div>
    );
}
