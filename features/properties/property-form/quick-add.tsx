"use client";

import type { MutableRefObject } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { Camera, Check } from "lucide-react";

import { createClientId } from "@/lib/client-id";
import type { PropertyDraftValues } from "@/lib/schemas/property";

import { AppImage } from "@/components/shared/app-image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { BEDROOM_OPTIONS, LISTING_FOR_OPTIONS, propertyTypeOptions } from "@/constants/property";
import {
    ChoiceField,
    CurrencyField,
    FORM_GRID_CLASS,
    NumberField,
    SelectField,
    TextField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

export function QuickAdd({
    photoFilesRef,
}: {
    photoFilesRef: MutableRefObject<Map<string, File>>;
}) {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const values = watch();
    const firstPhoto = values.media.photos[0];

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
                    Capture seven essentials now. This stays a draft so the complete details can be
                    added later.
                </p>
            </div>
            <WizardSection title="Property essentials">
                <div className="flex flex-col gap-4">
                    <ChoiceField
                        name="basics.listingFor"
                        label="Listing for"
                        options={LISTING_FOR_OPTIONS}
                        columns={3}
                    />
                    <div className={FORM_GRID_CLASS}>
                        <SelectField
                            name="basics.propertyType"
                            label="Property type"
                            options={propertyTypeOptions(values.basics.category)}
                        />
                        <TextField
                            name="location.locality"
                            label="Locality"
                            placeholder="e.g. Vesu"
                        />
                        <SelectField
                            name="details.bedrooms"
                            label="BHK"
                            options={BEDROOM_OPTIONS}
                        />
                        <NumberField name="area.carpetArea" label="Area (sq ft)" />
                        {values.basics.listingFor === "sell" ||
                        values.basics.listingFor === "both" ? (
                            <CurrencyField name="sale.expectedPrice" label="Expected price" />
                        ) : null}
                        {values.basics.listingFor === "rent" ||
                        values.basics.listingFor === "both" ? (
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
                description="A quick photo makes this draft easier to recognise later."
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
