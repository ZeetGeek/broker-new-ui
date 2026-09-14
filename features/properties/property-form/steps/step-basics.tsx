"use client";

import { useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";
import toast from "react-hot-toast";

import { Building2, FileText, Layers2, Sparkles, Type } from "lucide-react";

import { DEFAULT_PROPERTY_DRAFT, type PropertyDraftValues } from "@/lib/schemas/property";

import { Button } from "@/components/ui/button";

import {
    LISTING_FOR_OPTIONS,
    PROPERTY_CATEGORY_OPTIONS,
    PROPERTY_SUBTYPE_OPTIONS,
    propertyTypeOptions,
    toLabel,
} from "@/constants/property";
import {
    ChoiceField,
    FORM_GRID_CLASS,
    SelectField,
    TextAreaField,
    TextField,
    WizardSection,
} from "@/features/properties/property-form/form-fields";
import {
    CATEGORY_ICONS,
    LISTING_FOR_ICONS,
} from "@/features/properties/property-form/option-icons";

export function StepBasics() {
    const { watch, setValue } = useFormContext<PropertyDraftValues>();
    const dealSwitchNotified = useRef(false);
    const category = watch("basics.category");
    const listingFor = watch("basics.listingFor");
    const propertyType = watch("basics.propertyType");
    const bedrooms = watch("details.bedrooms");
    const locality = watch("location.locality");
    const city = watch("location.city");
    const suggestedTitle = useMemo(() => {
        const configuration =
            category === "residential" && bedrooms
                ? bedrooms === "1rk"
                    ? "1 RK"
                    : `${bedrooms} BHK`
                : "";
        const purpose = listingFor === "sell" ? "Sale" : listingFor === "pg" ? "PG" : "Rent";
        const place = [locality, city].filter(Boolean).join(", ") || "Surat";
        return [configuration, toLabel(propertyType), `for ${purpose}`, `in ${place}`]
            .filter(Boolean)
            .join(" ");
    }, [bedrooms, category, city, listingFor, locality, propertyType]);

    return (
        <div className="flex flex-col gap-8">
            <WizardSection
                title={
                    <>
                        <Building2
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        What are you listing?
                    </>
                }
                description="Start with the property and the kind of deal the owner wants."
            >
                <div className="flex flex-col gap-5">
                    <ChoiceField
                        name="basics.listingFor"
                        label="Listing for"
                        options={LISTING_FOR_OPTIONS}
                        columns={2}
                        icons={LISTING_FOR_ICONS}
                        onValueChange={() => {
                            if (dealSwitchNotified.current) return;
                            dealSwitchNotified.current = true;
                            toast("Sale and rent details are kept if you switch back.");
                        }}
                    />
                    <ChoiceField
                        name="basics.category"
                        label="Category"
                        options={PROPERTY_CATEGORY_OPTIONS}
                        columns={5}
                        icons={CATEGORY_ICONS}
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
                            // Listings are always measured in sq ft, including agricultural land.
                            if (!watch("area.carpetArea") && !watch("area.plotArea")) {
                                setValue("area.unit", "sqft", { shouldDirty: true });
                            }
                        }}
                    />
                    <div className={FORM_GRID_CLASS}>
                        <SelectField
                            name="basics.propertyType"
                            label="Property type"
                            options={propertyTypeOptions(category)}
                            startIcon={Building2}
                            onValueChange={() => {
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
                        <SelectField
                            name="basics.propertySubType"
                            label="Property subtype"
                            options={PROPERTY_SUBTYPE_OPTIONS}
                            placeholder="Optional"
                            startIcon={Layers2}
                        />
                    </div>
                </div>
            </WizardSection>

            <WizardSection
                title={
                    <>
                        <FileText
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Listing story
                    </>
                }
                description="Use plain details an owner or broker can scan quickly."
            >
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <TextField
                            name="basics.title"
                            label="Listing title"
                            placeholder={suggestedTitle}
                            startIcon={Type}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                                setValue("basics.title", suggestedTitle, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                            className="
                              gap-2 self-start font-semibold text-brand-text
                              hover:bg-brand-soft hover:text-brand-text
                            "
                        >
                            <Sparkles className="block-4 inline-4" aria-hidden />
                            Use suggested title
                        </Button>
                    </div>
                    <TextAreaField
                        name="basics.description"
                        label="Description"
                        placeholder="Describe the layout, condition, surroundings, and what makes this property worth a visit."
                        hint="50–3,000 characters. This is shown on the listing."
                        rows={6}
                    />
                </div>
            </WizardSection>
        </div>
    );
}
